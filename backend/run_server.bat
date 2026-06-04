@echo off
setlocal enabledelayedexpansion

REM Get the directory where this batch file is located
set BACKEND_DIR=%~dp0
set BACKEND_DIR=%BACKEND_DIR:~0,-1%

REM Change to backend directory
cd /d "%BACKEND_DIR%"

REM Set environment variables
set PYTHONPATH=%BACKEND_DIR%
set DJANGO_SETTINGS_MODULE=config.settings.dev
set PYTHONUNBUFFERED=1

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Show startup info
echo.
echo Starting Django Channels Server (Daphne)
echo =========================================
echo Backend Directory: %BACKEND_DIR%
echo Python: %PYTHON%
echo.

REM Run Daphne
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application

REM Handle errors
if errorlevel 1 (
    echo.
    echo Error running server. Make sure you're in the backend directory.
    pause
)

endlocal

