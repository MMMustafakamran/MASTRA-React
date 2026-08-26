@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"

echo ===================================================
echo  Starting dev servers in separate terminals...
echo ===================================================

if exist "%ROOT_DIR%npm\app" (
    echo [npm]  Opening terminal for npm dev...
    start "npm dev - mastra-starter" cmd /k "cd /d "%ROOT_DIR%npm\app" && echo === Starting npm run dev in %ROOT_DIR%npm\app === && npm run dev"
)

if exist "%ROOT_DIR%pnpm\app" (
    echo [pnpm] Opening terminal for pnpm dev...
    start "pnpm dev - mastra-starter" cmd /k "cd /d "%ROOT_DIR%pnpm\app" && echo === Starting pnpm run dev in %ROOT_DIR%pnpm\app === && pnpm run dev"
)

if exist "%ROOT_DIR%bun\app" (
    echo [bun]  Opening terminal for bun dev...
    start "bun dev - mastra-starter" cmd /k "cd /d "%ROOT_DIR%bun\app" && echo === Starting bun run dev in %ROOT_DIR%bun\app === && bun run dev"
)

if exist "%ROOT_DIR%yarn\app" (
    echo [yarn] Opening terminal for yarn dev...
    start "yarn dev - mastra-starter" cmd /k "cd /d "%ROOT_DIR%yarn\app" && echo === Starting yarn run dev in %ROOT_DIR%yarn\app === && yarn run dev"
)

echo.
echo All dev server terminals have been opened.
pause
