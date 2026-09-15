import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { chunks, entities, events, worlds } from "./schema";

function blankTiles() {
  return { tiles: Array.from({ length: 16 }, () => Array(16).fill(0)) };
}

/**
 * Whisperwood (0,1) — forager forest south of spawn.
 * Tiles are indexes into the shared tileset (public/tiles/tileset.json):
 * 0 grass, 1 dense-grass, 2 pine-floor, 3 canopy, 6 dirt-path.
 * A dirt path enters from the north edge (spawn side) and fades into the
 * woods; canopy density grows toward the south edge so danger and
 * complexity grow outward.
 */
function whisperwoodTiles() {
  const rows: number[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: number[] = [];
    for (let x = 0; x < 16; x++) {
      // Clear path entering from the north edge on the spawn side.
      if ((x === 7 || x === 8) && y <= 7) {
        row.push(6);
        continue;
      }
      const hash = (x * 7 + y * 13 + ((x * y) % 11)) % 16;
      // Denser tree tiles toward the south edge.
      const threshold = 2 + Math.floor(y * 0.8);
      if (hash < threshold) {
        row.push(3); // canopy
      } else if (y <= 1 && hash % 3 === 0) {
        row.push(0); // grass fringe where forest meets plains directly
      } else {
        row.push(2); // pine-floor
      }
    }
    rows.push(row);
  }
  return { tiles: rows };
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

  // Whisperwood: forager forest south of spawn (0,1). Adjacent to (0,0),
  // so no transition chunk is needed where forest meets plains directly.
  await db.insert(chunks).values({
    worldId,
    x: 0,
    y: 1,
    biome: "forest",
    tiles: whisperwoodTiles()
  }).onConflictDoNothing({ target: [chunks.worldId, chunks.x, chunks.y] });

  await db.insert(entities).values({
    worldId,
    chunkX: 0,
    chunkY: 1,
    kind: "npc",
    sprite: "forager",
    props: {
      name: "Pippa the Forager",
      place: "Whisperwood",
      role: "quest-giver",
      occupation: "gatherer",
      position: { tx: 7, ty: 3 },
      hook: "A blight is on the glowcap patch.",
      task: "Gather 3 glowcaps marked around the chunk.",
      payoff: "A poultice recipe plus a rumor pointing west toward Stillpond Bank at (-1,0).",
      quest: {
        hook: "A blight is on the glowcap patch.",
        task: "Gather 3 glowcaps marked around the chunk.",
        payoff: "A poultice recipe plus a rumor pointing west toward Stillpond Bank at (-1,0)."
      }
    }
  }).onConflictDoNothing();

  await db.insert(entities).values({
    worldId,
    chunkX: 0,
    chunkY: 1,
    kind: "landmark",
    sprite: "oak",
    props: {
      name: "Whispering Oak",
      place: "Whisperwood",
      role: "vista",
      secondaryRole: "nav anchor",
      position: { tx: 8, ty: 8 },
      description: "Oldest tree near chunk center."
    }
  }).onConflictDoNothing();

  await db.insert(entities).values({
    worldId,
    chunkX: 0,
    chunkY: 1,
    kind: "resource",
    sprite: "glowcap",
    props: {
      name: "glowcap patch",
      place: "Whisperwood",
      role: "quest objective",
      gatherable: true,
      count: 3,
      markers: [
        { id: 1, tx: 4, ty: 5 },
        { id: 2, tx: 11, ty: 6 },
        { id: 3, tx: 9, ty: 11 }
      ]
    }
  }).onConflictDoNothing();

  await db.insert(entities).values({
    worldId,
    chunkX: 0,
    chunkY: 1,
    kind: "flavor",
    sprite: "wisp",
    props: {
      name: "pale wisp",
      place: "Whisperwood",
      role: "mystery",
      position: { tx: 4, ty: 14 },
      hint: "Drifts near the south edge; hints at deeper woods further south."
    }
  }).onConflictDoNothing();

  await db.insert(events).values({
    worldId,
    type: "world.expanded",
    payload: { x: 0, y: 1, biome: "forest", place: "Whisperwood" }
  });

  console.log("db:seed done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
