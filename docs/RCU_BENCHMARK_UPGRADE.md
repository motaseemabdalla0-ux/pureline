# Pure Line — RCU Benchmark Upgrade Implementation Report

**Date:** 2026-07-13 · **Commit:** `43e2f5c` · **Deployed:** local Docker stack + Cloudflare tunnel

## 1. Benchmark analysis

The RCU Agriculture Platform (https://agriculture.rcu.gov.sa/) was used purely as a **capability
benchmark**. No RCU code, assets, text, imagery, or branding was copied at any point — only the
capability checklist below was used, implemented from scratch with Pure Line's own design system,
copy, and architecture. Sources for the benchmark: the platform's public farm-data API
(`/ndvi-data/farms_data.json`, already the source of Pure Line's real 6-farm NDVI dataset), public
RCU e-services documentation (agricultural records, service requests), and the detailed capability
catalog recorded in `docs/SERVICES_PLATFORM.md` / `docs/OPERATIONS_PLATFORM.md` from earlier
benchmarking sessions. A live walkthrough via the Chrome extension was planned but the extension
was not connected; the user approved proceeding on the above sources.

Benchmark capability areas: central operations dashboard, farm registry with GIS,
interactive map viewer with field boundaries, NDVI analytics with time series, satellite imagery
intelligence, integrated pest management, irrigation management, field operations scheduling,
asset & workforce management, user/role administration, reporting/PDF outputs, service
requests → quotations workflow, consultancy services, and an administration portal.

## 2. Gap audit result

Already at or above benchmark before this session (from prior module work): Services Marketplace,
Service Requests, Customer Dashboard, Quotations (+PDF), NDVI Analytics Center, Satellite
Intelligence Center, Farm Monitoring, Farm Reports (PDF), Consultancy Portal, Admin Portal,
Platform multi-role login, Operations Dashboard, Farm Registry, Field Operations, IPM, Irrigation,
Assets, Workforce, Reporting Center.

Confirmed gaps vs the benchmark, all closed in this session:

| Gap | Resolution |
|---|---|
| No real interactive GIS map (stylized card grids only) | Leaflet-based GIS layer across 5 pages |
| No user management (accounts fixed at 3 seeded users) | Full admin User Management module (UI + API) |
| No weather intelligence on dashboards | Live Open-Meteo agro-weather widgets incl. ET₀ |
| No account activation/deactivation enforcement | `is_active` column + auth enforcement |

## 3. What was built

### 3.1 Interactive GIS layer (new)

- Dependencies: `leaflet@1.9.4`, `react-leaflet@4.2.1` (code-split into its own lazy chunk —
  46.9 kB gzip, loaded only on map pages).
- `src/lib/gisData.ts` — joins the real per-farm boundary polygons + GPS centroids
  (`real_farm_data.json`, originally from the RCU portal's public API) with the latest real NDVI
  readings (`ndvi-farms.json`) into map-ready records.
- `src/components/gis/FarmGisMap.tsx` — reusable map: Esri World Imagery / OpenStreetMap base-layer
  switcher, real field-boundary polygons colored by the shared NDVI color scale, focus/dim mode for
  single-farm views, popups with live NDVI + 12-month trend + cross-module links (farm profile /
  NDVI analytics / satellite intelligence), NDVI legend overlay, RTL-safe (map itself pinned LTR,
  popups follow app language).
- `src/components/gis/LazyFarmGisMap.tsx` — Suspense wrapper so Leaflet never loads on non-map pages.
- Embedded in: **Farm Registry** (new grid/map view toggle), **Farm Registry detail** (focused
  boundary map), **Operations Dashboard** (live GIS overview), **NDVI Analytics** (NDVI field map
  following the selected farm), **Irrigation Management** (irrigated-farms map).

### 3.2 Live agro-weather (new)

- `src/components/gis/WeatherWidget.tsx` — Open-Meteo (free, keyless, fetched client-side per farm
  centroid, cached per coordinate): temperature, humidity, wind, rain probability, and **FAO
  reference evapotranspiration (ET₀)** — the figure irrigation planning actually needs.
- Shown on the Operations Dashboard, Irrigation Management, and each farm's registry detail page.

### 3.3 User Management module (new)

- Backend (`/api/platform/users`, admin-only): list with role/search filters, create (role,
  contact info, PBKDF2-hashed password ≥8 chars, duplicate-username guard), patch (role change,
  contact/profile edits, activate/deactivate, password reset). Self-protection rules: an admin
  cannot deactivate their own account or remove their own admin role.
- `PlatformUser.is_active` column added; login and every token validation now reject deactivated
  accounts. Migration applied to the live DB (`ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS
  is_active BOOLEAN NOT NULL DEFAULT TRUE`) — required because `create_all()` doesn't add columns
  to existing tables (same pitfall documented in the Module 1–12 build).
- Frontend `/platform/users` (admin-gated in nav; route behind platform login): KPI row
  (total/admins/staff/customers/deactivated), search + role filter, create form, inline role
  switcher, activate/deactivate toggle, inline password reset. Full EN/AR.

### 3.4 Navigation & i18n

- "User Management" added to desktop + mobile platform nav (visible to admins only).
- New EN/AR locale groups: `gisMap.*`, `weather.*`, `userManagement.*`, `navPlatform.users`.

## 4. Incidents found & fixed during the session

Seven frontend files in the working tree were **truncated mid-token before this session**
(`AdminPage.tsx` down to 487 of 839 lines, plus `Navbar.tsx`, `platformApi.ts`, `en.json`,
`ar.json`, `main.tsx`, `types/platform.ts`) — apparently left over from a previous crashed
session. All were restored from git HEAD before new work was layered on, and the same
truncation-on-edit failure mode was avoided for the rest of the session by applying edits through
scripted whole-file writes. Everything is now committed intact.

## 5. Verification (all passed, 2026-07-13)

- `npm run build` (`tsc -b && vite build`): clean, 2,056 modules, zero TypeScript errors; Leaflet
  correctly split into a lazy `FarmGisMap` chunk.
- `docker compose build website chatbot-backend` + `up -d`: both images rebuilt, containers
  recreated; DB migration applied; backend restarted with a clean seed pass.
- End-to-end API test against the live stack: admin login → list users (3 seeded) → create smoke
  user → deactivate → **deactivated login correctly rejected**.
- Routes via nginx (`localhost:8080`): `/`, `/platform/login`, `/platform/dashboard`,
  `/platform/farms`, `/platform/users`, `/ndvi-analytics`, `/platform/irrigation`, `/services`,
  `/chat/` — all HTTP 200.
- Public tunnel serving the new build: https://enhancement-comfort-elementary-reg.trycloudflare.com
  (URL is ephemeral; the `PureLineTunnelWatchdog` task refreshes `tunnel_url.txt`).

Verification script kept at `scripts/verify_gis_users.ps1`.

## 6. Known follow-ups

- Irrigation zones are not yet drawable as sub-farm polygons on the map (zones carry no geometry
  in the DB); adding a `geometry` JSON column + Leaflet-draw editing is the natural next step.
- Weather is fetched client-side; a backend cache would remove the per-visitor API calls.
- Chrome-extension walkthrough of the logged-in RCU portal remains available as a future pass to
  spot any capability not visible from public sources.
