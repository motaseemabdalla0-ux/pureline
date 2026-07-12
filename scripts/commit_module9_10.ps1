Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git add -A
git commit -m "Module 9: Workforce Management; Module 10: Reporting Center"
git log --oneline -3
