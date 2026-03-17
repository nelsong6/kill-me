# kill-me — Workout Tracker

Personal workout tracker built around a custom 12-day training cycle called **Synergy 12**.

The repo name comes from a Tom Platz video where he screams "KILL ME" during an
agonizing set of leg extensions under hypnotherapy coaching.

## The 12-Day Synergy System

The cycle is Nelson's own design, optimized for **consistent daily activity** rather
than traditional rest-heavy programming. Three guiding principles:

1. **Daily activity over rest** — the cycle alternates intensity so every day has
   something to do. Grip, calves, and mobility days are deliberately low-impact,
   keeping the habit of daily training without taxing recovery.
2. **Wellness over hypertrophy** — the goal is muscle-mind connection and joint health,
   not progressive overload. Nelson's muscles grow readily; the priority is controlled
   movement and avoiding excessive bulk.
3. **CNS-aware sequencing** — only three days (1, 5, 9) are systemically taxing compound
   lifts. They are evenly spaced with isolation and recovery work between them to avoid
   stacking central nervous system fatigue.

### Recovery sequencing in the cycle order

The day ordering is not arbitrary — each placement accounts for what came before:

- **Day 1 (Legs/Squat)** → **Day 3 (Hamstrings)**: hamstring isolation is safe because
  Day 1's squat volume has cleared by Day 3
- **Day 7 (Torso)** is placed to save the lower back for Day 1 when the cycle wraps
- **Day 8 (Pecs Mobility)** primes the shoulder capsule for Day 9's heavy pressing —
  light flys, holds, and stretches only
- **Day 9 (Compound Push)** is where dips and heavy pressing belong — never on Day 8
- **Day 12 (Grip)** ends the cycle as a near-zero CNS load before restarting

### Day 8 shoulder safety

Nelson has historical shoulder injuries (both shoulders, 15-20 years ago). They healed
well but have underlying limitations. Day 8's strict "no heavy pressing" rule protects
the shoulder joint by keeping pec work light and mobility-focused before compound push
day. Dips are fine on Day 9 (assisted machine at -90 lbs), but never on Day 8.

## Architecture

```text
frontend/          React 19 SPA (Vite + Tailwind CSS 4)
  ├── Left sidebar tab navigation (inline styles, matches bender-world/eight-queens)
  ├── Client-side URL routing via History API (pushState/popstate, no library)
  ├── Centralized color palette (src/colors.js)
  ├── Microsoft sign-in via MSAL.js (redirect flow)
  ├── Public viewing, admin-only editing
  ├── In-browser SQLite via sql.js/WASM for anonymous visitors (instant loads)
  ├── Deployed to Azure Static Web App
  └── Calls backend API with Bearer tokens

snapshot/          SQLite snapshot generator (Node 20)
  ├── Queries Cosmos DB for all public document types
  ├── Writes a SQLite .db file consumed by the frontend
  └── Runs daily via GitHub Actions cron (6:00 AM UTC)

backend/           Express.js API (Node 20)
  ├── Self-signed JWT auth (Microsoft ID token exchange)
  ├── Azure Cosmos DB NoSQL for storage
  ├── Azure App Configuration + Key Vault for runtime config
  ├── CORS via Express middleware (local dev only; production uses infra-level CORS)
  ├── Deployed as Azure Container App
  └── Managed identity for all Azure service access

tofu/              OpenTofu infrastructure-as-code
  └── App-specific resources on top of shared infra
```

### Auth model

"Everyone can view, only Nelson can edit." Anonymous visitors get instant page
loads from an in-browser SQLite snapshot (sql.js/WASM) — no backend cold start.
Authenticated users switch to the live API. Logging workouts, changing the current
day, and admin actions require signing in with the whitelisted Microsoft account
(`nelson-devops-project@outlook.com`).

### Data flow

1. Anonymous visitors load `snapshot.db` via sql.js/WASM — reads served entirely in-browser
2. On sign-in, snapshot is discarded and all reads switch to the live backend API

