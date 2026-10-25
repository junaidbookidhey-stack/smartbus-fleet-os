import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, Base, engine
from models import Bus, Route, Trip, Booking, BookedSeat, SwapLog


def seed_database(db: Session = None, reset: bool = False):
    """Seed default PRD routes, buses, and trips into SQLite."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        if reset:
            # Drop and recreate tables cleanly
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
        else:
            Base.metadata.create_all(bind=engine)
            # If routes already exist, don't reseed
            if db.query(Route).count() > 0:
                return

        # 1. Initialize PRD Buses
        buses = [
            Bus(bus_id="BUS-101", bus_number="KB-4001", bus_type="Luxury AC Cruiser", total_capacity=40, status="Active"),
            Bus(bus_id="BUS-102", bus_number="KB-3602", bus_type="Executive Sleeper", total_capacity=36, status="Active"),
            Bus(bus_id="BUS-103", bus_number="HD-3203", bus_type="Super Standard", total_capacity=32, status="Active"),
            Bus(bus_id="BUS-104", bus_number="LH-4504", bus_type="Royal Falcon Executive", total_capacity=45, status="Active"),
            Bus(bus_id="BUS-105", bus_number="SK-3005", bus_type="Rapid Express", total_capacity=30, status="Active"),
            # Standby fleet for emergency swaps (BR-13)
            Bus(bus_id="BUS-SB-45", bus_number="SB-9901", bus_type="Standby Luxury Elite", total_capacity=45, status="Standby"),
            Bus(bus_id="BUS-SB-50", bus_number="SB-9902", bus_type="Standby Super Liner", total_capacity=50, status="Standby"),
            Bus(bus_id="BUS-SB-25", bus_number="SB-9903", bus_type="Standby Mini Shuttler", total_capacity=25, status="Standby"),
            # Maintenance fleet
            Bus(bus_id="BUS-MT-01", bus_number="MT-0001", bus_type="Workshop Overhaul", total_capacity=40, status="Maintenance"),
        ]
        db.add_all(buses)
        db.flush()

        # 2. Initialize PRD Routes:
        # R101 (Karachi->Hyd Rs.1200, 40 seats)
        # R102 (Karachi->Sukkur Rs.2000, 36 seats)
        # R103 (Hyd->Mirpur Khas Rs.800, 32 seats)
        # R104 (Karachi->Lahore Rs.5000, 45 seats)
        # R105 (Sukkur->Hyd Rs.1500, 30 seats)
        routes = [
            Route(route_id="R101", departure_city="Karachi", destination_city="Hyderabad", base_fare=1200.0),
            Route(route_id="R102", departure_city="Karachi", destination_city="Sukkur", base_fare=2000.0),
            Route(route_id="R103", departure_city="Hyderabad", destination_city="Mirpur Khas", base_fare=800.0),
            Route(route_id="R104", departure_city="Karachi", destination_city="Lahore", base_fare=5000.0),
            Route(route_id="R105", departure_city="Sukkur", destination_city="Hyderabad", base_fare=1500.0),
        ]
        db.add_all(routes)
        db.flush()

        # 3. Initialize Trips linked to active buses
        trips = [
            Trip(
                trip_id="T101",
                route_id="R101",
                bus_id="BUS-101",
                departure_datetime="Today - 08:00 AM",
                available_seats=40,
                trip_status="Scheduled"
            ),
            Trip(
                trip_id="T102",
                route_id="R102",
                bus_id="BUS-102",
                departure_datetime="Today - 10:30 AM",
                available_seats=36,
                trip_status="Scheduled"
            ),
            Trip(
                trip_id="T103",
                route_id="R103",
                bus_id="BUS-103",
                departure_datetime="Today - 01:00 PM",
                available_seats=32,
                trip_status="Scheduled"
            ),
            Trip(
                trip_id="T104",
                route_id="R104",
                bus_id="BUS-104",
                departure_datetime="Today - 04:00 PM",
                available_seats=45,
                trip_status="Scheduled"
            ),
            Trip(
                trip_id="T105",
                route_id="R105",
                bus_id="BUS-105",
                departure_datetime="Today - 07:30 PM",
                available_seats=30,
                trip_status="Scheduled"
            ),
        ]
        db.add_all(trips)
        db.commit()
        print("SmartBus PRD database successfully seeded.")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_database(reset=True)
