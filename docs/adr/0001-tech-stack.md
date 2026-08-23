# ADR 0001: Tech stack

**Status:** Accepted

## Context

WOD Engine starts as a local-only web app but is meant to grow to hosted
web, iOS, and Android without a rewrite. That constraint should drive the
stack more than any single layer's ergonomics.

## Decision

TypeScript everywhere, in one npm-workspaces monorepo:

- **API:** NestJS (modules + DI keep the generator/scheduler logic testable
  as it grows) on Node.
- **Database:** SQLite via Prisma locally; Prisma makes a later move to
  Postgres a config change, not a rewrite.
- **Shared types:** `packages/shared` — Zod schemas are the one source of
  truth for DTOs, imported by every client.
- **Web:** React + Vite + TypeScript + TanStack Query + Tailwind CSS.
- **Future mobile:** React Native (Expo), importing `packages/shared`
  directly — no client-side type/DTO work redone.

## Why not Express, or a Python backend

Express is lighter but hands back the structure NestJS gives for free as
scheduling logic grows. A Python (FastAPI) backend was the other real
contender — faster to write, excellent auto-generated docs — but it forfeits
direct code/type reuse with a future React Native app; that reuse is the
whole point of the TypeScript choice here.
