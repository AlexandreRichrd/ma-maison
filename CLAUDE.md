# CLAUDE.md

Project instructions for Claude Code. Read this before making changes.

## Project

**Home Manager** — a self-hosted household app. A single React Router v7
application containing both frontend and backend (server-side loaders/actions),
backed by PostgreSQL. Runs on a VPS behind a Caddy reverse proxy, reachable
over the public internet — see Deployment. Public reachability does not mean
open sign-up: the only way to create an account is via an invite token issued
by an already-signed-in user (see Authentication) — `/register` rejects
anyone without one.

Scoped to **one household**. Do not build multi-tenancy, org hierarchies,
third-party household sign-up, or role permission systems. Chore rotation,
the Cleaning/Dashboard two-column view, and reminder assignees are all still
built for exactly **two** people — see Chore rotation and Not in scope yet.
Invites can technically add a third+ person today; that will visibly break
those views until they're redesigned for N users, which hasn't happened yet.

## Stack

- React Router v7 (framework mode, SSR enabled) — routing, data loading, mutations
- TypeScript, strict mode
- PostgreSQL via Drizzle ORM
- Tailwind CSS
- Vite
- Node 20+
- Vitest + Playwright

Do not add a separate API server, tRPC, or a client-side data-fetching library
(React Query, SWR, Axios). Loaders and actions are the data layer.

## Sections

Persistent sidebar navigation. Six sections.

### Dashboard
Read-only overview, one loader aggregating three sources:
- reminders due today
- shopping list previews (name + open-item count)
- this week's cleaning chores, grouped by person — signed-in user's column
  first, but both people always shown (see Cleaning)

Every widget links into its owning section. No mutations happen here.

### Shopping
- **Overview** — one card per list with open-item count, plus `+ New list`
- **Detail** — checkable items with quantity, plus `+ Add item`

Checking an item is a `useFetcher` mutation with optimistic UI — it must not
navigate or scroll the list.

### Recipes
- **Overview** — name, servings, ingredient count
- **Detail** — ingredient list, and two ways to push ingredients out:
  - into **any existing shopping list**, chosen from a selector
  - via `+ New list`, which creates a list named after the recipe and
    **redirects to that list's detail page**

Both paths go through one server-side function, `addIngredientsToList()`:

- inserts one `shopping_items` row per ingredient
- **merges** with an existing *unchecked* row of the same normalised name and
  unit in the target list, summing quantities, rather than creating a duplicate
- a *checked* row is not merged into — it is treated as already bought, so a new
  unchecked row is created
- tags each created row with `source_recipe_id`
- runs in a single transaction; partial application is not acceptable

Name normalisation (trim, lowercase, collapse whitespace) lives in
`app/lib/ingredients.ts` and is unit-tested. Do not inline it.

### Cleaning
- Week navigator (`←` / `→`), driven by a `?week=` search param holding an ISO
  week string (`2026-W32`). Never keep the current week in component state: the
  URL is the source of truth so the view is linkable and refresh-safe.
  This does not change now that users are signed in individually.
- Two-person chore view, each chore independently checkable. The
  **signed-in user's column is displayed first**, but **both columns stay
  visible** — on Cleaning and on the Dashboard widget. Never hide the other
  person's chores; seeing the split is the whole point of the section.
- Assignment is **derived, not stored** — see below. The stable, explicit
  anchor that ordering depends on is `households.member_order` (see Chore
  rotation) — never derive "whose column is first" from query result order,
  or the pairing could flip depending on who's signed in.

### Reminders
Flat list with time and a done/undo toggle. Reversible; there is no
delete-on-complete. `+ Add reminder` opens the shared Modal (title,
due date/time, and assignee checkboxes — either or both users); no
edit or delete yet. Each assignee shows as a chip colored the same as
that user's avatar elsewhere in the UI.

### Household
User list with role, plus `+ Inviter un membre`: any signed-in user can send
an invite email to a new address (see Authentication). The **Edit** button
stays a **static placeholder** — present in the UI, intentionally not wired.
Do not implement it without being asked; editing/removing a user is still out
of scope (see Not in scope yet).

## Chore rotation

The core domain rule. Implement it once, as a pure function in
`app/lib/rotation.ts`, tested in isolation. Never scatter this logic across
routes or components.

Two rotating groups, both keyed off the ISO week number relative to a fixed
`ROTATION_EPOCH` constant:

**Weekly swap** — alternates every week:
- Group A: Kitchen, Trash
- Group B: Bathroom, Surfaces, Floors

