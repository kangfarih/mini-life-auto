import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const world = searchParams.get("world") ?? "main";

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      world,
      counts: { chunks: 0, entities: 0, events: 0 },
      note: "DATABASE_URL not set"
    });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const w = await sql`select id, name from worlds where name = ${world} limit 1`;
    if (w.length === 0) {
      return NextResponse.json({ world, counts: { chunks: 0, entities: 0, events: 0 } });
    }
    const worldId = (w[0] as { id: number }).id;
    const [c, e, ev] = await Promise.all([
      sql`select count(*)::int as n from chunks where world_id = ${worldId}`,
      sql`select count(*)::int as n from entities where world_id = ${worldId}`,
      sql`select count(*)::int as n from events where world_id = ${worldId}`
    ]);
    return NextResponse.json({
      world,
      counts: {
        chunks: (c[0] as { n: number }).n,
        entities: (e[0] as { n: number }).n,
        events: (ev[0] as { n: number }).n
      }
    });
  } catch (err) {
    console.error("GET /api/state failed", err);
    return NextResponse.json({ world, counts: null, error: "db unreachable" }, { status: 200 });
  }
}
