cd C:\Users\motas\PureLine\deployment
docker compose build website *> C:\Users\motas\PureLine\website_image_build.log
docker compose up -d website *>> C:\Users\motas\PureLine\website_image_build.log
Start-Sleep -Seconds 5
docker compose ps *>> C:\Users\motas\PureLine\website_image_build.log
