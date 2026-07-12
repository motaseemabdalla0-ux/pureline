cd C:\Users\motas\PureLine
git checkout 6d78c3f -- chatbot/backend/main.py
git checkout 6d78c3f -- chatbot/backend/services/platform/farm_ops_routers.py
git diff 6d78c3f -- chatbot/backend/main.py chatbot/backend/services/platform/farm_ops_routers.py
Write-Output "DONE - empty diff above means exact match"
