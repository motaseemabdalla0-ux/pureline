cd C:\Users\motas\PureLine
git show --stat HEAD
Write-Output "--- main.py diff ---"
git diff HEAD~1 HEAD -- chatbot/backend/main.py
Write-Output "--- farm_ops_routers.py diff stat ---"
git diff HEAD~1 HEAD --stat -- chatbot/backend/services/platform/farm_ops_routers.py
