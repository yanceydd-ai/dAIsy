CREATE TABLE "app_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ts" timestamp DEFAULT now() NOT NULL,
	"user_upn" varchar(200) NOT NULL,
	"user_role" varchar(50) NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" varchar(200),
	"detail" jsonb,
	"ip_address" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "crossing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ts" timestamp NOT NULL,
	"student_id" uuid,
	"door_id" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"confidence" real NOT NULL,
	"sensor_confirmed" boolean DEFAULT false NOT NULL,
	"raw_read_count" integer NOT NULL,
	"epc" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_heartbeats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" varchar(100) NOT NULL,
	"ts" timestamp DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"door_id" varchar(50),
	"type" varchar(50) NOT NULL,
	"last_heartbeat_at" timestamp,
	"status" varchar(20) DEFAULT 'unknown' NOT NULL,
	"last_queue_depth" integer,
	"last_reader_connected" boolean,
	"zone_a_read_rate" real,
	"zone_b_read_rate" real
);
--> statement-breakpoint
CREATE TABLE "doors" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"label" varchar(100) NOT NULL,
	"location" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "presence_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"state" varchar(20) DEFAULT 'missing' NOT NULL,
	"last_crossing_id" uuid,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"manual_override" boolean DEFAULT false NOT NULL,
	"manual_override_note" text,
	"manual_override_by" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "raw_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ts" timestamp NOT NULL,
	"epc" varchar(200) NOT NULL,
	"door_id" varchar(50) NOT NULL,
	"antenna_zone" varchar(20) NOT NULL,
	"rssi" real,
	"device_id" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_roster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(200) NOT NULL,
	"scheduled_start" timestamp NOT NULL,
	"scheduled_end" timestamp NOT NULL,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_by" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"unassigned_at" timestamp,
	"assigned_by" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sis_student_key" varchar(100) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"grade" varchar(20) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_sis_student_key_unique" UNIQUE("sis_student_key")
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_type" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"students_synced" integer,
	"sessions_synced" integer,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"epc" varchar(200) NOT NULL,
	"tag_type" varchar(50) DEFAULT 'UHF_PASSIVE' NOT NULL,
	"issued_on" date NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	CONSTRAINT "tags_epc_unique" UNIQUE("epc")
);
--> statement-breakpoint
ALTER TABLE "crossing_events" ADD CONSTRAINT "crossing_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crossing_events" ADD CONSTRAINT "crossing_events_door_id_doors_id_fk" FOREIGN KEY ("door_id") REFERENCES "public"."doors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_heartbeats" ADD CONSTRAINT "device_heartbeats_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_door_id_doors_id_fk" FOREIGN KEY ("door_id") REFERENCES "public"."doors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_states" ADD CONSTRAINT "presence_states_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_states" ADD CONSTRAINT "presence_states_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_states" ADD CONSTRAINT "presence_states_last_crossing_id_crossing_events_id_fk" FOREIGN KEY ("last_crossing_id") REFERENCES "public"."crossing_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_roster" ADD CONSTRAINT "session_roster_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_roster" ADD CONSTRAINT "session_roster_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_tags" ADD CONSTRAINT "student_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "raw_reads_ts_idx" ON "raw_reads" USING btree ("ts");