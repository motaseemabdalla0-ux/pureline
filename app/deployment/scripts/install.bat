@echo off
setlocal
title PURE LINE - Install
echo ============================================
echo   PURE LINE - Installation
echo ============================================
echo.

cd /d "%~dp0\.."

echo [1/4] Checking Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
  echo   [ERROR] Docker is not installed or not running.
  echo   Install Docker Desktop: https://www.docker.com/products/docker-desktop/
  echo   Then start Docker Desktop and re-run this script.
  pause
  exit /b 1
)
echo   [OK] Docker found.

echo.
echo [2/4] Checking Docker Compose...
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
  echo   [ERROR] 'docker compose' not available. Update Docker Desktop.
  pause
  exit /b 1
)
echo   [OK] Docker Compose found.

echo.
echo [3/4] Checking cloudflared (for public HTTPS - optional)...
cloudflared --version >nul 2>&1
if %errorlevel% neq 0 (
  echo   [WARN] cloudflared not found. Public tunnel will run via the docker
  echo          'cloudflared' service instead ^(needs TUNNEL_TOKEN in .env^).
  echo          To install natively: winget install --id Cloudflare.cloudflared
) else (
  echo   [OK] cloudflared found.
)

echo.
echo [4/4] Preparing config and building images...
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo   Created .env from .env.example - please edit it and set your secrets.
)
docker compose build
if %errorlevel% neq 0 (
  echo   [ERROR] Build failed. See output above.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Install complete. Edit deployment\.env, then run start.bat
echo ============================================
pause
