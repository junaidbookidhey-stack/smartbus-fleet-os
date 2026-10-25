import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, get_db, Base
from models import Bus, Route, Trip, Booking, BookedSeat, SwapLog
import schemas
from seed_data import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Auto-initialize database tables and seed baseline PRD routes (R101-R105)
    and fleet buses on application startup for Render/production deployment.
    """
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


# Immediate initialization for test runners and direct imports
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="SmartBus Commercial Fleet & Ticket Reservation System",
    description="High-availability transportation backend compliant with PRD BR-01 to BR-15",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend applications (Vercel, localhost, preview domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def generate_booking_id(db: Session) -> str:
    """Generate sequential booking ID starting at B1001 (e.g. B1001, B1002)."""
    count = db.query(Booking).count()
    candidate_num = 1001 + count
    candidate_id = f"B{candidate_num}"
    # Verify uniqueness in case of custom inserts
    while db.query(Booking).filter(Booking.booking_id == candidate_id).first():
        candidate_num += 1
        candidate_id = f"B{candidate_num}"
    return candidate_id


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SmartBus Fleet & Ticket Reservation API",
        "docs_url": "/docs",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==========================================
# ROUTES & BUSES ENDPOINTS
# ==========================================

@app.get("/api/routes", response_model=List[schemas.RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    """Retrieve all operational routes (R101-R105)."""
    return db.query(Route).all()


@app.get("/api/buses", response_model=List[schemas.BusResponse])
def get_buses(db: Session = Depends(get_db)):
    """Retrieve full fleet registry including Active, Standby, and Maintenance units."""
    return db.query(Bus).all()


# ==========================================
# TRIPS ENDPOINTS
# ==========================================

@app.get("/api/trips", response_model=List[schemas.TripResponse])
def get_trips(db: Session = Depends(get_db)):
    """Retrieve all scheduled trips with active booked seats and vehicle status."""
    trips = db.query(Trip).all()
    results = []
    for t in trips:
        occupied_seats = [
            s.seat_number for s in t.booked_seats if s.status == "Confirmed"
        ]
        results.append(
            schemas.TripResponse(
                trip_id=t.trip_id,
                route_id=t.route_id,
                bus_id=t.bus_id,
                departure_datetime=t.departure_datetime,
                available_seats=t.available_seats,
                trip_status=t.trip_status,
                route=t.route,
                bus=t.bus,
                occupied_seats=occupied_seats
            )
        )
    return results


@app.get("/api/trips/{trip_id}", response_model=schemas.TripResponse)
def get_trip_detail(trip_id: str, db: Session = Depends(get_db)):
    """Retrieve single trip details including interactive cabin occupancy."""
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found (BR-03).")

    occupied_seats = [
        s.seat_number for s in trip.booked_seats if s.status == "Confirmed"
    ]
    return schemas.TripResponse(
        trip_id=trip.trip_id,
        route_id=trip.route_id,
        bus_id=trip.bus_id,
        departure_datetime=trip.departure_datetime,
        available_seats=trip.available_seats,
        trip_status=trip.trip_status,
        route=trip.route,
        bus=trip.bus,
        occupied_seats=occupied_seats
    )


# ==========================================
# BOOKINGS ENDPOINTS (BR-01 TO BR-08)
# ==========================================

@app.post("/api/bookings", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: schemas.CreateBookingRequest, db: Session = Depends(get_db)):
    """
    Create a new seat booking with strict domain validations:
    - BR-01: Name validation (non-empty)
    - BR-02: Age validation (1-120)
    - BR-03: Route/trip existence
    - BR-04 & BR-05: Capacity validation and double-booking prevention
    - BR-08: Base fare * seats, 10% discount for >= 4 seats
    """
    # 1. Validate Trip Existence (BR-03)
    trip = db.query(Trip).filter(Trip.trip_id == payload.trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{payload.trip_id}' does not exist (BR-03)."
        )

    if trip.trip_status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book tickets on a cancelled trip."
        )

    requested_seats = payload.seat_numbers
    seat_count = len(requested_seats)

    # 2. Check remaining capacity (BR-04, BR-05)
    if seat_count > trip.available_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested {seat_count} seats, but only {trip.available_seats} remaining (BR-05)."
        )

    # 3. Check for double booking of specific seats
    already_booked = db.query(BookedSeat).filter(
        BookedSeat.trip_id == payload.trip_id,
        BookedSeat.seat_number.in_(requested_seats),
        BookedSeat.status == "Confirmed"
    ).all()

    if already_booked:
        taken_seats = [s.seat_number for s in already_booked]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Seat(s) already booked: {', '.join(taken_seats)}. Please select different seats (BR-05)."
        )

    # 4. Pricing Calculation & 10% Group Discount (BR-08)
    base_fare = trip.route.base_fare
    raw_subtotal = base_fare * seat_count
    discount_applied = False
    if seat_count >= 4:
        discount_applied = True
        total_fare = raw_subtotal * 0.90  # 10% discount
    else:
        total_fare = raw_subtotal

    # 5. Atomic State Mutation
    booking_id = generate_booking_id(db)
    booking = Booking(
        booking_id=booking_id,
        trip_id=trip.trip_id,
        passenger_name=payload.passenger_name,
        passenger_phone=payload.passenger_phone,
        passenger_age=payload.passenger_age,
        total_fare=total_fare,
        status="Confirmed",
        created_at=datetime.now(timezone.utc)
    )
    db.add(booking)
    db.flush()

    for seat_num in requested_seats:
        seat_record = BookedSeat(
            booking_id=booking_id,
            trip_id=trip.trip_id,
            seat_number=seat_num,
            status="Confirmed"
        )
        db.add(seat_record)

    # Deduct available seats
    trip.available_seats -= seat_count
    db.commit()
    db.refresh(booking)

    return schemas.BookingResponse(
        booking_id=booking.booking_id,
        trip_id=booking.trip_id,
        passenger_name=booking.passenger_name,
        passenger_phone=booking.passenger_phone,
        passenger_age=booking.passenger_age,
        total_fare=booking.total_fare,
        status=booking.status,
        created_at=booking.created_at,
        seat_numbers=requested_seats,
        discount_applied=discount_applied,
        original_fare=raw_subtotal
    )


@app.get("/api/bookings", response_model=List[schemas.BookingResponse])
def get_bookings(
    trip_id: Optional[str] = None,
    passenger_phone: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve bookings with optional filtering."""
    query = db.query(Booking)
    if trip_id:
        query = query.filter(Booking.trip_id == trip_id)
    if passenger_phone:
        query = query.filter(Booking.passenger_phone == passenger_phone)

    bookings = query.order_by(Booking.created_at.desc()).all()
    results = []
    for b in bookings:
        seats = [s.seat_number for s in b.seats]
        results.append(
            schemas.BookingResponse(
                booking_id=b.booking_id,
                trip_id=b.trip_id,
                passenger_name=b.passenger_name,
                passenger_phone=b.passenger_phone,
                passenger_age=b.passenger_age,
                total_fare=b.total_fare,
                status=b.status,
                created_at=b.created_at,
                seat_numbers=seats,
                discount_applied=(len(seats) >= 4),
                original_fare=(b.trip.route.base_fare * len(seats) if b.trip and b.trip.route else b.total_fare)
            )
        )
    return results


