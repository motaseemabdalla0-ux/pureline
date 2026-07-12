Remove-Item C:\Users\motas\PureLine\.git\index.lock -ErrorAction SilentlyContinue
cd C:\Users\motas\PureLine
git add -A
git commit -m "Ops Platform checkpoint: backend (auth/farms/operations/pests/irrigation/assets/workforce models+API) + frontend Modules 1-3 (Platform Login, Nav/Hero CTA, Operations Dashboard, Farm Registry, Field Operations)"
git log --oneline -3
