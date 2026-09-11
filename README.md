# WOD Engine

A daily bodyweight workout generator and training log. Bodyweight + a
pull-up bar only, ≤30 minutes, ≤5 days a week — CrossFit-inspired WODs
without the gym membership.

See [`docs/plan.md`](docs/plan.md) for the full plan and
[`docs/adr/`](docs/adr) for the reasoning behind the bigger calls.

## Where the work is tracked

Planning lives in **[Linear](https://linear.app/wod-engine)** — the backlog,
what's in progress, and everything not yet built.

GitHub Issues is the **archive of shipped work**, kept readable because the
code cites it: comments like `Feature #63 opt-in` in `schema.prisma` point at
the issue that explains why a field exists. Those issues are all closed, and
the empty backlog there means the work moved, not that the project is done.

A bare `#N` in a doc, comment or commit message is a GitHub issue. Linear
issues are always written in full (`WOD-5`) — the two numbering schemes
overlap and mean different things, so the prefix is what tells them apart.

## Stack

TypeScript monorepo (npm workspaces): NestJS + Prisma + Postgres API,
React + Vite + Tailwind web client, Zod-schema types shared between them
in `packages/shared`.

## Getting started

```bash
npm install   # also builds packages/shared (postinstall) — apps/api needs its compiled dist

# API: generate the Prisma client, run the migration, seed the WOD library
npm run prisma:generate --workspace apps/api
npm run prisma:migrate --workspace apps/api
npm run prisma:seed --workspace apps/api

# run both apps (separate terminals)
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:5173
```

Copy `apps/api/.env.example` to `apps/api/.env` first if it isn't there
already.

If you edit `packages/shared`, rebuild it before the API dev server will
see the change — `npm run build --workspace packages/shared`, or run
`npm run dev --workspace packages/shared` in a separate terminal to
rebuild on save.

## Scripts (root)

- `npm run dev:api` / `npm run dev:web` — run one app
- `npm run build` — build all workspaces
- `npm run lint` / `npm run typecheck` / `npm run test` — across all workspaces
