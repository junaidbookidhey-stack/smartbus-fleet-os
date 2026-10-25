import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Ticket, 
  Ban, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  Phone, 
  User, 
  CreditCard,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function TicketSearch({
  bookings = [],
  trips = [],
  onCancelBooking,
  onViewBoardingPass,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [errorFeedback, setErrorFeedback] = useState(null);

  // Filter bookings by booking_id, passenger_name, or passenger_phone
  const filteredBookings = bookings.filter(b => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      b.booking_id.toLowerCase().includes(term) ||
      b.passenger_name.toLowerCase().includes(term) ||
      (b.passenger_phone && b.passenger_phone.toLowerCase().includes(term))
    );
  });

  const handleCancel = async (booking) => {
    if (booking.status === 'Cancelled') {
      setErrorFeedback(`BR-10 Error: Booking ${booking.booking_id} is already cancelled.`);
      setTimeout(() => setErrorFeedback(null), 4000);
      return;
    }

    if (!window.confirm(`Are you sure you want to cancel booking ${booking.booking_id} for ${booking.passenger_name}? Seats will be restored to trip.`)) {
      return;
    }

    setCancellingId(booking.booking_id);
    setErrorFeedback(null);
    setCancelFeedback(null);

    try {
      const res = await onCancelBooking(booking.booking_id);
      setCancelFeedback({
        id: booking.booking_id,
        seats: res.restored_seats,
        trip_id: res.trip_id,
        available_seats: res.trip_available_seats
      });
      setTimeout(() => setCancelFeedback(null), 5000);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Cancellation rejected.';
      setErrorFeedback(msg);
      setTimeout(() => setErrorFeedback(null), 5000);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-400" />
              Ticket Search & Cancellation Audit
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Lookup tickets by ID (e.g. B1001), phone, or passenger name. Cancel bookings with automatic seat restoration (BR-09, BR-10).
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search B1001, Ahmed, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Feedback alerts */}
        <AnimatePresence>
          {cancelFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Success:</strong> Booking {cancelFeedback.id} cancelled. Exactly {cancelFeedback.seats} seat(s) restored back to trip {cancelFeedback.trip_id} (Available now: {cancelFeedback.available_seats}).
                </span>
              </div>
              <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">BR-10 Verified</span>
            </motion.div>
          )}

          {errorFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Reservations Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? 'No tickets match your search criteria.' : 'Book a ticket in the "Routes & Booking" tab to view audit records here.'}
            </p>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const isCancelled = b.status === 'Cancelled';
            const trip = trips.find(t => t.trip_id === b.trip_id);

            return (
              <motion.div
                key={b.booking_id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-panel rounded-2xl p-4 md:p-5 border transition-all ${
                  isCancelled
                    ? 'border-slate-800/80 bg-slate-900/40 opacity-75'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start md:items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                      isCancelled
                        ? 'bg-slate-800 text-slate-500 border border-slate-700'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {b.booking_id}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{b.passenger_name}</span>
                        <span className="text-xs text-slate-400">({b.passenger_age} yrs)</span>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400 font-mono">
                        <span>Trip: <strong className="text-slate-200">{b.trip_id}</strong> ({trip?.route?.departure_city} → {trip?.route?.destination_city})</span>
                        <span>Phone: <strong className="text-slate-200">{b.passenger_phone}</strong></span>
                        <span>Time: {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle seats & fare */}
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Seats</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {b.seat_numbers.map(s => (
                          <span
                            key={s}
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              isCancelled
                                ? 'bg-slate-800 text-slate-500 line-through'
                                : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">Fare</span>
                      <span className={`text-base font-mono font-black ${
                        isCancelled ? 'text-slate-500 line-through' : 'text-amber-400'
                      }`}>
                        Rs. {b.total_fare?.toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewBoardingPass(b)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="View Official Boarding Pass"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {!isCancelled ? (
                        <button
                          onClick={() => handleCancel(b)}
                          disabled={cancellingId === b.booking_id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                          title="Cancel Booking & Restore Seats (BR-10)"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancel Ticket</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 italic px-2 py-1 bg-slate-800/40 rounded border border-slate-800">
                          Audit Preserved (BR-11)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
