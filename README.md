# Hearth — Home Manager

A self-hosted app for a two-person household. One React Router app
(server-rendered, loaders/actions as the data layer) backed by PostgreSQL,
running on a VPS behind Caddy over HTTPS — reachable from the public
internet, but not indexed or advertised, and there's no public sign-up.

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
- **Household** — user list with role. Edit/Invite are deliberate static
  placeholders.

See [`CLAUDE.md`](./CLAUDE.md) for the full architectural spec (data model,
route layout, conventions) this app follows.

## Stack

React Router (framework mode, SSR) · TypeScript (strict) · PostgreSQL via
Drizzle ORM · Tailwind CSS v4 · Vite · Vitest · Playwright

## Local development

Requires Node 22.22+ (`nvm use`, see `.nvmrc`) and Docker.

```bash
cp .env.example .env
# fill in SESSION_SECRET — instructions are in the file

npm install
docker compose up -d postgres   # compose.override.yml auto-adds the local port mapping
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs at `http://localhost:5173`. `npm run db:seed` creates two
fixture accounts — `mia@example.com` / `sam@example.com`, both with password
`devpassword`. Real accounts are just rows in the `users` table (see
`CLAUDE.md`'s Authentication section) — there's no shared password or
sign-up flow.

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

A VPS, reverse-proxied by Caddy (automatic Let's Encrypt HTTPS, HSTS — see
`Caddyfile`). Postgres and the app run in Docker; Postgres is never bound to
`0.0.0.0` and, on the VPS, not even to `127.0.0.1` — only the compose
network. Build on a development machine and ship the image.

```bash
# On the VPS, not locally:
docker compose -f compose.yml -f compose.prod.yml up -d
```

`compose.override.yml` (Postgres's local-dev port mapping) is picked up
automatically by plain `docker compose` and must **not** be present on the
VPS — only `compose.yml` + `compose.prod.yml` there, invoked explicitly as
above.

Set `SESSION_SECRET` and `DOMAIN` as real environment variables on the host
(not committed, not baked into the image) — see `.env.example`. Back up with
`scripts/backup.sh` on a cron schedule; it dumps Postgres and copies the
dump off the VPS via rclone — a local file or volume snapshot is not a
backup on its own. `rclone config` and `BACKUP_REMOTE` need setting up
first, or the script fails loudly rather than pretending it protected
anything.

`public/robots.txt` disallows the whole site — publicly reachable isn't the
same as publicly listed.
