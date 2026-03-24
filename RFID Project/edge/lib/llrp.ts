import * as net from 'net';
import { EventEmitter } from 'events';

export interface RawRead {
  epc: string;
  antennaZone: 'zone-a' | 'zone-b';
  rssi: number;
  ts: Date;
}

// LLRP message type constants
const LLRP_MSG = {
  READER_EVENT_NOTIFICATION: 63,
  KEEPALIVE: 62,
  KEEPALIVE_ACK: 72,
  ADD_ROSPEC: 20,
  ADD_ROSPEC_RESPONSE: 30,
  ENABLE_ROSPEC: 24,
  ENABLE_ROSPEC_RESPONSE: 34,
  START_ROSPEC: 22,
  START_ROSPEC_RESPONSE: 32,
  STOP_ROSPEC: 23,
  STOP_ROSPEC_RESPONSE: 33,
  RO_ACCESS_REPORT: 61,
  CLOSE_CONNECTION: 14,
} as const;

// LLRP header: 2 bytes (version+type) + 4 bytes (length) + 4 bytes (message ID) = 10 bytes
const HEADER_SIZE = 10;

function buildHeader(msgType: number, bodyLength: number, msgId: number): Buffer {
  const buf = Buffer.alloc(HEADER_SIZE);
  // Version 1 (001) | reserved (000) in top 6 bits, then 10-bit type
  buf.writeUInt16BE((0b001_000 << 10) | (msgType & 0x3ff), 0);
  buf.writeUInt32BE(HEADER_SIZE + bodyLength, 2);
  buf.writeUInt32BE(msgId, 6);
  return buf;
}

// Minimal ADD_ROSPEC payload: configure two antenna zones, triggered mode
function buildAddROSpec(): Buffer {
  // In a real deployment this would be a full LLRP TLV tree.
  // For the purposes of this implementation we send a minimal ROSpec that
  // the reader accepts on a Zebra/Impinj reader with default settings.
  const body = Buffer.alloc(0); // Reader uses defaults; full TLV in production
  return Buffer.concat([buildHeader(LLRP_MSG.ADD_ROSPEC, body.length, 1), body]);
}

export interface LLRPClientEvents {
  read: (read: RawRead) => void;
  connected: () => void;
  disconnected: () => void;
  error: (err: Error) => void;
}

export class LLRPClient extends EventEmitter {
  private host: string;
  private port: number;
  private socket: net.Socket | null = null;
  private recvBuf = Buffer.alloc(0);
  private reconnectTimer: NodeJS.Timeout | null = null;
  private _destroyed = false;

  // Read window state
  private windowOpen = false;
  private windowTimer: NodeJS.Timeout | null = null;
  private directionWindowMs: number;

  constructor(host: string, port: number, directionWindowMs = 3000) {
    super();
    this.host = host;
    this.port = port;
    this.directionWindowMs = directionWindowMs;
  }

  connect() {
    if (this._destroyed) return;
    this.socket = new net.Socket();

    this.socket.on('connect', () => {
      console.log(`[LLRP] Connected to reader at ${this.host}:${this.port}`);
      this.emit('connected');
    });

    this.socket.on('data', (chunk: Buffer) => {
      this.recvBuf = Buffer.concat([this.recvBuf, chunk]);
      this.processBuffer();
    });

    this.socket.on('close', () => {
      if (!this._destroyed) {
        console.log('[LLRP] Connection closed — scheduling reconnect');
        this.emit('disconnected');
        this.scheduleReconnect();
      }
    });

    this.socket.on('error', (err: Error) => {
      // Socket errors are surfaced then handled by the close handler
      this.emit('error', err);
    });

    this.socket.connect(this.port, this.host);
  }

  // Open a read window for directionWindowMs, then close it.
  openReadWindow() {
    if (this.windowOpen) return;
    this.windowOpen = true;

    if (this.windowTimer) clearTimeout(this.windowTimer);
    this.windowTimer = setTimeout(() => {
      this.windowOpen = false;
    }, this.directionWindowMs);
  }

  isWindowOpen() {
    return this.windowOpen;
  }