**Critical `useDataSource()` contract:** Every consumer of `useDataSource()` MUST check `isReady` before calling any fetch function. The snapshot loads asynchronously (WASM init + network fetch). Until it's ready, `db` is null, `isLive` evaluates to true, and fetches silently hit the live API — which doesn't exist for anonymous visitors, causing a permanent loading spinner. Pattern: `const { fetchFoo, isReady } = useDataSource(); useEffect(() => { if (!isReady) return; fetchFoo()... }, [isReady]);`
3. To edit, user signs in with Microsoft via MSAL.js redirect flow
4. Frontend sends Microsoft ID token to backend `/auth/microsoft/login`
5. Backend verifies ID token against Microsoft JWKS, assigns admin/viewer role
6. Backend issues self-signed 7-day JWT; frontend stores it in localStorage
7. Frontend attaches JWT as Bearer token on write requests
8. Backend validates JWT, extracts `sub` claim as userId
9. Backend queries/writes Cosmos DB, partitioned by userId

### Shared infrastructure

This repo builds on shared resources provisioned by **infra-bootstrap**:

- Cosmos DB account (`infra-cosmos`)
- Container App Environment (`infra-aca`)
- Azure App Configuration (`infra-appconfig`)
- DNS zone (`romaine.life`)
- Key Vault (`romaine-kv`)

App-specific resources created by this repo: the Cosmos DB database and container,
the Container App, the Static Web App, JWT signing secret in Key Vault, DNS records,
the Microsoft sign-in app registration, and a per-app App Config key
(`workout:microsoft_client_id`).

See also: **pipeline-templates** for reusable GitHub Actions workflows, and
**shell-config** for the global Claude config chain and DevOps tooling.

## Data Model (Cosmos DB)

Single container (`workouts`) partitioned by `/userId`. Document types
distinguished by a `type` field:

| Type | Purpose | Key fields |
| ---- | ------- | ---------- |
| `workout-day-definition` | Static cycle definition (days 1-12) | `dayNumber`, `name`, `focus`, `primaryMuscleGroups` |
| `exercise` | Exercise library entries per day | `dayNumber`, `name`, `equipment`, `targetWeight/Reps/Sets` |
| `logged-workout` | A completed workout session | `userId`, `dayNumber`, `date`, `mode` (quick/detailed), `exercises[]` |
| `soreness-entry` | Daily soreness journal entry | `userId`, `date`, `muscles[]` (`{group, muscle, level}`) |
| `settings` | Per-user settings (current day) | `userId`, `currentDay` |
| `account` | Microsoft auth account record | `userId`, `provider`, `name`, `email`, `role` |

All document types share the same container and partition key. The `type` field is
used in queries to distinguish them.

## CI/CD

All workflows delegate to **nelsong6/pipeline-templates** reusable templates:

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| `container-app-build.yml` | Push/PR to main | Builds Docker image, pushes to GHCR |
| `full-stack-deploy.yml` | After CI Build succeeds / manual | Deploys backend (Container App image update + custom domain cert), deploys frontend (SWA) |
| `tofu.yml` | Push/PR touching `tofu/` | Plan on PR, apply on main merge |
| `lint.yml` | PR to main | Trailing newlines, YAML, spelling, markdown, tofu fmt |
| `tofu-lockfile-check.yml` | PR touching `tofu/` | Validates lockfile is current |
| `tofu-lockfile-update.yml` | Manual dispatch | Regenerates lockfile across platforms |
| `generate-local-env.yml` | Manual dispatch | Generates `frontend/.env` and `backend/.env` from infra outputs |
| `snapshot.yml` | Daily cron (6 AM UTC) / manual | Generates SQLite snapshot from Cosmos DB and commits it to the repo (`frontend/public/snapshot.db`) |

## Development

### Prerequisites

