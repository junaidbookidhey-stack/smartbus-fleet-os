import React from 'react';
import { Bus, Compass, ArrowLeftRight, Search, BarChart3, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onReset, isResetting, serverStatus }) {
  const tabs = [
    { id: 'booking', label: 'Routes & Booking', icon: Compass },
    { id: 'fleet', label: 'Fleet & Bus Swaps', icon: ArrowLeftRight },
    { id: 'search', label: 'Ticket Search', icon: Search },
    { id: 'analytics', label: 'Real-Time Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <Bus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                SmartBus<span className="text-amber-500 font-mono text-xs uppercase tracking-wider ml-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">Fleet OS</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Commercial Reservation & Swaps Suite</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-500/25 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Server status pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-mono">FastAPI + SQLite</span>
          </div>

          {/* PRD baseline reset button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            title="Reset database to initial PRD baseline (R101-R105, 0 bookings)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-amber-400 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Reset PRD State</span>
          </button>
        </div>
      </div>
    </header>
  );
}
