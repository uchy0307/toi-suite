@echo off
chcp 65001 > nul
cd /d "C:\Users\user\Documents\Claude\Projects\note 200本\toi-suite"

echo === Step 1: Fix broken git index ===
if exist .git\index (
  attrib -r -h -s .git\index 2>nul
  del /F /Q .git\index
)
git read-tree HEAD
if errorlevel 1 (
  echo [WARN] read-tree failed, trying reset...
  git reset
)

echo === Step 2: Show status ===
git status

echo === Step 3: Stage and commit ===
git add -A src/pages/Page004.jsx src/pages/Page005.jsx src/pages/Page006.jsx src/pages/Page007.jsx src/pages/Page008.jsx src/pages/Page009.jsx src/pages/Page010.jsx src/pages/Page011.jsx src/pages/Page012.jsx src/pages/Page013.jsx src/pages/Page014.jsx src/pages/Page015.jsx src/pages/Page016.jsx src/pages/Page017.jsx src/pages/Page018.jsx src/pages/Page019.jsx src/pages/Page020.jsx
git add -A src/pages/

git diff --cached --stat | findstr /C:"file"

git commit -m "fix(#004-#200): モード切替UI(深い/シンプル/詩的)を削除 - コンセプト不明確のため統一"
if errorlevel 1 (
  echo [INFO] No changes or commit failed
)

echo === Step 4: Push to origin ===
git push origin main

echo === DONE ===
pause
