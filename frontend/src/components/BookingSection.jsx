import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Tag, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Sparkles, 
  CreditCard,
  Zap,
  ArrowRight
} from 'lucide-react';
import SeatGrid from './SeatGrid';

export default function BookingSection({
  trips = [],
  selectedTripId,
  setSelectedTripId,
  selectedSeats,
  setSelectedSeats,
  onBookingSuccess
}) {
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('0300-9876543');
  const [passengerAge, setPassengerAge] = useState(24);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentTrip = trips.find(t => t.trip_id === selectedTripId) || trips[0];

  // Pricing calculations
  const baseFare = currentTrip?.route?.base_fare || 1200;
  const seatCount = selectedSeats.length;
  const subtotal = baseFare * seatCount;
  const isDiscountEligible = seatCount >= 4;
  const discountAmount = isDiscountEligible ? subtotal * 0.10 : 0;
  const totalPayable = subtotal - discountAmount;

  // Toggle seat
  const handleToggleSeat = (seatId) => {
    setErrorMessage('');
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Quick fill demo shortcuts for Hackathon Pitch!
  const fillAhmedDemo = () => {
    setPassengerName('Ahmed');
    setPassengerPhone('0300-9876543');
    setPassengerAge(24);
    setSelectedSeats(['A1', 'A2']);
    setErrorMessage('');
  };

  const fillGroupDemo = () => {
    setPassengerName('Fatima Group');
    setPassengerPhone('0312-5555555');
    setPassengerAge(32);
    setSelectedSeats(['A1', 'A2', 'A3', 'A4']);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    if (!passengerName.trim()) {
      setErrorMessage('BR-01 Validation Error: Passenger name cannot be blank.');
      return;
    }

    const ageNum = Number(passengerAge);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setErrorMessage('BR-02 Validation Error: Age must be a positive integer between 1 and 120.');
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Seat Selection Required: Please choose at least 1 cabin seat.');
      return;
    }

    setIsLoading(true);
    try {
      await onBookingSuccess({
        trip_id: currentTrip.trip_id,
        passenger_name: passengerName.trim(),
        passenger_phone: passengerPhone.trim() || '0300-0000000',
        passenger_age: ageNum,
        seat_numbers: selectedSeats
      });
      // Clear form on success
      setPassengerName('');
      setSelectedSeats([]);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Booking submission failed.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentTrip) {
    return <div className="text-center py-12 text-slate-400">Loading scheduled trips...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Route Selector Ribbon */}
      <div className="glass-panel rounded-2xl p-4 lg:p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Select PRD Route (R101 – R105)
            </h2>
            <p className="text-xs text-slate-400">Choose destination corridor to load cabin layout and schedule</p>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Demo Fill:</span>
            <button
              type="button"
              onClick={fillAhmedDemo}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
            >
              Ahmed (2 Seats)
            </button>
            <button
              type="button"
              onClick={fillGroupDemo}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer"
            >
              Group (-10%)
            </button>
          </div>
        </div>

        {/* Route Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {trips.map((trip) => {
            const isSelected = trip.trip_id === currentTrip.trip_id;
            const isFullyBooked = trip.available_seats === 0;
            return (
              <button
                key={trip.trip_id}
                onClick={() => {
                  setSelectedTripId(trip.trip_id);
                  setSelectedSeats([]);
                  setErrorMessage('');
                }}
                disabled={trip.trip_status === 'Cancelled'}
                className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'glass-card border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                } ${trip.trip_status === 'Cancelled' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-400'
                  }`}>
                    {trip.route_id}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Rs. {trip.route?.base_fare?.toLocaleString()}
                  </span>
                </div>

                <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5 truncate">
                  <span>{trip.route?.departure_city}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-amber-300">{trip.route?.destination_city}</span>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">{trip.departure_datetime}</span>
                  <span className={`font-mono font-bold ${isFullyBooked ? 'text-rose-400' : 'text-slate-300'}`}>
                    {trip.available_seats} left
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Reservation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Seat Cabin */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Interactive 2×2 Cabin Seat Map
              </h3>
              <p className="text-xs text-slate-400">
                Click on any green seat to reserve. Occupied seats are locked.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Bus: <strong className="text-amber-400">{currentTrip.bus?.bus_number}</strong>
              </span>
            </div>
          </div>

          <SeatGrid
            totalCapacity={currentTrip.bus?.total_capacity || 40}
            occupiedSeats={currentTrip.occupied_seats || []}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            busNumber={currentTrip.bus?.bus_number}
            busType={currentTrip.bus?.bus_type}
          />
        </div>

        {/* Right Column: Checkout & Passenger Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Passenger Form Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-amber-400" />
              Passenger Credentials
            </h3>

            {/* Error banner */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name (BR-01 Validation) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ahmed"
                  value={passengerName}
                  onChange={(e) => {
                    setPassengerName(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Phone & Age row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="0300-1234567"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Age (1-120 BR-02) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="24"
                    value={passengerAge}
                    onChange={(e) => {
                      setPassengerAge(e.target.value);
                      setErrorMessage('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Selected Seats summary tag */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Assigned Seat Numbers:
                </label>
                <div className="min-h-10 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                  {selectedSeats.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No seats selected yet. Click cabin map above.</span>
                  ) : (
                    selectedSeats.map(seat => (
                      <span key={seat} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold font-mono text-xs shadow-sm">
                        {seat}
                        <button
                          type="button"
                          onClick={() => handleToggleSeat(seat)}
                          className="hover:text-rose-900 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Fare Card (BR-08) */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/20 shadow-xl space-y-2.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Base Fare ({seatCount} × Rs. {baseFare.toLocaleString()})</span>
                  <span className="font-mono text-slate-200">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {/* Group discount banner */}
                {isDiscountEligible && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-between items-center text-xs p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300"
                  >
                    <span className="flex items-center gap-1 font-semibold">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      10% Group Discount (4+ seats)
                    </span>
                    <span className="font-mono font-bold">- Rs. {discountAmount.toLocaleString()}</span>
                  </motion.div>
                )}

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Total Amount</span>
                    <span className="text-[11px] text-emerald-400 font-medium">All taxes & fees included</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent font-mono">
                      Rs. {totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading || selectedSeats.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Transaction...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Booking & Generate Pass</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
