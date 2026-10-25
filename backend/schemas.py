from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class SeatBookingItem(BaseModel):
    seat_number: str


class CreateBookingRequest(BaseModel):
    trip_id: str = Field(..., description="Target Trip ID")
    passenger_name: str = Field(..., description="Passenger full name")
    passenger_phone: str = Field(..., description="Passenger contact phone")
    passenger_age: int = Field(..., description="Passenger age (1-120)")
    seat_numbers: List[str] = Field(..., min_length=1, description="List of chosen seats")

    @field_validator("passenger_name")
    @classmethod
    def validate_passenger_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Passenger name cannot be empty or blank (BR-01).")
        return trimmed

    @field_validator("passenger_age")
    @classmethod
    def validate_passenger_age(cls, v: int) -> int:
        if v < 1 or v > 120:
            raise ValueError("Passenger age must be between 1 and 120 (BR-02).")
        return v

    @field_validator("seat_numbers")
    @classmethod
    def validate_seat_numbers(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one seat must be selected.")
        # Check uniqueness in selection
        cleaned = [s.strip().upper() for s in v if s and s.strip()]
        if len(cleaned) != len(set(cleaned)):
            raise ValueError("Duplicate seat numbers provided in single booking request.")
        return cleaned


class SwapBusRequest(BaseModel):
    new_bus_id: str
    reason: Optional[str] = "Emergency Bus Breakdown"


class BusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bus_id: str
    bus_number: str
    bus_type: str
    total_capacity: int
    status: str


class RouteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    route_id: str
    departure_city: str
    destination_city: str
    base_fare: float


class BookedSeatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: str
    seat_number: str
    status: str


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: str
    trip_id: str
    passenger_name: str
    passenger_phone: str
    passenger_age: int
    total_fare: float
    status: str
    created_at: datetime
    seat_numbers: List[str] = []
    discount_applied: bool = False
    original_fare: float = 0.0


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    trip_id: str
    route_id: str
    bus_id: str
    departure_datetime: str
    available_seats: int
    trip_status: str
    route: Optional[RouteResponse] = None
    bus: Optional[BusResponse] = None
    occupied_seats: List[str] = []


class AnalyticsSummaryResponse(BaseModel):
    total_bookings: int
    confirmed_count: int
    cancelled_count: int
    reserved_seats: int
    net_confirmed_revenue: float
    cancelled_revenue: float
    fleet_occupancy_rate: float
    fully_booked_routes: List[str]
    city_departure_schedules: List[dict]
