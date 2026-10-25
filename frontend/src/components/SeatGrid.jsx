import React from 'react';
import { motion } from 'framer-motion';
import { Armchair, CircleUserRound, Shield, Sparkles } from 'lucide-react';

export default function SeatGrid({
  totalCapacity = 40,
  occupiedSeats = [],
  selectedSeats = [],
  onToggleSeat,
  busNumber = "KB-4001",
  busType = "Luxury AC Cruiser"
}) {
  // Generate seat labels in 2x2 rows: A1, A2 | A3, A4; B1, B2 | B3, B4...
  const rowsCount = Math.ceil(totalCapacity / 4);
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const rows = [];
  let seatCounter = 1;

  for (let r = 0; r < rowsCount; r++) {
    const letter = rowLetters[r % 26];
    const rowSeats = [];
    for (let c = 1; c <= 4; c++) {
      if (seatCounter <= totalCapacity) {
        const seatId = `${letter}${c}`;
        rowSeats.push({
          id: seatId,
          number: seatCounter,
          col: c,
        });
        seatCounter++;
      } else {
        rowSeats.push(null);
      }
    }
    rows.push(rowSeats);
  }

  const isOccupied = (id) => occupiedSeats.includes(id);
  const isSelected = (id) => selectedSeats.includes(id);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Cabin Legend */}
      <div className="w-full max-w-md flex items-center justify-between px-4 py-2 mb-4 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/50"></div>
          <span className="text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-400"></div>
          <span className="text-amber-300 font-semibold">Selected ({selectedSeats.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></div>
          <span className="text-slate-500">Occupied</span>
        </div>
      </div>

      {/* Bus Cabin Frame */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-slate-900/90 rounded-3xl p-6 border-2 border-slate-800 shadow-2xl overflow-hidden">
        {/* Ambient Top Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px]"></div>

        {/* Driver Cabin & Windshield */}
        <div className="pb-5 mb-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 mb-3">
            <span className="flex items-center gap-1 font-mono text-amber-400/90">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              {busNumber} • {busType}
            </span>
            <span className="font-mono text-slate-500">{totalCapacity} Seats</span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-2xl border border-slate-800/60">
            {/* Driver section */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-inner">
                {/* Steering wheel graphic */}
                <svg className="w-5 h-5 text-amber-500/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                  <line x1="12" y1="12" x2="4.93" y2="19.07" />
                  <line x1="12" y1="12" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-300">Driver Cabin</p>
                <p className="text-[10px] text-slate-500">Captain on Duty</p>
              </div>
            </div>

            {/* Entrance Door */}
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Front Door 🚪
              </span>
            </div>
          </div>
        </div>

        {/* 2x2 Cabin Seat Matrix */}
        <div className="space-y-3">
          {rows.map((rowSeats, rowIndex) => {
            const leftPair = rowSeats.slice(0, 2);
            const rightPair = rowSeats.slice(2, 4);

            return (
              <div key={rowIndex} className="flex items-center justify-between gap-3">
                {/* Left Side: 2 Seats */}
                <div className="flex items-center gap-2">
                  {leftPair.map((seat, idx) => (
                    <SeatButton
                      key={idx}
                      seat={seat}
                      occupied={seat ? isOccupied(seat.id) : false}
                      selected={seat ? isSelected(seat.id) : false}
                      onToggle={onToggleSeat}
                    />
                  ))}
                </div>

                {/* Central Aisle */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-6 w-px bg-slate-800/80 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-1 py-0.5 rounded">
                      {rowIndex + 1}
                    </span>
                  </div>
                </div>

                {/* Right Side: 2 Seats */}
                <div className="flex items-center gap-2">
                  {rightPair.map((seat, idx) => (
                    <SeatButton
                      key={idx}
                      seat={seat}
                      occupied={seat ? isOccupied(seat.id) : false}
                      selected={seat ? isSelected(seat.id) : false}
                      onToggle={onToggleSeat}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bus Rear Section */}
        <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Emergency Exit ◄</span>
          <span>Rear Cabin</span>
          <span>► Emergency Exit</span>
        </div>
      </div>
    </div>
  );
}

function SeatButton({ seat, occupied, selected, onToggle }) {
  if (!seat) {
    return <div className="w-11 h-11"></div>;
  }

  let statusClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-400";
  let content = seat.id;

  if (occupied) {
    statusClass = "bg-slate-800/80 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60";
  } else if (selected) {
    statusClass = "bg-gradient-to-tr from-amber-500 to-amber-400 border-amber-300 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/60 scale-105";
  }

  return (
    <motion.button
      type="button"
      whileTap={!occupied ? { scale: 0.92 } : {}}
      disabled={occupied}
      onClick={() => onToggle(seat.id)}
      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center border text-xs font-mono transition-all duration-150 cursor-pointer ${statusClass}`}
      title={occupied ? `Seat ${seat.id}: Occupied` : selected ? `Seat ${seat.id}: Click to remove` : `Seat ${seat.id}: Click to select`}
    >
      <Armchair className={`w-3.5 h-3.5 mb-0.5 ${occupied ? 'text-slate-600' : selected ? 'text-slate-950' : 'text-emerald-400'}`} />
      <span className="text-[10px] leading-none font-bold">{content}</span>
    </motion.button>
  );
}
