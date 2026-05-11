@echo off
REM ============================================================
REM toi-suite 6軸分析システムを GitHub に push するスクリプト
REM Vercel が GitHub 連携済みなら自動デプロイされる
REM ============================================================
cd /d "%~dp0"

echo.
echo === git status ===
git status

echo.
echo === git add -A ===
git add -A

echo.
echo === git commit ===
git commit -m "feat: 6-axis analysis system (Gemini + Supabase + RadarChart)"

echo.
echo === git push origin main ===
git push origin main

echo.
echo Done. Vercel auto-deploy will start if connected.
pause
