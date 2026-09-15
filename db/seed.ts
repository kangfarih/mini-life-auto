import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { chunks, entities, events, worlds } from "./schema";

function blankTiles() {
  return { tiles: Array.from({ length: 16 }, () => Array(16).fill(0)) };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("db:seed skipped: DATABASE_URL not set");
    return;
  }
  const sql = neon(url);
  const db = drizzle(sql);

  // Idempotent starter world. Requires tables to exist (run db:migrate first).
  await db
    .insert(worlds)
    .values({ name: "main", seed: 1 })
    .onConflictDoNothing({ target: worlds.name });

  const found = await sql`select id from worlds where name = 'main' limit 1`;
  const worldId = Number(found[0]?.id ?? 1);

  await db.insert(chunks).values({
    worldId,
    x: 0,
    y: 0,
    biome: "plains",
    tiles: blankTiles()
  }).onConflictDoNothing({ target: [chunks.worldId, chunks.x, chunks.y] });

  await db.insert(entities).values({
    worldId,
    chunkX: 0,
    chunkY: 0,
    kind: "signpost",
    sprite: "sign",
    props: { text: "Spawn. The world grows from here." }
  }).onConflictDoNothing();

  await db.insert(events).values({
    worldId,
    type: "world.seeded",
    payload: { x: 0, y: 0, biome: "plains" }
  });

  console.log("db:seed done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
