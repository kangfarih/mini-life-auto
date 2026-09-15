# STACK — Locked (do not change without human approval)

This file locks tech decisions. The self-build agent must NOT bikeshed stack.
Focus tokens on world content, not framework debates.

## Services (2 only)

1. **Vercel** — FE + BE
   - Next.js App Router (TypeScript)
   - PixiJS v8 viewer (client-only, `ssr: false`)
   - Route Handlers as BE API (`/api/chunk`, `/api/events`, `/api/state`)
2. **Neon Postgres** — centered source of truth
   - Access via `@neondatabase/serverless` (HTTP, pooled)
   - Schema/migrations via `drizzle-orm` + `drizzle-kit`

## Explicitly OUT

- No server-side SQLite file on Vercel (ephemeral FS, loses data)
- No Redis / realtime DB / WebSocket server for now (viewer polls)
- No Supabase / Convex / Firebase / Turso unless human approves
- No multiplayer netcode, no auth system yet

## Packages

- `next` (App Router), `react`, `typescript`
- `pixi.js` (^8) — rendering only
- `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`
- `zod` for API validation (optional but preferred)

## Commands

- `npm run dev` — local dev
- `npm run build` — must pass before any PR
- `npm run db:generate` — drizzle generate migration
- `npm run db:migrate` — apply migration (CI uses `DATABASE_URL` secret)
- `npm run db:seed` — seed starter world (idempotent)

## Env

- `DATABASE_URL` — Neon pooled connection string (Vercel env + GitHub Secret)
- Never commit `.env.local`

## Data pattern

- World stored as **chunks**: 1 row = 16x16 tiles (`tiles JSONB`)
- Viewer polls, never subscribes: `GET /api/chunks?x&y`, `GET /api/events?since=`
- Writes only from agent/seed scripts + rare admin API. No per-frame writes.
