Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git add -A
git commit -m "Module 8: Asset Management - registry, maintenance records, status tracking"
git log --oneline -3
