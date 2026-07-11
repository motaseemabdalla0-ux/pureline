@echo off
setlocal
title PURE LINE - Start
echo ============================================
echo   PURE LINE - Starting stack
echo ============================================
cd /d "%~dp0\.."

docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo   [ERROR] Docker Desktop is not running. Start it and retry.
  pause
  exit /b 1
)

echo Starting services (including Cloudflare Tunnel profile)...
docker compose --profile tunnel up -d
if %errorlevel% neq 0 (
  echo   [ERROR] Failed to start the stack.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   PURE LINE is running.
echo   Local:   http://localhost:8080
echo   Public:  https://pureline.com  (if Cloudflare Tunnel is configured)
echo.
echo   Routes:  /  website   /chat  assistant   /api  backend   /admin  stub
echo ============================================
echo.
echo Tip: if the tunnel container is restarting, set TUNNEL_TOKEN in .env.
pause
