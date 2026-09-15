import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

function num(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const world = searchParams.get("world") ?? "main";
  const x0 = num(searchParams.get("x0"), -2);
  const y0 = num(searchParams.get("y0"), -2);
  const x1 = num(searchParams.get("x1"), 2);
  const y1 = num(searchParams.get("y1"), 2);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ chunks: [], note: "DATABASE_URL not set" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      select c.id, c.x, c.y, c.biome
      from chunks c
      join worlds w on w.id = c.world_id
      where w.name = ${world}
        and c.x between ${x0} and ${x1}
        and c.y between ${y0} and ${y1}
      order by c.y, c.x
      limit 200
    `;
    return NextResponse.json({ chunks: rows });
  } catch (err) {
    console.error("GET /api/chunks failed", err);
    return NextResponse.json({ chunks: [], error: "db unreachable" }, { status: 200 });
  }
}
