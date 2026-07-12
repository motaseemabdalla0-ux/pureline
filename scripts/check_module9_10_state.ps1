cd C:\Users\motas\PureLine
git status --porcelain
Write-Output "--- WorkforcePage ---"
Test-Path website\src\pages\WorkforcePage.tsx
Write-Output "--- ReportingCenterPage ---"
Test-Path website\src\pages\ReportingCenterPage.tsx
