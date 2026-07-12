# Pure Line Services Platform

A full AgriTech services/farm-intelligence/customer-management platform layered on top of the
Pure Line marketing site, benchmarked against the UX/IA/workflow patterns of the RCU Agriculture
Platform (https://agriculture.rcu.gov.sa/). No RCU code, assets, imagery, branding, or copyrighted
content was copied — only general UX patterns (marketplace → request → dashboard → quotation →
GIS/NDVI monitoring → admin) were used as inspiration, reimplemented with Pure Line's own design
system, data, and copy.

## Architecture

- **Frontend**: React 18 + Vite + TypeScript (strict) + TailwindCSS + Framer Motion +
  react-i18next (EN/AR, RTL), extended from single-page to `react-router-dom` client-side routing.
- **Backend**: existing FastAPI service (`chatbot/backend`) extended with a `services/platform`
  package — SQLAlchemy models against the already-provisioned Postgres container, Pydantic
  schemas, HMAC-signed admin session tokens, and `reportlab`-based PDF generation.
- **Data reuse**: all NDVI/satellite modules reuse the existing real farm dataset
  (`website/src/data/ndvi-farms.json`, 6 farms with real GPS/polygon/36-month NDVI series) and the
  existing satellite/NDVI component library — no new mock geodata was introduced.

## Auth model (intentional scope decisions)

- **Admin**: single shared password (`ADMIN_PASSWORD` env var) + HMAC-SHA256 signed, 12-hour
  expiring token. Not a multi-user auth system — appropriate for a small internal admin team.
- **Customer portal**: no signup/login. Customers look up their requests by the email address used
  at submission time, similar to package-tracking UX. Simpler and lower-friction than a full
  account system for a B2B services intake flow.

## New routes

| Route | Module | Description |
|---|---|---|
| `/services` | 1 | Services Marketplace overview (12 services) |
| `/services/:slug` | 1 | Service detail (benefits, specs, deliverables, workflow, FAQ, Request button) |
| `/request-service` | 2 | Service Request Portal (customer/farm/service info, file upload, priority) |
| `/dashboard` | 3 | Customer Dashboard (email lookup, KPIs, status timelines, quotation links) |
| `/quotations/:quoteId` | 4 | Quotation detail (pricing breakdown, terms, PDF download) |
| `/ndvi-analytics` | 5 | NDVI Analytics Center (all farms, trends, comparison, stats) |
| `/satellite-intelligence` | 6 | Satellite Intelligence Center (GIS-style dashboard, real alerts) |
| `/farm-monitoring`, `/farm-monitoring/:farmId` | 7 | Farm Monitoring Center (inventory + detail) |
| `/farm-reports` | 8 | Farm Reports Center (NDVI/satellite/health/operational PDF downloads) |
| `/consultancy` | 9 | Agricultural Consultancy Portal (requests + lookup) |
| `/admin` | 10 | Administration Portal (KPIs, requests, quotations, customers, activity, farms) |

## Backend API (`/api/platform/*`)

Requests: `POST /requests`, `GET /requests/lookup?email=`, `GET /requests/{id}`,
`POST /requests/{id}/attachments`.
Quotations: `POST /quotations` (admin), `GET /quotations/{id}`, `GET /quotations/{id}/pdf`.
Consultations: `POST /consultations`, `GET /consultations/lookup?email=`.
Reports: `GET /reports/{type}/{farmId}/pdf` (stateless, farm stats passed as query params).
Admin: `POST /admin/login`, `GET /admin/requests`, `PATCH /admin/requests/{id}/status`,
`GET /admin/customers`, `GET /admin/kpis`, `GET /admin/activity`.

## Files changed/added

Backend: `chatbot/backend/services/platform/{__init__,database,models,schemas,auth,pdf,routers}.py`,
`chatbot/backend/main.py`, `chatbot/backend/requirements.txt`, `deployment/docker-compose.yml`.

Frontend: `website/src/types/platform.ts`, `website/src/lib/platformApi.ts`,
`website/src/data/services.ts`, `website/src/components/platform/*`,
`website/src/pages/{ServicesMarketplacePage,ServiceDetailPage,RequestServicePage,
CustomerDashboardPage,QuotationDetailPage,NdviAnalyticsPage,SatelliteIntelligencePage,
FarmMonitoringPage,FarmMonitoringDetailPage,FarmReportsPage,ConsultancyPage,AdminPage}.tsx`,
`website/src/main.tsx`, `website/src/components/Navbar.tsx`,
`website/src/components/sections/Services.tsx` (refactored to share `data/services.ts`),
`website/src/locales/{en,ar}.json`.

## Build & deploy verification (2026-07-12)

- `npm run build` (tsc -b && vite build): **passed**, 1987 modules, zero TS errors.
- `docker compose build chatbot-backend` and `website`: both **passed**, containers recreated.
- Route check via nginx (`http://localhost:8080`): all 12 platform routes + `/`, `/chat/`,
  `/api/health` return **200**.
- End-to-end API test: admin login → create request → KPI count increments → email lookup returns
  the request with its status timeline — verified against the real Postgres-backed API.
- Public tunnel verified reachable: `https://headers-public-round-consists.trycloudflare.com`
  (`/services` → 200, `/api/health` → 200).

## Known follow-ups

- Admin customer/activity tables use inline English strings for column headers (not yet localized
  into `en.json`/`ar.json`) — cosmetic gap only.
- Main JS bundle is ~638 kB (189 kB gzip) after adding 12 new routes; a follow-up pass could
  route-split with `React.lazy` if load time becomes a concern.
- The Cloudflare Quick Tunnel URL is ephemeral and rotates on restart; a watchdog scheduled task
  (`PureLineTunnelWatchdog`) auto-recovers it, but a paid Cloudflare named tunnel would give a
  permanent URL (tracked as an open item — needs the user's own Cloudflare account).