- Node 20+
- Azure CLI (`az login` for local Cosmos DB and Key Vault access)
- Backend `.env` with `AZURE_APP_CONFIG_ENDPOINT`, `APP_CONFIG_PREFIX`, and `KEY_VAULT_URL`
- Frontend `.env` with `VITE_MICROSOFT_CLIENT_ID` and `VITE_API_URL`

### Running locally

```bash
dev                  # Shell function — installs deps if needed, starts both servers
cd backend && npm run dev   # Backend only (Express :3000)
cd frontend && npm run dev  # Frontend only (Vite :5173)
```

The frontend reads `VITE_MICROSOFT_CLIENT_ID` and `VITE_API_URL` environment variables.

Admin mode (database init, data migration) is available only on localhost in dev
mode when signed in as admin.

### Build number

The frontend displays a git short hash as the build number, injected at build time
via Vite's `define` config.

## Change Log

### 2026-03-15 (session 8)

- **Fixed admin role not assigned after Microsoft login** — the email comparison in `microsoft-routes.js` used strict equality (`===`) against the lowercase `ALLOWED_EMAIL` constant, but Microsoft ID tokens can return emails in varying case (e.g., `Nelson-DevOps-Project@outlook.com`). Added `.toLowerCase()` to the incoming email before comparison so admin role assignment is case-insensitive.

### 2026-03-15 (session 7)

- **Added static SQLite snapshot system for anonymous visitors** — the backend Container App scales to zero when idle, causing 30+ second cold starts for anonymous visitors. Built a snapshot pipeline: a GitHub Actions cron job (`snapshot.yml`) runs daily at 6:00 AM UTC, queries all 5 public document types from Cosmos DB via `@azure/cosmos`, writes them into a SQLite database (`snapshot/generate-snapshot.js` using `better-sqlite3`), and deploys the `.db` file as a static asset with the frontend. The frontend loads it in-browser via sql.js (SQLite compiled to WASM). Anonymous users get instant page loads from the snapshot; authenticated users discard the snapshot and switch to the live API. New files: `snapshot/` directory (generator script + deps), `frontend/src/api/snapshot.js` (query functions mirroring API shapes), `frontend/src/api/snapshotContext.jsx` (`SnapshotProvider`, `useSnapshot`, `useDataSource` hooks). Modified `TodayTab`, `HistoryTab`, `SorenessTab`, and `useWorkouts` to read from `useDataSource()` instead of `apiFetch` for GET operations. Write operations remain live API only.
- **Self-hosted sql.js WASM** — `vite.config.js` copies `sql-wasm.wasm` from `node_modules` to `public/` at build time, avoiding CDN dependency. Added `.db` and `.wasm` MIME types to `staticwebapp.config.json`.
- **Set up Cosmos DB RBAC for CI service principal** — the GitHub Actions OIDC service principal needed `Cosmos DB Built-in Data Reader` role on the Cosmos account to query data during snapshot generation. Now provisioned automatically by infra-bootstrap's app module (`azurerm_cosmosdb_sql_role_assignment`).
- **Added `AZURE_APP_CONFIG_ENDPOINT` GitHub variable** — the snapshot workflow resolves the Cosmos DB endpoint from App Config at runtime (via `az appconfig kv show`) rather than from tofu outputs, working around the pipeline-templates limitation where output-only tofu changes don't trigger an apply.
- **Added tofu outputs for cosmos_db_endpoint and app_config_endpoint** — defined in `outputs.tf` but not yet applied to state (not needed by snapshot workflow since it reads from App Config directly).

### 2026-03-15 (session 6)

