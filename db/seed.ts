import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { chunks, entities, events, worlds } from "./schema";

function blankTiles() {
  return { tiles: Array.from({ length: 16 }, () => Array(16).fill(0)) };
}

// Millbrook (1,0): roadside village east of spawn. Tileset indexes from
// public/tiles/tileset.json: 0 grass, 1 dense-grass, 6 dirt-path, 7 planks.
function millbrookTiles() {
  const tiles: number[][] = Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => ((x * 7 + y * 13) % 9 === 0 ? 1 : 0))
  );
  // Road entering from the west edge (spawn side), running east-west.
  for (let x = 0; x < 16; x++) {
    tiles[7][x] = 6;
    tiles[8][x] = 6;
  }
  // Millbrook Green: plank plaza around the village well near chunk center.
  // The road cuts through it on rows 7-8.
  for (let y = 5; y <= 10; y++) {
    for (let x = 6; x <= 9; x++) {
      if (y === 7 || y === 8) continue;
      tiles[y][x] = 7;
    }
  }
  // House-plot pads arranged around the green.
  const plots = [
    { x0: 2, x1: 4, y0: 2, y1: 3 },
    { x0: 11, x1: 13, y0: 2, y1: 3 },
    { x0: 2, x1: 4, y0: 12, y1: 13 },
    { x0: 11, x1: 13, y0: 12, y1: 13 }
  ];
  for (const p of plots) {
    for (let y = p.y0; y <= p.y1; y++) {
      for (let x = p.x0; x <= p.x1; x++) {
        tiles[y][x] = 7;
      }
    }
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

  // Millbrook: roadside village east of spawn (1,0). Adjacent to (0,0).
  // Idempotent: skip when the chunk already exists.
  const millbrook = await sql`select id from chunks where world_id = ${worldId} and x = 1 and y = 0 limit 1`;
  if (millbrook.length === 0) {
    await db.insert(chunks).values({
      worldId,
      x: 1,
      y: 0,
      biome: "village",
      tiles: millbrookTiles()
    }).onConflictDoNothing({ target: [chunks.worldId, chunks.x, chunks.y] });

    await db.insert(entities).values([
      {
        worldId,
        chunkX: 1,
        chunkY: 0,
        kind: "npc",
        sprite: "elder",
        props: {
          name: "Elder Maren",
          place: "Millbrook",
          role: "quest-giver",
          tileX: 7,
          tileY: 6,
          quest: {
            hook: "A traveler's satchel was lost on the east road out of Millbrook.",
            task: "Find the satchel cache marker at the east edge of Millbrook (1,0).",
            payoff: "A hearth-token, plus a rumor pointing south toward Whisperwood at (0,1)."
          }
        }
      },
      {
        worldId,
        chunkX: 1,
        chunkY: 0,
        kind: "npc",
        sprite: "trader",
        props: {
          name: "Bren the Trader",
          place: "Millbrook",
          role: "vendor",
          tileX: 8,
          tileY: 9,
          stock: [
            { item: "bread", price: 3, qty: 10 },
            { item: "torch", price: 5, qty: 6 },
            { item: "rope", price: 4, qty: 4 },
            { item: "hearth-charm", price: 12, qty: 1 }
          ],
          buys: ["forage", "herbs", "pelts"]
        }
      },
      {
        worldId,
        chunkX: 1,
        chunkY: 0,
        kind: "landmark",
        sprite: "well",
        props: {
          name: "Millbrook Green",
          place: "Millbrook",
          role: "vista",
          tileX: 7,
          tileY: 8,
          description: "Village well at the heart of Millbrook Green, nav anchor for the roadside village."
        }
      },
      {
        worldId,
        chunkX: 1,
        chunkY: 0,
        kind: "signpost",
        sprite: "sign",
        props: {
          name: "Crossroads signpost",
          place: "Millbrook",
          role: "nav",
          tileX: 0,
          tileY: 7,
          text: "West: spawn. East: open frontier."
        }
      }
    ]);

    await db.insert(events).values({
      worldId,
      type: "world.expanded",
      payload: { x: 1, y: 0, biome: "village" }
    });
  }

  console.log("db:seed done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
