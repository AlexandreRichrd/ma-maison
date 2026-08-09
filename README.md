# Hearth — Home Manager

A self-hosted intranet for a two-person household. One React Router app
(server-rendered, loaders/actions as the data layer) backed by PostgreSQL,
meant to run on a home server reachable only over VPN — never exposed to the
public internet.

## Sections

- **Dashboard** — read-only overview: today's reminders, shopping list
  previews, this week's cleaning chores by person.
- **Shopping** — lists with checkable items; checking an item is optimistic
  and never navigates.
- **Recipes** — seeded, read-only; push a recipe's ingredients into an
  existing shopping list or a new one, merging into matching unchecked items
  rather than duplicating them.
- **Cleaning** — a two-person chore rotation, linkable by week
  (`?week=2026-W32`). Kitchen/Trash and Bathroom/Surfaces/Floors swap weekly;
  Bedsheets and Corridor swap every two weeks and always land on opposite
  people. Assignment is computed on the fly, never stored — only completions
  are.
- **Reminders** — a flat list with a reversible done/undo toggle.
- **Household** — member list. Edit/Invite are deliberate static placeholders.

See [`CLAUDE.md`](./CLAUDE.md) for the full architectural spec (data model,
route layout, conventions) this app follows.

## Stack

React Router (framework mode, SSR) · TypeScript (strict) · PostgreSQL via
Drizzle ORM · Tailwind CSS v4 · Vite · Vitest · Playwright

## Local development

Requires Node 22.22+ (`nvm use`, see `.nvmrc`) and Docker.

```bash
cp .env.example .env
# fill in SESSION_SECRET and AUTH_PASSWORD_HASH — instructions are in the file

npm install
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs at `http://localhost:5173`. Sign in with the password you set
in `AUTH_PASSWORD_HASH`.

## Commands

```bash
npm run dev              # start the dev server, port 5173
npm run build             # production build
npm start                 # run the production build
npm run typecheck         # react-router typegen && tsc
npm run lint
npm run test               # vitest
npm run test:e2e           # playwright — seeds the db and starts the app itself
npm run db:generate        # generate a migration from schema.ts
npm run db:migrate         # apply migrations
npm run db:seed            # reset and seed sample data
```

## Deployment

Postgres and the app both run in Docker via `compose.yml`, on a home server
behind Tailscale/WireGuard. Postgres is never bound to `0.0.0.0` — only the
compose network and, for local dev, `127.0.0.1`. Build on a development
machine and ship the image; back up with scheduled `pg_dump`, not just a
volume snapshot.

Auth is a single shared household password behind a signed session cookie —
no OAuth, no per-user accounts, no password reset flow. Generate
`AUTH_PASSWORD_HASH` and `SESSION_SECRET` following the instructions in
`.env.example` and set them as real environment variables on the host
(not committed, not baked into the image).
