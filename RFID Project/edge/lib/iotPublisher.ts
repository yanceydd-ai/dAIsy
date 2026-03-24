import { Client, Message } from 'azure-iot-device';
import { Mqtt as MqttTransport } from 'azure-iot-device-mqtt';
import type { CrossingEvent } from './crossingEvents';

export interface HeartbeatPayload {
  deviceId: string;
  doorId: string;
  type: 'heartbeat';
  ts: string;
  queueDepth: number;
  readerConnected: boolean;
}

const QUEUE_MAX = 1_000;
const RECONNECT_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

export class IoTPublisher {
  private client: Client | null = null;
  private connected = false;
  private queue: CrossingEvent[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private deviceId: string;
  private doorId: string;
  private readerConnected = false;
  private connectionString: string;

  // Injectable for testing
  private _clientFactory: (cs: string) => Client;

  constructor(
    connectionString: string,
    deviceId: string,
    doorId: string,
    clientFactory?: (cs: string) => Client,
  ) {
    this.connectionString = connectionString;
    this.deviceId = deviceId;
    this.doorId = doorId;
    this._clientFactory = clientFactory ?? ((cs) => Client.fromConnectionString(cs, MqttTransport));
  }

  // ─── Connection lifecycle ────────────────────────────────────────────────────

  connect(): void {
    if (this.client) return; // already connecting or connected
    this._createClient();
  }

  private _createClient(): void {
    try {
      this.client = this._clientFactory(this.connectionString);

      this.client.open((err) => {
        if (err) {
          console.error('[IoT] Failed to connect to IoT Hub:', err.message);
          this.client = null;
          this._scheduleReconnect();
          return;
        }
        this.connected = true;
        console.log('[IoT] Connected to IoT Hub');
        this._startHeartbeat();
        this._flushQueue();
      });

      this.client.on('disconnect', () => {
        console.warn('[IoT] Disconnected from IoT Hub');
        this.connected = false;
        this._stopHeartbeat();
        this.client?.removeAllListeners();
        this.client = null;
        this._scheduleReconnect();
      });

      this.client.on('error', (err: Error) => {
        console.error('[IoT] Client error:', err.message);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[IoT] Failed to create client:', msg);
      this.client = null;
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('[IoT] Attempting reconnection to IoT Hub…');
      this._createClient();
    }, RECONNECT_INTERVAL_MS);
  }

  destroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this._stopHeartbeat();
    if (this.client) {
      this.client.removeAllListeners();
      this.client.close(() => {});
      this.client = null;
    }
    this.connected = false;
  }

  // ─── Publishing ──────────────────────────────────────────────────────────────

  publish(event: CrossingEvent): void {
    if (this.connected && this.client) {
      this._sendMessage(event);
    } else {
      this._enqueue(event);
    }
  }

  private _enqueue(event: CrossingEvent): void {
    if (this.queue.length >= QUEUE_MAX) {
      this.queue.shift(); // drop oldest
      console.warn('[IoT] Event queue full — oldest event dropped.');
    }
    this.queue.push(event);
  }

  private _flushQueue(): void {
    const pending = [...this.queue];
    this.queue = [];
    for (const event of pending) {
      this._sendMessage(event);
    }
  }

  private _sendMessage(event: CrossingEvent): void {
    if (!this.client || !this.connected) {
      this._enqueue(event);
      return;
    }

    const msg = new Message(JSON.stringify(event));
    msg.contentType = 'application/json';
    msg.contentEncoding = 'utf-8';

    // QoS 1 is the default for MQTT transport (at-least-once)
    this.client.sendEvent(msg, (err) => {
      if (err) {
        console.error('[IoT] Failed to send event:', err.message);
        this._enqueue(event); // re-queue on failure
      }
    });
  }

  // ─── Heartbeat ───────────────────────────────────────────────────────────────

  private _startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      this._sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private _sendHeartbeat(): void {
    if (!this.client || !this.connected) return;

    const payload: HeartbeatPayload = {
      deviceId: this.deviceId,
      doorId: this.doorId,
      type: 'heartbeat',
      ts: new Date().toISOString(),
      queueDepth: this.queue.length,
      readerConnected: this.readerConnected,
    };

    const msg = new Message(JSON.stringify(payload));
    msg.contentType = 'application/json';
    msg.contentEncoding = 'utf-8';

    this.client.sendEvent(msg, (err) => {
      if (err) {
        console.error('[IoT] Failed to send heartbeat:', err.message);
      }
    });
  }

  // ─── Accessors ───────────────────────────────────────────────────────────────

  setReaderConnected(connected: boolean): void {
    this.readerConnected = connected;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getQueueDepth(): number {
    return this.queue.length;
  }

  buildHeartbeat(): HeartbeatPayload {
    return {
      deviceId: this.deviceId,
      doorId: this.doorId,
      type: 'heartbeat',
      ts: new Date().toISOString(),
      queueDepth: this.queue.length,
      readerConnected: this.readerConnected,
    };
  }
}
