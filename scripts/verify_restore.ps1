cd C:\Users\motas\PureLine
git diff 6d78c3f -- chatbot/backend/main.py chatbot/backend/services/platform/farm_ops_routers.py
Write-Output "diff exit above should be empty if identical"
git status --porcelain -- chatbot/backend
