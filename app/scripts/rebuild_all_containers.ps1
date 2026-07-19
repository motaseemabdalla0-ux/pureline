cd C:\Users\motas\PureLine\deployment
docker compose build chatbot-backend website *> C:\Users\motas\PureLine\final_deploy_build.log
docker compose up -d chatbot-backend website *>> C:\Users\motas\PureLine\final_deploy_build.log
Start-Sleep -Seconds 8
docker compose ps *>> C:\Users\motas\PureLine\final_deploy_build.log
