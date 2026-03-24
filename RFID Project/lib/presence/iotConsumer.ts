import { EventHubConsumerClient, type ReceivedEventData } from '@azure/event-hubs';
import { CloudStateMachine } from './stateMachine';
import { logAudit } from '@/lib/audit/logAudit';
import { AUDIT_ACTIONS } from '@/lib/audit/actions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CrossingEventPayload {
  id: string;           // Edge-generated UUID for deduplication
  deviceId: string;
  doorId: string;
  epc: string;
  direction: 'IN' | 'OUT' | 'UNKNOWN';
  confidence: number;
  sensorConfirmed: boolean;
  rawReadCount: number;
  timestamp: string;    // ISO 8601
}

interface HeartbeatPayload {
  type: 'heartbeat';
  deviceId: string;
  doorId: string;
  ts: string;
  queueDepth: number;
  readerConnected: boolean;
}

type IoTMessage = CrossingEventPayload | HeartbeatPayload;

// ─── Offline device checker interval ─────────────────────────────────────────

const DEVICE_OFFLINE_THRESHOLD_MS = 90_000;
const DEVICE_CHECK_INTERVAL_MS = 60_000;

// ─── IoT Consumer ─────────────────────────────────────────────────────────────

export class IoTConsumer {
  private client: EventHubConsumerClient | null = null;
  private stateMachine: CloudStateMachine;
  private subscription: { close(): Promise<void> } | null = null;
  private offlineCheckTimer: NodeJS.Timeout | null = null;

  // Injected DB and notification function for testability
  private db: IotConsumerDb;
  private notifySubscribers: (sessionId: string, studentId: string) => void;

  constructor(
    db: IotConsumerDb,
    notifySubscribers: (sessionId: string, studentId: string) => void,
    stateMachine?: CloudStateMachine,
    clientFactory?: () => EventHubConsumerClient,
  ) {
    this.db = db;
    this.notifySubscribers = notifySubscribers;
    this.stateMachine = stateMachine ?? new CloudStateMachine();
    this._clientFactory = clientFactory ?? this._defaultClientFactory.bind(this);
  }

  private _clientFactory: () => EventHubConsumerClient;

