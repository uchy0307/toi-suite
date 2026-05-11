@echo off
REM #001 redo push batch - 階層カテゴリ＋10ラリー (sandboxで作成済 commit ec84352 を push)
REM このバッチは sandbox 側で
REM   1) Page001.jsx 書き直し済 (58830 bytes / 1241 lines)
REM   2) git fast-import で objects/pack/pack-3ac4abc...(.pack/.idx/.keep) を作成済
REM   3) refs/heads/main を ec84352 に書き換え済
REM   を前提に、Windows 側で残りロックの cleanup と push のみ行う。
setlocal
set "PROJ=%~dp0"
set "LOG=%PROJ%_push_001_redo.log"
echo === START === > "%LOG%"
echo Time: %DATE% %TIME% >> "%LOG%"
echo CWD: %PROJ% >> "%LOG%"
cd /d "%PROJ%" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === cleanup leftover locks/tmp files === >> "%LOG%"
if exist ".git\index.lock" del /f /q ".git\index.lock" >> "%LOG%" 2>&1
if exist ".git\HEAD.lock" del /f /q ".git\HEAD.lock" >> "%LOG%" 2>&1
if exist ".git\refs\heads\main.lock" del /f /q ".git\refs\heads\main.lock" >> "%LOG%" 2>&1
if exist ".git\foo.lock" del /f /q ".git\foo.lock" >> "%LOG%" 2>&1
del /f /q ".git\objects\pack\tmp_pack_*" >> "%LOG%" 2>&1
del /f /q ".git\objects\pack\tmp_idx_*" >> "%LOG%" 2>&1
del /f /q ".git\objects\pack\test.txt" >> "%LOG%" 2>&1
del /f /q ".git\objects\35\tmp_obj_*" >> "%LOG%" 2>&1
del /f /q ".git\objects\tmp_obj_*" >> "%LOG%" 2>&1
del /f /q ".git\objects\test_obj" >> "%LOG%" 2>&1
del /f /q ".git\objects\test_write" >> "%LOG%" 2>&1
del /f /q ".git\objects\testfile_5" >> "%LOG%" 2>&1
del /f /q ".git\testfile" >> "%LOG%" 2>&1
del /f /q ".git\test_write" >> "%LOG%" 2>&1
if exist ".git\objects\pack\multi-pack-index" del /f /q ".git\objects\pack\multi-pack-index" >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === verify HEAD/main === >> "%LOG%"
type ".git\refs\heads\main" >> "%LOG%" 2>&1
echo. >> "%LOG%"
git -c core.multiPackIndex=false log --oneline -3 >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === rebuild index from HEAD === >> "%LOG%"
git -c core.multiPackIndex=false read-tree HEAD >> "%LOG%" 2>&1
echo read-tree exit: %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo === git status (post read-tree) === >> "%LOG%"
git -c core.multiPackIndex=false status --short >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === git push origin main === >> "%LOG%"
git -c core.multiPackIndex=false push origin main >> "%LOG%" 2>&1
echo push exit: %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo === final HEAD === >> "%LOG%"
git -c core.multiPackIndex=false rev-parse HEAD >> "%LOG%" 2>&1

echo. >> "%LOG%"
echo === DONE === >> "%LOG%"
echo Time: %DATE% %TIME% >> "%LOG%"
endlocal
