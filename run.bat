@echo off
title SmartBus Fleet & Ticket Reservation System
echo ==========================================================
echo   SMARTBUS RESERVATION ^& FLEET MANAGEMENT SYSTEM
echo   100%% PRD Baseline Compliance + Commercial SaaS
echo ==========================================================

echo.
echo [Step 1/4] Running automated pytest test suite verifying TC-01 to TC-12...
set PYTHONPATH=backend
python -m pytest backend/tests/test_prd.py -v
if %ERRORLEVEL% NEQ 0 (
    echo Pytest suite failed! Aborting startup.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 2/4] Initializing / Seeding SQLite PRD baseline routes...
python backend/seed_data.py

echo.
echo [Step 3/4] Launching FastAPI Backend on port 8000 in background...
start "SmartBus Backend (FastAPI)" cmd /c "set PYTHONPATH=backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [Step 4/4] Launching React Frontend on port 3000...
cd frontend
cmd /c "npm run dev"
