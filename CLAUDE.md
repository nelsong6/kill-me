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
  ├── Left sidebar tab navigation (inline styles, collapsible, lucide-react icons)
  ├── Client-side URL routing via History API (pushState/popstate, no library)
  ├── Centralized color palette (src/colors.js)
  ├── Microsoft sign-in via MSAL.js (redirect flow)
  ├── Public viewing, admin-only editing
  ├── In-browser SQLite via sql.js/WASM for anonymous visitors (instant loads)
  ├── Deployed to Azure Static Web App
  └── Calls backend API with Bearer tokens

snapshot/          SQLite snapshot generator (Node 20)
  ├── Queries Cosmos DB for all public document types (6 tables)
  ├── Writes a SQLite .db file consumed by the frontend
  └── Runs every 4 hours via GitHub Actions cron

backend/routes/    Express router factories (workouts, soreness, cardio, admin)
  ├── Imported locally by backend/server.js — no longer published to GitHub Packages
  └── Seed data included (data/seed-data.js, data/seed-soreness.js)

tofu/              OpenTofu infrastructure-as-code
  └── App-specific resources on top of shared infra (no backend — decommissioned)
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
the Static Web App, JWT signing secret in Key Vault, DNS records, the Microsoft
sign-in app registration, and a per-app App Config key (`workout:microsoft_client_id`).
The backend Container App was decommissioned — routes now run in the shared API repo
at `api.romaine.life/workout`.

See also: **pipeline-templates** for reusable GitHub Actions workflows, and
**shell-config** for the global Claude config chain and DevOps tooling.

## Data Model (Cosmos DB)

Single container (`workouts`) partitioned by `/userId`. Document types
distinguished by a `type` field:

| Type | Purpose | Key fields |
| ---- | ------- | ---------- |
| `workout-day-definition` | Static cycle definition (days 1-12) | `dayNumber`, `name`, `focus`, `primaryMuscleGroups` |
| `exercise` | Exercise library entries per day | `dayNumber`, `name`, `equipment`, `tags[]`, `variations[]` (`{name, default, targetWeight/Reps/Sets}`) |
| `logged-workout` | A completed workout session | `userId`, `dayNumber`, `date`, `time` (HH:MM, nullable), `mode` (quick/detailed), `exercises[]` (`{name, variation, weight, reps, sets}`) |
| `cardio-session` | A completed cardio session | `userId`, `date`, `time` (HH:MM, nullable), `activity` (treadmill/bike), `durationMinutes`, `treadmill{}`, `bike{}` |
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
| `snapshot.yml` | Every 4 hours / manual | Generates SQLite snapshot from Cosmos DB and commits it to the repo (`frontend/public/snapshot.db`) |

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

### 2026-03-23

- **Decommissioned per-app Container App** — deleted `backend.tf`, `container-app-build.yml`, and remaining backend infrastructure. The old `kill-me-api` Container App and its custom domain/certificate/DNS records have been destroyed. Routes now run exclusively in the shared API at `api.romaine.life/workout`. Frontend deploy workflow rewritten to frontend-only (no backend build/push). Tofu outputs cleaned up (removed `container_app_name`, `container_app_environment_name`). Part of the shared API consolidation to eliminate 30-second cold starts.

### 2026-03-22

- **Extracted backend routes into `@nelsong6/kill-me-routes` npm package** — all route handlers from `server.js` extracted into modular router factories in `packages/routes/`: `createWorkoutRoutes`, `createSorenessRoutes`, `createCardioRoutes`, `createAdminRoutes`. Each accepts dependencies (container, requireAuth, requireAdmin) via injection. Seed data files copied into `packages/routes/data/`. Published to GitHub Packages. Motivation: consolidating all app backends into a single always-on shared Container App (`api` repo) to eliminate 30-second cold starts (~$19/month for always-on 0.25 vCPU / 0.5 Gi). Routes are mounted at `/workout` prefix in the shared API.
- **Added `publish-routes.yml` workflow** — publishes the route package on push to `packages/routes/` on main, then fires a `repository_dispatch` to the `api` repo to trigger a rebuild.
- **Updated frontend API URLs** — dev defaults changed from `localhost:3003` to `localhost:3000/workout` (shared API port + prefix). Production `backend_api_url` tofu output updated to `api.romaine.life/workout`.

### 2026-03-19

