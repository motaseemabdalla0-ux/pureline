# Pure Line Agricultural Operations Management Platform

A full farm-operations management platform layered on top of the Pure Line Services Platform,
benchmarked against the operational concepts, workflows, and dashboard UX of the RCU Agriculture
Platform (https://agriculture.rcu.gov.sa/). No RCU code, assets, branding, imagery, or text was
copied — only general operational patterns (a central ops dashboard, farm registry, field-task
scheduling, pest/IPM tracking, irrigation management, asset registry, workforce management,
reporting, and role-based portals) were used as UX/IA inspiration, reimplemented from scratch with
Pure Line's own design system, data, and copy.

## Architecture

- **Backend**: `chatbot/backend/services/platform/` extended with `models.py` additions
  (`PlatformUser`, `Operation`/`OperationLogEntry`, `PestType`/`PestDetection`/`TrapRecord`/
  `TreatmentRecord`, `IrrigationZone`/`IrrigationEvent`, `Asset`/`MaintenanceRecord`,
  `TaskAssignment`, plus an extended `Farm` registry), `platform_auth.py` (new multi-role login,
  separate from the existing single-password admin auth), `seed.py` (idempotent demo-data seeding),
  and `farm_ops_routers.py` (all new REST endpoints, mounted under `/api/platform`).
- **Frontend**: 15 new routed pages under `website/src/pages/`, a new `PlatformAuthContext` for
  session state, role-aware UI gating (`admin`/`staff` can create/mutate, `customer` is read-only),
  and a premium "Platform Login" CTA in the Navbar, mobile menu, and homepage Hero.
- **Data reuse**: the Farm Registry links to the existing real 6-farm NDVI/satellite dataset
  (`website/src/data/ndvi-farms.json`) via `farm_code` — the Postgres `farms` table holds only
  operational/registry fields (region, area, crop type, ownership); the 36-month NDVI time series
  intentionally stays in the frontend's static JSON rather than being duplicated into the database.

## Auth model

- **Platform login** (`/platform/login`): multi-role (`admin`/`staff`/`customer`), HMAC-signed
  24-hour session token, `POST /api/platform/auth/login`. Three seeded demo accounts (shown on the
  login page itself):
  - `admin` / `Pureline@2026` — full access, plus the 4 new tabs in the legacy `/admin` portal.
  - `agronomist1` / `Pureline@2026` — staff role (title "Field Agronomist"): can create/manage
    operations, pest detections, irrigation events, assets.
  - `customer1` / `Pureline@2026` — customer role: read-only across all `/platform/*` pages,
    blocked entirely from the staff-only Workforce page.
- This is intentionally a separate, parallel auth system from the pre-existing `/admin` single-
  shared-password portal (documented scope decision from the original Services Platform build) —
  the two were not merged. The `/admin` portal's 4 new tabs (Operations/Pests/Assets/Workforce)
  transparently obtain a cached platform-auth token behind the scenes using the seeded `admin`
  account so the existing admin can see ops data without a second manual login.

## New routes

| Route | Module |
|---|---|
| `/platform/login` | Platform Login |
| `/platform/dashboard` | Module 1 — Operations Management Center |
| `/platform/farms`, `/platform/farms/:farmCode` | Module 2 — Farm Registry |
| `/platform/operations`, `/platform/operations/:operationId` | Module 3 — Field Operations |
| `/platform/pests`, `/platform/pests/:detectionId` | Module 4 — Integrated Pest Management |
| `/ndvi-analytics?farm=`, `/satellite-intelligence?farm=` | Module 5+6 — cross-linked from farm pages |
| `/platform/irrigation` | Module 7 — Irrigation Management |
| `/platform/assets`, `/platform/assets/:assetCode` | Module 8 — Asset Management |
| `/platform/workforce` | Module 9 — Workforce Management (staff/admin only) |
| `/platform/reports` | Module 10 — Reporting Center |
| `/dashboard`, `/request-service` (existing) | Module 11 — Customer Portal (pre-existing, role-gated) |
| `/admin` (existing, +4 new tabs) | Module 12 — Administration Center |

## Backend API additions (`/api/platform/*`)

Auth: `POST /auth/login`, `GET /auth/me`.
Farms: `GET /farms`, `GET /farms/{farm_code}`.
Operations: `POST/GET /operations`, `GET /operations/{id}`, `PATCH /operations/{id}/status`,
`POST /operations/{id}/attachments`.
Pests: `GET/POST /pests/types`, `GET/POST /pests/detections`, `PATCH /pests/detections/{id}/status`,
`GET/POST /pests/traps`, `GET/POST /pests/treatments`, `GET /pests/dashboard`.
Irrigation: `GET/POST /irrigation/zones`, `GET/POST /irrigation/events`,
`PATCH /irrigation/events/{id}`, `GET /irrigation/dashboard`.
Assets: `GET/POST /assets`, `GET /assets/{code}`, `PATCH /assets/{code}/status`,
`GET/POST /assets/{code}/maintenance`.
Workforce: `GET /workforce/staff`, `GET /workforce/staff/{id}/assignments`,
`GET /workforce/performance`.
Dashboard: `GET /ops/dashboard`.

## Build, deploy & verification (2026-07-13)

- `npm run build` (`tsc -b && vite build`): passed clean, 2007 modules, zero TypeScript errors.
- `docker compose build chatbot-backend website` + `docker compose up -d`: both images rebuilt
  and containers recreated successfully.
- **Schema migration note**: the `farms` table pre-existed in Postgres from the earlier Services
  Platform build; SQLAlchemy's `create_all()` only creates missing *tables*, not missing *columns*
  on existing tables, so the new Farm Registry columns (`region`, `coordinates_lat`,
  `coordinates_lng`, `area_hectares`, `owner_name`) were silently missing after the first restart,
  causing the farm-registry seed to fail. Fixed with a one-time `ALTER TABLE farms ADD COLUMN ...`
  migration against the live database; confirmed the seed then completed successfully (6 farms,
  5 pest types, 3 demo users).
- All 21 checked routes (existing Services Platform pages + all new `/platform/*` pages) return
  HTTP 200 through nginx.
- End-to-end API test: admin login → farm registry list (6 real farms with region) → ops dashboard
  aggregate → pest types list — all verified against the live Postgres-backed API.
- Public tunnel verified reachable: `https://enhancement-comfort-elementary-reg.trycloudflare.com`
  (`/`, `/chat/`, `/api/health`, `/platform/login`, `/platform/dashboard`, `/platform/farms`,
  `/api/platform/farms` all → 200).

## Known follow-ups / scope notes

- Module 1's "map" is a stylized farm-card grid grouped by region rather than a real interactive
  map library (Leaflet/Mapbox) — this matches the rest of the site's existing visual language and
  avoids introducing a new heavy dependency for a single view; a real GIS map remains a reasonable
  future enhancement.
- The `ops/dashboard` endpoint intentionally omits NDVI/weather KPI figures (no weather data source
  exists); the frontend computes NDVI alert counts client-side from the real `ndvi-farms.json`
  series and simply does not render a weather widget rather than fabricate one.
- The public Cloudflare Quick Tunnel URL is ephemeral and rotates on restart; the existing
  `PureLineTunnelWatchdog` scheduled task auto-recovers it every 5 minutes. During this session the
  Cloudflare quick-tunnel provisioning endpoint was intermittently slow/timing out (unrelated to
  the Pure Line stack itself) — recovered on retry each time.
