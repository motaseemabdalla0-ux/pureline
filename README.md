# PURE LINE (بيور لاين) — Agricultural Technology

Complete deliverable for **PURE LINE**, an Agricultural Technology company building intelligent,
sustainable farms powered by technology, data and innovation.

> Tagline: **Future Agriculture Starts Here** · **مستقبل الزراعة يبدأ من هنا**

## Project structure

The repo is split in two: `website/` is the **public static site** (deployed standalone to
Vercel — https://website-delta-three-30.vercel.app), and `app/` is the **full application**
(chatbot, backend, database, deployment stack) used for local/full-stack development. Only
`website/` is hosted publicly; nothing in `app/` is deployed to Vercel.

```
pureline/
├── website/            Vite + React 18 + TS + Tailwind + Framer Motion + i18n (EN/AR, RTL, dark mode)
│   ├── src/            components, sections, ui, pages (/chat, /admin), locales
│   ├── public/         favicon.svg, og-image.svg
│   ├── Dockerfile      multi-stage build -> nginx (used by app/deployment's full stack)
│   ├── vercel.json      SPA rewrites for the standalone Vercel deployment
│   ├── README.md  SEO.md
│   └── (deployed as-is to Vercel — this is the public site)
├── app/                 Full application — NOT publicly hosted, main dev focus
│   ├── branding/
│   │   ├── logo/               3 concepts x 6 SVG variants + LOGO_CONCEPTS.md
│   │   └── ai-image-prompts.md
│   ├── chatbot/
│   │   ├── frontend/           React + Vite + TS + Tailwind chat UI (PURE LINE AI)
│   │   ├── backend/            FastAPI /api/chat + /health (RAG + LLM)
│   │   └── README.md
│   ├── deployment/
│   │   ├── docker-compose.yml  website, chatbot-frontend, chatbot-backend, db, nginx (+cloudflared)
│   │   ├── nginx/nginx.conf    edge reverse proxy
│   │   ├── cloudflared/        tunnel config + guide
│   │   ├── scripts/            install.bat start.bat stop.bat update.bat
│   │   └── README.md           architecture diagram
│   ├── docs/
│   ├── scripts/                dev/ops PowerShell + SQL utility scripts
│   └── tunnel_url.txt          current public tunnel URL (local full-stack testing)
└── README.md          (this file)
```

## Quick start — local development
Website:
```bash
cd website
npm install
npm run dev        # http://localhost:5173
```
Chatbot (optional, two terminals):
```bash
cd app/chatbot/backend  && pip install -r requirements.txt && uvicorn main:app --port 8000
cd app/chatbot/frontend && npm install && npm run dev     # http://localhost:5174/chat/
```

## Quick start — full production (Windows 11)
```bat
cd app\deployment\scripts
install.bat     :: checks Docker + cloudflared, builds all images
start.bat       :: brings the stack up + Cloudflare Tunnel, prints URLs
```
Then edit `app\deployment\.env` (POSTGRES_PASSWORD, TUNNEL_TOKEN, optional LLM_API_KEY).

## Publishing the static website
The public site at `website/` deploys independently of `app/`. After making changes there:
```bash
cd website
npx vercel deploy --prod --yes
```
Or connect the Vercel project to this GitHub repo (Vercel dashboard → Settings → Git) so every
push to `master` touching `website/` auto-deploys.

## Routing map
| Path | Serves |
|---|---|
| `/` | Marketing website |
| `/chat` | PURE LINE AI assistant (chatbot frontend) |
| `/api` | Chatbot backend (FastAPI) |
| `/admin` | Admin stub (website route, reserved) |

- Local edge: `http://localhost:8080` · Public: `https://pureline.com` (via Cloudflare Tunnel).

## What's included
- **Bilingual, RTL-aware, dark-mode** one-page site: Hero, About, Services (6), animated Statistics,
  Why Choose Us (6), filterable Projects gallery, Smart Farming Technology, an **interactive Farm
  Management Platform dashboard mockup**, Contact (form + map), Footer. SEO meta + JSON-LD Organization.
- **Branding:** 3 vector logo concepts (18 SVGs), color palette, typography, AI image prompt library.
- **Chatbot:** branded UI + FastAPI backend, structured for a drop-in real LLM.
- **Deployment:** docker-compose stack, nginx reverse proxy, Cloudflare Tunnel, Windows automation scripts.

## Brand
Colors — Primary `#0F6B3A`, Secondary `#3CB371`, Accent gold `#D4AF37`.
Fonts — Inter (Latin) + Tajawal/Cairo (Arabic). Primary logo: Concept 1 "Growth + Technology".
