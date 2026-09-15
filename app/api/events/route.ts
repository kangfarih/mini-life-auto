import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const world = searchParams.get("world") ?? "main";
  const since = searchParams.get("since") ?? "1970-01-01T00:00:00Z";
  const rawLimit = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ events: [], note: "DATABASE_URL not set" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      select e.id, e.created_at, e.type, e.payload
      from events e
      join worlds w on w.id = e.world_id
      where w.name = ${world}
        and e.created_at > ${since}::timestamptz
      order by e.created_at asc
      limit ${limit}
    `;
    return NextResponse.json({ events: rows });
  } catch (err) {
    console.error("GET /api/events failed", err);
    return NextResponse.json({ events: [], error: "db unreachable" }, { status: 200 });
  }
}
