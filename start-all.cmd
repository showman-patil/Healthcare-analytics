@echo off
setlocal
cd /d "%~dp0"
start "Health Insight API" cmd /k call "%~dp0start-api.cmd"
start "Health Insight Dashboard" cmd /k call "%~dp0start-dashboard.cmd"
