import React from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Calendar,
  Trash2,
  Check
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext.js';
import { ClinicNotification } from '../../types/notification.js';

export const NotificationPanel: React.FC = () => {
  const {
    notifications,
    acceptEarlierSlot,
    declineEarlierSlot,
    markNotificationAsRead,
    clearAllNotifications,
  } = useClinic();

  const pendingSlotNotifications = notifications.filter(
    (n) => n.type === 'EARLIER_SLOT' && n.status === 'PENDING'
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 relative">
            <Bell className="w-5 h-5" />
            {pendingSlotNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-ping"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Queue & Slot Alerts</h2>
              {pendingSlotNotifications.length > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-200 animate-pulse">
                  {pendingSlotNotifications.length} Action Needed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">Live no-show slot reassignments & queue alerts</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
            title="Clear all alerts"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-slate-100 my-2 max-h-[380px] overflow-y-auto pr-1 space-y-2">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No new notifications</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Slot openings from no-shows and queue updates will appear here
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isEarlierSlot = notif.type === 'EARLIER_SLOT';
            const isQueueUpdate = notif.type === 'QUEUE_UPDATE';
            const isNoShow = notif.type === 'NO_SHOW';
            const isPending = notif.status === 'PENDING';

            return (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl transition-all border ${
                  isEarlierSlot && isPending
                    ? 'bg-amber-50/60 border-amber-200 shadow-xs'
                    : isEarlierSlot && notif.status === 'ACCEPTED'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : isEarlierSlot && notif.status === 'DECLINED'
                    ? 'bg-slate-50 border-slate-200'
                    : isNoShow
                    ? 'bg-rose-50/40 border-rose-200/80'
                    : 'bg-slate-50/70 border-slate-200/60'
                }`}
              >
                {/* Top Row: Type, Title & Time */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isEarlierSlot ? (
                      <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                    ) : isQueueUpdate ? (
                      <span className="p-1 rounded-lg bg-blue-100 text-blue-800">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-lg bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <h3 className="font-bold text-xs text-slate-900 leading-tight">
                      {notif.title}
                    </h3>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {notif.createdAt}
                  </span>
                </div>

                {/* Body Message */}
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {notif.message}
                </p>

                {/* Earlier Slot Highlight Visual */}
                {isEarlierSlot && notif.originalSlot && notif.offeredSlot && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-amber-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Original Slot</span>
                      <span className="font-mono font-semibold text-slate-700 line-through">
                        {notif.originalSlot}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-amber-500" />

                    <div className="text-right">
                      <span className="text-[11px] text-emerald-700 font-bold block">
                        New Available Slot
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {notif.offeredSlot}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons for EARLIER_SLOT */}
                {isEarlierSlot && isPending && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-end gap-2">
                    <button
                      onClick={() => declineEarlierSlot(notif.id)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
                    >
                      Keep Current Slot
                    </button>
                    <button
                      onClick={() => acceptEarlierSlot(notif.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept Earlier Slot</span>
                    </button>
                  </div>
                )}

                {/* Status Badges for non-pending or completed */}
                {isEarlierSlot && !isPending && (
                  <div className="mt-2 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        notif.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {notif.status === 'ACCEPTED' ? 'Slot Accepted' : 'Original Slot Kept'}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
