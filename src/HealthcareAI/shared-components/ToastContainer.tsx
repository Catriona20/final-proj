import React from 'react';
import { NotificationItem } from '../types';
import { Bell, CheckCircle2, AlertCircle, Clock, Zap, X } from 'lucide-react';

interface ToastContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onActionSlotShift?: (slot: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  notifications,
  onDismiss,
  onActionSlotShift,
}) => {
  const visibleToasts = notifications.slice(0, 3);

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
      {visibleToasts.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-xl p-4 rounded-2xl border border-healthcare-500/40 shadow-2xl transition-all duration-300 transform animate-bounce-short"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-healthcare-500/20 text-healthcare-400 mt-0.5">
                {n.type === 'earlier_slot' ? (
                  <Zap className="w-5 h-5 animate-pulse text-amber-400" />
                ) : n.type === 'emergency_delay' ? (
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <div>
                <h5 className="font-bold text-sm text-white">{n.title}</h5>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 block mt-2 font-mono">
                  {n.timestamp}
                </span>

                {/* Slot Shift Action Button */}
                {n.type === 'earlier_slot' && n.actionableSlot && onActionSlotShift && (
                  <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onActionSlotShift(n.actionableSlot!)}
                      className="px-3 py-1.5 rounded-lg bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold text-xs shadow-md transition"
                    >
                      Accept Slot Shift ({n.actionableSlot})
                    </button>
                    <button
                      onClick={() => onDismiss(n.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss(n.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
