import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const worlds = pgTable("worlds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  seed: integer("seed").notNull().default(1)
});

export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  biome: text("biome").notNull().default("plains"),
  // 16x16 array of tileset indexes, e.g. { tiles: [[0,1,...], ...] }
  tiles: jsonb("tiles").notNull().default({ tiles: [] })
});

export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull(),
  chunkX: integer("chunk_x").notNull(),
  chunkY: integer("chunk_y").notNull(),
  kind: text("kind").notNull(),
  sprite: text("sprite").notNull().default("npc"),
  props: jsonb("props").notNull().default({})
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  worldId: integer("world_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({})
});
