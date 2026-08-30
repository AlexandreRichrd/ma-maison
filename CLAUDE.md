# CLAUDE.md

Project instructions for Claude Code. Read this before making changes.

## Project

**Home Manager** — a self-hosted household app. This repo is the **frontend
only**: a React Router v7 app (SSR) that renders the UI and talks to a
separate NestJS API (`my-home-backend`, sibling repo — see its `CLAUDE.md`)
over HTTP. Application code here holds **no database connection and no
domain logic** — no chore-rotation algorithm, no ingredient-merging logic.
If a piece of work sounds like "compute X" or "validate and persist Y", it
belongs in the backend, not here.

This app used to contain the backend too (server-side loaders/actions acting
as the data layer, Drizzle against Postgres directly). That was pulled out
into `my-home-backend` so the domain layer isn't tied to one frontend. Do not
add a database client, an ORM, or domain logic back into application code —
see Stack. One deliberate exception: `app/db/` (Drizzle) still exists purely
to run `npm run db:seed` for local dev — see Database.

Runs on a VPS behind a Caddy reverse proxy, path-routed alongside the backend
under one domain (`/api/*` → backend, everything else → this app) — reachable
over the public internet, see Deployment. Public reachability does not mean
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
- Tailwind CSS
- Vite
- Node 20+
- Vitest + Playwright

No database client or ORM in application code — see Project (`app/db/`'s
Drizzle setup is a local-dev-seeding-only exception, not application code;
see Database). Do not add tRPC or a client-side data-fetching library
(React Query, SWR, Axios): loaders and actions are still the data layer from
the browser's point of view, they just fetch from the NestJS API
(`app/lib/api.server.ts`) instead of querying Postgres directly. Server-only
code — the API client, the JWT cookie, secrets — lives in `.server.ts` files
or inside loaders/actions, same rule as before.

## Sections

