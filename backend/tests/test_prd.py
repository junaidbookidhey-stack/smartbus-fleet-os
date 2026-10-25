import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import SessionLocal
from seed_data import seed_database

client = TestClient(app)


@pytest.fixture(autouse=True)
def run_before_and_after_tests():
    """Reset database before each test run for test isolation."""
    seed_database(reset=True)
    yield


def test_tc_01_system_initialization_and_seed_data():
    """
    TC-01: Baseline Route and Fleet Verification
    PRD Routes R101-R105 must be present with designated cities and base fares.
    """
    response = client.get("/api/routes")
    assert response.status_code == 200
    routes = response.json()
    route_map = {r["route_id"]: r for r in routes}

    assert "R101" in route_map
    assert route_map["R101"]["departure_city"] == "Karachi"
    assert route_map["R101"]["destination_city"] == "Hyderabad"
    assert route_map["R101"]["base_fare"] == 1200.0

    assert "R102" in route_map
    assert route_map["R102"]["base_fare"] == 2000.0

    assert "R103" in route_map
    assert route_map["R103"]["base_fare"] == 800.0

    assert "R104" in route_map
    assert route_map["R104"]["base_fare"] == 5000.0

    assert "R105" in route_map
    assert route_map["R105"]["base_fare"] == 1500.0

    # Verify trips initialization
    trips_res = client.get("/api/trips")
    assert trips_res.status_code == 200
    trips = trips_res.json()
    assert len(trips) >= 5


def test_tc_02_br01_name_validation():
    """
    TC-02: BR-01 Passenger Name Validation
    Empty strings or whitespace-only names must be rejected with HTTP 422/400.
    """
    payload = {
        "trip_id": "T101",
        "passenger_name": "   ",
        "passenger_phone": "0300-1234567",
        "passenger_age": 25,
        "seat_numbers": ["A1"]
    }
    response = client.post("/api/bookings", json=payload)
    assert response.status_code in [400, 422]


def test_tc_03_br02_age_validation():
    """
    TC-03: BR-02 Positive Age Validation
    Age must be between 1 and 120. Rejections for 0, negative, and excessive numbers.
    """
    # Age 0
    res1 = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Test User",
        "passenger_phone": "0300-1234567",
        "passenger_age": 0,
        "seat_numbers": ["A1"]
    })
    assert res1.status_code in [400, 422]

    # Negative age
    res2 = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Test User",
        "passenger_phone": "0300-1234567",
        "passenger_age": -5,
        "seat_numbers": ["A1"]
    })
    assert res2.status_code in [400, 422]

    # Excessive age
    res3 = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Test User",
        "passenger_phone": "0300-1234567",
        "passenger_age": 130,
        "seat_numbers": ["A1"]
    })
    assert res3.status_code in [400, 422]


def test_tc_04_br08_booking_two_seats_ahmed():
    """
    TC-04 / BR-08:
    Book 2 seats on R101 for Ahmed (age 24).
    Automated Database Assertion:
    - Available seats drop from 40 to 38.
    - Total Revenue = Rs. 2,400 (1200 * 2).
    """
    payload = {
        "trip_id": "T101",
        "passenger_name": "Ahmed",
        "passenger_phone": "0300-9876543",
        "passenger_age": 24,
        "seat_numbers": ["A1", "A2"]
    }
    response = client.post("/api/bookings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["booking_id"] == "B1001"
    assert data["passenger_name"] == "Ahmed"
    assert data["total_fare"] == 2400.0
    assert data["discount_applied"] is False

    # Check trip available seats updated in DB
    trip_res = client.get("/api/trips/T101")
    assert trip_res.status_code == 200
    trip_data = trip_res.json()
    assert trip_data["available_seats"] == 38
    assert "A1" in trip_data["occupied_seats"]
    assert "A2" in trip_data["occupied_seats"]


def test_tc_05_br08_group_booking_discount():
    """
    TC-05 / BR-08:
    Group booking of >= 4 seats must receive 10% discount.
    4 seats on R101 (base 1200) = 4800 * 0.90 = Rs. 4,320.
    """
    payload = {
        "trip_id": "T101",
        "passenger_name": "Fatima Family",
        "passenger_phone": "0312-5555555",
        "passenger_age": 35,
        "seat_numbers": ["A1", "A2", "A3", "A4"]
    }
    response = client.post("/api/bookings", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["total_fare"] == 4320.0
    assert data["discount_applied"] is True

    # Check seats deducted: 40 - 4 = 36
    trip_res = client.get("/api/trips/T101")
    assert trip_res.json()["available_seats"] == 36


def test_tc_06_br05_capacity_and_double_booking_prevention():
    """
    TC-06 / BR-05:
    1. Requesting more seats than remaining returns HTTP 400 with zero state mutation.
    2. Attempting to book an already occupied seat returns HTTP 400.
    """
    # First book seat A1
    res1 = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "First Passenger",
        "passenger_phone": "0300-1111111",
        "passenger_age": 28,
        "seat_numbers": ["A1"]
    })
    assert res1.status_code == 201

    # Attempt to double-book A1
    res_duplicate = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Second Passenger",
        "passenger_phone": "0300-2222222",
        "passenger_age": 30,
        "seat_numbers": ["A1", "A2"]
    })
    assert res_duplicate.status_code == 400
    assert "already booked" in res_duplicate.json()["detail"].lower()

    # Available seats should still be 39 (zero mutation from rejected attempt)
    trip_res = client.get("/api/trips/T101")
    assert trip_res.json()["available_seats"] == 39


