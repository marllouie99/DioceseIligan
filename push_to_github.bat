@echo off
echo ========================================
echo Pushing changes to GitHub...
echo ========================================
cd /d "%~dp0"
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Changes pushed to GitHub
    echo Render will auto-deploy in 3-5 minutes
    echo ========================================
) else (
    echo.
    echo ========================================
    echo FAILED! Please use VS Code Source Control
    echo Press Ctrl+Shift+G in VS Code and click Push
    echo ========================================
)
echo.
pause
