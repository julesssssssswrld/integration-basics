@echo off
title Integration Basics - Stop

echo Stopping Python service on port 5001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping Node.js gateway on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Services stopped.
pause
