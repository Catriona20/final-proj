import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, X, AlertCircle, Calendar, Play } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext.js';

export const DemoTimeController: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [clockState, setClockState] = useState<{
    simulated: boolean;
    currentTime: string;
    todayDate: string;
    timezone: string;
  }>({
    simulated: false,
    currentTime: '',
    todayDate: '',
    timezone: 'Asia/Kolkata'
  });

  const [dateInput, setDateInput] = useState('2026-09-09');
  const [timeInput, setTimeInput] = useState('01:30 PM');
  const [loading, setLoading] = useState(false);
  const { refreshData, addToast } = useClinic();

  const fetchClockState = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/simulation/demo-clock');
      const data = await res.json();
      if (data && data.clock) {
        setClockState(data.clock);
        if (data.clock.todayDate) setDateInput(data.clock.todayDate);
        if (data.clock.currentTime) setTimeInput(data.clock.currentTime);
      }
    } catch (e) {
      console.warn('Could not fetch demo clock:', e);
    }
  };

  useEffect(() => {
    fetchClockState();
    const interval = setInterval(fetchClockState, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSetSimulated = async (date: string, time: string) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/simulation/demo-clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time }),
      });
      const data = await res.json();
      if (data.success) {
        setClockState(data.clock);
        addToast('success', 'Demo Clock Updated ⏱️', `Simulated time set to: ${data.clock.todayDate} ${data.clock.currentTime}`);
        refreshData();
      }
    } catch (err: any) {
      addToast('error', 'Demo Clock Error', err.message || 'Failed to update demo clock');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToReal = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/simulation/demo-clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const data = await res.json();
      if (data.success) {
        setClockState(data.clock);
        addToast('info', 'Real Clock Restored ⏱️', 'System clock restored to actual real time.');
        refreshData();
      }
    } catch (err: any) {
      addToast('error', 'Demo Clock Error', err.message || 'Failed to reset clock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating or Header trigger badge */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors shadow-2xs ${
          clockState.simulated
            ? 'bg-amber-500/10 text-amber-800 border-amber-300 hover:bg-amber-500/20 animate-pulse'
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
        }`}
        title="Open Simulated Demo Clock Controller (Development Only)"
      >
        <Clock className={`w-3.5 h-3.5 ${clockState.simulated ? 'text-amber-600' : 'text-slate-500'}`} />
        <span className="font-mono text-[11px]">
          {clockState.simulated ? `[SIM] ${clockState.todayDate} ${clockState.currentTime}` : 'Real Clock'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">DEMO / DEVELOPMENT ONLY</h3>
                  <p className="text-[11px] text-slate-400">Cross-App System Clock Controller</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Current Status Box */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                clockState.simulated ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={`w-2 h-2 rounded-full ${clockState.simulated ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className={clockState.simulated ? 'text-amber-800 font-bold' : 'text-slate-700'}>
                      {clockState.simulated ? 'SIMULATED TIME ACTIVE' : 'REAL SYSTEM TIME ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    {clockState.todayDate} • {clockState.currentTime} ({clockState.timezone})
                  </p>
                </div>
                {clockState.simulated && (
                  <button
                    onClick={handleResetToReal}
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Simulation Testing Presets
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetSimulated('2026-09-08', '09:30 PM')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Sep 8, 2026 • 09:30 PM</span>
                      <p className="text-[11px] text-slate-500">Night / Clinic Closed (Tomorrow apt is Upcoming)</p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSimulated('2026-09-09', '01:30 PM')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Sep 9, 2026 • 01:30 PM</span>
                      <p className="text-[11px] text-slate-500">Check-in Window Opens (30m before 02:00 PM)</p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSimulated('2026-09-09', '02:00 PM')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Sep 9, 2026 • 02:00 PM</span>
                      <p className="text-[11px] text-slate-500">Scheduled Slot Time (Arrival & Grace Period Active)</p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSimulated('2026-09-09', '02:11 PM')}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">Sep 9, 2026 • 02:11 PM</span>
                      <p className="text-[11px] text-rose-600 font-medium">Slot + 10m Grace Passed (Eligible for No-Show)</p>
                    </div>
                    <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Custom Date / Time inputs */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Custom Simulated Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Time (e.g. 02:00 PM)</label>
                    <input
                      type="text"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      placeholder="02:00 PM"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToReal}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset to Real Time
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSimulated(dateInput, timeInput)}
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  {loading ? 'Applying...' : 'Apply Simulation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
