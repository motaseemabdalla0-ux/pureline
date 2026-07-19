# PURE LINE AI — Chatbot

A branded agricultural assistant. Two parts:

- **`frontend/`** — React + Vite + TS + Tailwind chat UI (deep-green / gold theme). Bilingual EN/AR.
  Calls the backend at `POST /api/chat`. Served under `/chat/` in production.
- **`backend/`** — FastAPI service. `POST /api/chat` (currently rule-based placeholder) and `GET /health`.

## Run locally
Backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Frontend (proxies /api to the backend on :8000):
```bash
cd frontend
npm install
npm run dev        # http://localhost:5174/chat/
```

## Plugging in a real LLM
The backend ships with `rule_based_reply(...)` as a placeholder. To use a real model:
1. `pip install anthropic` (or `openai`) — already listed (commented) in `requirements.txt`.
2. Set an environment variable `LLM_API_KEY`.
3. In `backend/main.py`, uncomment the `llm_reply(...)` function and call it from the `/api/chat` route
   instead of `rule_based_reply(...)`. The system prompt is already defined (`SYSTEM_PROMPT`).

The frontend needs no changes — it already POSTs `{ message, lang }` and renders `data.reply`.

## Docker
Both parts have Dockerfiles and are wired into `../deployment/docker-compose.yml`
(services `chatbot-backend` and `chatbot-frontend`).