@app.get("/api/bookings/{booking_id}", response_model=schemas.BookingResponse)
def get_booking_by_id(booking_id: str, db: Session = Depends(get_db)):
    """Retrieve booking by ID."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking '{booking_id}' not found.")

    seats = [s.seat_number for s in booking.seats]
    return schemas.BookingResponse(
        booking_id=booking.booking_id,
        trip_id=booking.trip_id,
        passenger_name=booking.passenger_name,
        passenger_phone=booking.passenger_phone,
        passenger_age=booking.passenger_age,
        total_fare=booking.total_fare,
        status=booking.status,
        created_at=booking.created_at,
        seat_numbers=seats,
        discount_applied=(len(seats) >= 4),
        original_fare=(booking.trip.route.base_fare * len(seats) if booking.trip and booking.trip.route else booking.total_fare)
    )


# ==========================================
# CANCELLATION ENDPOINTS (BR-09, BR-10, BR-11)
# ==========================================

@app.post("/api/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: str, db: Session = Depends(get_db)):
    """
    Cancel booking with seat restoration:
    - Cancel only 'Confirmed' bookings (BR-09)
    - If already cancelled, reject with HTTP 400 (BR-10)
    - Restore released seats back to trip (BR-10)
    - Retain record for audit (BR-11)
    """
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking '{booking_id}' not found."
        )

    # Check already cancelled
    if booking.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking '{booking_id}' is already cancelled. Second cancellation rejected (BR-10)."
        )

    if booking.status != "Confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel booking with status '{booking.status}' (BR-09)."
        )

    # 1. Update Booking status to Cancelled (Audit preservation BR-11)
    booking.status = "Cancelled"

    # 2. Update all BookedSeats to Cancelled
    seat_count = 0
    for seat in booking.seats:
        if seat.status == "Confirmed":
            seat.status = "Cancelled"
            seat_count += 1

    # 3. Restore seats back to Trip (BR-10)
    trip = booking.trip
    if trip and trip.trip_status != "Cancelled":
        trip.available_seats = min(
            trip.bus.total_capacity,
            trip.available_seats + seat_count
        )

    db.commit()
    db.refresh(booking)

    return {
        "message": f"Booking {booking_id} successfully cancelled.",
        "booking_id": booking.booking_id,
        "status": booking.status,
        "restored_seats": seat_count,
        "trip_id": booking.trip_id,
        "trip_available_seats": trip.available_seats if trip else 0
    }


# ==========================================
# FLEET SWAPS & EMERGENCY OPS (BR-13, BR-14)
# ==========================================

@app.post("/api/trips/{trip_id}/swap-bus")
def swap_trip_bus(trip_id: str, payload: schemas.SwapBusRequest, db: Session = Depends(get_db)):
    """
    Emergency bus replacement (BR-13):
    - Swap trip's bus to standby bus.
    - Constraint check: New bus capacity MUST be >= current booked seats count.
    - Auto-recalculate trip available_seats based on new capacity.
    - Log swap event.
    """
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found.")

    if trip.trip_status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot swap bus for a cancelled trip.")

    new_bus = db.query(Bus).filter(Bus.bus_id == payload.new_bus_id).first()
    if not new_bus:
        raise HTTPException(status_code=404, detail=f"Standby Bus '{payload.new_bus_id}' not found.")

    if new_bus.bus_id == trip.bus_id:
        raise HTTPException(status_code=400, detail="Target bus is already assigned to this trip.")

    # Count currently active confirmed booked seats
    current_booked_seats = db.query(BookedSeat).filter(
        BookedSeat.trip_id == trip_id,
        BookedSeat.status == "Confirmed"
    ).count()

    # Constraint check: New bus capacity MUST be >= current booked seats count (BR-13)
    if new_bus.total_capacity < current_booked_seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Swap Rejected (BR-13 Operational Resilience): Standby bus capacity ({new_bus.total_capacity}) "
                f"is strictly less than currently booked seats ({current_booked_seats}). "
                f"Standby bus must have at least {current_booked_seats} seats to safeguard reservations."
            )
        )

    # Perform swap
    old_bus = trip.bus
    old_capacity = old_bus.total_capacity if old_bus else trip.available_seats + current_booked_seats

    # Log audit event
    swap_log = SwapLog(
        trip_id=trip.trip_id,
        old_bus_id=trip.bus_id,
        new_bus_id=new_bus.bus_id,
        old_capacity=old_capacity,
        new_capacity=new_bus.total_capacity,
        booked_seats_count=current_booked_seats,
        reason=payload.reason or "Emergency Bus Breakdown"
    )
    db.add(swap_log)

    # Update bus statuses
    if old_bus:
        old_bus.status = "Maintenance"
    new_bus.status = "Active"

    # Reassign and recalculate available seats
    trip.bus_id = new_bus.bus_id
    trip.available_seats = new_bus.total_capacity - current_booked_seats

    db.commit()
    db.refresh(trip)

    return {
        "message": f"Bus swapped successfully from {old_bus.bus_number if old_bus else 'None'} to {new_bus.bus_number}.",
        "trip_id": trip.trip_id,
        "new_bus_id": new_bus.bus_id,
        "new_bus_number": new_bus.bus_number,
        "new_capacity": new_bus.total_capacity,
        "retained_booked_seats": current_booked_seats,
        "recalculated_available_seats": trip.available_seats
    }


@app.post("/api/trips/{trip_id}/cancel-trip")
def cancel_trip(trip_id: str, db: Session = Depends(get_db)):
    """
    Emergency Trip Cancellation (BR-14):
    - Bulk update all bookings on trip to 'Cancelled' & 'Refunded'.
    - Release all seats.
    - Mark trip status as 'Cancelled'.
    """
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found.")

    if trip.trip_status == "Cancelled":
        raise HTTPException(status_code=400, detail="Trip is already cancelled.")

    # 1. Cancel trip
    trip.trip_status = "Cancelled"
    trip.available_seats = 0

    # 2. Bulk cancel all bookings and seats
    active_bookings = db.query(Booking).filter(
        Booking.trip_id == trip_id,
        Booking.status == "Confirmed"
    ).all()

    affected_bookings_count = len(active_bookings)
    refunded_revenue = sum(b.total_fare for b in active_bookings)

    for booking in active_bookings:
        booking.status = "Cancelled"
        for seat in booking.seats:
            seat.status = "Cancelled"

    db.commit()

    return {
        "message": f"Trip {trip_id} cancelled successfully.",
        "trip_id": trip_id,
        "cancelled_bookings_count": affected_bookings_count,
        "total_refunded_amount": refunded_revenue
    }


# ==========================================
# ANALYTICS & REPORTING (BR-12, BR-15)
# ==========================================

@app.get("/api/reports/analytics", response_model=schemas.AnalyticsSummaryResponse)
def get_analytics(db: Session = Depends(get_db)):
    """
    PRD Financial and Operational Analytics (BR-12, BR-15):
    - Total bookings
    - Confirmed count
    - Cancelled count
    - Reserved seats
    - Net Confirmed Revenue (strictly excluding cancellations BR-12)
    - Cancelled Revenue
    - Fleet Occupancy Rate
    - Fully booked routes
    - City-wise departure schedules
    """
    all_bookings = db.query(Booking).all()
    total_bookings = len(all_bookings)

    confirmed_bookings = [b for b in all_bookings if b.status == "Confirmed"]
    cancelled_bookings = [b for b in all_bookings if b.status == "Cancelled"]

    confirmed_count = len(confirmed_bookings)
    cancelled_count = len(cancelled_bookings)

    # Reserved seats count (only confirmed)
    reserved_seats = db.query(BookedSeat).filter(BookedSeat.status == "Confirmed").count()

    # Net Confirmed Revenue (strictly excluding cancellations BR-12)
    net_confirmed_revenue = sum(b.total_fare for b in confirmed_bookings)
    cancelled_revenue = sum(b.total_fare for b in cancelled_bookings)

    # Fleet occupancy
    trips = db.query(Trip).all()
    total_capacity = sum(t.bus.total_capacity for t in trips if t.bus)
    occupancy_rate = round((reserved_seats / total_capacity * 100), 2) if total_capacity > 0 else 0.0

    # Fully booked routes (where available_seats == 0 and scheduled)
    fully_booked_routes = [
        f"{t.route_id} ({t.route.departure_city} -> {t.route.destination_city})"
        for t in trips if t.available_seats == 0 and t.trip_status != "Cancelled"
    ]

    # City-wise departure schedules
    city_schedules = []
    for t in trips:
        city_schedules.append({
            "trip_id": t.trip_id,
            "route_id": t.route_id,
            "departure_city": t.route.departure_city,
            "destination_city": t.route.destination_city,
            "departure_time": t.departure_datetime,
            "bus_number": t.bus.bus_number if t.bus else "N/A",
            "bus_type": t.bus.bus_type if t.bus else "N/A",
            "available_seats": t.available_seats,
            "total_capacity": t.bus.total_capacity if t.bus else 0,
            "status": t.trip_status
        })

    return schemas.AnalyticsSummaryResponse(
        total_bookings=total_bookings,
        confirmed_count=confirmed_count,
        cancelled_count=cancelled_count,
        reserved_seats=reserved_seats,
        net_confirmed_revenue=net_confirmed_revenue,
        cancelled_revenue=cancelled_revenue,
        fleet_occupancy_rate=occupancy_rate,
        fully_booked_routes=fully_booked_routes,
        city_departure_schedules=city_schedules
    )


@app.post("/api/reset")
def reset_system(db: Session = Depends(get_db)):
    """Reset database to initial seed state for repeat demoing & test execution."""
    seed_database(db=db, reset=True)
    return {"message": "SmartBus database successfully re-seeded to initial PRD baseline state."}
