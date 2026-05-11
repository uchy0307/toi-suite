@echo off
setlocal
set "PROJ=%~dp0"
set "LOG=%PROJ%_git_fix_push.log"
set "MSG=%PROJ%_commit_msg.txt"
echo === START === > "%LOG%"
echo CWD: %PROJ% >> "%LOG%"
cd /d "%PROJ%" >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === remove corrupt index + lock === >> "%LOG%"
if exist ".git\index.lock" del /f /q ".git\index.lock" >> "%LOG%" 2>&1
if exist ".git\index" del /f /q ".git\index" >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === git read-tree HEAD (rebuild index) === >> "%LOG%"
git read-tree HEAD >> "%LOG%" 2>&1
echo read-tree exit: %ERRORLEVEL% >> "%LOG%"
echo. >> "%LOG%"
echo === git status --short === >> "%LOG%"
git status --short >> "%LOG%" 2>&1
echo. >> "%LOG%"
echo === git add Page003 === >> "%LOG%"
git add src/pages/Page003.jsx >> "%LOG%" 2>&1
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
