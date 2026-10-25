#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  SMARTBUS RESERVATION & FLEET MANAGEMENT SYSTEM"
echo "  100% PRD Baseline Compliance + Commercial SaaS"
echo "=========================================================="

# 1. Step: Run Automated Test Suite (TC-01 through TC-12)
echo ""
echo "[Step 1/4] Running automated pytest test suite verifying TC-01 to TC-12..."
export PYTHONPATH=backend
python -m pytest backend/tests/test_prd.py -v

echo ""
echo "[Step 2/4] Initializing / Seeding SQLite PRD baseline routes..."
python backend/seed_data.py

echo ""
echo "[Step 3/4] Launching FastAPI Backend on port 8000..."
nohup python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID on http://localhost:8000"

echo ""
echo "[Step 4/4] Starting React Frontend on port 3000..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build
echo "Serving frontend on http://localhost:3000"
npx serve -s dist -l 3000
