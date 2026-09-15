import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { chunks, entities, events, worlds } from "./schema";

function blankTiles() {
  return { tiles: Array.from({ length: 16 }, () => Array(16).fill(0)) };
}

// Stillpond Bank (-1,0): plains transition between spawn meadow (east half)
// and future water (west). Tileset indexes: 0 grass, 1 dense-grass,
// 4 shallow-water, 5 deep-water, 6 dirt-path (used as shore sand/mud + path).
function stillpondBankTiles() {
  const tiles: number[][] = Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      // East-half meadow base with deterministic dense-grass flecks.
      if (x >= 8) return (x + y) % 5 === 0 ? 1 : 0;
      return 0;
    })
  );
  const cx = 3;
  const cy = 8;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 8; x++) {
      const dx = x - cx;
      const dy = (y - cy) * 1.2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 1.8) tiles[y][x] = 5; // pond core: deep-water
      else if (dist <= 3.0) tiles[y][x] = 4; // pond ring: shallow-water
      else if (dist <= 4.0) tiles[y][x] = 6; // shore ring: dirt-path as bank
    }
  }
  // Path entering from the east edge (spawn side) at row 8, ending at the
  // pond shore so travelers reach Old Tam and the locket marker.
  for (let x = 6; x < 16; x++) {
    if (tiles[8][x] !== 5 && tiles[8][x] !== 4) tiles[8][x] = 6;
  }
  return { tiles };
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

  // Issue #8 — Stillpond Bank: western pond transition (-1,0).
  // Adjacent to spawn (0,0); biome stays plains so water never sits
  // directly against spawn. True water biome is reserved for (-2,0).
  const existingBank =
    await sql`select id from chunks where world_id = ${worldId} and x = -1 and y = 0 limit 1`;
  if (existingBank.length === 0) {
    await db.insert(chunks).values({
      worldId,
      x: -1,
      y: 0,
      biome: "plains",
      tiles: stillpondBankTiles()
    }).onConflictDoNothing({ target: [chunks.worldId, chunks.x, chunks.y] });
  }

  const existingBankEntities =
    await sql`select id from entities where world_id = ${worldId} and chunk_x = -1 and chunk_y = 0 limit 1`;
  if (existingBankEntities.length === 0) {
    await db.insert(entities).values([
      {
        worldId,
        chunkX: -1,
        chunkY: 0,
        kind: "npc",
        sprite: "fisher",
        props: {
          name: "Old Tam the Fisher",
          place: "Stillpond Bank",
          role: "quest-giver",
          hook: "A sunken locket lost in Stillpond calls out to be found.",
          task: "Retrieve the sunken locket marker at the pond edge.",
          payoff: "A Fisher keepsake, plus vista text: far western waters glimmer beyond uncharted shore.",
          quest: {
            hook: "A sunken locket lost in Stillpond calls out to be found.",
            task: "Retrieve the sunken locket marker at the pond edge.",
            payoff: "A Fisher keepsake, plus vista text: far western waters glimmer beyond uncharted shore."
          }
        }
      },
      {
        worldId,
        chunkX: -1,
        chunkY: 0,
        kind: "landmark",
        sprite: "pond",
        props: {
          name: "Stillpond",
          place: "Stillpond Bank",
          role: "vista and nav anchor",
          text: "Stillpond lies calm across the west half of Stillpond Bank, a quiet mystery and vista stop."
        }
      },
      {
        worldId,
        chunkX: -1,
        chunkY: 0,
        kind: "quest-item",
        sprite: "locket",
        props: {
          name: "sunken locket",
          place: "Stillpond Bank",
          role: "quest objective",
          retrievable: true,
          text: "A single retrievable sunken locket glints at the Stillpond edge."
        }
      },
      {
        worldId,
        chunkX: -1,
        chunkY: 0,
        kind: "signpost",
        sprite: "sign",
        props: {
          name: "Bank signpost",
          place: "Stillpond Bank",
          role: "nav flavor",
          text: "East: spawn meadow. West: uncharted shore."
        }
      }
    ]).onConflictDoNothing();
  }

  const existingBankEvent =
    await sql`select id from events where world_id = ${worldId} and type = 'world.expanded' and payload ->> 'x' = '-1' and payload ->> 'y' = '0' limit 1`;
  if (existingBankEvent.length === 0) {
    await db.insert(events).values({
      worldId,
      type: "world.expanded",
      payload: { x: -1, y: 0, biome: "plains", place: "Stillpond Bank" }
    });
  }

  console.log("db:seed done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