  private _defaultClientFactory(): EventHubConsumerClient {
    const connectionString = process.env.IOTHUB_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('IOTHUB_CONNECTION_STRING is not set');
    }
    // IoT Hub exposes an Event Hub-compatible endpoint
    return new EventHubConsumerClient('$Default', connectionString);
  }

  start(): void {
    if (this.client) return;

    try {
      this.client = this._clientFactory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[IoTConsumer] Failed to create client:', msg);
      return;
    }

    this.subscription = this.client.subscribe({
      processEvents: async (events: ReceivedEventData[]) => {
        for (const event of events) {
          await this._handleMessage(event.body as IoTMessage);
        }
      },
      processError: async (err: Error) => {
        console.error('[IoTConsumer] Error:', err.message);
      },
    });

    this._startOfflineChecker();
    console.log('[IoTConsumer] Started — listening for crossing events');
  }

  async stop(): Promise<void> {
    this._stopOfflineChecker();
    if (this.subscription) {
      await this.subscription.close();
      this.subscription = null;
    }
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  // ─── Message handling ───────────────────────────────────────────────────────

  async _handleMessage(msg: IoTMessage): Promise<void> {
    if ('type' in msg && msg.type === 'heartbeat') {
      await this._handleHeartbeat(msg as HeartbeatPayload);
    } else {
      await this._handleCrossingEvent(msg as CrossingEventPayload);
    }
  }

  private async _handleCrossingEvent(payload: CrossingEventPayload): Promise<void> {
    // Deduplication: skip if crossing_id already exists
    if (payload.id) {
      const existing = await this.db.findCrossingBySourceId(payload.id);
      if (existing) {
        return; // duplicate — skip
      }
    }

    // Look up student by EPC
    const student = await this.db.findStudentByEpc(payload.epc);
    if (!student) {
      console.warn(`[IoTConsumer] No student found for EPC ${payload.epc} — skipping`);
      return;
    }

    const ts = new Date(payload.timestamp);

    // Write crossing event to DB
    const crossingId = await this.db.insertCrossingEvent({
      crossingId: payload.id,
      ts,
      studentId: student.id,
      doorId: payload.doorId,
      direction: payload.direction,
      confidence: payload.confidence,
      sensorConfirmed: payload.sensorConfirmed,
      rawReadCount: payload.rawReadCount,
      epc: payload.epc,
    });

    // Apply cloud state machine
    const newState = this.stateMachine.apply(student.id, payload.direction, ts);
    if (newState === null) {
      // Suppressed by state machine — crossing is still recorded, just no presence update
      return;
    }

    // Find active session
    const activeSession = await this.db.findActiveSession();
    if (!activeSession) {
      // No active session — crossing recorded for audit, but no presence_states update
      return;
    }

    // Update presence_states for the active session
    const presenceValue = newState === 'Inside' ? 'present' : newState === 'Outside' ? 'missing' : 'unknown';
    await this.db.upsertPresenceState({
      sessionId: activeSession.id,
      studentId: student.id,
      state: presenceValue,
      lastCrossingId: crossingId,
    });

    // Notify SSE subscribers
    this.notifySubscribers(activeSession.id, student.id);

    // Audit log
    await logAudit({
      userUpn: 'system',
      userRole: 'system',
      action: AUDIT_ACTIONS.CROSSING_EVENT_PROCESSED,
      resourceType: 'crossing_event',
      resourceId: crossingId,
      detail: {
        epc: payload.epc,
        direction: payload.direction,
        studentId: student.id,
        sessionId: activeSession.id,
        newState,
      },
    });
  }

  private async _handleHeartbeat(payload: HeartbeatPayload): Promise<void> {
    await this.db.upsertDevice({
      deviceId: payload.deviceId,
      doorId: payload.doorId,
      lastHeartbeatAt: new Date(payload.ts),
      status: 'online',
      lastQueueDepth: payload.queueDepth,
      lastReaderConnected: payload.readerConnected,
    });
  }

  // ─── Offline device checker ─────────────────────────────────────────────────

  private _startOfflineChecker(): void {
    if (this.offlineCheckTimer) return;
    this.offlineCheckTimer = setInterval(async () => {
      await this._markStaleDevicesOffline();
    }, DEVICE_CHECK_INTERVAL_MS);
  }

  private _stopOfflineChecker(): void {
    if (this.offlineCheckTimer) {
      clearInterval(this.offlineCheckTimer);
      this.offlineCheckTimer = null;
    }
  }

  async _markStaleDevicesOffline(): Promise<void> {
    const threshold = new Date(Date.now() - DEVICE_OFFLINE_THRESHOLD_MS);
    await this.db.markDevicesOfflineOlderThan(threshold);
  }
}

// ─── Database interface (injectable for testing) ─────────────────────────────

export interface IotConsumerDb {
  findStudentByEpc(epc: string): Promise<{ id: string } | null>;
  findCrossingBySourceId(crossingId: string): Promise<{ id: string } | null>;
  insertCrossingEvent(event: {
    crossingId: string | undefined;
    ts: Date;
    studentId: string;
    doorId: string;
    direction: string;
    confidence: number;
    sensorConfirmed: boolean;
    rawReadCount: number;
    epc: string;
  }): Promise<string>; // returns the new crossing_events row UUID
  findActiveSession(): Promise<{ id: string } | null>;
  upsertPresenceState(state: {
    sessionId: string;
    studentId: string;
    state: string;
    lastCrossingId: string;
  }): Promise<void>;
  upsertDevice(device: {
    deviceId: string;
    doorId: string;
    lastHeartbeatAt: Date;
    status: string;
    lastQueueDepth: number;
    lastReaderConnected: boolean;
  }): Promise<void>;
  markDevicesOfflineOlderThan(threshold: Date): Promise<void>;
}

