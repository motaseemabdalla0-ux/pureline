cd C:\Users\motas\PureLine\deployment
docker compose up -d chatbot-backend db *> C:\Users\motas\PureLine\backend_restart.log
Start-Sleep -Seconds 5
docker compose ps *>> C:\Users\motas\PureLine\backend_restart.log
