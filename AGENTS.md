# AGENTS.md — instructions for the self-build agent (opencode)

Read `STACK.md` and `SPEC.md` first. They are authoritative.

## Your focus (in order)

1. **Review** — read issues/PRs, explain world state, point to relevant chunks/entities.
2. **Update** — expand the world per oldest `auto:todo` issue (adjacent chunks, entities, events).
3. **Fix** — keep `npm run build` green, fix broken chunk APIs, bad migrations, viewer regressions.
4. **Brainstorm** — turn `idea` issues into concrete `auto:todo` sub-tasks (biomes, quests, lore). Be specific: coordinates, biome, entities.

## Do NOT

- Do NOT change the stack (`STACK.md` is locked): no new DB, no Redis, no realtime service, no framework swap.
- Do NOT write per-frame game logic to Neon. Viewer polls; agent writes in batches.
- Do NOT push directly to `main`. Always open a PR.
- Do NOT do destructive DB changes (DROP TABLE/COLUMN) without label `human:approved`.
- Do NOT store images/binary in Postgres. Tiles reference shared tileset indexes.

## How to work

1. Pick oldest open issue with label `auto:todo`.
2. Inspect `db/schema.ts`, `app/api/*`, `app/game/*`.
3. Implement: Drizzle migration + seed data + viewer/API fix if needed.
4. Verify: `npm run build` must pass. If DB changed, include `db:generate` output.
5. Open PR with: what chunks added (coords), screenshots/log if viewer changed, migration notes.
6. Comment on the issue `/oc done — PR #N`, label issue `auto:done` only after PR merged.

## Roles (`.opencode/agents/`)

- `build` (default) — implements `auto:todo` issues, keeps `npm run build` green.
- `brainstorm` — idea-giver for the next loop. Runs only when the `auto:todo`
  backlog is empty; files 1–3 concrete `auto:todo` issues, writes no code.

## Rate-limit behavior

- If opencode/Zen returns 429 / `FreeUsageLimit`, parse `Retry-After` seconds.
- If wait < 15min: countdown in logs, then retry once.
- If wait >= 15min: write `.opencode/ratelimit.json` with `next_allowed_at`, exit 0. Next cron run resumes.

## Style

- Small PRs (≤3 chunks + entities). Prefer JSONB for flexible tile/entity props.
- TypeScript strict, no `any` without justification.
- API responses validated with zod where practical.
