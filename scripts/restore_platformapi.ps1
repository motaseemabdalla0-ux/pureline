cd C:\Users\motas\PureLine
git status --porcelain website/src/lib/platformApi.ts
git diff --stat HEAD -- website/src/lib/platformApi.ts
git checkout HEAD -- website/src/lib/platformApi.ts
Write-Output "restored"
Get-Item website/src/lib/platformApi.ts | Select-Object Length