Persistent sidebar navigation. Six sections. `/settings` (Paramètres,
issue #12) is deliberately **not** one of them, despite spanning enough
unrelated concerns (climate config, sensor labels, member ordering,
personal notification prefs) that a first pass gave it a nav entry —
reached only by clicking your own name/avatar in the sidebar instead, see
Paramètres below.

### Dashboard
Read-only overview, one loader aggregating four sources:
- reminders due today
- shopping list previews (name + open-item count)
- this week's cleaning chores, grouped by person — signed-in user's column
  first, but both people always shown (see Cleaning)
- indoor and outdoor temperature (plus indoor humidity and outdoor battery
  level), from `my-home-backend`'s `GET /climate/current`
  (`lib/climate-api.server.ts`'s `getHomeClimate()`) — the latest reading
  from each of the household's two sensors, `capteur-salon` (indoor) and
  `capteur-exterieur` (outdoor, temperature + battery only — a DS18B20
  probe, no humidity), filtered by `deviceName` (see
  `my-home-backend/CLAUDE.md`'s Climate). The outdoor sensor's `batterie`
  reading arrives as an already-computed percentage — the voltage-to-percent
  conversion happens on-device, in `capteurs/capteur-exterieur.yaml`'s
  `calibrate_linear` filter (a rough single-cell LiPo curve approximation,
  not lab-calibrated), not here; this repo just parses it like any other
  numeric reading. Fetched once per loader run, same as everything else on
  this page — **deliberately not
  polled**. Indoor readings update about once a minute at the source;
  outdoor wakes on a 2-minute deep-sleep cycle (see
  `capteurs/capteur-exterieur.yaml`) — either way, a loader fetch on
  navigation/refresh is enough to show current-enough data; a websocket or
  a `setInterval` refetch would be solving a problem this page doesn't have
  on its own — the live-update path `HomeClimateWidget` also has
  (`applyMeasurements`, fed by `climate-socket.client.ts`) exists for the
  widget to stay current while the tab is open, not to replace the loader
  fetch. `lib/climate.ts`'s `isStale()` flags a reading as not-live past a
  5-minute threshold, computed server-side at request time against
  `Date.now()` for each
  sensor independently

Every widget links into its owning section. No mutations happen here.

Both climate blocks (labeled Intérieur/Extérieur by default — see
Paramètres for the household-chosen override, issue #12) are also links to
`/climate/:deviceName` — a per-sensor history view (min/max/avg per day,
last 30 days, one simple hand-rolled SVG chart per metric — see
`lib/climate-history.ts` and `components/climate/DailyHistoryChart.tsx`)
backed by `my-home-backend`'s `GET /climate/summaries` (see its
`CLAUDE.md`'s Daily summaries and retention section). **Not its own
sidebar section** — same pattern as `shopping/:listId` and
`recipes/:recipeId`: reachable by clicking through from where it's
relevant, not nav-level. Deliberately no charting library and no
date-range navigation for now — the data really is one point per day per
metric, and this app already has no charting dependency to reuse.

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

Both paths go through one backend endpoint (`addIngredientsToList()` in the
API — see `my-home-backend/CLAUDE.md`) that merges into existing unchecked
rows, tags created rows with `source_recipe_id`, and runs as a single
transaction. This app just calls it and shows the result — see the
Recipes section confirmation-copy note under UI conventions; the merge logic
itself is not this repo's concern.

- **Servings scaling (issue #16)** — a `−`/`+` stepper on the detail page,
  driven by a `?servings=` URL param on `/recipes/:recipeId` (the loader
  validates and canonicalizes it, same `?week=`/`?view=` pattern as
  Cleaning/Reminders below). All the scaling math — the rounding rule for
  countable vs. continuous units, the decision not to add a per-ingredient
  "don't scale" flag — lives entirely in `my-home-backend` (see its
  CLAUDE.md's Servings scaling section); this app only ever displays
  whatever pre-scaled `quantity` the API returns for the requested
  `servings`, never recomputes it. The two "add to list" forms send the
  currently displayed `servings` alongside the request, so a scaled recipe
  sends scaled quantities to the shopping list, not the recipe's stored
  ones — the API does that scaling too, from the same shared function, so
  the display and what lands on the list can never diverge.
- **Create/edit** (`/recipes/new`, `/recipes/:recipeId/edit`) — a dedicated
  page, not the usual `<Modal>`: `RecipeForm`
  (`components/recipes/RecipeForm.tsx`) holds the ingredient and step lists
  as local component state (add/remove/reorder, `↑`/`↓`/`×` per row, same
  interaction as `ChoresSection.tsx`'s subtask editor) and submits both as
  one hidden JSON-string field each on save — the whole recipe is one
  document, not persisted row-by-row. `PATCH /recipes/:id` replaces the
  full ingredients/steps arrays server-side; there's no per-row endpoint.
- **Delete** — a confirmation `<Modal>` on the detail page (same pattern as
  `ChoresSection.tsx`'s delete modal), redirects to `/recipes` on success.
  Shopping items already sourced from a deleted recipe stay on their list
  (`source_recipe_id` nulled, not removed — enforced by the backend).
- Ingredient units are a closed list (`lib/units.ts`'s `Unit`, mirroring
  the backend's enum by hand) rendered through `unitLabel()` — a French
  label, singular/plural by quantity — never the raw enum value. The
  shopping item "add" form uses the same list for the same reason (see
  `my-home-backend/CLAUDE.md`'s Database section on why `shopping_items`
  and `recipe_ingredients` share one enum).

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
  rotation) — never derive "whose column is first" from API response array
  order, or the pairing could flip depending on who's signed in.

### Reminders
Three view modes — `list` (the original flat list, still useful for "what's
coming up" chronologically), `week` (default), and `month` — chosen via a
`?view=` search param, always paired with `?week=` (an ISO week string,
reused from Cleaning's convention — see `lib/week.ts`). Both live in the URL,
never component state, so reload/share reproduces the same displayed period
and mode; the loader canonicalizes and redirects if either is missing or
invalid. Week and month share one `CalendarGrid` component — week view is
just a one-row month grid, month view is `lib/week.ts`'s `monthGridWeeks()`
tiling the full calendar month (4-6 rows), with the leading/trailing days
outside the current month dimmed. `←`/`→` (`CalendarNavigator`) shifts by
one ISO week in week mode, by a calendar month in month mode
(`shiftIsoWeekByMonths`).

Chores are explicitly out of this — they stay in Cleaning's own week
navigator, own URL param, and never appear on this calendar.

Below the `sm:` breakpoint, both week and month render as a vertical agenda
(one section per day, reusing `ReminderRow` as-is) instead of a 7-column
grid — a real grid doesn't fit a phone width for reminder titles/chips. At
`sm:` and up, each day is a `CalendarDayCell` holding compact
`CompactReminderRow` chips (a deliberately smaller tap target than the
app's usual ≥44px rule — this view only renders on non-mobile widths, where
mobile's own agenda already has full-size `ReminderRow` controls).

`+ Add reminder` opens the shared Modal (title, due date/time, and assignee
checkboxes — either or both users); no edit or delete yet. Clicking a day
cell's date (week/month views) opens the same modal with that date
pre-filled in the "Date et heure" field. Each assignee shows as a chip (or,
in the compact grid chip, a small dot) colored the same as that user's
avatar elsewhere in the UI. Done/undo is reversible — there is no
delete-on-complete — and stays a `useFetcher` mutation everywhere it
appears, list or calendar: no navigation, no scroll jump.

`getReminders()` (`lib/reminders-api.server.ts`) takes an optional
`{ from, to }` range: omitted for the list view (every reminder ever
created), passed for week/month so only the visible days' worth is fetched
— see `my-home-backend/CLAUDE.md`'s Reminders section for why this matters
(no delete-on-complete means the unfiltered list only grows).

### Household
User list (name and avatar only — no per-user actions here since issue
#12 removed the long-inert "Edit" placeholder rather than implementing it;
nothing in scope anywhere defines what editing a user would even change),
plus `+ Inviter un membre`: any signed-in user can send an invite email to
a new address (see Authentication).

Below that, a **Corvées** card (`components/household/ChoresSection.tsx`) is
the admin UI for chore configuration — add, edit, and remove chores, each
with a name, frequency (every N weeks), and either "alterne" (rotating) or
"toujours la même personne" (pinned, with a person picker). It lands here
rather than its own section: Household already functions as the
membership/invite page, and a chore admin is a natural extension of that,
not a distinct enough concern to justify a section on its own (see
Sections above). One shared `<Modal>` handles both add and edit (same
pattern as the invite modal); a second `<Modal>` is a delete confirmation,
since removing a chore also deletes its completion history and nothing
else in the app currently needs a destructive-action confirmation. The
anchor-week field is a native `<input type="week">` — its value format
(`YYYY-Www`) already matches `isValidIsoWeek()`, no custom picker needed.

Household-wide settings (climate thresholds, sensor labels, member order)
used to live here too, as a card (issue #11) — issue #12 moved them to
`/settings` instead, once that list grew past "one card next to the
chores admin" (see Paramètres below for where it lives now).

### Paramètres

Issue #12's settings page, `routes/settings.tsx` — reached **only** by
clicking your own name/avatar in the sidebar (`HouseholdFooter.tsx`), not
a sidebar nav item. A first pass gave it a nav entry, on the reasoning
that the settings list had grown to span climate config, sensor display
names, household membership ordering, and a per-user notification
preference — concerns with no natural shared home with the chores admin
or with each other, unlike issue #11's original climate-only card. That
turned out to be the wrong call for this app's nav, so the entry was
removed again — `/settings` is a click-through page like
`/climate/:deviceName`, not a section, and carries the same `back:
{ to: "/", label: "← Tableau de bord" }` `<PageHeader>` prop that page
uses, since there's no persistent nav link back to it otherwise. Two
clearly separated cards (`components/settings/`):

- **`HouseholdSettingsCard.tsx`** — shared, one value for the whole
  household. Climate cool-down/close-up alert (enabled switch, outdoor/
  indoor margin, indoor comfort threshold, cooldown), raw-measure
  retention, and sensor display names — backed by `my-home-backend`'s
  `GET/PATCH /settings` (`lib/settings-api.server.ts`), see that repo's
  `CLAUDE.md` Climate alerts section. One shared `<Modal>` edits all of
  it together: a hidden field mirrors the enabled checkbox as an explicit
  `"true"`/`"false"` string (an unchecked native checkbox omits itself
  from `FormData` entirely, which a partial-update `PATCH` can't tell
  apart from "field not touched"); the two label fields accept an empty
  string on purpose, shown via `placeholder` as the current default —
  that's how an override is cleared back to it
  (`resolveSensorLabel()`, also used by the Dashboard widget and
  `/climate/:deviceName` so a chosen label actually shows up everywhere a
  sensor name renders, not just on this page). Below the modal, a
  member-order editor: one row per member with ↑/↓ swap buttons (same
  pattern as `ChoresSection.tsx`'s subtask reorder — this app is scoped
  to exactly two people, so nothing fancier is justified), submitting the
  full reordered array via a hand-built `FormData` + `fetcher.submit`.
  The API rejects anything that isn't exactly a permutation of the
  current members (see `my-home-backend/CLAUDE.md`'s Households
  section).
- **`PersonalPreferencesCard.tsx`** (`id="personal-preferences"`) —
  per-user. Today just `receiveClimateAlerts` (issue #11's one per-user
  setting, moved here from a short-lived `/account` page). The route's
  `action` always updates the signed-in user's own row
  (`requireUser(request).id`), never a client-submitted target — unlike
  the household card, this one has no "edit someone else" path even in
  principle. Instant-toggle checkbox via `useFetcher`, same
  optimistic-flip-while-pending pattern as `ShoppingItemRow.tsx`.

`HouseholdFooter.tsx` links your own name/avatar row to
`/settings#personal-preferences`, scrolled straight to the personal card
— `currentUserId`, threaded down from `_layout.tsx`'s loader through
`Sidebar`/`MobileNavDrawer`, is what makes only *your* row a link; another
member's row renders the same avatar+name but isn't one, since nobody
edits another member's preferences from here. This is the page's **only**
entry point (see Sections above) — get there via your own profile row,
never a nav item.

## Chore rotation

The core domain rule, but it is **not implemented here**. Each chore now
carries its own frequency/assignment config (see
`my-home-backend/CLAUDE.md`'s Chore rotation section for the actual
algorithm); the backend computes each week's occurrences and
`GET /cleaning?week=…` returns them already grouped by user and merged with
that week's completions. This app renders whatever the API returns — do not
recompute, cache-and-diverge, or re-derive assignment from raw chore/
completion data on this side. If the Cleaning view seems to need rotation
logic client-side (e.g. instant optimistic UI on a toggle), that's still
just reflecting the API's response shape, not recomputing the schedule.

`ChoreDto.frequencyWeeks` is a plain number (1 = weekly, N = every N weeks)
— `lib/cleaning-api.server.ts`'s `frequencyLabel()` turns it into French
("Chaque semaine" / "Toutes les N semaines"), covering any N instead of a
fixed weekly/biweekly pair.

Both response entries are always present, but a chore with `frequencyWeeks
> 1` is entirely absent from the response on its off-weeks (not returned
with `done: false` — just not there at all), and any user's `chores` array
can legitimately be empty for a given week (nothing assigned to them, or
nothing occurring at all). `ChoreColumn` and `CleaningWidget` both render a
muted "Rien à faire cette semaine." placeholder row instead of going blank
in that case — never render an empty column with no explanation.

The one thing this app still owns: **the signed-in user's column is
displayed first**, both columns always visible — derive that ordering from
which user id matches the current session, applied to whatever order the API
returns. Never assume the API's array order tells you who's signed in.

## Layout

```
app/
  routes.ts              # routes declared here, not file-based
  root.tsx
  routes/
    dashboard.tsx
    shopping.tsx           # list overview
    shopping.$listId.tsx   # list detail
    recipes.tsx               # recipe overview
    recipes.new.tsx           # create form
    recipes.$recipeId.tsx     # recipe detail + add-to-list actions
    recipes.$recipeId.edit.tsx # edit form
    cleaning.tsx           # ?week=2026-W32
    reminders.tsx
    household.tsx
    settings.tsx            # /settings — household + personal preferences, see Paramètres
    climate.$deviceName.tsx # per-sensor history, linked from the Dashboard widget
    register.tsx           # public, requires ?token= from an invite
    activate.tsx           # public, consumes the emailed activation link
    forgot-password.tsx    # public, email -> same confirmation either way
    reset-password.tsx     # public, requires ?token= from a reset email
  components/
    ui/                  # Button, Card, Checkbox, Modal, Input, Select, Badge
    layout/              # Sidebar, PageHeader
    dashboard/
    shopping/
    recipes/              # RecipeForm.tsx — create/edit form, ingredient+step lists
    cleaning/
    reminders/
    household/            # ChoresSection.tsx — chore admin CRUD
    settings/              # HouseholdSettingsCard.tsx, PersonalPreferencesCard.tsx — see Paramètres
    climate/               # DailyHistoryChart.tsx — per-sensor history chart
  lib/
    api.server.ts         # fetch wrapper: base URL, JWT header, error mapping,
                            #   401 -> clear session + redirect to /login
    auth.server.ts         # requireUser(), login/logout
    session.server.ts      # cookie session storage — split out of auth.server.ts
                            #   so api.server.ts can clear it without a
                            #   circular import between the two
    week.ts                # ISO week parsing and navigation (display only)
    validation.ts          # form-side validation that mirrors API error codes
    chores-api.server.ts   # chore config CRUD client
    settings-api.server.ts # household_settings GET/PATCH client, resolveSensorLabel()
    units.ts                # closed Unit list + French labels (recipes, shopping)
```

`app/db/` still exists, but only for local dev seeding (`npm run db:seed`)
— see Database. No route, loader, action, or component reads from it.

## Data flow rules

- **Loaders** read. **Actions** write. Never fetch in `useEffect`.
- All API calls go through `app/lib/api.server.ts`, never a bare `fetch()`
  scattered in a loader/action — it's the one place that attaches the JWT
  `Authorization` header and maps API error shapes to something routes can
  use
- Server-only code (the API client, the JWT cookie, secrets) lives in
  `.server.ts` files or inside loaders/actions. It must never be imported by
  a component module
- Mutations use `<Form method="post">`, or `useFetcher` for inline toggles that
  should not navigate (checking an item, completing a chore, done/undo)
- After a successful action, return `redirect()` or plain data — React Router
  revalidates loaders automatically. Do not manually refetch
- Actions still validate shape client-side before calling the API (fast
  feedback), but the API's response is authoritative — surface its `errors`
  array (see `my-home-backend/CLAUDE.md`'s API surface), mapped from
  machine-readable `code` to French copy, don't re-derive validation logic
  here
- Every action carries an `intent` field so one route can host several mutations
- A `401` from the API means the JWT is invalid or expired: clear the cookie
  and redirect to `/login`. Don't try to silently retry or refresh — there is
  no refresh token (see Authentication). Enforced once, centrally, in
  `apiFetch` itself — not repeated per loader/action — so it covers every
  authenticated call (reads and writes, top-level navigations and
  `useFetcher` submissions alike) for free. Gated on whether *this specific
  call* carried an `accessToken`: a 401 from a public endpoint (wrong
  password on `/auth/login`, an unverified account) is an ordinary
  rejection its caller already handles as an `ApiRequestError` and must
  not be swallowed into a redirect — only a 401 on a call that attached a
  bearer token means the session itself is dead

## Database

No application code has a database connection. Schema, migrations, and all
queries the app *serves* live in `my-home-backend`. See that repo's
`CLAUDE.md` for the table layout if you need to understand what shape the
API returns.

One deliberate, isolated exception: `app/db/` still has a Drizzle setup
(`schema.ts`, `index.server.ts`) and `app/db/seed.ts`, kept solely so
`npm run db:seed` can populate a fresh local Postgres for `npm run dev` —
`my-home-backend` has no seed path of its own today. Nothing under
`app/routes/`, `app/lib/`, or `app/components/` imports from `app/db/`; if
that ever stops being true, something has regressed. This is the one
remaining piece of the Drizzle-to-API migration (see Project) and is tracked
as a separate cleanup, not an oversight — removing it requires either a
backend seed path or accepting no way to seed a fresh dev database.

## Authentication

The backend issues JWTs (see `my-home-backend/CLAUDE.md` — Authentication);
this app's job is to hold that token safely and attach it to every API call.

- `POST /login` action calls the API's `/auth/login`, gets back
  `{ accessToken, user }`, and stores `accessToken` in a session cookie via
  `createCookieSessionStorage` (`app/lib/auth.server.ts`) — same mechanism as
  before, just holding an opaque JWT instead of a raw `user_id`
- **The JWT never reaches browser JS.** It lives only in the `HttpOnly`
  session cookie and is read server-side in loaders/actions to build the
  `Authorization: Bearer <token>` header via `api.server.ts`. Do not expose
  it to a component, `useLoaderData`, or any client bundle — that would
  defeat the point of choosing a cookie over `localStorage`
- Cookie flags: `Secure`, `HttpOnly`, `SameSite=Lax`
- `requireUser(request)` (in `auth.server.ts`) reads the cookie and verifies
  the JWT **locally** with `jsonwebtoken` against `JWT_PUBLIC_KEY` — no
  network round trip to the API just to know who's signed in. Redirects to
  `/login` if there's no token, the signature doesn't check out, or it's
  expired. It returns the `sub` claim as-is and does **not** check that the
  user it names still exists — no DB or API call, on purpose. Trusting the
  claim this way is only safe because nothing can currently invalidate a
  user out from under a live token: there's no delete-user endpoint, no
  invite revocation, and no session/token revocation of any kind (see
  `my-home-backend/CLAUDE.md`'s Not in scope yet — refresh tokens / token
  revocation / logout-everywhere, and household edit / remove-user /
  invite revocation are both listed there). **If any of those ship, this
  needs revisiting first** — a token outliving its user stops being
  theoretical at that point. Confirmed concretely: deleting a user's row
  while their session cookie is still live doesn't get them logged out by
  `requireUser()` itself — it still passes. What used to happen next was
  worse than it needed to be: the first place that actually re-reads the
  user (e.g. `GET /households/me`) 401'd, nothing caught it, and the page
  500'd instead of redirecting. `apiFetch` now catches exactly this (see
  Data flow rules) — a 401 on a call that carried a token clears the
  cookie and redirects to `/login` — so the practical window between "user
  deleted" and "user logged out" is one request, not a crash. The
  underlying tradeoff is unchanged, though: `requireUser()` still trusts
  the claim without a DB round trip, so anything a loader does *before*
  its first authenticated API call in that same request still runs
  against a stale identity
- **RS256, not a shared secret.** The backend signs with a private key this
  app never sees; `JWT_PUBLIC_KEY` is the matching RSA public key, copied
  from `my-home-backend`'s `JWT_PUBLIC_KEY` (see that repo's `.env.example`
  for how the keypair is generated) — not a secret itself, but it has to be
  the exact right value or every local verification fails with a signature
  error. `jwt.verify()` is called with `algorithms: ["RS256"]` pinned
  explicitly; dropping that allow-list would let a forged token specify
  `alg: HS256` and get verified using the public key as an HMAC secret,
  since it isn't secret. This repo holds no private key and never signs
  anything — only the backend issues tokens
- No refresh token exists yet (see backend's Authentication) — a `401` means
  the session is over; clear the cookie and redirect, don't try to recover it
- Still out of scope: OAuth. Sign-up is not open/public — the only path is
  the invite flow below

### Invite / register / activate

Household growth is invite-gated, not self-serve. This app renders the flow;
the API owns tokens, expiry, and persistence (see
`my-home-backend/CLAUDE.md`):

1. Any signed-in user can send an invite from **Household** (email only) —
   this app posts to `/invites`, the API generates the token and sends the
   mail
2. `/register?token=…` is a public route. Its loader/action call the API's
   `/auth/register`, which rejects a missing, expired, or already-accepted
   token server-side — this app doesn't validate the token itself, it just
   surfaces whatever error the API returns
3. `/activate?token=…` is public. Its loader calls the API's `/auth/activate`
   and redirects to `/login?activated=1` on success. Login is refused until
   this step happens (enforced by the API, not here)

### Forgot / reset password

Recovery, unlike sign-up, needs no invite — any existing account can request
one. This app renders the flow; the API owns tokens, expiry, and the
never-reveal-which-emails-exist behavior (see `my-home-backend/CLAUDE.md`):

1. **Login** links to `/forgot-password`, a public route with just an email
   field. Its action posts to the API's `/auth/forgot-password` and shows
   the *same* confirmation message regardless of outcome — whether the
   email has an account, doesn't, or the request was rate-limited. Only a
   malformed address (a client-side/DTO validation error) gets its own
   field error; every other case collapses to the same confirmation, so
   this app never becomes the thing that leaks account existence even
   though the API itself doesn't
2. `/reset-password?token=…` is a public route with new-password and
   confirm fields. There's no token-preview endpoint the way `/register`
   has via `GET /invites/:token` — the loader only checks the token is
   *present* in the URL before rendering the form; the API is what actually
   validates it, on submit. A missing, expired, or already-consumed token
   surfaces as a general form error (`reset_invalid`), same pattern as
   `/register`'s handling of `invite_invalid`. On success it redirects to
   `/login?reset=1`, mirroring `/activate`'s `?activated=1`

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
npm run db:seed          # tsx app/db/seed.ts — see Database
```

Run `npm run typecheck` after touching routes — it regenerates route types.
The API must be running locally (see `my-home-backend`) for `npm run dev` to
be useful beyond static UI work. Schema and migrations are entirely
`my-home-backend`'s concern (`prisma migrate dev`) — `npm run db:seed` here
is local-dev demo data only, and doesn't touch schema.

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
- **Do not add a `Co-Authored-By` trailer or any AI-attribution line to commit
  messages.**
- **Never push.** Commits stay local until the user explicitly asks for a
  push — the general git safety protocol around pushing still applies.
- Still ask before any destructive or history-rewriting git operation
  (`reset --hard`, `rebase`, `commit --amend`, force-push).

## Conventions

- Named exports, except route modules (default export required)
- `type` over `interface` unless declaration merging is needed
- No `any`. No non-null assertions (`!`) — narrow properly
- Dates: the API returns UTC ISO 8601, render in the household's local timezone
- Quantities: strings over the wire and in TS, matching what the API sends. Never floats
- The household is French-speaking. All user-facing text (UI copy, and the
  French messages this app maps API error `code`s to) is French, hardcoded
  directly in components — no i18n library, no translation-key indirection,
  since this app is single-language by design. Date/time formatting uses the
  `fr` date-fns locale and `Intl` with `"fr-FR"`. Code identifiers, comments,
  and commit messages
  stay in English.

## Testing

Rotation and ingredient-merge test coverage now lives in
`my-home-backend` (see its Testing section) — don't re-add those tests here.
This repo's tests are about rendering and wiring, not domain logic:

- `week.ts` — ISO week parsing/navigation used for the `?week=` URL param
- Every action gets an invalid-input test against a mocked API response
  (both a `400` with `errors`, and a `401`), not just the happy path
- Playwright covers: check off a shopping item, add a recipe to an existing list,
  create a list from a recipe, complete a chore, toggle a reminder, navigate weeks
  — run against a real backend instance, not mocked, since it's testing the
  integration too
- Run `npm run typecheck && npm run test` before considering work finished

## Deployment

A VPS, reverse-proxied by Caddy, reachable over the public internet,
alongside the backend (see `my-home-backend/CLAUDE.md` — Deployment) and its
Postgres. This app has no database to back up — that's entirely the
backend's concern now.

- Docker + `compose.yml` (`node:24-alpine`, no armv7 constraint), one service
  among several (this app, the backend, Postgres) in a shared compose file
- Caddy sits in front of **both** services on one domain: `/api/*` routed to
  the backend container, everything else to this app — automatic Let's
  Encrypt HTTPS, HSTS
- Build on a development machine, not on the server
- This app's container binds `127.0.0.1:3000` (or an internal Docker network
  address) only — Caddy is the only thing that talks to it directly. Never
  `0.0.0.0`
- This app needs the backend's public base URL (or its internal Docker
  service name/port, since they're on the same Docker network) at build/run
  time to know where to send API calls — check how that's wired before
  assuming `localhost` works in prod
- `public/robots.txt`: `Disallow: /` for the whole site. Publicly reachable
  is not the same as publicly listed

## Not in scope yet

Do not build these unless explicitly asked:

- Household member **edit** (the old placeholder button was removed rather
  than implemented, issue #12 — see Household)
- Remove-user flow, or any way to revoke/expire an invite from the UI
- Redesigning chore rotation, Cleaning/Dashboard's two-column layout, or
  reminder assignees for more than two people — invites can technically
  create a third+ user today, but nothing downstream of that has been
  redesigned to handle it (see Chore rotation, Project intro)
- Store tags on shopping items
- Push or in-app notifications (transactional invite/activation/password-reset
  email is the only mail the app sends)
- Multi-tenancy or third-party household sign-up
- Row-Level Security
- React Native or any native mobile app
- A second backend, a GraphQL layer, or bypassing `my-home-backend` to talk
  to Postgres directly from this repo — see Project
- Store distribution — TWA, Capacitor, or otherwise
- Billing, advertising
- OAuth (see Authentication)

## When unsure

Ask before adding a dependency, changing how this app talks to the API, or
introducing a new architectural pattern. Prefer the boring solution that fits
the stack already here.