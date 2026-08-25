@echo off
setlocal
echo Starting CopilotKit Mastra Daily Automation...
cd /d "%~dp0"
node scripts/automate.mjs %*
pause
