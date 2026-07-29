@echo off
title Start Huomiantong

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing Electron runtime...
  set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
  call node node_modules\electron\install.js
  if errorlevel 1 (
    echo.
    echo Electron runtime installation failed.
    pause
    exit /b 1
  )
)

echo.
echo Starting Huomiantong...
echo Keep this black window open while using the app.
echo.

call npm run dev

echo.
echo Huomiantong exited.
pause
