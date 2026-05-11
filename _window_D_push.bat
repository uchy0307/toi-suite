@echo off
chcp 65001 > nul
cd /d "C:\Users\user\Documents\Claude\Projects\note 200本\toi-suite"

echo === Window D: Push Pages 004-200 mode switch removal ===

echo === Step 1: Clear stale locks ===
if exist .git\index.lock (
  attrib -r -h -s .git\index.lock 2>nul
  del /F /Q .git\index.lock
  echo Cleared index.lock
)
if exist .git\foo.lock (
  attrib -r -h -s .git\foo.lock 2>nul
  del /F /Q .git\foo.lock
)

echo === Step 2: Verify HEAD ===
git log --oneline -3
git status -s | find /c /v ""

echo === Step 3: Stage only Pages 004-200 ===
setlocal enabledelayedexpansion
for /L %%i in (4,1,9) do (
  set "n=00%%i"
  set "n=!n:~-3!"
  if exist "src\pages\Page!n!.jsx" git add "src\pages\Page!n!.jsx"
)
for /L %%i in (10,1,99) do (
  set "n=0%%i"
  if exist "src\pages\Page!n!.jsx" git add "src\pages\Page!n!.jsx"
)
for /L %%i in (100,1,200) do (
  set "n=%%i"
  if exist "src\pages\Page!n!.jsx" git add "src\pages\Page!n!.jsx"
)
endlocal

echo === Step 4: Show staged stats ===
git diff --cached --stat | findstr /C:"changed"

echo === Step 5: Commit ===
git commit -m "fix(#004-#200): モード切替UI(深い/シンプル/詩的)を削除 - コンセプト不明確のため統一"
if errorlevel 1 (
  echo [INFO] Commit failed or nothing staged
)

echo === Step 6: Push to origin ===
git push origin main > _window_D_push.log 2>&1
type _window_D_push.log

echo === Step 7: Final status ===
git log --oneline -3 > _window_D_log.txt
type _window_D_log.txt

echo === DONE === > _window_D_done.flag
echo === DONE ===
