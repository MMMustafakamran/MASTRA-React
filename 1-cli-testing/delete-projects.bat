@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"
set "FOLDERS=bun npm pnpm yarn"

echo ================================================================
echo   CLEANUP: Deleting Generated Projects and Test Artifacts
echo ================================================================
echo Target root: %ROOT_DIR%
echo Folders:     bun, npm, pnpm, yarn
echo.

set "TOTAL_FOLDERS=4"
set "CURRENT_INDEX=0"
set "TOTAL_DELETED_DIRS=0"
set "TOTAL_DELETED_FILES=0"

for %%F in (%FOLDERS%) do (
    set /a CURRENT_INDEX+=1
    set "TARGET_DIR=%ROOT_DIR%%%F"
    set "FOLDER_DIR_COUNT=0"
    set "FOLDER_FILE_COUNT=0"
    
    echo ----------------------------------------------------------------
    echo [!CURRENT_INDEX!/%TOTAL_FOLDERS%] Inspecting: %%F
    echo ----------------------------------------------------------------
    
    if exist "!TARGET_DIR!" (
        :: Check and delete subdirectories
        for /d %%D in ("!TARGET_DIR!\*") do (
            set /a FOLDER_DIR_COUNT+=1
            set /a TOTAL_DELETED_DIRS+=1
            echo   [-] Removing folder: %%~nxD...
            rd /s /q "%%D" 2>nul
            if not exist "%%D" (
                echo       [DONE] Deleted folder %%~nxD
            ) else (
                echo       [WARN] Could not completely remove %%~nxD - files may be locked
            )
        )
        
        :: Check and delete files (skip README.md)
        for %%I in ("!TARGET_DIR!\*") do (
            if /i not "%%~nxI"=="README.md" (
                set /a FOLDER_FILE_COUNT+=1
                set /a TOTAL_DELETED_FILES+=1
                echo   [-] Removing file:   %%~nxI...
                del /f /q /a "%%I" 2>nul
                if not exist "%%I" (
                    echo       [DONE] Deleted file %%~nxI
                ) else (
                    echo       [WARN] Could not remove %%~nxI
                )
            )
        )
        
        set /a SUB_TOTAL=!FOLDER_DIR_COUNT!+!FOLDER_FILE_COUNT!
        if !SUB_TOTAL! EQU 0 (
            echo   [OK] %%F is already clean - only README.md present
        ) else (
            echo   [OK] Cleaned %%F - !FOLDER_DIR_COUNT! directories and !FOLDER_FILE_COUNT! files removed
        )
    ) else (
        echo   [SKIP] Directory %%F not found.
    )
    echo.
)

echo ================================================================
echo   CLEANUP COMPLETE
echo ================================================================
echo   Total directories deleted : !TOTAL_DELETED_DIRS!
echo   Total files deleted       : !TOTAL_DELETED_FILES!
echo ================================================================
echo.
pause


