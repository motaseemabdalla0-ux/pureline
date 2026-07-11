# PURE LINE (بيور لاين) — Agricultural Technology

Complete deliverable for **PURE LINE**, an Agricultural Technology company building intelligent,
sustainable farms powered by technology, data and innovation.

> Tagline: **Future Agriculture Starts Here** · **مستقبل الزراعة يبدأ من هنا**

## Project structure
```
pureline/
├── website/            Vite + React 18 + TS + Tailwind + Framer Motion + i18n (EN/AR, RTL, dark mode)
│   ├── src/            components, sections, ui, pages (/chat, /admin), locales
│   ├── public/         favicon.svg, og-image.svg
│   ├── Dockerfile      multi-stage build -> nginx
│   ├── README.md  SEO.md
├── branding/
│   ├── logo/           3 concepts x 6 SVG variants + LOGO_CONCEPTS.md
│   └── ai-image-prompts.md   10 photo prompts + 5 satellite + 5 UI mockup prompts
├── chatbot/
│   ├── frontend/       React + Vite + TS + Tailwind chat UI (PURE LINE AI)
│   ├── backend/        FastAPI /api/chat + /health (rule-based stub, LLM-ready)
│   └── README.md
├── deployment/
│   ├── docker-compose.yml     website, chatbot-frontend, chatbot-backend, db, nginx (+cloudflared)
│   ├── nginx/nginx.conf        edge reverse proxy
│   ├── cloudflared/            tunnel config + guide
│   ├── scripts/                install.bat start.bat stop.bat update.bat
│   └── README.md               architecture diagram
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
cd chatbot/backend  && pip install -r requirements.txt && uvicorn main:app --port 8000
cd chatbot/frontend && npm install && npm run dev     # http://localhost:5174/chat/
```

## Quick start — full production (Windows 11)
```bat
cd deployment\scripts
install.bat     :: checks Docker + cloudflared, builds all images
start.bat       :: brings the stack up + Cloudflare Tunnel, prints URLs
```
Then edit `deployment\.env` (POSTGRES_PASSWORD, TUNNEL_TOKEN, optional LLM_API_KEY).

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
