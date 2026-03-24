import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  date,
  real,
  integer,
  text,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// students
export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  sisStudentKey: varchar('sis_student_key', { length: 100 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  grade: varchar('grade', { length: 20 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  epc: varchar('epc', { length: 200 }).notNull().unique(),
  tagType: varchar('tag_type', { length: 50 }).notNull().default('UHF_PASSIVE'),
  issuedOn: date('issued_on').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active | revoked | lost
});

// student_tags (assignment history — never delete, only add unassigned_at)
export const studentTags = pgTable('student_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').notNull().references(() => students.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  unassignedAt: timestamp('unassigned_at'),
  assignedBy: varchar('assigned_by', { length: 200 }).notNull(), // Azure AD user UPN
});

// doors
export const doors = pgTable('doors', {
  id: varchar('id', { length: 50 }).primaryKey(), // "door-a" | "door-b"
  label: varchar('label', { length: 100 }).notNull(),
  location: varchar('location', { length: 200 }),
});

// devices (edge nodes + readers)
export const devices = pgTable('devices', {
  id: varchar('id', { length: 100 }).primaryKey(), // IoT Hub device ID
  doorId: varchar('door_id', { length: 50 }).references(() => doors.id),
  type: varchar('type', { length: 50 }).notNull(), // "edge_node" | "reader"
  lastHeartbeatAt: timestamp('last_heartbeat_at'),
  status: varchar('status', { length: 20 }).notNull().default('unknown'), // online | offline | unknown
  lastQueueDepth: integer('last_queue_depth'),
  lastReaderConnected: boolean('last_reader_connected'),
  zoneAReadRate: real('zone_a_read_rate'),
  zoneBReadRate: real('zone_b_read_rate'),
});

// device_heartbeats (history for the health log modal)
export const deviceHeartbeats = pgTable('device_heartbeats', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: varchar('device_id', { length: 100 }).notNull().references(() => devices.id),
  ts: timestamp('ts').notNull().defaultNow(),
  payload: jsonb('payload').notNull(),
});

// raw_reads (retained per policy; index ts for retention queries)
export const rawReads = pgTable(
  'raw_reads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ts: timestamp('ts').notNull(),
    epc: varchar('epc', { length: 200 }).notNull(),
    doorId: varchar('door_id', { length: 50 }).notNull(),
    antennaZone: varchar('antenna_zone', { length: 20 }).notNull(), // "zone-a" | "zone-b"
    rssi: real('rssi'),
    deviceId: varchar('device_id', { length: 100 }).notNull(),
  },
  (table) => [index('raw_reads_ts_idx').on(table.ts)],
);

// crossing_events
export const crossingEvents = pgTable('crossing_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ts: timestamp('ts').notNull(),
  studentId: uuid('student_id').references(() => students.id),
  doorId: varchar('door_id', { length: 50 }).notNull().references(() => doors.id),
  direction: varchar('direction', { length: 10 }).notNull(), // IN | OUT | UNKNOWN
  confidence: real('confidence').notNull(),
  sensorConfirmed: boolean('sensor_confirmed').notNull().default(false),
  rawReadCount: integer('raw_read_count').notNull(),
  epc: varchar('epc', { length: 200 }).notNull(),
});

// sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: varchar('label', { length: 200 }).notNull(),
  scheduledStart: timestamp('scheduled_start').notNull(),
  scheduledEnd: timestamp('scheduled_end').notNull(),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled | active | ended
  createdBy: varchar('created_by', { length: 200 }).notNull(),
});

// session_roster (expected students per session)
export const sessionRoster = pgTable('session_roster', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
});

// presence_states (current state per student per session)
export const presenceStates = pgTable('presence_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  studentId: uuid('student_id').notNull().references(() => students.id),
  state: varchar('state', { length: 20 }).notNull().default('missing'), // present | missing | unknown
  lastCrossingId: uuid('last_crossing_id').references(() => crossingEvents.id),
  lastUpdatedAt: timestamp('last_updated_at').notNull().defaultNow(),
  manualOverride: boolean('manual_override').notNull().default(false),
  manualOverrideNote: text('manual_override_note'),
  manualOverrideBy: varchar('manual_override_by', { length: 200 }),
});

// audit_log (immutable — no UPDATE or DELETE operations permitted on this table)
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  ts: timestamp('ts').notNull().defaultNow(),
  userUpn: varchar('user_upn', { length: 200 }).notNull(),
  userRole: varchar('user_role', { length: 50 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: varchar('resource_id', { length: 200 }),
  detail: jsonb('detail'),
  ipAddress: varchar('ip_address', { length: 50 }),
});

// sync_log (Blackbaud sync history)
export const syncLog = pgTable('sync_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  syncType: varchar('sync_type', { length: 20 }).notNull(), // full | delta
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  studentsSynced: integer('students_synced'),
  sessionsSynced: integer('sessions_synced'),
  errorMessage: text('error_message'),
});

// app_config (key-value configuration — retention policy, etc.)
export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 200 }),
});
