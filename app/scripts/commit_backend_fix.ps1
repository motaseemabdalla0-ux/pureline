Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git add chatbot/backend/main.py chatbot/backend/services/platform/farm_ops_routers.py
git commit -m "Fix: restore main.py (/api/chat, /api/kb/status endpoints) and farm_ops_routers.py accidentally truncated by previous agent's commit 3568e16"
git log --oneline -3
