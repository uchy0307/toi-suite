@echo off
setlocal
set "PROJ=%~dp0"
set "LOG=%PROJ%_git_push.log"
set "MSG=%PROJ%_commit_msg.txt"
echo === START === > "%LOG%"
echo CWD: %PROJ% >> "%LOG%"
cd /d "%PROJ%" >> "%LOG%" 2>&1
if exist ".git\index.lock" del /f /q ".git\index.lock" >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === git status --short === >> "%LOG%"
git status --short >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === git add === >> "%LOG%"
git add src/pages/Page001.jsx src/pages/Page002.jsx >> "%LOG%" 2>&1
echo add exit: %ERRORLEVEL% >> "%LOG%"
echo. >> "%LOG%"
echo === git commit -F msg === >> "%LOG%"
git commit -F "%MSG%" >> "%LOG%" 2>&1
echo commit exit: %ERRORLEVEL% >> "%LOG%"
echo. >> "%LOG%"
echo === git push origin main === >> "%LOG%"
git push origin main >> "%LOG%" 2>&1
echo push exit: %ERRORLEVEL% >> "%LOG%"
echo. >> "%LOG%"
echo === git log --oneline -3 === >> "%LOG%"
git log --oneline -3 >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === git rev-parse HEAD === >> "%LOG%"
git rev-parse HEAD >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === DONE === >> "%LOG%"
endlocal
