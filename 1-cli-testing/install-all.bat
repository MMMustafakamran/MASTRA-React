@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"

echo ===================================================
echo  Installing dependencies in separate terminals...
echo ===================================================

if exist "%ROOT_DIR%npm\app" (
    if exist "%ROOT_DIR%.env" copy /y "%ROOT_DIR%.env" "%ROOT_DIR%npm\app\.env" >nul 2>&1
    echo [npm]  Opening terminal for npm install...
    start "npm install - mastra-starter" cmd /k "cd /d "%ROOT_DIR%npm\app" && echo === Running npm install in %ROOT_DIR%npm\app === && npm install"
)

if exist "%ROOT_DIR%pnpm\app" (
    if exist "%ROOT_DIR%.env" copy /y "%ROOT_DIR%.env" "%ROOT_DIR%pnpm\app\.env" >nul 2>&1
    echo [pnpm] Opening terminal for pnpm install...
    start "pnpm install - mastra-starter" cmd /k "cd /d "%ROOT_DIR%pnpm\app" && echo === Running pnpm install in %ROOT_DIR%pnpm\app === && pnpm install"
)

if exist "%ROOT_DIR%bun\app" (
    if exist "%ROOT_DIR%.env" copy /y "%ROOT_DIR%.env" "%ROOT_DIR%bun\app\.env" >nul 2>&1
    echo [bun]  Opening terminal for bun install...
    start "bun install - mastra-starter" cmd /k "cd /d "%ROOT_DIR%bun\app" && echo === Running bun install in %ROOT_DIR%bun\app === && bun install"
)

if exist "%ROOT_DIR%yarn\app" (
    if exist "%ROOT_DIR%.env" copy /y "%ROOT_DIR%.env" "%ROOT_DIR%yarn\app\.env" >nul 2>&1
    echo [yarn] Opening terminal for yarn install...
    start "yarn install - mastra-starter" cmd /k "cd /d "%ROOT_DIR%yarn\app" && echo === Running yarn install in %ROOT_DIR%yarn\app === && yarn install"
)

echo.
echo All installer terminals have been opened.
pause
