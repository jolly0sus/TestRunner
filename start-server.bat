@echo off
cd /d "%~dp0"
echo Starting TestRunner local server...
node serve.cjs
echo.
echo Server stopped or failed to start (see any error above).
pause
