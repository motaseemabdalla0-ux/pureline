Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git add -A
git status --porcelain | Measure-Object -Line
git commit -m "Resync git index with working tree after plumbing-commit index desync"
git log --oneline -3
