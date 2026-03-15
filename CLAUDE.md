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
  ├── Auth0 for authentication (SPA flow)
  ├── Deployed to Azure Static Web App
  └── Calls backend API with Bearer tokens

backend/           Express.js API (Node 20)
  ├── Auth0 JWT validation (express-oauth2-jwt-bearer)
  ├── Azure Cosmos DB NoSQL for storage
  ├── Azure App Configuration for runtime config
  ├── Deployed as Azure Container App
  └── Managed identity for all Azure service access

tofu/              OpenTofu infrastructure-as-code
  ├── App-specific resources on top of shared infra
  └── Auth0 provider for client/resource server management
```

### Data flow

1. User authenticates via Auth0 (SPA redirect flow)
2. Frontend requests Bearer token silently from Auth0
3. Frontend calls backend API with token in Authorization header
4. Backend validates JWT, extracts `sub` claim as userId
5. Backend queries/writes Cosmos DB, partitioned by userId

### Shared infrastructure

This repo builds on shared resources provisioned by **infra-bootstrap**:

- Cosmos DB account (`infra-cosmos`)
- Container App Environment (`infra-aca`)
- Azure App Configuration (`infra-appconfig`)
- DNS zone (`romaine.life`)
- Key Vault (`romaine-kv`)

App-specific resources created by this repo: the Cosmos DB database and container,
the Container App, the Static Web App, Auth0 client and resource server, DNS records,
and App Configuration keys.

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

All document types share the same container and partition key. The `type` field is
used in queries to distinguish them.

## CI/CD

All workflows delegate to **nelsong6/pipeline-templates** reusable templates:

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| `container-app-build.yml` | Push/PR to main | Builds Docker image, pushes to GHCR |
| `lint.yml` | PR to main | Trailing newlines, YAML, spelling, markdown, tofu fmt |
| `tofu-lockfile-check.yml` | PR touching `tofu/` | Validates lockfile is current |
| `tofu-lockfile-update.yml` | Manual dispatch | Regenerates lockfile across platforms |
| `generate-local-env.yml` | Manual dispatch | Generates `frontend/config.js` and `backend/.env` from infra outputs |

## Development

### Prerequisites

- Node 20+
- Azure CLI (`az login` for local Cosmos DB access)
- Auth0 tenant configured (domain, client ID, audience)
- Backend `.env` or Azure App Configuration endpoint

### Running locally

```bash
npm run dev          # Starts both frontend (Vite :5173) and backend (Express :3000)
npm run dev:frontend # Frontend only
npm run dev:backend  # Backend only
```

The frontend reads Auth0 config from `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`,
`VITE_AUTH0_AUDIENCE`, and `VITE_API_URL` environment variables.

Admin mode (database init, migration panel) is available only on localhost in dev mode.

### Build number

The frontend displays a git short hash as the build number, injected at build time
via Vite's `define` config.

## Tech Debt / Cleanup Needed

- **Legacy backend endpoints**: `GET /api/workouts` and `POST /api/workouts/bulk`
  were used by now-removed components and migration tooling. The canonical endpoints
  are `/api/logged-workouts` and `/api/log-workout`. Consider removing the legacy
  routes once confirmed unused.

## Change Log
