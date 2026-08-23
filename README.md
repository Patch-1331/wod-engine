# WOD Engine

A daily bodyweight workout generator and training log. Bodyweight + a
pull-up bar only, ≤30 minutes, ≤5 days a week — CrossFit-inspired WODs
without the gym membership.

See [`docs/plan.md`](docs/plan.md) for the full plan and
[`docs/adr/`](docs/adr) for the reasoning behind the bigger calls.

## Stack

TypeScript monorepo (npm workspaces): NestJS + Prisma + SQLite API,
React + Vite + Tailwind web client, Zod-schema types shared between them
in `packages/shared`.

## Getting started

```bash
npm install

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

## Scripts (root)

- `npm run dev:api` / `npm run dev:web` — run one app
- `npm run build` — build all workspaces
- `npm run lint` / `npm run typecheck` / `npm run test` — across all workspaces
