# SmartBus Fleet OS — Commercial Bus Fleet & Ticket Reservation System

[![PRD Compliance](https://img.shields.io/badge/PRD%20Baseline-100%25%20Compliance-gold?style=for-the-badge)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLite ACID](https://img.shields.io/badge/SQLite-ACID%20Relational-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![React 18](https://img.shields.io/badge/React%2018-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Luxury%20Dark-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

A full-stack, enterprise-grade transportation management suite engineered according to the **SmartBus Ticket Booking PRD specification (BR-01 to BR-15, TC-01 to TC-12)**. Replaces legacy text console scripts with high-performance SQLite relational ACID integrity, emergency bus swap resilience, live revenue analytics, interactive 2×2 luxury bus cabin seat selection, and digital printable boarding passes.

---

## 🚌 Architectural Matrix

| Module | PRD Baseline Requirement | SmartBus OS Commercial SaaS Capability |
| :--- | :--- | :--- |
| **Routes & Fleet** | 5 in-memory routes (`R101`–`R105`) | Relational SQLite database, vehicle license plates, active & standby fleet registry |
| **Seat Allocation** | Seat count decrement only | Interactive 2×2 cabin seat map (`A1`, `A2`, `B1`...), driver cabin indicator, instant status |
| **Emergency Ops** | Not addressed in base document | Emergency standby bus breakdown replacement with capacity validation safeguard (BR-13) & bulk trip cancellation (BR-14) |
| **Financials** | Static confirmed revenue | Real-time ledger strictly excluding cancellations (BR-12), occupancy rate, departure matrix |
| **Boarding Pass** | Console text output | High-contrast luxury boarding pass modal with cryptographic QR verification & print stylesheet |

---

## ⚡ Quick Start (One Command)

### Option 1: Docker Compose
```bash
docker compose up --build
```
- **Backend API**: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **Frontend App**: `http://localhost:3000`

### Option 2: Linux / macOS / Bash
```bash
chmod +x run.sh
./run.sh
```

### Option 3: Windows Native
Double-click `run.bat` or run:
```cmd
run.bat
```

### Option 4: Manual Startup
1. **Start Backend**:
   ```bash
   pip install -r backend/requirements.txt
   python backend/seed_data.py
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🧪 Automated Pytest Suite (TC-01 through TC-12)

Run the test suite verifying 100% compliance:
```bash
set PYTHONPATH=backend
python -m pytest backend/tests/test_prd.py -v
```

### Test Case Verification Summary
| Test Case | PRD Rule | Scenario & Assertion | Result |
| :--- | :--- | :--- | :---: |
| **TC-01** | Seed Baseline | Routes R101–R105 present with designated base fares and fleet linkage | **PASSED** |
| **TC-02** | BR-01 | Rejection of empty or whitespace passenger names (HTTP 422/400) | **PASSED** |
| **TC-03** | BR-02 | Rejection of non-positive or excessive passenger age (1-120 range) | **PASSED** |
| **TC-04** | BR-08 | Ahmed (age 24) books 2 seats on R101: seats drop 40→38, fare = Rs. 2,400 | **PASSED** |
| **TC-05** | BR-08 | Group booking of 4+ seats receives automatic 10% group discount | **PASSED** |
| **TC-06** | BR-05 | Excess seats & double-booking prevention with zero database state mutation | **PASSED** |
| **TC-07** | BR-10 | Single cancellation of B1001 restores released seats back to trip (38→40) | **PASSED** |
| **TC-08** | BR-10 | Attempt to cancel already cancelled booking B1001 rejected with HTTP 400 | **PASSED** |
| **TC-09** | BR-13 | Emergency bus swap with adequate capacity recalculates available seats | **PASSED** |
| **TC-10** | BR-13 | Safeguard: Swap to smaller bus than booked seats count rejected with HTTP 400 | **PASSED** |
| **TC-11** | BR-12 | Cancelled revenue strictly excluded from confirmed ledger / net revenue | **PASSED** |
| **TC-12** | BR-14 | Emergency trip bulk cancellation refunds all active passengers | **PASSED** |

---

## 🎯 Hackathon Live 3-Minute Demo Pitch Strategy

Follow this exact sequence for maximum judge evaluation score:
1. **Minute 1: Seamless Reservation & Digital Boarding Pass**
   - Click "Routes & Booking", select **R101 (Karachi → Hyderabad)**.
   - Click the "Ahmed (2 Seats)" demo button to choose seats **A1 & A2**.
   - Click "Confirm Booking & Generate Pass" to see celebration confetti and the luxury printable **Boarding Pass** with QR verification code.
2. **Minute 2: Fleet Resilience & Capacity Safeguard (BR-13)**
   - Switch to the "Fleet & Bus Swaps" dispatch board.
   - Click "Swap Bus" on trip T101.
   - Point out the real-time **BR-13 Capacity Safeguard Indicator**. Demonstrate that assigning a standby bus with adequate seats succeeds, while smaller buses are safely rejected to protect passenger reservations.
3. **Minute 3: Real-Time Ledger Audit (BR-12)**
   - Switch to "Ticket Search", locate Ahmed's ticket (`B1001`), and click "Cancel Ticket".
   - Notice the instant feedback: exactly 2 seats are restored to trip T101, and the booking is retained with `Cancelled` status (zero hard deletes).
   - Switch to the "Real-Time Analytics" tab to show judges that cancelled revenue is immediately deducted from the confirmed ledger while audit transparency is maintained.

---

## 📡 REST API Reference

- `GET /api/routes` — Operational PRD route corridors
- `GET /api/trips` — Trip schedules, assigned buses, and occupied seat maps
- `POST /api/bookings` — Create reservation with validation and 10% discount check
- `POST /api/bookings/{id}/cancel` — One-time cancellation with seat restoration
- `POST /api/trips/{id}/swap-bus` — Emergency bus replacement with capacity audit
- `POST /api/trips/{id}/cancel-trip` — Emergency trip cancellation & bulk refund
- `GET /api/reports/analytics` — Executive KPI metrics and financial ledger
- `POST /api/reset` — Reset database to initial seed baseline