- **Added tags to exercises and redesigned Exercises tab** — exercises now carry a `tags[]` array capturing movement patterns (press, pull, curl, squat, fly, row), muscle groups (chest, triceps, quads, glutes), equipment (cable, dumbbell, machine), and exercise types (compound, isolation, mobility). All ~43 seed exercises tagged. New `GET /api/exercises` endpoint returns all exercises across all 12 days. Exercises tab (`ExercisesTab.jsx`) redesigned as a card carousel (one exercise at a time, prev/next arrows + keyboard nav) with filtering by text search, day toggle pills (1-12 with All/None), and tag filter pills (AND logic). Cards show day badge, name, equipment/location, notes, tag chips, variations list, and anatomy diagrams (mapped from tags via `TAG_TO_ANATOMY_GROUP`). Admin "Add Existing to Day" flow lets Nelson assign an exercise already defined on another day. Snapshot pipeline updated: `exercises` table has a `tags TEXT` column (JSON-serialized). Fixed Cosmos DB partition key duplication where exercises seeded without `userId` created ghost duplicates — added cleanup step that deletes all old exercise documents before re-seeding, and set `userId: 'shared'` on all shared documents.
- **Removed exercise pose illustrations (deferred)** — explored SVG exercise pose visualizations (inline JSX stick figures → silhouettes → detailed anatomical side-view figures → PNG generation via sharp). Nelson decided to defer this feature. `ExercisePoses.jsx` reduced to a null-returning stub; generated PNGs and generation script removed. The tag-matching infrastructure is preserved for future use.
- **Added success feedback and double-submit guard to cardio logging** — logging a treadmill or bike session had no visible confirmation beyond the form closing. Added a floating emerald toast notification ("✓ Treadmill session logged" / "✓ Bike ride logged") that auto-dismisses after 4 seconds, and a 10-second cooldown on the submit button after success. During cooldown, the button shows "✓ Logged" and is disabled with a dark overlay that shrinks right-to-left as a visual progress bar (CSS `scaleX` animation). Prevents accidental double-logging when Nelson taps the button twice. Applies to both treadmill and bike submit buttons in `WorkoutDrawer.jsx`.
- **Auto-populate previous soreness when logging new entry** — creating a new soreness entry now carries forward muscles from the most recent entry, since soreness commonly persists across multiple days. Carried-forward muscles are visually distinguished with an amber left border and a banner ("Carried forward from previous entry") with a "Dismiss all" button. Individual muscles can be removed with the existing ✕ button, and adjusting a muscle's severity slider accepts it (removes the carry-forward styling). The `carryForward` flag is UI-only — stripped before saving to Cosmos DB. Only applies to new entries; editing an existing entry loads its own muscles as before.
- **Added soreness to List and Calendar views** — soreness entries now appear alongside workouts and cardio in both the chronological list (`ListTab.jsx`) and the calendar (`HistoryTab.jsx`). In the list view, soreness entries render as orange-badged cards showing each affected muscle with a severity-colored dot and level label. In the calendar, days with logged soreness show an orange stripe, making it easy to spot recent activity. Both views fetch soreness via `useDataSource().fetchSoreness()`. Stats cards in both views include soreness counts, and soreness dates contribute to "Days Active". The calendar filter legend has a new "Wellness > Soreness" toggle (orange dot, same interaction as workout/cardio filters). The intent: soreness indicates recent activity and is noteworthy when reviewing training history.
- **Added time-of-day tracking to workout and cardio logs** — previously only the date (YYYY-MM-DD) was recorded. Added a `time` field (HH:MM string, nullable) to both `logged-workout` and `cardio-session` document types. The Log tab now shows a time input next to the date picker for both weight and cardio forms, auto-populated with the current local time on create and pre-filled from saved data on edit. The time is stored as a raw string with no timezone conversion — it's whatever the clock showed when Nelson logged it. The List tab displays time in 12-hour format after the date (e.g., "Mar 18, 2026  5:30 PM") and sorts same-date entries by time descending. Snapshot pipeline updated: both SQLite tables have a new `time` column, and snapshot query functions include it. Existing entries without a time field display normally with no time shown. `dateUtils.js` gained `nowLocalTime()` and `formatTime12h()` helpers.

### 2026-03-17

