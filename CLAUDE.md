# CLAUDE.md

Project instructions for Claude Code. Read this before making changes.

## Project

**Home Manager** — a self-hosted household intranet. A single React Router v7
application containing both frontend and backend (server-side loaders/actions),
backed by PostgreSQL. Runs on a home server, reachable over VPN only. Never
exposed to the public internet.

Scoped to **one household with two members**. Do not build multi-tenancy, org
hierarchies, or role permission systems.

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
- this week's cleaning chores, grouped by person

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
- Two-person chore view, each chore independently checkable.
- Assignment is **derived, not stored** — see below.

### Reminders
Flat list with time and a done/undo toggle. Reversible; there is no
delete-on-complete.

### Household
Member list with role. Edit and invite buttons are **static placeholders** —
present in the UI, intentionally not wired. Do not implement them without being asked.

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

- Signature: `getWeekAssignment(isoWeek: string, members: [Member, Member]): Assignment`
- **Pure and deterministic** — same week in, same result out, no database access
- Assignments are never written to the database. Only *completions* are stored.
- Member order is stable, from `households.member_order`, so rotation does not
  scramble if a row's `created_at` changes

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
| `members` | name, role, avatar_key |
| `shopping_lists` | name |
| `shopping_items` | list_id, name, quantity, unit, checked, source_recipe_id nullable |
| `recipes` | name, servings, instructions |
| `recipe_ingredients` | recipe_id, name, quantity, unit, position |
| `chores` | name, rotation_group (`A`\|`B`\|`C`\|`D`) |
| `chore_completions` | chore_id, member_id, iso_week, completed_at |
| `reminders` | title, due_at, done_at nullable |

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

Home server behind a VPN (Tailscale/WireGuard). No public exposure, no CDN, no
edge runtime. Assume a low-power ARM64 host.

- Build on a development machine, not on the server
- Postgres runs in Docker alongside the app, both in `compose.yml`
- Never bind Postgres to `0.0.0.0` — container network only
- Back up with scheduled `pg_dump`; a volume snapshot is not a backup
- Auth is a simple session cookie. No OAuth, no password reset flows

## Not in scope yet

Do not build these unless explicitly asked:

- Household edit / invite (buttons are deliberate placeholders)
- Add/remove member flow
- Recipe creation and editing — the app reads recipes; seed them for now
- Servings scaling of ingredient quantities
- Store tags on shopping items
- Notifications, push, or email

## When unsure

Ask before adding a dependency, changing the schema, or introducing a new
architectural pattern. Prefer the boring solution that fits the stack already here.