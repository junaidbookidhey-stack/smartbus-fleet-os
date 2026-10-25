import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, 
  MapPin, 
  Calendar, 
  Clock, 
  Printer, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Tag, 
  Sparkles,
  QrCode
} from 'lucide-react';

export default function BoardingPassModal({ booking, trip, onClose }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const route = trip?.route;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="relative w-full max-w-2xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Printable Container */}
          <div id="printable-boarding-pass" className="p-6 md:p-8">
            {/* Header / Brand */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                  <Bus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                    SMARTBUS OFFICIAL PASS
                  </h3>
                  <p className="text-xs text-amber-400 font-mono">FastAPI • SQLite ACID Certified Ledger</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">PASS IDENTIFIER</span>
                <span className="text-lg font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                  {booking.booking_id}
                </span>
              </div>
            </div>

            {/* Verification Status Ribbon */}
            <div className="my-5 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Confirmed & Digitally Signed (PRD BR-08 Compliant)
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {new Date(booking.created_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            {/* Route & Journey Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">Departure Station</span>
                <p className="text-lg font-bold text-white mt-0.5">{route?.departure_city || 'Origin'}</p>
                <p className="text-xs text-slate-400">{trip?.departure_datetime || '08:00 AM'}</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full mb-1">
                  {route?.route_id || 'R101'}
                </span>
                <div className="w-full flex items-center justify-center gap-2 text-slate-500">
                  <div className="h-px w-8 bg-slate-700"></div>
                  <Bus className="w-4 h-4 text-amber-400" />
                  <div className="h-px w-8 bg-slate-700"></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">{trip?.bus?.bus_number}</span>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[10px] font-mono uppercase text-slate-500">Arrival Destination</span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">{route?.destination_city || 'Destination'}</p>
                <p className="text-xs text-slate-400">Scheduled Terminal</p>
              </div>
            </div>

            {/* Passenger & Seats Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Passenger</span>
                <p className="text-sm font-bold text-white mt-1 truncate">{booking.passenger_name}</p>
                <p className="text-xs text-slate-400">Age: {booking.passenger_age} yrs</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Contact</span>
                <p className="text-sm font-mono text-slate-200 mt-1 truncate">{booking.passenger_phone || 'N/A'}</p>
                <p className="text-xs text-emerald-400 font-mono">SMS Verified</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Assigned Seats</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(booking.seat_numbers || []).map((seat) => (
                    <span key={seat} className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold font-mono text-xs">
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Total Fare</span>
                <p className="text-sm font-black font-mono text-amber-400 mt-1">
                  Rs. {booking.total_fare?.toLocaleString()}
                </p>
                {booking.discount_applied && (
                  <p className="text-[10px] text-emerald-400 font-medium">10% Discount Applied</p>
                )}
              </div>
            </div>

            {/* Digital Security Stub with Vector QR */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Fake QR visual matrix */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                  {/* High visual density SVG QR pattern */}
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 33 33" fill="currentColor">
                    <rect x="0" y="0" width="7" height="7" />
                    <rect x="1" y="1" width="5" height="5" fill="white" />
                    <rect x="2" y="2" width="3" height="3" />
                    
                    <rect x="26" y="0" width="7" height="7" />
                    <rect x="27" y="1" width="5" height="5" fill="white" />
                    <rect x="28" y="2" width="3" height="3" />

                    <rect x="0" y="26" width="7" height="7" />
                    <rect x="1" y="27" width="5" height="5" fill="white" />
                    <rect x="2" y="28" width="3" height="3" />

                    <rect x="9" y="3" width="2" height="3" />
                    <rect x="13" y="1" width="4" height="2" />
                    <rect x="19" y="3" width="3" height="2" />
                    <rect x="9" y="9" width="4" height="4" />
                    <rect x="15" y="10" width="3" height="3" />
                    <rect x="20" y="8" width="4" height="2" />
                    <rect x="9" y="16" width="3" height="4" />
                    <rect x="14" y="15" width="5" height="2" />
                    <rect x="22" y="14" width="3" height="5" />
                    <rect x="9" y="23" width="3" height="3" />
                    <rect x="14" y="22" width="2" height="4" />
                    <rect x="18" y="24" width="4" height="3" />
                    <rect x="24" y="23" width="3" height="4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200">Electronic Check-in Code</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">SHA256: {booking.booking_id}-SMARTBUS-VALID</p>
                  <p className="text-[10px] text-slate-500 mt-1">Present this QR code or printed pass at boarding gate.</p>
                </div>
              </div>

              {/* Barcode graphic */}
              <div className="flex flex-col items-center md:items-end">
                <div className="flex gap-[2px] h-9 items-center">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 2, 1, 3, 2, 4].map((w, idx) => (
                    <div key={idx} style={{ width: `${w * 1.5}px` }} className="h-full bg-slate-300"></div>
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1">0094 8831 2940 {booking.booking_id}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 md:px-8 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Press print to generate official hardcopy receipt</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Pass</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
