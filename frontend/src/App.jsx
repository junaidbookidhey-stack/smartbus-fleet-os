import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  getTrips, 
  getBuses, 
  getBookings, 
  getAnalytics, 
  createBooking, 
  cancelBooking, 
  swapTripBus, 
  cancelTrip, 
  resetDatabase 
} from './api';

import Navbar from './components/Navbar';
import BookingSection from './components/BookingSection';
import FleetDispatchBoard from './components/FleetDispatchBoard';
import TicketSearch from './components/TicketSearch';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import BoardingPassModal from './components/BoardingPassModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'fleet' | 'search' | 'analytics'
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [selectedTripId, setSelectedTripId] = useState('T101');
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Modal for official boarding pass
  const [activeBoardingPass, setActiveBoardingPass] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initial load
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [tripsRes, busesRes, bookingsRes, analyticsRes] = await Promise.all([
        getTrips(),
        getBuses(),
        getBookings(),
        getAnalytics()
      ]);

      setTrips(tripsRes.data);
      setBuses(busesRes.data);
      setBookings(bookingsRes.data);
      setAnalytics(analyticsRes.data);

      if (!selectedTripId && tripsRes.data.length > 0) {
        setSelectedTripId(tripsRes.data[0].trip_id);
      }
    } catch (err) {
      console.error('Failed to sync SmartBus data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle booking creation
  const handleBookingSuccess = async (bookingData) => {
    const response = await createBooking(bookingData);
    const newBooking = response.data;

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Confetti fallback
    }

    // Refresh trips, bookings, and analytics in real-time
    await loadAllData();

    // Open boarding pass modal
    setActiveBoardingPass(newBooking);
    return newBooking;
  };

  // Handle bus swap
  const handleSwapBus = async (tripId, data) => {
    const res = await swapTripBus(tripId, data);
    await loadAllData();
    return res.data;
  };

  // Handle trip cancellation
  const handleCancelTrip = async (tripId) => {
    const res = await cancelTrip(tripId);
    await loadAllData();
    return res.data;
  };

  // Handle ticket cancellation
  const handleCancelBooking = async (bookingId) => {
    const res = await cancelBooking(bookingId);
    await loadAllData();
    return res.data;
  };

  // Handle database reset
  const handleReset = async () => {
    if (!window.confirm("Reset database to initial PRD baseline? All bookings will be cleared and R101-R105 refreshed.")) {
      return;
    }
    setIsResetting(true);
    try {
      await resetDatabase();
      setSelectedSeats([]);
      await loadAllData();
    } catch (err) {
      console.error('Reset failed:', err);
      alert('Reset failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsResetting(false);
    }
  };

  const currentTripForPass = trips.find(t => t.trip_id === activeBoardingPass?.trip_id);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        isResetting={isResetting}
        serverStatus="online"
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {activeTab === 'booking' && (
          <BookingSection
            trips={trips}
            selectedTripId={selectedTripId}
            setSelectedTripId={setSelectedTripId}
            selectedSeats={selectedSeats}
            setSelectedSeats={setSelectedSeats}
            onBookingSuccess={handleBookingSuccess}
          />
        )}

        {activeTab === 'fleet' && (
          <FleetDispatchBoard
            trips={trips}
            buses={buses}
            onSwapBus={handleSwapBus}
            onCancelTrip={handleCancelTrip}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'search' && (
          <TicketSearch
            bookings={bookings}
            trips={trips}
            onCancelBooking={handleCancelBooking}
            onViewBoardingPass={(b) => setActiveBoardingPass(b)}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            analytics={analytics}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Luxury Digital Boarding Pass Modal */}
      {activeBoardingPass && (
        <BoardingPassModal
          booking={activeBoardingPass}
          trip={currentTripForPass}
          onClose={() => setActiveBoardingPass(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>SmartBus Fleet OS v2.0 • Antigravity Production Architecture</span>
          <span className="text-amber-400/80">Python 3.11+ FastAPI • SQLite ACID • React 18 + Tailwind</span>
        </div>
      </footer>
    </div>
  );
}
