@echo off
title Integration Basics - Start

echo Starting Python service (port 5001)...
start "Python Service" cmd /k "cd /d %~dp0python-service && python app.py"

timeout /t 2 /nobreak >nul

echo Starting Node.js gateway (port 3000)...
start "Node.js Gateway" cmd /k "cd /d %~dp0nodejs-service && node server.js"

timeout /t 2 /nobreak >nul

echo Opening calculator in browser...
start http://localhost:3000

echo.
echo Both services are running.
echo   http://localhost:3000
echo.
echo Run stop.bat to shut everything down.
pause
