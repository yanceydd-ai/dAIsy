import { getDb } from '@/db';
import { devices, deviceHeartbeats } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { computeDeviceStatus } from './deviceService';
import type { DeviceDb, DeviceRecord, HeartbeatHistoryRow } from './deviceService';

export function makeDeviceDb(): DeviceDb {
  const db = getDb();
  return {
    async getAllDevices() {
      const rows = await db
        .select({
          id: devices.id,
          doorId: devices.doorId,
          type: devices.type,
          lastHeartbeatAt: devices.lastHeartbeatAt,
          lastQueueDepth: devices.lastQueueDepth,
          lastReaderConnected: devices.lastReaderConnected,
          zoneAReadRate: devices.zoneAReadRate,
          zoneBReadRate: devices.zoneBReadRate,
        })
        .from(devices);

      const now = new Date();
      return rows.map((r): DeviceRecord => {
        const status = computeDeviceStatus(r.lastHeartbeatAt, now);
        const secondsSinceHeartbeat = r.lastHeartbeatAt
          ? Math.floor((now.getTime() - r.lastHeartbeatAt.getTime()) / 1000)
          : null;
        return {
          id: r.id,
          doorId: r.doorId,
          type: r.type,
          status,
          lastHeartbeatAt: r.lastHeartbeatAt?.toISOString() ?? null,
          queueDepth: r.lastQueueDepth,
          readerConnected: r.lastReaderConnected,
          zoneAReadRate: r.zoneAReadRate,
          zoneBReadRate: r.zoneBReadRate,
          secondsSinceHeartbeat,
        };
      });
    },

    async getHeartbeatHistory(deviceId, limit) {
      const rows = await db
        .select({ id: deviceHeartbeats.id, ts: deviceHeartbeats.ts, payload: deviceHeartbeats.payload })
        .from(deviceHeartbeats)
        .where(eq(deviceHeartbeats.deviceId, deviceId))
        .orderBy(desc(deviceHeartbeats.ts))
        .limit(limit);

      return rows.map((r): HeartbeatHistoryRow => ({
        id: r.id,
        ts: r.ts.toISOString(),
        payload: r.payload as Record<string, unknown>,
      }));
    },
  };
}
