import React from 'react';
import { Footprints, Plus, Clock, Stethoscope, Phone, AlertCircle } from 'lucide-react';
import { WalkIn } from '../../types/walkin.js';

interface WalkInListProps {
  walkIns: WalkIn[];
  onAddWalkInClick: () => void;
}

export const WalkInList: React.FC<WalkInListProps> = ({ walkIns, onAddWalkInClick }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Walk-in Patients</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 rounded-full border border-purple-200/60">
                {walkIns.length} registered
              </span>
            </div>
            <p className="text-xs text-slate-500">Unscheduled arrivals & emergency intake</p>
          </div>
        </div>

        <button
          id="add-walkin-btn"
          onClick={onAddWalkInClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Walk-in</span>
        </button>
      </div>

      {/* Walk-in Items */}
      <div className="divide-y divide-slate-100 my-2 max-h-[380px] overflow-y-auto pr-1">
        {walkIns.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Footprints className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No walk-in patients yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Add Walk-in" to register arrivals</p>
          </div>
        ) : (
          walkIns.map((walkIn) => (
            <div
              key={walkIn.id}
              className="py-3.5 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {walkIn.patientName}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {walkIn.phone}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60 inline-block">
                    {walkIn.reason}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Reg: <strong className="text-slate-700">{walkIn.registeredAt}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      Pref: <strong className="text-teal-700">{walkIn.preferredDoctor}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {walkIn.status === 'WAITING' ? 'Waiting' : walkIn.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
