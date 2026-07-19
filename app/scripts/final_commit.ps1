Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git status --porcelain
git add -A
git commit -m "Final: Ops Platform docs, deployment/verification scripts, tunnel_url refresh"
git log --oneline -8