**Biweekly swap** — alternates every two weeks:
- Group C: Bedsheets
- Group D: Corridor

The biweekly pair is always assigned to **opposite** people: whoever has
Bedsheets does not have Corridor that week.

Rules:

- Signature: `getWeekAssignment(isoWeek: string, users: [User, User]): Assignment`
  — the tuple type is load-bearing: this function is only defined for two
  people. If the household ever has a third+ member (possible now via
  invites, see Authentication), calling this needs a redesign first; don't
  paper over it with `users[0]`/`users[1]` slicing
- **Pure and deterministic** — same week in, same result out, no database access
- Assignments are never written to the database. Only *completions* are stored.
- User order is stable, from `households.member_order` (an array of
  `users.id` — the column name predates the `members` → `users` merge and
  was kept as-is; it means "order of the household's people", not a
  reference to the old `members` table, which no longer exists). Rotation
  does not scramble if a row's `created_at` changes.

Test past, current, and future weeks plus the year boundary — ISO weeks do not
align with calendar years. Use `date-fns` (`getISOWeek`, `parseISO`), never a
hand-rolled division by 7.

## Layout

```
app/
  routes.ts              # routes declared here, not file-based
  root.tsx
  routes/
    dashboard.tsx
    shopping.tsx           # list overview
    shopping.$listId.tsx   # list detail
    recipes.tsx            # recipe overview
    recipes.$recipeId.tsx  # recipe detail + add-to-list actions
    cleaning.tsx           # ?week=2026-W32
    reminders.tsx
    household.tsx
    register.tsx           # public, requires ?token= from an invite
    activate.tsx           # public, consumes the emailed activation link
  components/
    ui/                  # Button, Card, Checkbox, Modal, Input, Select, Badge
    layout/              # Sidebar, PageHeader
    dashboard/
    shopping/
    recipes/
    cleaning/
    reminders/
  db/
    schema.ts
    index.ts             # db client singleton
    queries/             # grouped by feature
  lib/
    rotation.ts          # chore rotation — pure, heavily tested
    week.ts              # ISO week parsing and navigation
    ingredients.ts       # name normalisation and merging
    validation.ts        # Zod schemas shared by actions and forms
    tokens.server.ts      # opaque token generation for invites/verification
    mail.server.ts        # outgoing mail; logs instead of sending if SMTP unset
    registration.server.ts # transactional invite -> user creation
drizzle/                 # generated migrations — never hand-edit
```

## Data flow rules

- **Loaders** read. **Actions** write. Never fetch in `useEffect`.
- Server-only code (db client, queries, secrets) lives in `.server.ts` files or
  inside loaders/actions. It must never be imported by a component module.
- Mutations use `<Form method="post">`, or `useFetcher` for inline toggles that
  should not navigate (checking an item, completing a chore, done/undo).
- After a successful action, return `redirect()` or plain data — React Router
  revalidates loaders automatically. Do not manually refetch.
- Validate every action input with Zod before touching the database. Return
  `{ errors }` with a 400; never surface a raw validation error.
- Every action carries an `intent` field so one route can host several mutations.

## Database

Connection string in `DATABASE_URL`. The db client is a singleton in
`app/db/index.ts` — import it, never construct a new `Pool`.

| Table | Notes |
|---|---|
| `households` | single row; holds `member_order` for stable rotation |
| `users` | email, password_hash, household_id, name, avatar_key, role, email_verified_at nullable — see Authentication |
| `invites` | household_id, invited_by_user_id, email, token, expires_at, accepted_at nullable |
| `email_verifications` | user_id, token, expires_at, consumed_at nullable |
| `shopping_lists` | name |
| `shopping_items` | list_id, name, quantity, unit, checked, source_recipe_id nullable |
| `recipes` | name, servings, instructions |
| `recipe_ingredients` | recipe_id, name, quantity, unit, position |
| `chores` | name, rotation_group (`A`\|`B`\|`C`\|`D`) |
| `chore_completions` | chore_id, user_id, iso_week, completed_at |
| `reminders` | title, due_at, done_at nullable, assignee_ids (0-2, no FK — array column) |

Conventions:

- `id` is `uuid` with `defaultRandom()`
- `created_at` / `updated_at` are `timestamptz`, not `timestamp`
- Chore *assignment* is computed by `rotation.ts`. Only completions are persisted,
  keyed by `(chore_id, iso_week)` with a unique constraint
- Reminder completion is `done_at nullable`, not a boolean — undo sets it to null
- `shopping_items.source_recipe_id` is `on delete set null`: deleting a recipe
  must never remove items already on a list