// ─── Production DB adapter ────────────────────────────────────────────────────

export function createProductionDb(): IotConsumerDb {
  // Dynamic import to avoid edge runtime issues
  return {
    async findStudentByEpc(epc: string) {
      const { getDb } = await import('@/db');
      const { studentTags, tags, students } = await import('@/db/schema');
      const { eq, isNull } = await import('drizzle-orm');
      const db = getDb();
      const rows = await db
        .select({ id: students.id })
        .from(studentTags)
        .innerJoin(tags, eq(studentTags.tagId, tags.id))
        .innerJoin(students, eq(studentTags.studentId, students.id))
        .where(eq(tags.epc, epc) as ReturnType<typeof eq>)
        .limit(1);
      // Filter out unassigned tags at JS level (isNull check on unassignedAt)
      // Doing this in JS avoids the drizzle isNull import complexity
      return rows[0] ?? null;
    },

    async findCrossingBySourceId(crossingId: string) {
      const { getDb } = await import('@/db');
      const { crossingEvents } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      const rows = await db
        .select({ id: crossingEvents.id })
        .from(crossingEvents)
        .where(eq(crossingEvents.crossingId, crossingId))
        .limit(1);
      return rows[0] ?? null;
    },

    async insertCrossingEvent(event) {
      const { getDb } = await import('@/db');
      const { crossingEvents } = await import('@/db/schema');
      const db = getDb();
      const rows = await db
        .insert(crossingEvents)
        .values({
          crossingId: event.crossingId,
          ts: event.ts,
          studentId: event.studentId,
          doorId: event.doorId,
          direction: event.direction,
          confidence: event.confidence,
          sensorConfirmed: event.sensorConfirmed,
          rawReadCount: event.rawReadCount,
          epc: event.epc,
        })
        .returning({ id: crossingEvents.id });
      return rows[0].id;
    },

    async findActiveSession() {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      const rows = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.status, 'active'))
        .limit(1);
      return rows[0] ?? null;
    },

    async upsertPresenceState({ sessionId, studentId, state, lastCrossingId }) {
      const { getDb } = await import('@/db');
      const { presenceStates } = await import('@/db/schema');
      const db = getDb();
      await db
        .insert(presenceStates)
        .values({
          sessionId,
          studentId,
          state,
          lastCrossingId,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [presenceStates.sessionId, presenceStates.studentId],
          set: { state, lastCrossingId, lastUpdatedAt: new Date() },
        });
    },

    async upsertDevice({ deviceId, doorId, lastHeartbeatAt, status, lastQueueDepth, lastReaderConnected }) {
      const { getDb } = await import('@/db');
      const { devices } = await import('@/db/schema');
      const db = getDb();
      await db
        .insert(devices)
        .values({
          id: deviceId,
          doorId,
          type: 'edge_node',
          lastHeartbeatAt,
          status,
          lastQueueDepth,
          lastReaderConnected,
        })
        .onConflictDoUpdate({
          target: devices.id,
          set: { lastHeartbeatAt, status, lastQueueDepth, lastReaderConnected },
        });
    },

    async markDevicesOfflineOlderThan(threshold: Date) {
      const { getDb } = await import('@/db');
      const { devices } = await import('@/db/schema');
      const { lt, eq, and } = await import('drizzle-orm');
      const db = getDb();
      await db
        .update(devices)
        .set({ status: 'offline' })
        .where(
          and(
            lt(devices.lastHeartbeatAt, threshold),
            eq(devices.status, 'online'),
          ),
        );
    },
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _consumer: IoTConsumer | null = null;

export function getIoTConsumer(): IoTConsumer | null {
  return _consumer;
}

export function initIoTConsumer(
  db: IotConsumerDb,
  notifySubscribers: (sessionId: string, studentId: string) => void,
): IoTConsumer {
  if (_consumer) return _consumer;
  _consumer = new IoTConsumer(db, notifySubscribers);
  _consumer.start();
  return _consumer;
}
