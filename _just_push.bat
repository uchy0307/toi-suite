@echo off
REM 窓C #003 push-only batch (commit 1de8a56 already created via fast-import)
setlocal
set "PROJ=%~dp0"
set "LOG=%PROJ%_just_push.log"
echo === START === > "%LOG%"
echo CWD: %PROJ% >> "%LOG%"
cd /d "%PROJ%" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === cleanup stale lock/index from sandbox === >> "%LOG%"
if exist ".git\index.lock" del /f /q ".git\index.lock" >> "%LOG%" 2>&1
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock" >> "%LOG%" 2>&1
if exist ".git\objects\pack\test_pack" del /f /q ".git\objects\pack\test_pack" >> "%LOG%" 2>&1
if exist ".git\objects\pack\tmp_pack_*" del /f /q ".git\objects\pack\tmp_pack_*" >> "%LOG%" 2>&1
if exist ".git\objects\pack\tmp_idx_*" del /f /q ".git\objects\pack\tmp_idx_*" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git status before push === >> "%LOG%"
git status --short >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git log --oneline -3 === >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git push origin main === >> "%LOG%"
git push origin main >> "%LOG%" 2>&1
echo push exit: %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo === git rev-parse HEAD === >> "%LOG%"
git rev-parse HEAD >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === DONE === >> "%LOG%"
endlocal
