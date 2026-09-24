import React, { useState } from 'react';
import { Clinic } from '../types';
import { MapPin, Navigation, Clock, Star, Compass, Layers } from 'lucide-react';

interface InteractiveMapProps {
  clinics: Clinic[];
  selectedClinicId: string;
  onSelectClinic: (clinicId: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  clinics,
  selectedClinicId,
  onSelectClinic,
}) => {
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard');
  const selectedClinic = clinics.find(c => c.id === selectedClinicId) || clinics[0];

  return (
    <div className="relative w-full h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-slate-900 group">
      
      {/* Map Background SVG Grid Canvas */}
      <svg className="w-full h-full absolute inset-0 bg-[#0F172A]" viewBox="0 0 800 420">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          </pattern>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFD6B5" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Map Terrain Features / Roads / Blocks */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Simulated Road Arteries */}
        <path d="M 50 200 Q 250 80 450 220 T 750 350" fill="none" stroke="#1E293B" strokeWidth="18" />
        <path d="M 50 200 Q 250 80 450 220 T 750 350" fill="none" stroke="#334155" strokeWidth="12" />

        <path d="M 200 400 Q 300 200 650 50" fill="none" stroke="#1E293B" strokeWidth="16" />
        <path d="M 200 400 Q 300 200 650 50" fill="none" stroke="#334155" strokeWidth="10" />

        {/* User Location Pulse Marker */}
        <g transform="translate(180, 260)">
          <circle r="18" fill="#FF8A3D" opacity="0.25" className="animate-ping" />
          <circle r="10" fill="#FF8A3D" filter="url(#glow)" />
          <circle r="4" fill="#FFFFFF" />
          <text x="0" y="24" fill="#FFD6B5" fontSize="11" fontWeight="bold" textAnchor="middle">
            Your Location
          </text>
        </g>

        {/* Animated Route Line from User to Selected Clinic */}
        {selectedClinic && (
          <g>
            <path
              d={`M 180 260 Q 300 150 ${350 + (clinics.indexOf(selectedClinic) * 35)} ${120 + (clinics.indexOf(selectedClinic) * 20)}`}
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="4"
              strokeDasharray="8 4"
              className="animate-pulse"
              filter="url(#glow)"
            />
          </g>
        )}

        {/* Clinic SVG Pins */}
        {clinics.map((clinic, idx) => {
          const cx = 320 + (idx * 42) % 400;
          const cy = 90 + ((idx * 55) % 250);
          const isSelected = clinic.id === selectedClinicId;

          return (
            <g
              key={clinic.id}
              transform={`translate(${cx}, ${cy})`}
              onClick={() => onSelectClinic(clinic.id)}
              className="cursor-pointer transition-transform duration-300 hover:scale-125"
            >
              {isSelected && (
                <circle r="22" fill="#FF8A3D" opacity="0.3" className="animate-pulse" />
              )}
              
              {/* Pin Base */}
              <circle
                r={isSelected ? '14' : '10'}
                fill={isSelected ? '#FF8A3D' : '#3B82F6'}
                stroke="#FFFFFF"
                strokeWidth="2.5"
                filter="url(#glow)"
              />
              
              <text
                x="0"
                y="4"
                fill="#FFFFFF"
                fontSize={isSelected ? '11' : '9'}
                fontWeight="bold"
                textAnchor="middle"
              >
                {idx + 1}
              </text>

              {/* Pin Title Label */}
              <g transform="translate(0, -20)">
                <rect
                  x="-50"
                  y="-12"
                  width="100"
                  height="18"
                  rx="6"
                  fill={isSelected ? '#FF8A3D' : 'rgba(15, 23, 42, 0.85)'}
                  stroke={isSelected ? '#FFD6B5' : 'rgba(255,255,255,0.2)'}
                />
                <text
                  x="0"
                  y="0"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {clinic.name.split(' ')[0]} ({clinic.distanceKm}km)
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-white text-xs font-semibold">
        <Compass className="w-4 h-4 text-healthcare-500 animate-spin-slow" />
        <span>Live GIS Route Navigator</span>
      </div>

      {/* Selected Clinic Floating Information Card Overlay */}
      {selectedClinic && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-10 max-w-sm bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 text-white shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 rounded-md bg-healthcare-500/20 text-healthcare-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                {selectedClinic.aiRecommended ? '⭐ AI Recommended Clinic' : 'Nearby Healthcare Provider'}
              </span>
              <h4 className="font-bold text-sm text-white">{selectedClinic.name}</h4>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{selectedClinic.address}</p>
            </div>
            <div className="flex items-center space-x-1 bg-amber-500/20 px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{selectedClinic.rating}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center text-xs">
            <div className="bg-slate-800/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Distance</span>
              <span className="font-semibold text-healthcare-400 flex items-center justify-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3" /> {selectedClinic.distanceKm} km
              </span>
            </div>

            <div className="bg-slate-800/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Travel Time</span>
              <span className="font-semibold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" /> {selectedClinic.travelTimeMin} mins
              </span>
            </div>

            <div className="bg-slate-800/60 p-1.5 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Live Queue</span>
              <span className="font-semibold text-amber-400 block mt-0.5">
                {selectedClinic.liveQueueLength} Patients
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
