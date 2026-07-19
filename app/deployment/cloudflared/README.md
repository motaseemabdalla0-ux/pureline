# Cloudflare Tunnel — PURE LINE

Public HTTPS for the stack **without opening any inbound port** on the Windows host.
cloudflared makes an outbound connection to Cloudflare; Cloudflare terminates TLS and forwards
requests through the tunnel to the local edge nginx (`localhost:8080`).

## Two ways to run it

### A) Containerized with a token (DEFAULT — used by docker-compose)
1. Create the tunnel and copy its **token** (Cloudflare Zero Trust dashboard → Networks → Tunnels,
   or `cloudflared tunnel token pureline`).
2. Put it in `deployment/.env` as `TUNNEL_TOKEN=...`.
3. `docker compose --profile tunnel up -d` (this is what `scripts/start.bat` does).
   The `cloudflared` service routes public traffic to the `nginx` service.

### B) Native Windows service (uses `config.yml` in this folder)
```powershell
cloudflared tunnel login                 # opens browser, authorizes your Cloudflare account
cloudflared tunnel create pureline       # creates tunnel + credentials json (note the UUID)
# edit config.yml: set credentials-file path to the generated <UUID>.json
cloudflared tunnel route dns pureline pureline.com
cloudflared tunnel route dns pureline www.pureline.com
cloudflared tunnel run pureline          # test in foreground

# install as a Windows service so it starts on boot:
cloudflared service install
```

Either way, DNS (CNAME) records for `pureline.com` / `www.pureline.com` are created automatically
by `cloudflared tunnel route dns ...` (or in the dashboard) and point at the tunnel.

## Verify
- Local:  http://localhost:8080  (nginx → website)
- Public: https://pureline.com   (Cloudflare edge → tunnel → nginx)