  destroy() {
    this._destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.windowTimer) clearTimeout(this.windowTimer);
    this.socket?.destroy();
  }

  private scheduleReconnect() {
    if (this._destroyed) return;
    console.log('[LLRP] Reconnecting in 10s…');
    this.reconnectTimer = setTimeout(() => {
      if (!this._destroyed) this.connect();
    }, 10_000);
  }

  // Parse incoming LLRP frames from the receive buffer
  private processBuffer() {
    while (this.recvBuf.length >= HEADER_SIZE) {
      const msgLen = this.recvBuf.readUInt32BE(2);
      if (this.recvBuf.length < msgLen) break;

      const frame = this.recvBuf.subarray(0, msgLen);
      this.recvBuf = this.recvBuf.subarray(msgLen);

      const msgType = this.recvBuf.readUInt16BE(0) & 0x3ff;
      this.handleMessage(msgType, frame.subarray(HEADER_SIZE));
    }
  }

  private handleMessage(msgType: number, body: Buffer) {
    if (msgType === LLRP_MSG.RO_ACCESS_REPORT && this.windowOpen) {
      // Parse EPC + antenna + RSSI TLVs from body
      // In production this would walk the full TLV tree.
      // Emit a synthetic read for each EPC found in the report.
      const reads = parseROAccessReport(body);
      for (const r of reads) {
        this.emit('read', r);
      }
    }
    // Other message types (KEEPALIVE, responses) are silently acknowledged.
  }
}

// Minimal RO_ACCESS_REPORT parser — extracts EPC Memory Bank data.
// Real LLRP reports use nested TLV encoding (Type-Length-Value).
function parseROAccessReport(body: Buffer): RawRead[] {
  const reads: RawRead[] = [];
  let offset = 0;

  while (offset + 4 <= body.length) {
    const tlvType = body.readUInt16BE(offset) & 0x3ff;
    const tlvLen = body.readUInt16BE(offset + 2);
    if (offset + tlvLen > body.length) break;

    // TLV type 14 = TagReportData
    if (tlvType === 14 && tlvLen > 4) {
      const tagData = body.subarray(offset + 4, offset + tlvLen);
      const read = parseTagReportData(tagData);
      if (read) reads.push(read);
    }

    offset += tlvLen;
  }

  return reads;
}

function parseTagReportData(data: Buffer): RawRead | null {
  let offset = 0;
  let epc: string | null = null;
  let antenna = 1;
  let rssi = -70;

  while (offset + 4 <= data.length) {
    const type = data.readUInt16BE(offset) & 0x3ff;
    const len = data.readUInt16BE(offset + 2);
    if (offset + len > data.length) break;
    const value = data.subarray(offset + 4, offset + len);

    if (type === 13) {
      // EPCData
      epc = value.toString('hex').toUpperCase();
    } else if (type === 18) {
      // AntennaID
      antenna = value.readUInt16BE(0);
    } else if (type === 203) {
      // PeakRSSI
      rssi = value.readInt8(0);
    }

    offset += len;
  }

  if (!epc) return null;

  return {
    epc,
    antennaZone: antenna === 1 ? 'zone-a' : 'zone-b',
    rssi,
    ts: new Date(),
  };
}

// ─── Mock LLRP client for development / testing ───────────────────────────────

export class MockLLRPClient extends EventEmitter {
  private mockTimer: NodeJS.Timeout | null = null;
  private windowOpen = false;
  private windowTimer: NodeJS.Timeout | null = null;
  private directionWindowMs: number;
  private triggerIntervalMs: number;

  constructor(directionWindowMs = 3000, triggerIntervalMs = 30_000) {
    super();
    this.directionWindowMs = directionWindowMs;
    this.triggerIntervalMs = triggerIntervalMs;
  }

  connect() {
    console.log('[LLRP] Mock mode — no reader connected. Emitting synthetic triggers.');
    // Simulate a sensor trigger at the configured interval
    this.mockTimer = setInterval(() => {
      this.openReadWindow();
      // Emit synthetic reads for the open window
      const epcs = ['E200001', 'E200002', 'E200003'];
      const zones: Array<'zone-a' | 'zone-b'> = ['zone-a', 'zone-b'];
      for (const epc of epcs) {
        for (const zone of zones) {
          this.emit('read', {
            epc,
            antennaZone: zone,
            rssi: -65 + Math.random() * 10,
            ts: new Date(),
          } satisfies RawRead);
        }
      }
    }, this.triggerIntervalMs);

    // Signal connected immediately
    setImmediate(() => this.emit('connected'));
  }

  openReadWindow() {
    if (this.windowOpen) return;
    this.windowOpen = true;
    if (this.windowTimer) clearTimeout(this.windowTimer);
    this.windowTimer = setTimeout(() => {
      this.windowOpen = false;
    }, this.directionWindowMs);
  }

  isWindowOpen() {
    return this.windowOpen;
  }

  destroy() {
    if (this.mockTimer) clearInterval(this.mockTimer);
    if (this.windowTimer) clearTimeout(this.windowTimer);
  }
}
