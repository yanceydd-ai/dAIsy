// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeviceRecord {
  id: string;
  doorId: string | null;
  type: string;
  status: 'online' | 'offline' | 'unknown';
  lastHeartbeatAt: string | null;
  queueDepth: number | null;
  readerConnected: boolean | null;
  zoneAReadRate: number | null;
  zoneBReadRate: number | null;
  secondsSinceHeartbeat: number | null;
}

export interface HeartbeatHistoryRow {
  id: string;
  ts: string;
  payload: Record<string, unknown>;
}

export interface DeviceDb {
  getAllDevices(): Promise<DeviceRecord[]>;
  getHeartbeatHistory(deviceId: string, limit: number): Promise<HeartbeatHistoryRow[]>;
}

// ─── Offline threshold ────────────────────────────────────────────────────────

export const OFFLINE_THRESHOLD_SECONDS = 90;

export function computeDeviceStatus(lastHeartbeatAt: Date | null, now: Date): 'online' | 'offline' | 'unknown' {
  if (!lastHeartbeatAt) return 'unknown';
  const secondsAgo = (now.getTime() - lastHeartbeatAt.getTime()) / 1000;
  return secondsAgo <= OFFLINE_THRESHOLD_SECONDS ? 'online' : 'offline';
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getDevices(db: DeviceDb): Promise<DeviceRecord[]> {
  return db.getAllDevices();
}

export async function getDeviceHeartbeats(db: DeviceDb, deviceId: string): Promise<HeartbeatHistoryRow[]> {
  return db.getHeartbeatHistory(deviceId, 50);
}
