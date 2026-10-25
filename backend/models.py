from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship
from database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Bus(Base):
    __tablename__ = "buses"

    bus_id = Column(String(50), primary_key=True, index=True)
    bus_number = Column(String(50), unique=True, nullable=False)
    bus_type = Column(String(50), nullable=False, default="Luxury AC")
    total_capacity = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="Active")  # Active, Standby, Maintenance

    trips = relationship("Trip", back_populates="bus")


class Route(Base):
    __tablename__ = "routes"

    route_id = Column(String(20), primary_key=True, index=True)
    departure_city = Column(String(100), nullable=False)
    destination_city = Column(String(100), nullable=False)
    base_fare = Column(Float, nullable=False)

    trips = relationship("Trip", back_populates="route")


class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(String(50), primary_key=True, index=True)
    route_id = Column(String(20), ForeignKey("routes.route_id"), nullable=False)
    bus_id = Column(String(50), ForeignKey("buses.bus_id"), nullable=False)
    departure_datetime = Column(String(100), nullable=False)
    available_seats = Column(Integer, nullable=False)
    trip_status = Column(String(20), nullable=False, default="Scheduled")  # Scheduled, In-Progress, Completed, Cancelled

    route = relationship("Route", back_populates="trips")
    bus = relationship("Bus", back_populates="trips")
    bookings = relationship("Booking", back_populates="trip", cascade="all, delete-orphan")
    booked_seats = relationship("BookedSeat", back_populates="trip", cascade="all, delete-orphan")
    swap_logs = relationship("SwapLog", back_populates="trip", cascade="all, delete-orphan")


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(String(50), primary_key=True, index=True)
    trip_id = Column(String(50), ForeignKey("trips.trip_id"), nullable=False)
    passenger_name = Column(String(100), nullable=False)
    passenger_phone = Column(String(50), nullable=False)
    passenger_age = Column(Integer, nullable=False)
    total_fare = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="Confirmed")  # Confirmed, Cancelled
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    trip = relationship("Trip", back_populates="bookings")
    seats = relationship("BookedSeat", back_populates="booking", cascade="all, delete-orphan")


class BookedSeat(Base):
    __tablename__ = "booked_seats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String(50), ForeignKey("bookings.booking_id"), nullable=False)
    trip_id = Column(String(50), ForeignKey("trips.trip_id"), nullable=False)
    seat_number = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="Confirmed")  # Confirmed, Cancelled

    booking = relationship("Booking", back_populates="seats")
    trip = relationship("Trip", back_populates="booked_seats")

    __table_args__ = (
        Index("idx_trip_seat_status", "trip_id", "seat_number", "status"),
    )


class SwapLog(Base):
    __tablename__ = "swap_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String(50), ForeignKey("trips.trip_id"), nullable=False)
    old_bus_id = Column(String(50), nullable=False)
    new_bus_id = Column(String(50), nullable=False)
    old_capacity = Column(Integer, nullable=False)
    new_capacity = Column(Integer, nullable=False)
    booked_seats_count = Column(Integer, nullable=False)
    reason = Column(String(255), default="Emergency Bus Breakdown")
    timestamp = Column(DateTime, default=get_utc_now, nullable=False)

    trip = relationship("Trip", back_populates="swap_logs")
