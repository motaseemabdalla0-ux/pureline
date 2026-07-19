# PURE LINE — Deployment

Full production stack for a **single Windows 11 machine** using Docker Desktop + Cloudflare Tunnel.

## Architecture
```
                       Internet (HTTPS)
                            │
                   ┌────────▼─────────┐
                   │  Cloudflare edge │  (TLS terminated here)
                   └────────┬─────────┘
                            │  outbound tunnel (cloudflared)
              ┌─────────────▼──────────────┐
              │   Windows 11 host (Docker)  │
              │                             │
              │   ┌───────── nginx ───────┐ │   reverse proxy (host :8080)
              │   │  /      -> website    │ │
              │   │  /chat  -> chat-front │ │
              │   │  /api   -> chat-back  │ │
              │   │  /admin -> website    │ │
              │   └───┬───────┬───────┬───┘ │
              │       │       │       │     │
              │   website  chat-fe  chat-be │
              │                        │    │
              │                       db    │  (postgres, future history/admin)
              └─────────────────────────────┘
```

## Services (docker-compose.yml)
| Service | Image | Role | Exposed |
|---|---|---|---|
| website | pureline/website | Vite/React marketing site (nginx) | internal :80 |
| chatbot-frontend | pureline/chatbot-frontend | React chat UI (nginx, /chat/) | internal :80 |
| chatbot-backend | pureline/chatbot-backend | FastAPI `/api/chat`, `/health` | internal :8000 |
| db | postgres:16 | database (future chat history / admin) | internal :5432 |
| nginx | nginx:1.27 | edge reverse proxy | host **:8080** |
| cloudflared | cloudflare/cloudflared | public HTTPS tunnel (profile `tunnel`) | — |

## Quick start (Windows)
```bat
cd deployment\scripts
install.bat     :: checks Docker + cloudflared, builds images
start.bat       :: docker compose up (+ tunnel), prints URLs
stop.bat        :: stops tunnel + stack
update.bat      :: pull latest, rebuild, restart
```

## Manual
```bash
cp .env.example .env         # set POSTGRES_PASSWORD, TUNNEL_TOKEN, (optional) LLM_API_KEY
docker compose build
docker compose --profile tunnel up -d
```

## URLs
- Local:  `http://localhost:8080`
- Public: `https://pureline.com` (once the Cloudflare Tunnel is configured — see `cloudflared/README.md`)

## Routing map
| Path | Goes to |
|---|---|
| `/` | website |
| `/chat` | chatbot-frontend |
| `/api` | chatbot-backend (FastAPI) |
| `/admin` | website (React Router stub page) |

## TLS
TLS is terminated at the Cloudflare edge; cloudflared forwards plain HTTP to nginx internally,
so no local certificates and no inbound firewall ports are required. See `nginx/nginx.conf` and
`cloudflared/README.md` for the alternative local-cert approach.