- **Added workout edit/delete capability** — clicking a logged workout in the History tab (calendar or list view) now navigates to the Log tab with the form pre-filled from that workout's data (date, day number via flipper, mode, exercises). The Log tab uses a single unified form for both creating and editing — the only differences are the header ("Edit Workout" vs "Log Workout"), the submit action (PUT vs POST), and a delete button with two-step confirmation that appears only in edit mode. When editing a detailed workout, the exercise checklist fetches definitions from the API and pre-checks any that match saved exercises, overlaying saved weight/reps/sets values; saved exercises not matching a definition are appended. A "← Log New Workout" link switches back to create mode. Backing out discards changes. Nelson wanted create and edit to feel identical ("you're always editing a workout, it just happens to be new") to prevent UI fatigue from having two different interfaces. Added `PUT /api/logged-workouts/:id` and `DELETE /api/logged-workouts/:id` backend endpoints (admin-only, cross-partition queries to find documents by id). HistoryTab click behavior changed: workout cells open edit mode, empty cells open create mode. App.jsx manages `logViewWorkout` state and passes `viewWorkout`, `onViewWorkout`, and `onWorkoutChanged` props to LogTab. A "Recent Workouts" section at the bottom of the Log tab shows the last 5 entries, each clickable to switch into edit mode.
- **Switched soreness list to vertical muscle-specific format** — the soreness journal displayed each day's sore muscles as horizontal wrapped pills showing just the muscle or group name. Changed to a vertical list where each line shows the severity level (color-coded) followed by the full path: "Group › Specific Muscle" (e.g., "Lats & Back › Erector Spinae (Lower)") or just the group name if no specific muscle was recorded. This makes it immediately clear which exact muscles were sore each day, accommodating variable-length lists without layout issues.
- **Fixed date change on existing soreness entries leaving duplicates** — the soreness editor had a date picker but changing the date on an existing entry only created a new Cosmos document at the new date without deleting the original. Added `originalDate` tracking so that when an entry's date is changed, the old `soreness-{originalDate}` document is deleted after the new one is saved.
- **Increased snapshot frequency from daily to every 4 hours** — anonymous visitors were seeing stale data for up to 24 hours. Changed `snapshot.yml` cron from `0 6 * * *` to `0 */4 * * *`.
- **Fixed soreness journal mobile layout** — entry rows were side-by-side (date + muscles) which broke on narrow viewports. Changed to a stacked layout: date and wrench icon on top row, muscles always wrap below via `flex-wrap: wrap` with `flex: 1 1 100%` on the muscles column and `white-space: nowrap` on the date. Both the list view and editor view containers have `overflowX: auto` so the anatomy diagram panel is reachable by horizontal scroll.
- **Added click-to-pin anatomy diagram in soreness list** — the anatomy diagram panel was hover-only, useless on touch devices. Clicking a muscle line now pins it (highlighted with cyan text and subtle background), keeping the diagram visible after the cursor/finger leaves. Hovering a different muscle temporarily overrides the pinned one, then snaps back. Clicking the pinned muscle again unpins it.
- **Separated soreness edit action from muscle click** — the entire entry row was clickable for admin editing, which conflicted with the new click-to-pin behavior. Replaced the row-level click with a small wrench icon (`lucide-react` `Wrench`) next to the date, visible only for admins.
- **Made History calendar view mobile-responsive** — the 7-column month/week calendar grids were unusable on narrow screens. Added responsive breakpoints throughout `HistoryTab.jsx`: day headers show single letters (S/M/T/W/T/F/S) on mobile and full names (Sun/Mon/...) on `sm`+, cell heights shrink (`h-14`/`min-h-[80px]` vs `h-20`/`min-h-[120px]`), grid gaps tighten, day number overlays and stat card fonts scale down, nav buttons show just arrows on mobile. Calendar/List toggle buttons hide emojis and shrink padding on mobile. Filter legend stacks vertically on small screens.
- **Added collapsible sidebar with icons** — the left sidebar tab bar now supports a collapsed mode toggled by a `◀`/`▶` button at the bottom. When collapsed, the sidebar shrinks to 36px and shows only lucide-react icons (CalendarDays for History, Dumbbell for Workout, RefreshCw for Cycle, Activity for Soreness, PenLine for Log, Wrench for Admin). When expanded, both icon and label are shown. Defaults to collapsed on screens under 640px. `TabBar.jsx` accepts `collapsed` and `onToggleCollapse` props; `App.jsx` manages `sidebarCollapsed` state.
- **Reduced content area padding** — `tabContent` padding decreased from `12px 24px` to `12px 12px` to reclaim horizontal space, especially on mobile.
- **Improved soreness tab mobile responsiveness** — added a `useIsMobile()` hook (640px breakpoint, matching sidebar collapse threshold) to `SorenessTab.jsx`. On mobile: entry rows stack vertically (date on top, muscles below) instead of side-by-side; the anatomy diagram panel shrinks from 300px to 220px and sits to the right of a full-width list column, reachable by horizontal scroll rather than being hidden. The editor view also allows horizontal scroll to reach the diagram when the muscle picker is open. Muscle entry rows in the editor allow wrapping for slider controls on narrow screens.
- **Added cardio tracking (treadmill + bike)** — the app previously only tracked weight training via the Synergy 12 cycle. Nelson does cardio daily (treadmill intervals and bike rides) but had no way to log them. Cardio is fully independent of the 12-day cycle. New `cardio-session` document type in Cosmos DB with `activity` field (treadmill/bike) and activity-specific sub-objects: `treadmill` stores a template reference and full interval array; `bike` stores distance, speed, HR, cadence, calories, and Garmin activity ID (for future import dedup). Backend: 4 new endpoints (`GET/POST/PUT/DELETE /api/cardio-sessions`) following existing patterns. Snapshot pipeline: new `cardio_sessions` SQLite table with `fetchCardioSessions` in `useDataSource()`. Frontend LogTab (`WorkoutDrawer.jsx`): weight/cardio toggle at top of the form; treadmill mode shows a template dropdown with read-only interval preview (each row shows type, speed, duration); bike mode shows manual-entry fields for duration, distance, speed, HR, calories. Both support create/edit/delete with the same unified form pattern as weight workouts. `App.jsx` manages `logViewCardio` state parallel to `logViewWorkout`. Frontend HistoryTab: fetches cardio sessions alongside workouts (parallel), merges them into calendar cells as colored stripes (emerald for treadmill, teal for bike), adds a Cardio filter section to the legend, and interleaves cardio cards in the list view with metrics summaries. Stats card expanded to 4 columns: Workouts, Cardio, Days Active, Cycle Days. New files: `cardioTemplates.js` (Nelson's Walk/Jog 5×5.4 + 1×6.0 template, 32 min), `cardioConfig.js` (activity colors/labels). Phase 2 (not yet built): Garmin Connect import via `python-garminconnect` in a GitHub Actions cron, similar to the snapshot workflow.
- **Fixed backend timezone bug stamping evening workouts with tomorrow's date** — the `/api/log-workout` endpoint computed `today` via `new Date().toISOString().split('T')[0]` which returns UTC. In Pacific time after ~4-5 PM, UTC has already rolled to the next day, so workouts logged in the evening got the wrong date. Fixed by having the frontend send its local date (`todayLocal()` from `dateUtils.js`) in the request body and having the backend use the client-provided `date` field, falling back to server time only if absent. `TodayTab.jsx` quick and detailed log calls now include `date: todayLocal()`. `WorkoutDrawer.jsx` already sent the date. This approach is server-timezone-agnostic — works regardless of Azure's default UTC.
- **Added exercise variation system** — exercises previously had a single fixed set of targets (targetWeight/Reps/Sets). Nelson noticed that logging an incline dumbbell bench press got recorded as a flat bench press because the system had no way to distinguish variations. Restructured the exercise data model: each exercise document now has a `variations[]` array where each variation has its own `name`, `targetWeight`, `targetReps`, `targetSets`, and a `default` flag. The same base exercise on different days remains separate documents with different targets per day (e.g., Dumbbell Bench Press on Day 8 has light mobility variations, Day 9 has heavy pressing variations). Logged workout exercise entries now include a `variation` field. Frontend: Workout tab and Log tab show clickable variation pills below each exercise — selecting a variation updates the target fields and records which variation was performed. History tab displays the variation name in parentheses for non-Standard entries. Snapshot pipeline updated: `exercises` table drops `target_weight/reps/sets` columns, adds `variations TEXT` (JSON). Backend: new `POST /api/admin/migrate-exercise-variations` endpoint migrates existing Cosmos DB data — wraps flat exercise targets into `variations: [{ name: 'Standard', ... }]` and backfills `variation: 'Standard'` on historical logged workout exercise entries. Migration button added to Admin tab. Seed data expanded with variations for exercises that have meaningful options (bench press angles, grip widths, curl styles, pushdown attachments, etc.). Migration path: re-seed (Initialize Database) to get the full variation library, then run Migrate Exercise Variations to backfill historical logs.

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
- **Left sidebar tab navigation** — replaced horizontal top tabs (Tailwind) with vertical left sidebar `TabBar` component using inline styles. Added centralized `colors.js` palette. Converted `App.jsx` and `UserProfile.jsx` from Tailwind classes to inline styles. App shell is now: sticky header → flex row (sidebar + scrollable content).
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
