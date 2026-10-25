import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bus, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  Layers, 
  RefreshCw, 
  Clock, 
  Ban,
  Wrench,
  AlertCircle
} from 'lucide-react';

export default function FleetDispatchBoard({
  trips = [],
  buses = [],
  onSwapBus,
  onCancelTrip,
  onRefresh
}) {
  const [selectedTripForSwap, setSelectedTripForSwap] = useState(null);
  const [selectedStandbyBusId, setSelectedStandbyBusId] = useState('');
  const [swapReason, setSwapReason] = useState('Engine Transmission Breakdown');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState('');
  const [swapSuccess, setSwapSuccess] = useState('');

  // Trip cancel modal state
  const [tripToCancel, setTripToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Filter buses by category
  const activeBuses = buses.filter(b => b.status === 'Active');
  const standbyBuses = buses.filter(b => b.status === 'Standby');
  const maintenanceBuses = buses.filter(b => b.status === 'Maintenance');

  const openSwapModal = (trip) => {
    setSelectedTripForSwap(trip);
    // Default to first standby bus if available
    const firstStandby = standbyBuses[0]?.bus_id || '';
    setSelectedStandbyBusId(firstStandby);
    setSwapError('');
    setSwapSuccess('');
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTripForSwap || !selectedStandbyBusId) return;

    setIsSwapping(true);
    setSwapError('');
    setSwapSuccess('');

    try {
      const res = await onSwapBus(selectedTripForSwap.trip_id, {
        new_bus_id: selectedStandbyBusId,
        reason: swapReason
      });
      setSwapSuccess(res.message || 'Bus swapped successfully!');
      setTimeout(() => {
        setSelectedTripForSwap(null);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Bus swap rejected.';
      setSwapError(msg);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleCancelTripSubmit = async () => {
    if (!tripToCancel) return;
    setIsCancelling(true);
    try {
      await onCancelTrip(tripToCancel.trip_id);
      setTripToCancel(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Trip cancellation failed.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Find candidate standby bus to calculate capacity safety check
  const candidateBus = buses.find(b => b.bus_id === selectedStandbyBusId);
  const currentTripBookedCount = selectedTripForSwap ? (selectedTripForSwap.occupied_seats?.length || 0) : 0;
  const isCapacitySafe = candidateBus ? (candidateBus.total_capacity >= currentTripBookedCount) : true;

  return (
    <div className="space-y-8">
      {/* Fleet Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-amber-400" />
            Commercial Fleet Registry & Emergency Operations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time vehicle allocations, standby bus dispatching, and BR-13 capacity safeguards
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Fleet State</span>
        </button>
      </div>

      {/* Fleet Status Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Fleet */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider font-semibold">Active Fleet</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-white">{activeBuses.length}</span>
            <span className="text-xs text-slate-400">deployed vehicles</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeBuses.map(b => (
              <span key={b.bus_id} className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                {b.bus_number} ({b.total_capacity} seats)
              </span>
            ))}
          </div>
        </div>

        {/* Standby Fleet */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider font-semibold">Standby Units</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-amber-400">{standbyBuses.length}</span>
            <span className="text-xs text-slate-400">ready for emergency swaps</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {standbyBuses.map(b => (
              <span key={b.bus_id} className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                {b.bus_number} ({b.total_capacity}s)
              </span>
            ))}
          </div>
        </div>

        {/* Maintenance Fleet */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-rose-400 tracking-wider font-semibold">Maintenance</span>
            <Wrench className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-black text-rose-400">{maintenanceBuses.length}</span>
            <span className="text-xs text-slate-400">depot workshop</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {maintenanceBuses.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No vehicles in maintenance</span>
            ) : (
              maintenanceBuses.map(b => (
                <span key={b.bus_id} className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  {b.bus_number} ({b.bus_type})
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trips Dispatch Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Bus className="w-4 h-4 text-amber-400" />
          Active Trip Schedules & Vehicle Assignments
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Trip ID</th>
                <th className="px-4 py-3">Route Corridor</th>
                <th className="px-4 py-3">Assigned Vehicle</th>
                <th className="px-4 py-3">Capacity & Occupancy</th>
                <th className="px-4 py-3">Trip Status</th>
                <th className="px-4 py-3 text-right">Emergency Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {trips.map(trip => {
                const bookedCount = trip.occupied_seats?.length || 0;
                const totalCap = trip.bus?.total_capacity || 40;
                const occupancyPercent = Math.round((bookedCount / totalCap) * 100);
                const isCancelled = trip.trip_status === 'Cancelled';

                return (
                  <tr key={trip.trip_id} className={`hover:bg-slate-900/50 transition-colors ${isCancelled ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                      {trip.trip_id}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">
                        {trip.route?.departure_city} → {trip.route?.destination_city}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {trip.route_id} • {trip.departure_datetime}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-sm font-bold text-slate-200">
                        {trip.bus?.bus_number}
                      </div>
                      <div className="text-xs text-slate-500">
                        {trip.bus?.bus_type}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${occupancyPercent >= 90 ? 'bg-rose-500' : occupancyPercent >= 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${occupancyPercent}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-xs text-slate-300">
                          {bookedCount}/{totalCap} ({trip.available_seats} free)
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        isCancelled
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCancelled ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                        {trip.trip_status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      {!isCancelled ? (
                        <>
                          <button
                            onClick={() => openSwapModal(trip)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-all cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Swap Bus</span>
                          </button>

                          <button
                            onClick={() => setTripToCancel(trip)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel Trip</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Trip Refunded & Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Swap Modal (BR-13) */}
      <AnimatePresence>
        {selectedTripForSwap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0f172a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-slate-100"
            >
              <button
                onClick={() => setSelectedTripForSwap(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Emergency Bus Replacement</h3>
                  <p className="text-xs text-slate-400 font-mono">Trip: {selectedTripForSwap.trip_id} ({selectedTripForSwap.route?.departure_city} → {selectedTripForSwap.route?.destination_city})</p>
                </div>
              </div>

              {/* Status messages */}
              {swapError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{swapError}</span>
                </div>
              )}

              {swapSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{swapSuccess}</span>
                </div>
              )}

              {/* Operational Resilience Safeguard Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Reserved Passengers:</span>
                  <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                    {currentTripBookedCount} seats booked
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Selected Standby Bus Capacity:</span>
                  <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded">
                    {candidateBus ? `${candidateBus.total_capacity} seats` : 'None'}
                  </span>
                </div>

                {/* Live Safety Check Indicator */}
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 mt-2 font-mono ${
                  isCapacitySafe
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}>
                  {isCapacitySafe ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>BR-13 SAFE: Capacity is sufficient for all {currentTripBookedCount} booked passengers.</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>BR-13 REJECTED: Standby capacity ({candidateBus?.total_capacity}) &lt; Booked seats ({currentTripBookedCount})!</span>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleSwapSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Standby Bus Replacement *
                  </label>
                  <select
                    value={selectedStandbyBusId}
                    onChange={(e) => {
                      setSelectedStandbyBusId(e.target.value);
                      setSwapError('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                    required
                  >
                    <option value="" disabled>-- Select a standby bus --</option>
                    {standbyBuses.map(b => (
                      <option key={b.bus_id} value={b.bus_id}>
                        {b.bus_number} — {b.bus_type} ({b.total_capacity} Seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Operational Reason / Audit Log
                  </label>
                  <input
                    type="text"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="e.g. Engine breakdown or tire defect"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTripForSwap(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSwapping || !selectedStandbyBusId}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSwapping ? 'Executing Swap...' : 'Execute Bus Swap'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Trip Cancellation Modal (BR-14) */}
      <AnimatePresence>
        {tripToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0f172a] border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-slate-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white">Emergency Trip Cancellation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to cancel trip <strong className="text-amber-400 font-mono">{tripToCancel.trip_id}</strong> ({tripToCancel.route?.departure_city} → {tripToCancel.route?.destination_city})?
              </p>

              <div className="my-4 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                <p>• All {tripToCancel.occupied_seats?.length || 0} active ticket bookings will be marked <strong>'Cancelled' & 'Refunded'</strong>.</p>
                <p>• All seats will be released.</p>
                <p>• This action is non-reversible (PRD BR-14).</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTripToCancel(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleCancelTripSubmit}
                  disabled={isCancelling}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isCancelling ? 'Processing...' : 'Confirm Bulk Cancellation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
