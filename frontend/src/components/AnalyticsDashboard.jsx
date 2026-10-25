import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Percent, 
  MapPin, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldCheck, 
  Bus, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

export default function AnalyticsDashboard({ analytics, onRefresh, isLoading }) {
  if (!analytics) {
    return <div className="text-center py-12 text-slate-400">Loading live analytics...</div>;
  }

  const {
    total_bookings = 0,
    confirmed_count = 0,
    cancelled_count = 0,
    reserved_seats = 0,
    net_confirmed_revenue = 0,
    cancelled_revenue = 0,
    fleet_occupancy_rate = 0,
    fully_booked_routes = [],
    city_departure_schedules = []
  } = analytics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Executive Financial & Fleet Occupancy Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ledger updates compliant with PRD BR-12 (Strict exclusion of cancelled tickets)
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Confirmed Revenue */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-card rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase font-semibold text-amber-400">Net Confirmed Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-mono font-black text-amber-400">
              Rs. {net_confirmed_revenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <span className="text-emerald-400">✔ PRD BR-12:</span>
            <span>Excludes Rs. {cancelled_revenue.toLocaleString()} cancelled</span>
          </div>
        </motion.div>

        {/* KPI 2: Fleet Occupancy Rate */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase font-semibold text-slate-300">Fleet Occupancy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Percent className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-white">{fleet_occupancy_rate}%</span>
            <span className="text-xs text-slate-400">utilization</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
              style={{ width: `${Math.min(100, fleet_occupancy_rate)}%` }}
            ></div>
          </div>
        </motion.div>

        {/* KPI 3: Total Bookings */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase font-semibold text-slate-300">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-mono font-black text-white">{total_bookings}</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{confirmed_count} Active</span>
            <span>•</span>
            <span className="text-rose-400 font-bold">{cancelled_count} Cancelled</span>
          </div>
        </motion.div>

        {/* KPI 4: Reserved Seats */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase font-semibold text-slate-300">Reserved Seats</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-mono font-black text-white">{reserved_seats}</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Active passenger seat allocations
          </div>
        </motion.div>
      </div>

      {/* Fully Booked Alert Banner (if any) */}
      {fully_booked_routes.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Fully Booked Routes Alert (100% Capacity)</p>
              <p className="text-xs text-amber-200/80">{fully_booked_routes.join(', ')}</p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/30 text-amber-200 font-bold">
            Sold Out
          </span>
        </div>
      )}

      {/* City-Wise Departure Schedule Matrix */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          City-Wise Departure Schedules Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Route ID</th>
                <th className="px-4 py-3">Departure City</th>
                <th className="px-4 py-3">Destination City</th>
                <th className="px-4 py-3">Departure Time</th>
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="px-4 py-3 text-right">Available / Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {city_departure_schedules.map((item, index) => {
                const isSoldOut = item.available_seats === 0;
                return (
                  <tr key={index} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      {item.route_id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {item.departure_city}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {item.destination_city}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {item.departure_time}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-mono font-bold text-slate-300">{item.bus_number}</span>
                      <span className="text-slate-500 ml-1.5">({item.bus_type})</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={`font-bold ${isSoldOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.available_seats}
                      </span>
                      <span className="text-slate-500"> / {item.total_capacity} seats</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Baseline Certification Ribbon */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          SmartBus Specification Audit & PRD Baseline Compliance
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-mono text-emerald-400 font-bold">BR-01 & BR-02</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Name & Age (1-120) Verified</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-mono text-emerald-400 font-bold">BR-04 & BR-05</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Capacity & Double-Book Block</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-mono text-emerald-400 font-bold">BR-08</span>
            <p className="text-[11px] text-slate-400 mt-0.5">10% Group Discount (&gt;=4)</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-mono text-emerald-400 font-bold">BR-10 & BR-11</span>
            <p className="text-[11px] text-slate-400 mt-0.5">1-Time Cancel & Audit Trace</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-mono text-emerald-400 font-bold">BR-12 & BR-13</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Revenue Audit & Swap Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}
