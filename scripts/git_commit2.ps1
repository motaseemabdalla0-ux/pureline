Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git add -A
git commit -m "Add Pure Line Services Platform: 10 modules (marketplace, requests, dashboard, quotations, NDVI/satellite/farm monitoring centers, consultancy, admin portal)"
git log --oneline -5
