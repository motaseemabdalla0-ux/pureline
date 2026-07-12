cd C:\Users\motas\PureLine
git show 6d78c3f:chatbot/backend/main.py | Out-File -FilePath chatbot/backend/main.py -Encoding utf8
git show 6d78c3f:chatbot/backend/services/platform/farm_ops_routers.py | Out-File -FilePath chatbot/backend/services/platform/farm_ops_routers.py -Encoding utf8
Write-Output "--- main.py tail ---"
Get-Content chatbot/backend/main.py -Tail 12
Write-Output "--- farm_ops_routers.py line count ---"
(Get-Content chatbot/backend/services/platform/farm_ops_routers.py | Measure-Object -Line).Lines
