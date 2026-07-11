@echo off
setlocal
title PURE LINE - Update
echo ============================================
echo   PURE LINE - Update / Redeploy
echo ============================================
cd /d "%~dp0\.."

echo [1/3] Pulling latest source (if this is a git checkout)...
git rev-parse --is-inside-work-tree >nul 2>&1
if %errorlevel% equ 0 (
  git pull
  if %errorlevel% neq 0 echo   [WARN] git pull failed - continue with local files.
) else (
  echo   [INFO] Not a git repo - update files manually, then continue.
)

echo.
echo [2/3] Rebuilding images...
docker compose build
if %errorlevel% neq 0 (
  echo   [ERROR] Build failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Restarting with minimal downtime...
REM Recreates only changed containers; old ones keep serving until swap.
docker compose --profile tunnel up -d
if %errorlevel% neq 0 (
  echo   [ERROR] Restart failed.
  pause
  exit /b 1
)
echo   [OK] Update complete.
pause
