@echo off
setlocal
title PURE LINE - Stop
echo ============================================
echo   PURE LINE - Stopping stack
echo ============================================
cd /d "%~dp0\.."

docker compose --profile tunnel down
if %errorlevel% neq 0 (
  echo   [ERROR] Failed to stop cleanly. Check 'docker ps'.
  pause
  exit /b 1
)
echo   [OK] All services (and the tunnel) stopped.
pause
