cd C:\Users\motas\PureLine\deployment
docker compose restart chatbot-backend *> C:\Users\motas\PureLine\backend_restart2.log
Start-Sleep -Seconds 10
docker logs deployment-chatbot-backend-1 --tail 40 *>> C:\Users\motas\PureLine\backend_restart2.log
