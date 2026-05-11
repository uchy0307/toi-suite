@echo off
REM Page000 + QuickAnalyze 修復 push
setlocal
cd /d "%~dp0"

if exist ".git\index.lock" del /f /q ".git\index.lock"

git add src/pages/Page000.jsx
git add src/QuickAnalyze.jsx
git commit -m "fix(page000+quickanalyze): add memo export, simplify refresh, broaden v1/v2 history regex"
git push origin main

echo.
echo === push exit: %ERRORLEVEL% ===
echo Vercel auto-deploy will start in ~30s.
endlocal
pause
