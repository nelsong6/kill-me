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
  ├── Centralized color palette (src/colors.js)
  ├── Microsoft sign-in via MSAL.js (redirect flow)
  ├── Public viewing, admin-only editing
  ├── Deployed to Azure Static Web App
  └── Calls backend API with Bearer tokens

backend/           Express.js API (Node 20)
  ├── Self-signed JWT auth (Microsoft ID token exchange)
  ├── Azure Cosmos DB NoSQL for storage
  ├── Azure App Configuration + Key Vault for runtime config
  ├── Deployed as Azure Container App
  └── Managed identity for all Azure service access

tofu/              OpenTofu infrastructure-as-code
  └── App-specific resources on top of shared infra
```

### Auth model

"Everyone can view, only Nelson can edit." Public visitors see workout history
and the current day in the cycle. Logging workouts, changing the current day, and
admin actions require signing in with the whitelisted Microsoft account
(`nelson-devops-project@outlook.com`).

### Data flow

1. Anyone can browse — GET endpoints are public (no auth required)
2. To edit, user signs in with Microsoft via MSAL.js redirect flow
3. Frontend sends Microsoft ID token to backend `/auth/microsoft/login`
4. Backend verifies ID token against Microsoft JWKS, assigns admin/viewer role
5. Backend issues self-signed 7-day JWT; frontend stores it in localStorage
6. Frontend attaches JWT as Bearer token on write requests
7. Backend validates JWT, extracts `sub` claim as userId
8. Backend queries/writes Cosmos DB, partitioned by userId

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

Single container (`workouts`) partitioned by `/userId`. Four document types
distinguished by a `type` field:

| Type | Purpose | Key fields |
| ---- | ------- | ---------- |
| `workout-day-definition` | Static cycle definition (days 1-12) | `dayNumber`, `name`, `focus`, `primaryMuscleGroups` |
| `exercise` | Exercise library entries per day | `dayNumber`, `name`, `equipment`, `targetWeight/Reps/Sets` |
| `logged-workout` | A completed workout session | `userId`, `dayNumber`, `date`, `mode` (quick/detailed), `exercises[]` |
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

### 2026-03-16

- **Fixed loading screen hang on MSAL failure** — `AuthContext.jsx` had no error handling around `msalReady` / `handleRedirectPromise()`. If MSAL initialization failed (e.g., missing client ID), the error was silently swallowed and `setLoading(false)` never ran, leaving the app stuck on "Loading..." forever. Wrapped in try/catch/finally so the app always progresses past the loading state.
- **Created frontend `.env` for local dev** — added `frontend/.env` (gitignored) with `VITE_MICROSOFT_CLIENT_ID` (fetched from Azure App Config via `az appconfig kv show`) and `VITE_API_URL=http://localhost:3000`. The Microsoft client ID is a public value injected at build time — standard MSAL pattern.
- **Fixed custom domain bind in deploy workflow** — `az containerapp hostname bind` was failing because the ACA environment (`infra-aca`) lives in the `infra` resource group, not `workout-rg`. Fixed by passing the full environment resource ID instead of just the name. Also made the step idempotent: skips if a managed certificate is already bound (one-time bootstrap operation).
- **Fixed backend Dockerfile** — `COPY server.js ./` only copied the entrypoint, missing `auth/`, `middleware/`, `startup/`, and `seed-data.js`. Container was crash-looping with `ERR_MODULE_NOT_FOUND`. Changed to `COPY . .` (`.dockerignore` already excludes `node_modules`, `.env`, etc.).
- **Added Key Vault Secrets User role for Container App** — the managed identity was missing RBAC to read the JWT signing secret from Key Vault, causing a 403 `ForbiddenByRbac` on startup. Created the role assignment manually (CI identity lacks `roleAssignments/write` on the infra RG KV scope) and imported into tofu state via an `import` block.
- **Added `ignore_changes` for container image in tofu** — the deploy workflow sets the image tag to a commit SHA via `az containerapp update`, but tofu had `image = "...latest"` which doesn't exist in GHCR. Without `ignore_changes`, every tofu apply tried to reset the tag and failed with `MANIFEST_UNKNOWN`.
- **Left sidebar tab navigation** — replaced horizontal top tabs (Tailwind) with vertical left sidebar `TabBar` component using inline styles, matching the bender-world/eight-queens pattern. Added centralized `colors.js` palette. Converted `App.jsx` and `UserProfile.jsx` from Tailwind classes to inline styles. App shell is now: sticky header → flex row (sidebar + scrollable content).
- **Moved Microsoft client ID to App Config** — backend was reading `MICROSOFT_CLIENT_ID` from a Container App env var (set by tofu). Moved to Azure App Configuration as `workout:microsoft_client_id`, written by a new `azurerm_app_configuration_key` resource in tofu. Backend `appConfig.js` now fetches it from App Config alongside other settings. Removed the env var from the Container App template.

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
