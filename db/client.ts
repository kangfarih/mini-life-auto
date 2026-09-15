import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let cached: ReturnType<typeof drizzle> | null = null;

/** Returns null when DATABASE_URL is missing so `next build` works without a DB. */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!cached) {
    const sql = neon(url);
    cached = drizzle(sql);
  }
  return cached;
}
