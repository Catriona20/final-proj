import React, { useState } from 'react';
import { MedicalRecord, Prescription, Patient } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  FileText, 
  FlaskConical, 
  Stethoscope, 
  Pill, 
  ImageIcon, 
  Download, 
  Search, 
  Calendar,
  Building2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface HealthRecordsViewProps {
  patient: Patient;
  records: MedicalRecord[];
  prescriptions: Prescription[];
}

export const HealthRecordsView: React.FC<HealthRecordsViewProps> = ({
  patient,
  records,
  prescriptions,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'prescriptions' | 'labs' | 'images'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = records.filter(r => {
    const qMatch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   r.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'prescriptions') return qMatch && r.type === 'Digital Prescription';
    if (activeTab === 'labs') return qMatch && r.type === 'Lab Report';
    if (activeTab === 'images') return qMatch && r.type === 'Medical Image';
    return qMatch;
  });

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-2xl text-slate-900 dark:text-white">Patient Digital Health Vault</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Encrypted Electronic Health Records (EHR) • Patient: <strong>{patient.name}</strong> ({patient.bloodGroup})
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-healthcare-50 dark:bg-healthcare-950/50 px-3 py-1.5 rounded-xl border border-healthcare-200 text-xs font-bold text-healthcare-700 dark:text-healthcare-300">
            <span>ABHA ID: 91-8765-4321-0987</span>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports or doctors..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-healthcare-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'prescriptions' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'
              }`}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'labs' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'
              }`}
            >
              Lab Reports
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'images' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'
              }`}
            >
              Scans/Images
            </button>
          </div>
        </div>
      </div>

      {/* Digital Prescriptions Section */}
      {(activeTab === 'all' || activeTab === 'prescriptions') && prescriptions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
            <Pill className="w-5 h-5 text-healthcare-500" />
            <span>Active Digital Prescriptions</span>
          </h3>

          {prescriptions.map((rx) => (
            <GlassCard key={rx.id} className="border-healthcare-300 dark:border-healthcare-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-extrabold bg-healthcare-100 text-healthcare-700 px-2 py-0.5 rounded-md">
                    Rx ID: {rx.id}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">{rx.diagnosis}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prescribed by <strong>{rx.doctorName}</strong> at {rx.clinicName} on {rx.date}
                  </p>
                </div>

                <button
                  onClick={() => alert(`Downloading official PDF prescription for ${rx.id}...`)}
                  className="px-3 py-1.5 rounded-xl bg-healthcare-500 text-white font-bold text-xs shadow hover:bg-healthcare-600 transition flex items-center space-x-1 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Rx</span>
                </button>
              </div>

              {/* Medicines Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-2.5 rounded-l-xl">Medicine Name</th>
                      <th className="p-2.5">Dosage Frequency</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5 rounded-r-xl">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rx.medicines.map((med, idx) => (
                      <tr key={idx} className="text-slate-800 dark:text-slate-200">
                        <td className="p-2.5 font-bold text-healthcare-600 dark:text-healthcare-400">{med.name}</td>
                        <td className="p-2.5 font-semibold">{med.dosage}</td>
                        <td className="p-2.5">{med.duration}</td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.labTestsRecommended && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs flex items-center space-x-2">
                  <FlaskConical className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600 dark:text-slate-300">
                    Recommended Lab Tests: <strong>{rx.labTestsRecommended.join(', ')}</strong>
                  </span>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* General Medical Records List */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
          <FileText className="w-5 h-5 text-healthcare-500" />
          <span>Uploaded Lab Reports & Imaging ({filteredRecords.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <GlassCard key={rec.id}>
              <div className="flex items-start space-x-3">
                <div className="p-3 rounded-2xl bg-healthcare-50 dark:bg-healthcare-950 text-healthcare-500">
                  {rec.type === 'Lab Report' ? <FlaskConical className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{rec.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{rec.fileSize}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">{rec.summary}</p>
                  <p className="text-[11px] text-slate-400 font-medium">By {rec.doctorName} • {rec.date}</p>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => alert(`Opening secure digital viewer for ${rec.title}...`)}
                      className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-healthcare-100 hover:text-healthcare-600 transition flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View File</span>
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
};
