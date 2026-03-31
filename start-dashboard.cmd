@echo off
setlocal
cd /d "%~dp0"
call corepack pnpm install
call corepack pnpm --filter @workspace/healthcare-dashboard dev
