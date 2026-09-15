import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("db:migrate skipped: DATABASE_URL not set");
    return;
  }
  const migrationsFolder = path.join(process.cwd(), "db", "migrations");
  if (!fs.existsSync(migrationsFolder)) {
    console.log("db:migrate: no db/migrations folder yet, nothing to apply");
    return;
  }
  const sql = neon(url);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder });
  console.log("db:migrate done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