- Ingredient count on the recipe overview is an aggregate query, not a stored
  counter column
- Foreign keys always declare `onDelete` explicitly
- Schema changes: edit `schema.ts`, run `db:generate`, review the SQL, then `db:migrate`

## Authentication

Real accounts — not the single shared household password from the VPN-only
era. Mia and Sam are `users` rows. There is no separate "member" concept:
one person entity only. The old `members` table is gone.

`users` columns: `email`, `password_hash` (argon2id), `household_id`,
`name`, `avatar_key`, `role`, `email_verified_at` nullable. `name` and
`avatar_key` aren't new — they're carried over from the old `members`
table, since the app still needs a display name and avatar everywhere
(greeting, sidebar, chips). `role` is also carried over: a descriptive
label ("Parent" / "Partenaire" / whatever the invited person picks), not a
permission level — this app still has no authorization system, per "Scoped
to one household" above.

- Session cookie carries `user_id`, not just an `authenticated` boolean
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax`
- Passwords hashed with argon2id
- Login action is rate-limited, per IP and per identifier (email)
- Constant-time failure delay, and the same error message whether the
  account doesn't exist or the password is wrong — never reveal which
- Login additionally refuses any account with `email_verified_at IS NULL`,
  with a distinct message telling them to check their mail — this check
  happens *after* password verification, not before, so it can't be used to
  probe whether an email has an account
- Still out of scope: OAuth, password reset. Sign-up is not open/public —
  the only path is the invite flow below

### Invite / register / activate

Household growth is invite-gated, not self-serve:

1. Any signed-in user can send an invite from **Household** (email only).
   `createInvite()` writes an `invites` row with a random token
   (`generateToken()`, 32 bytes hex) and a 7-day expiry, then
   `sendInviteEmail()` mails a `/register?token=…` link.
2. `/register` is a public route, but the loader/action both reject a
   missing, expired, or already-accepted token — it isn't reachable without
   a live invite. On submit, `registerFromInvite()` runs one transaction:
   creates the `users` row (unverified), appends the new user's id to
   `households.member_order` (so rotation/ordering picks them up — see
   Chore rotation), marks the invite accepted, and issues an
   `email_verifications` row (24h expiry). The activation email is sent
   after the transaction commits.
3. `/activate?token=…` is public. Its loader consumes the token (sets
   `email_verified_at`, marks the verification row consumed) and redirects
   to `/login?activated=1`. Login is refused until this step happens.

Mail delivery is `app/lib/mail.server.ts`: if `SMTP_HOST` isn't set, it
logs the email (with the link) to the console instead of sending — that's
the local-dev path, and how you find invite/activation links when testing
without real SMTP. Production needs `SMTP_HOST` (+ `SMTP_USER`/`SMTP_PASS`
if the relay needs auth) and `APP_URL` set, so emailed links point at the
real domain. See `.env.example`.

Accounts that existed before this flow shipped (seeded directly, e.g. Mia
and Sam) were backfilled with `email_verified_at = created_at` in the
migration that added the column — they were never meant to need
activation.

## UI conventions

- Tailwind utilities only — no CSS modules, no styled-components
- Design tokens live in `tailwind.config.ts`. Use semantic names
  (`bg-surface`, `text-muted`), not raw palette values (`bg-slate-100`)
- `components/ui/` is presentational, no data dependencies
- **One modal component**, reused for "+ New list" and "+ Add item". It takes a
  title, fields, and a submit intent — do not fork it per use case
- Mobile-first: used mostly on phones, in the kitchen. Tap targets ≥ 44px
- Checkboxes are real `<input type="checkbox">` inside a form, not divs with onClick
- Modals trap focus, close on Escape, and restore focus to the trigger
- Adding a recipe to a list shows a confirmation of what happened (added vs merged),
  since a silent merge otherwise looks like nothing happened

## PWA

Installable to the home screen — worth having now that the app is reachable
directly from a phone over the public internet, not just via VPN.

- `public/manifest.webmanifest`: `display: "standalone"`, 192×192 and
  512×512 icons
- `apple-touch-icon` link tag in `root.tsx`
- No service worker, no offline cache, for now. The architecture stays fully
  SSR via loaders/actions — installability is the only goal here, not
  offline support

## Commands

```bash
npm run dev              # port 5173
npm run build
npm start
npm run typecheck        # react-router typegen && tsc
npm run lint
npm run test             # vitest
npm run test:e2e         # playwright
npm run db:generate
npm run db:migrate
npm run db:seed
```

Run `npm run typecheck` after touching routes — it regenerates route types.

## Git workflow

Commit after each todo item is completed — this is standing authorization to
commit without asking each time, scoped to local commits only.

- One commit per completed todo-list item, not per file and not batched across
  a whole feature. If a task wasn't broken into a todo list, commit once the
  discrete piece of work is done.
- Run `npm run typecheck` and, when relevant to the change, `npm run test`
  before committing. Do not commit code that fails either.
- Commit messages: short, imperative, present tense (`add cleaning week
  navigator`, `fix rotation opposite-person constraint`), following the style
  of prior commits in the repo.
- **Never push.** Commits stay local until the user explicitly asks for a
  push — the general git safety protocol around pushing still applies.
- Still ask before any destructive or history-rewriting git operation
  (`reset --hard`, `rebase`, `commit --amend`, force-push).

## Conventions

- Named exports, except route modules (default export required)
- `type` over `interface` unless declaration merging is needed
- No `any`. No non-null assertions (`!`) — narrow properly
- Dates: store UTC, render in the household's local timezone
- Quantities: `numeric` in Postgres, strings in TS. Never floats
- The household is French-speaking. All user-facing text (UI copy, Zod
  validation messages, seeded demo data) is French, hardcoded directly in
  components — no i18n library, no translation-key indirection, since this
  app is single-language by design. Date/time formatting uses the `fr`
  date-fns locale and `Intl` with `"fr-FR"`. Code identifiers, comments, and
  commit messages stay in English.

## Testing

- `rotation.ts` is the highest-value test target — cover weekly alternation,
  biweekly alternation, the opposite-person constraint, and year boundaries
- `addIngredientsToList()` — cover merge into an unchecked row, no-merge into a
  checked row, unit mismatch, and the new-list-then-redirect path
- Query functions get unit tests against a test database
- Every action gets an invalid-input test, not just the happy path
- Playwright covers: check off a shopping item, add a recipe to an existing list,
  create a list from a recipe, complete a chore, toggle a reminder, navigate weeks
- Run `npm run typecheck && npm run test` before considering work finished

## Deployment

A VPS, reverse-proxied by Caddy, reachable over the public internet. No more
VPN, no more low-power-ARM64 assumption — that whole constraint is gone.

- Docker + `compose.yml` (`node:24-alpine`, no armv7 constraint)
- Caddy in front of the app: automatic Let's Encrypt HTTPS, HSTS
- Build on a development machine, not on the server
- The app container binds `127.0.0.1:3000` only — Caddy is the only thing
  that talks to it directly. Never `0.0.0.0`
- Postgres stays on the Docker network only — no `ports:` mapping at all,
  not even to `127.0.0.1`. **Flagged**: the `compose.yml` used for local dev
  currently maps `127.0.0.1:5432` so `npm run dev` / `db:migrate` can reach
  it from the host — that mapping is needed for local dev and must not
  exist in whatever compose file actually ships to the VPS. Reconcile with
  a separate prod compose file/override when the deployment work happens;
  don't just delete the local mapping.
- Back up with scheduled `pg_dump`, copied off the VPS — a volume snapshot
  is not a backup, and neither is a backup that lives on the box it's
  meant to protect against
- `public/robots.txt`: `Disallow: /` for the whole site. Publicly reachable
  is not the same as publicly listed

## Not in scope yet

Do not build these unless explicitly asked:

- Household **edit** (button is a deliberate placeholder — invite is now wired, see Household)
- Remove-user flow, or any way to revoke/expire an invite from the UI
- Redesigning chore rotation, Cleaning/Dashboard's two-column layout, or
  reminder assignees for more than two people — invites can technically
  create a third+ user today, but nothing downstream of that has been
  redesigned to handle it (see Chore rotation, Project intro)
- Recipe creation and editing — the app reads recipes; seed them for now
- Servings scaling of ingredient quantities
- Store tags on shopping items
- Push or in-app notifications (transactional invite/activation email is
  the only mail the app sends)
- Multi-tenancy or third-party household sign-up
- Row-Level Security
- React Native or any native mobile app
- NestJS or any separate API server (see Stack — loaders/actions are the
  data layer)
- Store distribution — TWA, Capacitor, or otherwise
- Billing, advertising
- OAuth, password reset (see Authentication)

## When unsure

Ask before adding a dependency, changing the schema, or introducing a new
architectural pattern. Prefer the boring solution that fits the stack already here.