def test_tc_07_br10_cancel_booking_once():
    """
    TC-07 / BR-10:
    Cancel booking B1001 once.
    Automated Database Assertion:
    - Status changes to Cancelled.
    - Exactly 2 seats restored back to trip (38 -> 40).
    """
    # Create booking for 2 seats
    b_res = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Ahmed",
        "passenger_phone": "0300-9876543",
        "passenger_age": 24,
        "seat_numbers": ["A1", "A2"]
    })
    booking_id = b_res.json()["booking_id"]

    # Trip available seats is 38
    assert client.get("/api/trips/T101").json()["available_seats"] == 38

    # Cancel booking
    c_res = client.post(f"/api/bookings/{booking_id}/cancel")
    assert c_res.status_code == 200
    cancel_data = c_res.json()
    assert cancel_data["status"] == "Cancelled"
    assert cancel_data["restored_seats"] == 2

    # Check trip available seats restored to 40
    trip_res = client.get("/api/trips/T101")
    assert trip_res.json()["available_seats"] == 40
    assert "A1" not in trip_res.json()["occupied_seats"]
    assert "A2" not in trip_res.json()["occupied_seats"]


def test_tc_08_br10_reject_already_cancelled_booking():
    """
    TC-08 / BR-10:
    Cancel already cancelled booking B1001.
    Automated Database Assertion:
    - HTTP 400 Rejected.
    - No second seat restoration permitted.
    """
    # Book and cancel once
    b_res = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Ahmed",
        "passenger_phone": "0300-9876543",
        "passenger_age": 24,
        "seat_numbers": ["A1", "A2"]
    })
    booking_id = b_res.json()["booking_id"]
    client.post(f"/api/bookings/{booking_id}/cancel")

    # Second cancel attempt must fail
    res_second = client.post(f"/api/bookings/{booking_id}/cancel")
    assert res_second.status_code == 400
    assert "already cancelled" in res_second.json()["detail"].lower()

    # Seat capacity remains 40 (no double addition)
    trip_res = client.get("/api/trips/T101")
    assert trip_res.json()["available_seats"] == 40


def test_tc_09_br13_emergency_bus_swap_adequate_capacity():
    """
    TC-09 / BR-13:
    Emergency bus replacement:
    Swap trip's bus to standby bus with adequate capacity.
    - Bus swapped successfully.
    - Trip available seats recalculated.
    """
    # Book 2 seats on T101
    client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Passenger 1",
        "passenger_phone": "0300-1111111",
        "passenger_age": 25,
        "seat_numbers": ["A1", "A2"]
    })

    # Swap to standby bus BUS-SB-45 (capacity 45)
    swap_res = client.post("/api/trips/T101/swap-bus", json={
        "new_bus_id": "BUS-SB-45",
        "reason": "Engine Transmission Issue"
    })
    assert swap_res.status_code == 200
    swap_data = swap_res.json()
    assert swap_data["new_bus_id"] == "BUS-SB-45"
    assert swap_data["new_capacity"] == 45
    assert swap_data["retained_booked_seats"] == 2
    assert swap_data["recalculated_available_seats"] == 43  # 45 - 2 = 43

    # Check trip endpoint reflects new bus and capacity
    trip_res = client.get("/api/trips/T101")
    assert trip_res.json()["bus_id"] == "BUS-SB-45"
    assert trip_res.json()["available_seats"] == 43