- **Added Soreness tab** — new public tab (`SorenessTab.jsx`) in the left sidebar between Cycle and Log for tracking daily muscle soreness. Nelson's spreadsheet had a free-text "Soreness calendar" sheet; this replaces it with structured data. Each entry is a date with an array of sore muscles, each having a group, optional specific muscle name, and 1-10 severity level. The `muscle` field can be `null` for group-level soreness (e.g. "Biceps" without specifying a head) — Nelson preferred the flexibility to be either specific or general. Admin can add/edit entries via a muscle picker that supports both group-level and specific-muscle selection, with a search function. Public users can view the history.
- **Created muscle taxonomy** — `muscleTaxonomy.js` defines 12 muscle groups (Quadriceps, Hamstrings, Glutes, Calves, Pecs, Lats & Back, Deltoids, Biceps, Triceps, Forearms & Grip, Abs & Core, Hip & Adductors) with specific muscles under each, including anatomical location hints. Includes a `searchMuscles()` function for the picker's search bar.
- **Created SVG anatomy reference diagrams** — `AnatomyDiagrams.jsx` renders schematic SVG diagrams for all 12 muscle groups. Every muscle in the taxonomy has a distinct highlightable shape — surface muscles use solid fills, deep muscles (e.g., Vastus Intermedius, Pectoralis Minor, Internal Obliques) use a subtler dashed style that lights up on hover. Supports `highlightMuscle` prop with fuzzy name matching (strips parentheses, case-insensitive containment). Used by the soreness picker's right-panel diagram view.
- **Added soreness API endpoints** — `GET /api/soreness` (public), `POST /api/soreness` (admin, upserts by date), `DELETE /api/soreness/:date` (admin). New `soreness-entry` document type in Cosmos DB, one per date, containing `muscles[]` array.
- **Added soreness seed endpoint** — `POST /api/admin/seed-soreness` upserts 40 historical entries from the spreadsheet (Nov 2025 – Feb 2026). Accessible via "Seed Soreness Data" button in the admin panel (`DatabaseInit.jsx`). Seed data lives in `seed-soreness.js` as a data export. Severity levels inferred from spreadsheet qualifiers ("light"→3, "nearly faded"→2, "very sore"→8, no qualifier→5).

### 2026-03-15 (session 5)

- **Transformed Today tab into Workout view** — the Today tab was locked to the current day with no way to browse other days' details. Renamed to "Workout" and added a 12-day selector strip at the top (numbered pill buttons with a green dot on the current day). Defaults to the current day but allows selecting any day to see its full breakdown: description, recovery sequencing rationale, compound/today badges, safety notes, exercises with targets, and muscle groups. Exercise list is now always visible to all users (previously only shown inside admin-only detailed logging mode). Logging modes (quick/detailed) remain admin-only, below the exercise list. `TodayTab.jsx` now imports `DAY_CONFIG`, `colors`, and `RECOVERY_NOTES` (previously only in `CycleTab`). Tab label in `App.jsx` changed from "Today" to "Workout".

### 2026-03-15 (session 4)

- **Moved day override from Cycle tab to Admin tab** — the override toggle and day dropdown were in `CycleTab.jsx` but belong with other admin tools. Moved override state, toggle button, and dropdown to `DatabaseInit.jsx`. `CycleTab` no longer takes `onDayChange` or `isAdmin` props. `App.jsx` now passes `currentDay` and `onDayChange` to `DatabaseInit`.
- **Fixed History calendar Next button stuck** — `hasWorkoutsInFuture()` in `HistoryTab.jsx` only enabled the Next button if logged workouts existed beyond the current viewing period. This meant navigating forward to the current month was impossible if no workouts were logged there yet (e.g., viewing February with no March data). Added a check that always allows forward navigation when the viewed period's end is still in the past, so users can always reach the current month.

### 2026-03-15 (session 3)

- **Moved day override from Today tab to Cycle tab** — the override toggle and day dropdown were in `TodayTab.jsx` but conceptually belong in the Cycle tab where the full 12-day breakdown is visible. Moved override state, toggle button, and dropdown to `CycleTab.jsx` (admin-only). Removed `onDayChange` prop and `DAY_CONFIG` import from `TodayTab`. `App.jsx` now passes `onDayChange` and `isAdmin` to `CycleTab` instead of `TodayTab`.

### 2026-03-15 (session 2)

