@echo off
setlocal
echo Starting CopilotKit Mastra Daily Automation...
cd /d "%~dp0"
node ci/automate.mjs %*
pause
