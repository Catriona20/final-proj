import React, { useState } from 'react';
import { Clinic, Doctor } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  ShieldCheck, 
  Stethoscope, 
  Building2, 
  ChevronRight,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface PatientSearchProps {
  clinics: Clinic[];
  doctors: Doctor[];
  onSelectClinic: (clinicId: string) => void;
  onSelectDoctor: (doctorId: string) => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  clinics,
  doctors,
  onSelectClinic,
  onSelectDoctor,
}) => {
  const [query, setQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string>('All');
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [minRating, setMinRating] = useState<number>(4.5);
  const [maxFee, setMaxFee] = useState<number>(2000);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [insuranceOnly, setInsuranceOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const specializations = ['All', 'Cardiology', 'Dermatology', 'Orthopedics', 'General Medicine', 'Pediatrics', 'ENT', 'Gynaecology', 'Neurology'];

  const filteredClinics = clinics.filter(c => {
    const qMatch = c.name.toLowerCase().includes(query.toLowerCase()) || 
                   c.city.toLowerCase().includes(query.toLowerCase()) || 
                   c.departments.some(d => d.toLowerCase().includes(query.toLowerCase()));
    const specMatch = selectedSpec === 'All' || c.departments.includes(selectedSpec);
    const distMatch = c.distanceKm <= maxDistance;
    const ratingMatch = c.rating >= minRating;
    const emergencyMatch = !emergencyOnly || c.emergencyAvailable;
    const insuranceMatch = !insuranceOnly || c.insuranceAccepted;

    return qMatch && specMatch && distMatch && ratingMatch && emergencyMatch && insuranceMatch;
  });

  const filteredDoctors = doctors.filter(d => {
    const qMatch = d.name.toLowerCase().includes(query.toLowerCase()) || 
                   d.specialization.toLowerCase().includes(query.toLowerCase());
    const specMatch = selectedSpec === 'All' || d.specialization === selectedSpec;
    const feeMatch = d.consultationFee <= maxFee;
    const ratingMatch = d.rating >= minRating;

    return qMatch && specMatch && feeMatch && ratingMatch;
  });

  return (
    <div className="space-y-6">

      {/* Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <h2 className="font-extrabold text-2xl text-slate-900 dark:text-white">Smart Healthcare Search</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Search by doctor name, clinic, specialization, symptoms, medicine, or city location.</p>

        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-healthcare-500 absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 'Dr. Sharma', 'Cardiology', 'Chest pain', 'Apex Clinic'..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500 shadow-inner"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 p-2 rounded-xl text-xs font-bold flex items-center space-x-1 border transition ${
              showFilters ? 'bg-healthcare-500 text-white border-healthcare-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Smart Filters</span>
          </button>
        </div>

        {/* Specialization Quick Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {specializations.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpec(spec)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedSpec === spec
                  ? 'bg-healthcare-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Expandable Smart Filters Drawer */}
        {showFilters && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-healthcare-500" /> Filter Criteria
              </h4>
              <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Max Distance: <strong>{maxDistance} km</strong></label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full accent-healthcare-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Min Rating: <strong>{minRating} Stars</strong></label>
                <input
                  type="range"
                  min="4.0"
                  max="5.0"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full accent-healthcare-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Max Fee: <strong>₹{maxFee}</strong></label>
                <input
                  type="range"
                  min="500"
                  max="2500"
                  step="100"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full accent-healthcare-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={(e) => setEmergencyOnly(e.target.checked)}
                  className="accent-healthcare-500 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">24/7 Emergency Available</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={insuranceOnly}
                  onChange={(e) => setInsuranceOnly(e.target.checked)}
                  className="accent-healthcare-500 rounded"
                />
                <span className="text-slate-700 dark:text-slate-300">Insurance Cashless Accepted</span>
              </label>
            </div>
          </div>
        )}

      </div>

      {/* Matching Doctors Section */}
      {filteredDoctors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-healthcare-500" />
            <span>Matching Doctors ({filteredDoctors.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doc) => (
              <GlassCard key={doc.id} onClick={() => onSelectDoctor(doc.id)}>
                <div className="flex items-start space-x-4">
                  <img src={doc.avatar} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-healthcare-200" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{doc.name}</h4>
                        <span className="inline-block text-xs text-healthcare-600 dark:text-healthcare-400 font-semibold">
                          {doc.specialization} • {doc.experienceYears} Yrs Exp
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{doc.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{doc.qualification}</p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Fee: <strong>₹{doc.consultationFee}</strong>
                      </span>
                      <button
                        onClick={() => onSelectDoctor(doc.id)}
                        className="px-3 py-1.5 rounded-xl bg-healthcare-500 text-white font-bold text-xs shadow hover:bg-healthcare-600 transition flex items-center space-x-1"
                      >
                        <span>Book Doctor</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Matching Clinics Section */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-healthcare-500" />
          <span>Matching Clinics ({filteredClinics.length})</span>
        </h3>

        {filteredClinics.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-500">
            <p className="font-semibold text-base">No clinics matched your filter criteria.</p>
            <button onClick={() => { setQuery(''); setSelectedSpec('All'); setMaxDistance(15); setMinRating(4.0); }} className="mt-2 text-xs text-healthcare-500 font-bold hover:underline">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredClinics.map((clinic) => (
              <GlassCard key={clinic.id} onClick={() => onSelectClinic(clinic.id)}>
                <div className="flex items-start space-x-4">
                  <img src={clinic.image} alt={clinic.name} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{clinic.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{clinic.address}</p>
                    
                    <div className="flex items-center space-x-3 text-xs mt-2 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">{clinic.distanceKm} km</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">{clinic.travelTimeMin} min drive</span>
                      <span>•</span>
                      <span className="text-healthcare-500 font-bold">{clinic.liveQueueLength} in queue</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
