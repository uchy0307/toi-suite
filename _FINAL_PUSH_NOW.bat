@echo off
chcp 65001 > nul
cd /d "C:\Users\user\Documents\Claude\Projects\note 200本\toi-suite"

echo ========================================
echo  Window D Final Push (commit already made)
echo  HEAD = 93b2c775 (Pages 004-200 mode switch removal)
echo ========================================

echo.
echo === Step 1: Remove stale lock files ===
if exist .git\index.lock (
  attrib -r -h -s .git\index.lock 2>nul
  del /F /Q .git\index.lock
  echo Removed index.lock
)
if exist .git\foo.lock (
  attrib -r -h -s .git\foo.lock 2>nul
  del /F /Q .git\foo.lock
  echo Removed foo.lock
)
if exist .git\refs\heads\main.lock (
  attrib -r -h -s .git\refs\heads\main.lock 2>nul
  del /F /Q .git\refs\heads\main.lock
  echo Removed main.lock
)

echo.
echo === Step 2: Verify HEAD ===
git log --oneline -3

echo.
echo === Step 3: Push to origin/main ===
git push origin main

echo.
echo === DONE ===
pause
