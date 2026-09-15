# SPEC — mini-life-auto: self-growing 2D RPG world (viewer)

## Vision

A 2D-RPG-like world in the browser that grows by itself.
The browser is **only a viewer**. All truth lives centered in Neon.
A scheduled agent expands the world: new map chunks, entities, lore, quests.

## Non-goals (for now)

- No multiplayer, no live player movement sync
- No auth, no accounts
- No realtime WebSockets, no per-frame server writes
- No game-over / combat balancing yet

## World model

- World = grid of **chunks**, each chunk 16x16 tiles.
- Tables (see `db/schema.ts` when scaffolded):
  - `worlds(id, name, seed)`
  - `chunks(world_id, x, y, biome, tiles JSONB)` — unique `(world_id, x, y)`
  - `entities(id, world_id, chunk_x, chunk_y, kind, sprite, props JSONB)`
  - `events(id, world_id, created_at, type, payload JSONB)` — append-only log the viewer polls
- Biomes (v1): `plains`, `forest`, `water`, `village`. Agent may propose more via issues.

## Growth rules (agent must follow)

1. Expand **adjacent** to existing chunks only (no floating islands).
2. One PR = max ~3 new chunks + their entities/events. Small diffs.
3. Every expansion must include: chunk rows + at least 1 entity or lore event.
4. Tiles are indexes into a shared tileset, not inline images. No binary in DB.
5. Migrations must be reversible-ish: new tables/columns OK, destructive drops forbidden without human label `human:approved`.

## Viewer behavior (PixiJS)

- `app/game/page.tsx` renders chunks around camera with PixiJS v8.
- Polls `GET /api/chunks?world=main&x0&y0&x1&y1` and `GET /api/events?since=` every 3–5s.
- Interpolates locally at 60fps. Never writes game state to server per frame.

## Issue-driven work

- Humans/ideas file issues with label `auto:todo` (e.g. "add forest village east of spawn").
- Agent picks oldest `auto:todo`, implements, opens PR, labels `auto:done`.
- Brainstorm issues use label `idea` — agent may turn them into `auto:todo` sub-tasks.
