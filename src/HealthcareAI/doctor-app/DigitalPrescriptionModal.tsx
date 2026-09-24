import React, { useState } from 'react';
import { Appointment, Prescription, PharmacyItem } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Pill, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X, 
  FlaskConical, 
  Calendar, 
  FileText,
  Search
} from 'lucide-react';

interface DigitalPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  pharmacyItems: PharmacyItem[];
  onSavePrescription: (prescription: Prescription) => void;
}

export const DigitalPrescriptionModal: React.FC<DigitalPrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  pharmacyItems,
  onSavePrescription,
}) => {
  const [diagnosis, setDiagnosis] = useState('Acute Upper Respiratory Tract Infection & Mild Fever');
  const [medicines, setMedicines] = useState([
    { name: 'Paracetamol 650mg (Dolo)', dosage: '1 tablet thrice daily', duration: '5 Days', instructions: 'After meals' },
    { name: 'Amoxicillin 500mg (Mox 500)', dosage: '1 tablet twice daily', duration: '5 Days', instructions: 'With warm water' },
  ]);
  const [labTests, setLabTests] = useState(['Complete Blood Count (CBC)', 'C-Reactive Protein (CRP)']);
  const [followUpDate, setFollowUpDate] = useState('2026-08-11');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    const defaultMed = pharmacyItems[0] ? pharmacyItems[0].name.split(' - ')[0] : 'Azithromycin 500mg';
    setMedicines([...medicines, { name: defaultMed, dosage: '1 tablet once daily', duration: '3 Days', instructions: 'Before bedtime' }]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRx: Prescription = {
      id: `rx-${Date.now()}`,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      clinicName: appointment.clinicName,
      date: new Date().toISOString().split('T')[0],
      diagnosis,
      medicines,
      labTestsRecommended: labTests,
      followUpDate,
    };

    setIsSaved(true);
    setTimeout(() => {
      onSavePrescription(newRx);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-healthcare-500 text-white flex items-center justify-center shadow-floating">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Digital Prescription Builder</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Patient: <strong>{appointment.patientName}</strong> • Token #{appointment.tokenNumber}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Diagnosis Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Diagnosis & Consultation Notes
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500"
              required
            />
          </div>

          {/* Medicines Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-healthcare-500" /> Prescribed Medications ({medicines.length})
              </h4>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-1.5 rounded-xl bg-healthcare-100 dark:bg-healthcare-950 text-healthcare-700 dark:text-healthcare-300 text-xs font-bold hover:bg-healthcare-200 transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold">Medicine</label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => {
                        const newMeds = [...medicines];
                        newMeds[idx].name = e.target.value;
                        setMedicines(newMeds);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => {
                        const newMeds = [...medicines];
                        newMeds[idx].dosage = e.target.value;
                        setMedicines(newMeds);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block font-semibold">Duration</label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => {
                        const newMeds = [...medicines];
                        newMeds[idx].duration = e.target.value;
                        setMedicines(newMeds);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 block font-semibold">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => {
                          const newMeds = [...medicines];
                          newMeds[idx].instructions = e.target.value;
                          setMedicines(newMeds);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mt-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Date Recommendation
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {isSaved ? (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-center font-bold text-sm">
              ✓ Digital Prescription Signed & Sent to Patient & Pharmacy!
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-sm shadow-floating transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Sign & Dispatch Digital Rx</span>
            </button>
          )}

        </form>

      </div>
    </div>
  );
};
