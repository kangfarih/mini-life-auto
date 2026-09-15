import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { chunks, entities, events, worlds } from "./schema";

function blankTiles() {
  return { tiles: Array.from({ length: 16 }, () => Array(16).fill(0)) };
}

// Stillpond Bank (-1,0): plains transition, meadow east, shore + pond west,
// dirt path entering from the east edge (spawn side) at row 8.
// Tileset indexes: 0 grass, 1 dense-grass, 4 shallow-water, 5 deep-water,
// 6 dirt-path, 8 shore, 9 pond.
function stillpondBankTiles() {
  const grid: number[][] = [];
  for (let y = 0; y < 16; y++) {
    const row: number[] = [];
    for (let x = 0; x < 16; x++) {
      let t: number;
      if (x <= 2) {
        // Stillpond water core: deep inside, shallow at the north/south rim.
        t = y >= 2 && y <= 13 ? 5 : 4;
      } else if (x === 3) {
        // Pond rim grading into shore, with pond-tile accents.
        t = (y + 3) % 4 === 0 ? 9 : 4;
      } else if (x === 4 || x === 5) {
        // Shore band on the west half.
        t = 8;
      } else {
        // Meadow on the east half near spawn.
        t = (x * 7 + y * 3) % 7 === 0 ? 1 : 0;
        // Path entering from the east edge on the spawn side.
        if (y === 8 && x >= 6) t = 6;
      }
      row.push(t);
    }
    grid.push(row);
  }
  return { tiles: grid };
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

  // Stillpond Bank (-1,0): adjacent west of spawn, biome plains (true water
  // biome reserved for a later chunk at (-2,0)).
  await db.insert(chunks).values({
    worldId,
    x: -1,
    y: 0,
    biome: "plains",
    tiles: stillpondBankTiles()
  }).onConflictDoNothing({ target: [chunks.worldId, chunks.x, chunks.y] });

  // Idempotent entity seeding for (-1,0): insert only kinds not yet present.
  const existing = await sql`
    select kind, props from entities where world_id = ${worldId} and chunk_x = -1 and chunk_y = 0
  `;
  const has = (kind: string, match?: (p: Record<string, unknown>) => boolean) =>
    (existing as Array<{ kind: string; props: Record<string, unknown> }>).some(
      (r) => r.kind === kind && (!match || match(r.props ?? {}))
    );

  if (!has("npc", (p) => p["name"] === "Old Tam the Fisher")) {
    await db.insert(entities).values({
      worldId,
      chunkX: -1,
      chunkY: 0,
      kind: "npc",
      sprite: "fisher",
      props: {
        name: "Old Tam the Fisher",
        place: "Stillpond Bank",
        role: "quest-giver",
        dialog: "Quiet water today. The pond keeps what it takes.",
        quest: {
          hook: "A sunken locket lost in Stillpond — my wife's, gone beneath the west water.",
          task: "Retrieve the sunken locket marker at the pond edge of Stillpond Bank.",
          payoff: "A Fisher keepsake, plus vista text about lands further west: grey water stretches past the bank toward uncharted shore."
        }
      }
    });
  }

  if (!has("landmark", (p) => p["name"] === "Stillpond pond")) {
    await db.insert(entities).values({
      worldId,
      chunkX: -1,
      chunkY: 0,
      kind: "landmark",
      sprite: "pond",
      props: {
        name: "Stillpond pond",
        place: "Stillpond Bank",
        role: "vista and nav anchor",
        text: "Calm water on the west half of the bank, grading toward uncharted shore further west."
      }
    });
  }

  if (!has("quest-item", (p) => p["name"] === "sunken locket")) {
    await db.insert(entities).values({
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
        location: "pond edge",
        quest: "Old Tam the Fisher"
      }
    });
  }

  if (!has("signpost", (p) => p["place"] === "Stillpond Bank")) {
    await db.insert(entities).values({
      worldId,
      chunkX: -1,
      chunkY: 0,
      kind: "signpost",
      sprite: "sign",
      props: {
        name: "Bank signpost",
        place: "Stillpond Bank",
        role: "nav flavor",
        text: "East: spawn. West: uncharted shore."
      }
    });
  }

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

  // world.expanded log for (-1,0); insert once per seed history.
  const expanded = await sql`
    select id from events where world_id = ${worldId} and type = 'world.expanded'
      and payload->>'x' = '-1' and payload->>'y' = '0' limit 1
  `;
  if (expanded.length === 0) {
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
