@echo off
REM #001 v2.0 push batch — カテゴリUI＋10ラリー実装
setlocal
set "PROJ=%~dp0"
set "LOG=%PROJ%_push_001_v2.log"
echo === START === > "%LOG%"
echo Time: %DATE% %TIME% >> "%LOG%"
echo CWD: %PROJ% >> "%LOG%"
cd /d "%PROJ%" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === cleanup stale lock/index from sandbox === >> "%LOG%"
if exist ".git\index.lock" del /f /q ".git\index.lock" >> "%LOG%" 2>&1
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock" >> "%LOG%" 2>&1
if exist ".git\refs\heads\main.lock" del /f /q ".git\refs\heads\main.lock" >> "%LOG%" 2>&1
if exist ".git\objects\pack\tmp_pack_*" del /f /q ".git\objects\pack\tmp_pack_*" >> "%LOG%" 2>&1
if exist ".git\objects\pack\tmp_idx_*" del /f /q ".git\objects\pack\tmp_idx_*" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git status before === >> "%LOG%"
git status --short >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git fetch + pull --rebase (avoid conflict with 窓A) === >> "%LOG%"
git fetch origin main >> "%LOG%" 2>&1
git pull --rebase origin main >> "%LOG%" 2>&1
echo pull-rebase exit: %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo === git add === >> "%LOG%"
git add src/pages/Page001.jsx >> "%LOG%" 2>&1
git status --short >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git commit === >> "%LOG%"
git commit -m "fix: #001 業種職種性格悩みのカテゴリ分け＋10回ラリー実装" >> "%LOG%" 2>&1
echo commit exit: %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo === git log --oneline -3 === >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git push origin main === >> "%LOG%"
git push origin main >> "%LOG%" 2>&1
echo push exit: %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo === final HEAD === >> "%LOG%"
git rev-parse HEAD >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === DONE === >> "%LOG%"
echo Time: %DATE% %TIME% >> "%LOG%"
endlocal
