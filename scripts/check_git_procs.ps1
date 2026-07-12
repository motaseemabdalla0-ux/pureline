Get-Process -Name git,code -ErrorAction SilentlyContinue | Select-Object ProcessName,Id | Format-Table -AutoSize
Test-Path C:\Users\motas\PureLine\.git\index.lock