- **Added Cycle tab to left sidebar** — new tab (`CycleTab.jsx`) between Today and Log that displays the full Synergy 12 system: three guiding principles, all 12 days with names/focus/descriptions, recovery sequencing rationale for key days, safety callouts (Day 8 shoulder, Day 10 pushdown preference), and CNS-aware compound day highlighting (Days 1, 5, 9). The current day is highlighted in green with a "Next" badge so it's immediately obvious which workout is up next. Public tab — no auth required, renders from static `dayConfig.js`. Receives `currentDay` from `App.jsx`. Also hosts day override controls (admin-only).

### 2026-03-16

- **Snapshot workflow now commits `snapshot.db` to the repo** — instead of only deploying the snapshot with the frontend build, the workflow now commits it back to the repo so local dev and CI builds include it via `git pull`. Removed `snapshot.db` from `.gitignore`. Added `rm -f` before regeneration to avoid "table already exists" errors when the checkout includes a previously committed snapshot.
- **Added client-side URL routing via History API** — tabs are now linkable via URL paths (`/soreness`, `/today`, `/cycle`, `/log`, `/admin`; `/` defaults to History). Uses `pushState`/`popstate` directly — no router library needed since the tab structure is flat with no nested routes. Browser back/forward buttons work. The `navigateTab()` wrapper replaces all `setActiveTab()` calls so every tab switch (sidebar clicks, programmatic navigates from `handleOpenLog`/`handleWorkoutSuccess`) updates the URL. `staticwebapp.config.json` already had `navigationFallback` for SPA rewrites, so direct-link navigation works in production with no hosting changes.
- **Fixed permanent loading spinner for anonymous visitors** — `HistoryTab`, `SorenessTab`, and `TodayTab` called `useDataSource()` fetch functions on mount without checking `isReady`. The snapshot was still loading (WASM init + network fetch), so `db` was null, `isLive` was true, and fetches hit the nonexistent live API. Added `isReady` guards to all three components. Documented the `useDataSource()` consumer contract in code comments and CLAUDE.md Data flow section.
- **Fixed loading screen hang on MSAL failure** — `AuthContext.jsx` had no error handling around `msalReady` / `handleRedirectPromise()`. If MSAL initialization failed (e.g., missing client ID), the error was silently swallowed and `setLoading(false)` never ran, leaving the app stuck on "Loading..." forever. Wrapped in try/catch/finally so the app always progresses past the loading state.
- **Created frontend `.env` for local dev** — added `frontend/.env` (gitignored) with `VITE_MICROSOFT_CLIENT_ID` (fetched from Azure App Config via `az appconfig kv show`) and `VITE_API_URL=http://localhost:3000`. The Microsoft client ID is a public value injected at build time — standard MSAL pattern.
- **Redesigned soreness muscle picker with two-column anatomy panel** — the muscle picker was cluttered and didn't help identify muscles visually. Restructured the editor into a two-column layout: picker list on the left, live anatomy diagram on the right. The diagram panel appears when the picker is open, shows the currently expanded group, and highlights individual muscles on hover with their name and anatomical location below. Removed the inline diagram that was crammed inside the picker list. The diagram panel uses `position: sticky` to follow scrolling.
- **Added anatomy diagrams to public soreness list view** — the anatomy viewer was only visible in the admin editor when the muscle picker was open. Extended it to the public list view so anyone (anonymous or authenticated) can hover a muscle pill to see the corresponding SVG anatomy diagram in a sticky right panel, with the specific muscle highlighted and its anatomical location labeled. The panel always reserves its layout space (opacity fade instead of conditional mount) to prevent layout thrashing when hovering pills rapidly.
- **Comprehensive anatomy diagram upgrade** — the original diagrams only covered ~60% of taxonomy muscles. Many were shown as non-interactive dashed outlines or merged into single shapes (e.g., one "Pectoralis Major" shape for both Clavicular and Sternal heads). Rewrote all 10 diagrams that had gaps: split Pec Major into Clavicular/Sternal, split Biceps Femoris into Long/Short Head, split Trapezius into Upper/Middle/Lower, split Erector Spinae into Upper/Lower, split Rectus Abdominis into Upper/Lower, added Serratus Anterior, Pectoralis Minor, Gluteus Minimus, Posterior Deltoid, Teres Major/Minor, Infraspinatus, Tibialis Anterior, Achilles Tendon, Pronator Teres, Supinator, Internal Obliques, Transverse Abdominis, Hip Abductors, Piriformis, and Brachioradialis (in Biceps diagram). Added `mpDeep()` rendering for deep muscles — subtler dashed stroke by default, bright highlight on hover.
- **Fixed UTC date bug showing tomorrow in soreness picker** — `todayStr()` used `new Date().toISOString().split('T')[0]` which converts to UTC, showing tomorrow's date in the evening for western timezones. Created shared `dateUtils.js` with `todayLocal()` and `dateToLocal()` using local timezone. Fixed the same bug in `WorkoutDrawer.jsx` (3 occurrences) and `HistoryTab.jsx` (4 occurrences).
- **Fixed custom domain bind in deploy workflow** — `az containerapp hostname bind` was failing because the ACA environment (`infra-aca`) lives in the `infra` resource group, not `workout-rg`. Fixed by passing the full environment resource ID instead of just the name. Also made the step idempotent: skips if a managed certificate is already bound (one-time bootstrap operation).
- **Fixed backend Dockerfile** — `COPY server.js ./` only copied the entrypoint, missing `auth/`, `middleware/`, `startup/`, and `seed-data.js`. Container was crash-looping with `ERR_MODULE_NOT_FOUND`. Changed to `COPY . .` (`.dockerignore` already excludes `node_modules`, `.env`, etc.).
- **Added Key Vault Secrets User role for Container App** — the managed identity was missing RBAC to read the JWT signing secret from Key Vault, causing a 403 `ForbiddenByRbac` on startup. Created the role assignment manually (CI identity lacks `roleAssignments/write` on the infra RG KV scope) and imported into tofu state via an `import` block.
- **Added `ignore_changes` for container image in tofu** — the deploy workflow sets the image tag to a commit SHA via `az containerapp update`, but tofu had `image = "...latest"` which doesn't exist in GHCR. Without `ignore_changes`, every tofu apply tried to reset the tag and failed with `MANIFEST_UNKNOWN`.
- **Left sidebar tab navigation** — replaced horizontal top tabs (Tailwind) with vertical left sidebar `TabBar` component using inline styles, matching the bender-world/eight-queens pattern. Added centralized `colors.js` palette. Converted `App.jsx` and `UserProfile.jsx` from Tailwind classes to inline styles. App shell is now: sticky header → flex row (sidebar + scrollable content).
- **Moved Microsoft client ID to App Config** — backend was reading `MICROSOFT_CLIENT_ID` from a Container App env var (set by tofu). Moved to Azure App Configuration as `workout:microsoft_client_id`, written by a new `azurerm_app_configuration_key` resource in tofu. Backend `appConfig.js` now fetches it from App Config alongside other settings. Removed the env var from the Container App template.
- **Added CORS middleware for local dev** — the `cors` npm package was installed but never imported. In production, CORS is handled at the Azure Container App infra level, but locally Express is hit directly from `localhost:5173` → `localhost:3000`, causing "Failed to fetch" on cross-origin requests (e.g., the admin init-database button). Added `cors()` middleware gated behind `NODE_ENV !== 'production'` so it only applies in local dev.
- **Fixed admin tab white screen** — clicking the admin button crashed the app to a white screen. `DatabaseInit.jsx` line 243 referenced `{API_URL}` as a JSX expression in a troubleshooting `<code>` block, but `API_URL` was never imported or defined in the component (it's a non-exported const in `client.js`). React threw a `ReferenceError` during render, and with no error boundary the entire app unmounted. Replaced with a string literal since the admin panel only renders on localhost in dev mode.

### 2026-03-15

- **Switched auth from Auth0 to Microsoft sign-in** — replaced Auth0 SPA flow with MSAL.js redirect flow (Microsoft identity). Backend now verifies Microsoft ID tokens via JWKS and issues self-signed JWTs. Whitelisted email (`nelson-devops-project@outlook.com`) gets admin role; all others get viewer.
- **Adopted "view/edit" access model** — anyone can browse workout history and today's workout (GET endpoints are public). Only admin can log workouts, change the current day, or access admin tools. Frontend conditionally hides edit UI for non-admin users.
- **Removed Auth0 infrastructure** — deleted Auth0 provider, SPA client, resource server, and App Config audience key from OpenTofu. Added JWT signing secret to Key Vault and Key Vault access role for the Container App.
- **Removed legacy endpoints** — deleted `GET /api/workouts`, `POST /api/workouts/bulk`, `GET /api/workouts/day/:dayNumber`, `POST /api/workouts`, `DELETE /api/workouts/:id` (tech debt, no consumers).
- **Added data migration endpoint** — `POST /api/admin/migrate-data` re-partitions existing documents from the old Auth0 userId to the new Microsoft userId.
- **Created shared API client** — `frontend/src/api/client.js` with auto Bearer token, 503 retry, and 401 handling. Replaced per-component `getToken` prop drilling.

### 2026-03-15

- **Created CLAUDE.md and inline documentation** — wrote repo-level docs covering Synergy 12 philosophy, architecture, data model, CI/CD, and dev setup. Added inline comments to all source files (backend, frontend components/hooks/utils, tofu) following global documentation standards (meta in CLAUDE.md, component-level in code).
- **Deleted dead components** — removed `WorkoutForm.jsx`, `WorkoutHistory.jsx`, `DayCard.jsx`, `DayNavigation.jsx` (superseded by TodayTab/HistoryTab, no remaining imports).
- **Removed dev scaffolding** — deleted `MigrationPanel.jsx`, `migration.js`, `useLocalStorage.js` (one-time localStorage→Cosmos migration tooling, no longer needed). Removed MigrationPanel import/usage from `App.jsx`.
- **Cleaned up dayConfig.js** — removed `exercises` arrays from all day entries since the DB is the source of truth. Only names, colors, descriptions, and safety notes remain.
- **Modernized remote-state.tf** — replaced hardcoded ARM resource IDs with `azurerm_*` data source lookups for Cosmos DB, Container App Environment, and App Configuration. Updated all downstream references in `backend.tf`, `db.tf`, `appconfig.tf`, `outputs.tf`, and `keyvault.tf`.
- **Removed root-level npm artifacts** — deleted root `package.json`, `package-lock.json`, and `node_modules/`. The root package existed only to provide `concurrently` for running both servers. Replaced with a `dev` shell function in shell-config that auto-detects `backend/`+`frontend/` dirs, installs deps if `node_modules` is missing, and runs both servers concurrently.
- **Added backend `.env`** — created `backend/.env` with `AZURE_APP_CONFIG_ENDPOINT` and `APP_CONFIG_PREFIX` for local development (gitignored).
- **Converted workout drawer to Log tab** — the slide-in `WorkoutDrawer` panel (fixed-position right drawer with framer-motion animations, "New Workout" button, ESC handler, body scroll lock) was being clipped by the sticky title bar. Instead of fixing the overlap, converted it to a "Log" tab in the left sidebar, rendering inline as tab content. Renamed export to `LogTab` (file still `WorkoutDrawer.jsx`). Calendar day clicks in HistoryTab now switch to the Log tab with pre-filled day/date. After a successful log, auto-navigates back to History. The Log tab is admin-only.
- **Shrunk history calendar month view cells** — month view cells in `HistoryTab.jsx` used `aspect-square`, which made them excessively tall on wide screens. Replaced with fixed `h-20` (80px) on both day cells and empty padding cells for a compact calendar that doesn't dominate the page.