def test_tc_10_br13_emergency_bus_swap_inadequate_capacity_safeguard():
    """
    TC-10 / BR-13 Operational Resilience Safeguard:
    When swapping buses, if a bus has confirmed bookings, assigning a standby bus
    with smaller capacity than current booked seats count MUST be rejected with HTTP 400.
    """
    # Book 28 seats on T105 (Sukkur->Hyd, bus has 30 seats)
    # We can do this in groups
    for i in range(7):
        seat_names = [f"S{i*4 + j + 1}" for j in range(4)]
        res = client.post("/api/bookings", json={
            "trip_id": "T105",
            "passenger_name": f"Group {i+1}",
            "passenger_phone": f"0300-999000{i}",
            "passenger_age": 30,
            "seat_numbers": seat_names
        })
        assert res.status_code == 201

    # Total booked seats on T105 = 28
    # Now attempt to swap with BUS-SB-25 (total capacity = 25)
    # 25 < 28 -> Must be rejected!
    swap_res = client.post("/api/trips/T105/swap-bus", json={
        "new_bus_id": "BUS-SB-25",
        "reason": "Emergency Swap Attempt"
    })
    assert swap_res.status_code == 400
    err_detail = swap_res.json()["detail"]
    assert "safeguard" in err_detail.lower() or "less than" in err_detail.lower()


def test_tc_11_br12_financial_report_excluding_cancelled_revenue():
    """
    TC-11 / BR-12:
    Report generation after cancellation:
    Cancelled revenue strictly excluded from confirmed ledger.
    """
    # 1. Booking 1: 2 seats on R101 (fare = 2400)
    b1 = client.post("/api/bookings", json={
        "trip_id": "T101",
        "passenger_name": "Booking One",
        "passenger_phone": "0300-1111111",
        "passenger_age": 25,
        "seat_numbers": ["A1", "A2"]
    }).json()

    # 2. Booking 2: 1 seat on R102 (fare = 2000)
    b2 = client.post("/api/bookings", json={
        "trip_id": "T102",
        "passenger_name": "Booking Two",
        "passenger_phone": "0300-2222222",
        "passenger_age": 30,
        "seat_numbers": ["B1"]
    }).json()

    # Check analytics before cancel: Total = 2400 + 2000 = 4400
    report_before = client.get("/api/reports/analytics").json()
    assert report_before["confirmed_count"] == 2
    assert report_before["cancelled_count"] == 0
    assert report_before["net_confirmed_revenue"] == 4400.0

    # 3. Cancel Booking 1
    client.post(f"/api/bookings/{b1['booking_id']}/cancel")

    # 4. Check analytics after cancel:
    # Confirmed count = 1, Cancelled count = 1
    # Net Confirmed Revenue = 2000.0 (strictly excludes the 2400 cancelled fare!)
    # Cancelled Revenue = 2400.0
    report_after = client.get("/api/reports/analytics").json()
    assert report_after["confirmed_count"] == 1
    assert report_after["cancelled_count"] == 1
    assert report_after["net_confirmed_revenue"] == 2000.0
    assert report_after["cancelled_revenue"] == 2400.0


def test_tc_12_br14_emergency_trip_cancellation():
    """
    TC-12 / BR-14:
    Emergency trip cancellation:
    Bulk update all bookings on trip to 'Cancelled' & 'Refunded'.
    Release seats and mark trip cancelled.
    """
    # Book 2 bookings on T103
    b1 = client.post("/api/bookings", json={
        "trip_id": "T103",
        "passenger_name": "Passenger Alpha",
        "passenger_phone": "0300-7777777",
        "passenger_age": 22,
        "seat_numbers": ["C1"]
    }).json()

    b2 = client.post("/api/bookings", json={
        "trip_id": "T103",
        "passenger_name": "Passenger Beta",
        "passenger_phone": "0300-8888888",
        "passenger_age": 26,
        "seat_numbers": ["C2"]
    }).json()

    # Emergency cancel trip T103
    cancel_trip_res = client.post("/api/trips/T103/cancel-trip")
    assert cancel_trip_res.status_code == 200
    res_data = cancel_trip_res.json()
    assert res_data["cancelled_bookings_count"] == 2
    assert res_data["total_refunded_amount"] == 1600.0  # 800 * 2

    # Verify individual bookings are now Cancelled
    booking1_check = client.get(f"/api/bookings/{b1['booking_id']}").json()
    assert booking1_check["status"] == "Cancelled"

    # Verify trip status is Cancelled
    trip_check = client.get("/api/trips/T103").json()
    assert trip_check["trip_status"] == "Cancelled"
