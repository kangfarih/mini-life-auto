CREATE TABLE IF NOT EXISTS "chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"biome" text DEFAULT 'plains' NOT NULL,
	"tiles" jsonb DEFAULT '{"tiles":[]}'::jsonb NOT NULL,
	CONSTRAINT "chunks_world_xy" UNIQUE("world_id","x","y")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"chunk_x" integer NOT NULL,
	"chunk_y" integer NOT NULL,
	"kind" text NOT NULL,
	"sprite" text DEFAULT 'npc' NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "worlds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"seed" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "worlds_name_unique" UNIQUE("name")
);
