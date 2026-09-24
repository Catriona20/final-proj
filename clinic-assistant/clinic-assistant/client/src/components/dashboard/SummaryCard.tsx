import React from 'react';
import { CalendarDays, CheckCircle2, Clock, Stethoscope, Footprints, LucideIcon } from 'lucide-react';
import { DashboardSummary } from '../../types/dashboard.js';

interface SummaryCardsProps {
  summary: DashboardSummary;
  onCardClick?: (type: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onCardClick }) => {
  const cards = [
    {
      id: 'appointments',
      title: "Today's Appointments",
      value: summary.todayAppointments.total,
      subtitle: `${summary.todayAppointments.remaining} remaining`,
      icon: CalendarDays,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200/60',
      badgeBg: 'bg-blue-50 text-blue-700',
      accentColor: 'border-l-blue-500',
    },
    {
      id: 'checked-in',
      title: 'Checked In',
      value: summary.checkedIn.total,
      subtitle: summary.checkedIn.subtitle,
      icon: CheckCircle2,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-200/60',
      badgeBg: 'bg-teal-50 text-teal-700',
      accentColor: 'border-l-teal-500',
    },
    {
      id: 'waiting',
      title: 'Waiting',
      value: summary.waiting.total,
      subtitle: summary.waiting.subtitle,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/60',
      badgeBg: 'bg-amber-50 text-amber-700',
      accentColor: 'border-l-amber-500',
    },
    {
      id: 'doctors',
      title: 'Available Doctors',
      value: summary.availableDoctors.available,
      subtitle: summary.availableDoctors.subtitle,
      icon: Stethoscope,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
      badgeBg: 'bg-emerald-50 text-emerald-700',
      accentColor: 'border-l-emerald-500',
    },
    {
      id: 'walk-ins',
      title: 'Walk-ins',
      value: summary.walkIns.total,
      subtitle: summary.walkIns.subtitle,
      icon: Footprints,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200/60',
      badgeBg: 'bg-purple-50 text-purple-700',
      accentColor: 'border-l-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon: LucideIcon = card.icon;
        return (
          <div
            key={card.id}
            id={`summary-card-${card.id}`}
            onClick={() => onCardClick && onCardClick(card.id)}
            className="group relative bg-white p-5 rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                  {card.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                </div>
              </div>
              <div
                className={`p-2.5 rounded-xl border ${card.iconBg} transition-transform group-hover:scale-105`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
