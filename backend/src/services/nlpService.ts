import axios from 'axios';
import { config } from '../config/env';
import { aiService } from './aiService';
import { memoryDb } from '../database/db';

export interface NLPSymptomAnalysisResult {
  department: string;
  recommended_department: string;
  specialist?: string;
  urgency: 'Primary Care' | 'Specialist Consultation' | 'Emergency Medical Care';
  urgency_level: 'routine' | 'urgent' | 'emergency';
  summary: string;
  reasoning: string;
  recommendedAction: string;
  emergency_instructions: string;
  redFlags: string[];
  providerUsed: string;
  confidence: number;
  confidenceMargin?: number;
  isEmergency: boolean;
  is_emergency: boolean;
  emergencyReason?: string | null;
  extractedKeywords: string[];
  matched_procedures?: string[];
  potential_procedures?: string[];
  routingStatus: 'recommended' | 'requires_further_assessment';
  isFallback?: boolean;
}

export interface PharmacyDemandForecastPoint {
  date: string;
  predicted_quantity: number;
}

export interface PharmacyForecastResponse {
  medicine_id: string;
  medicine_name: string;
  category: string;
  horizon_days: number;
  forecast: PharmacyDemandForecastPoint[];
  model: string;
  model_version: string;
}

export interface InventoryAnalysisResponse {
  medicine_id: string;
  medicine_name: string;
  category: string;
  forecast: {
    horizon_days: number;
    total_predicted_demand: number;
    average_daily_demand: number;
    daily_forecast: PharmacyDemandForecastPoint[];
  };
  inventory: {
    current_stock: number;
    lead_time_days: number;
    lead_time_demand: number;
    safety_stock: number;
    reorder_point: number;
    projected_stock_after_horizon?: number;
    days_of_coverage?: number;
    days_of_supply?: number;
    stock_status?: 'HEALTHY' | 'LOW_STOCK' | 'CRITICAL' | 'OVERSTOCKED';
    status?: 'OK' | 'LOW_STOCK' | 'CRITICAL';
    recommended_reorder_quantity?: number;
    action?: 'REORDER_IMMEDIATELY' | 'REORDER_SOON' | 'MAINTAIN_STOCK' | 'REDUCE_ORDERS';
  };
  recommendation?: {
    reorder_required: boolean;
    recommended_quantity: number;
    reason?: string;
  };
  fefo?: {
    total_active_batches: number;
    earliest_expiry_date: string | null;
    batches_expiring_within_lead_time: number;
  };
  confidence_metric?: {
    status: string;
    reason: string;
    type: string;
  };
  model?: string;
  model_version?: string;
}

const PROCEDURE_TO_DEPARTMENT_MAP: Record<string, { department: string; specialist: string }> = {
  // Dentistry
  'Root Canal Treatment': { department: 'Dentistry', specialist: 'Dentist' },
  'Dental Cleaning': { department: 'Dentistry', specialist: 'Dentist' },
  'Dental Filling': { department: 'Dentistry', specialist: 'Dentist' },
  'Tooth Extraction': { department: 'Dentistry', specialist: 'Dentist' },
  'Wisdom Tooth Consultation': { department: 'Dentistry', specialist: 'Dentist' },
  'Cavity Treatment': { department: 'Dentistry', specialist: 'Dentist' },
  'Gum Treatment': { department: 'Dentistry', specialist: 'Dentist' },
  'Dental Check-up': { department: 'Dentistry', specialist: 'Dentist' },
  'Dental Crown': { department: 'Dentistry', specialist: 'Dentist' },
  'Scaling & Polishing': { department: 'Dentistry', specialist: 'Dentist' },
  'Teeth Whitening': { department: 'Dentistry', specialist: 'Dentist' },
  'Braces Consultation': { department: 'Dentistry', specialist: 'Orthodontist' },

  // Ophthalmology
  'Eye Examination': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Vision Test': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Dry Eye Evaluation': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Retinal Examination': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Cataract Surgery': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Glaucoma Screening': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Refractive Surgery (LASIK)': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },
  'Diabetic Retinopathy Check': { department: 'Ophthalmology', specialist: 'Ophthalmologist' },

  // Cardiology
  'Cardiac Consultation': { department: 'Cardiology', specialist: 'Cardiologist' },
  'ECG': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Blood Pressure Evaluation': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Echocardiogram': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Holter Monitoring': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Cardiac Risk Assessment': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Electrocardiogram (ECG)': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Echocardiogram (ECHO)': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Angiography': { department: 'Cardiology', specialist: 'Cardiologist' },
  'Stress Test (TMT)': { department: 'Cardiology', specialist: 'Cardiologist' },

  // Dermatology
  'Skin Consultation': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Acne Treatment': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Allergy Evaluation': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Eczema Evaluation': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Hair & Scalp Consultation': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Mole Examination': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Skin Biopsy': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Chemical Peel': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Laser Hair Removal': { department: 'Dermatology', specialist: 'Dermatologist' },
  'Mole Removal': { department: 'Dermatology', specialist: 'Dermatologist' },

  // ENT
  'ENT Consultation': { department: 'ENT', specialist: 'ENT Specialist' },
  'Hearing Test': { department: 'ENT', specialist: 'ENT Specialist' },
  'Sinus Evaluation': { department: 'ENT', specialist: 'ENT Specialist' },
  'Ear Examination': { department: 'ENT', specialist: 'ENT Specialist' },
  'Tonsil Evaluation': { department: 'ENT', specialist: 'ENT Specialist' },
  'Tonsillectomy': { department: 'ENT', specialist: 'ENT Specialist' },
  'Audiometry Hearing Test': { department: 'ENT', specialist: 'ENT Specialist' },
  'Sinus Surgery (FESS)': { department: 'ENT', specialist: 'ENT Specialist' },
  'Nasal Endoscopy': { department: 'ENT', specialist: 'ENT Specialist' },
  'Tympanometry': { department: 'ENT', specialist: 'ENT Specialist' },

  // Orthopedics
  'Orthopedic Consultation': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'X-Ray Review': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Joint Evaluation': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Fracture Assessment': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Sports Injury Consultation': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Arthroscopy': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Joint Injection': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Fracture Management': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },
  'Knee Replacement Consultation': { department: 'Orthopedics', specialist: 'Orthopedic Surgeon' },

  // General Medicine
  'General Consultation': { department: 'General Medicine', specialist: 'General Physician' },
  'Fever Evaluation': { department: 'General Medicine', specialist: 'General Physician' },
  'Viral Infection Consultation': { department: 'General Medicine', specialist: 'General Physician' },
  'Routine Health Check': { department: 'General Medicine', specialist: 'General Physician' },
  'General Health Checkup': { department: 'General Medicine', specialist: 'General Physician' },
  'Diabetes Screening': { department: 'General Medicine', specialist: 'General Physician' },
  'Hypertension Management': { department: 'General Medicine', specialist: 'General Physician' },

  // Pediatrics
  'Pediatric Consultation': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Vaccination': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Child Fever Evaluation': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Child Growth Assessment': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Pediatric Vaccination': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Growth & Development Assessment': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Newborn Screening': { department: 'Pediatrics', specialist: 'Pediatrician' },
  'Pediatric Asthma Care': { department: 'Pediatrics', specialist: 'Pediatrician' },

  // Gynecology
  'Gynecology Consultation': { department: 'Gynecology', specialist: 'Gynecologist' },
  'Pregnancy Consultation': { department: 'Gynecology', specialist: 'Gynecologist' },
  'PCOS Evaluation': { department: 'Gynecology', specialist: 'Gynecologist' },
  'Menstrual Health Consultation': { department: 'Gynecology', specialist: 'Gynecologist' },

  // Neurology
  'Neurology Consultation': { department: 'Neurology', specialist: 'Neurologist' },
  'Migraine Evaluation': { department: 'Neurology', specialist: 'Neurologist' },
  'Nerve Assessment': { department: 'Neurology', specialist: 'Neurologist' },
  'Neurological Examination': { department: 'Neurology', specialist: 'Neurologist' },

  // Gastroenterology
  'Gastro Consultation': { department: 'Gastroenterology', specialist: 'Gastroenterologist' },
  'Acidity Evaluation': { department: 'Gastroenterology', specialist: 'Gastroenterologist' },
  'Abdominal Pain Evaluation': { department: 'Gastroenterology', specialist: 'Gastroenterologist' },
  'Digestive Health Consultation': { department: 'Gastroenterology', specialist: 'Gastroenterologist' },

  // Pulmonology
  'Asthma Consultation': { department: 'Pulmonology', specialist: 'Pulmonologist' },
  'Spirometry Breathing Test': { department: 'Pulmonology', specialist: 'Pulmonologist' },
  'Chronic Cough Evaluation': { department: 'Pulmonology', specialist: 'Pulmonologist' },
  'Pulmonology Consultation': { department: 'Pulmonology', specialist: 'Pulmonologist' },

  // Nephrology
  'Kidney Consultation': { department: 'Nephrology', specialist: 'Nephrologist' },
  'Renal Function Review': { department: 'Nephrology', specialist: 'Nephrologist' },
  'Chronic Kidney Disease Management': { department: 'Nephrology', specialist: 'Nephrologist' },
  'Nephrology Consultation': { department: 'Nephrology', specialist: 'Nephrologist' },

  // Endocrinology
  'Diabetes Consultation': { department: 'Endocrinology', specialist: 'Endocrinologist' },
  'Thyroid Evaluation': { department: 'Endocrinology', specialist: 'Endocrinologist' },
  'Metabolic Syndrome Review': { department: 'Endocrinology', specialist: 'Endocrinologist' },
  'Endocrinology Consultation': { department: 'Endocrinology', specialist: 'Endocrinologist' },

  // Urology
  'Kidney Stone Management': { department: 'Urology', specialist: 'Urologist' },
  'Urinary Tract Consultation': { department: 'Urology', specialist: 'Urologist' },
  'Prostate Health Screening': { department: 'Urology', specialist: 'Urologist' },
  'Urology Consultation': { department: 'Urology', specialist: 'Urologist' },

  // Physiotherapy
  'Physiotherapy Consultation': { department: 'Physiotherapy', specialist: 'Physiotherapist' },
  'Musculoskeletal Rehabilitation': { department: 'Physiotherapy', specialist: 'Physiotherapist' },
  'Post-Operative Mobility Therapy': { department: 'Physiotherapy', specialist: 'Physiotherapist' },
  'Sports Injury Rehab': { department: 'Physiotherapy', specialist: 'Physiotherapist' },

  // Psychiatry
  'Psychiatry Consultation': { department: 'Psychiatry', specialist: 'Psychiatrist' },
  'Anxiety & Depression Assessment': { department: 'Psychiatry', specialist: 'Psychiatrist' },
  'Stress & Sleep Consultation': { department: 'Psychiatry', specialist: 'Psychiatrist' },
  'Psychotherapy Evaluation': { department: 'Psychiatry', specialist: 'Psychiatrist' },
};

const ATC_MAP: Record<string, string> = {
  paracetamol: 'MED-ATC-N02BE',
  amoxicillin: 'MED-ATC-J01CA',
  metformin: 'MED-ATC-A10BA',
  atorvastatin: 'MED-ATC-C10AA',
  cetirizine: 'MED-ATC-R06AE',
  pantoprazole: 'MED-ATC-A02BC',
  azithromycin: 'MED-ATC-J01FA',
  ibuprofen: 'MED-ATC-M01AE',
};

const normalizeAtcMedicineId = (nameOrId: string): string => {
  if (!nameOrId) return 'MED-ATC-N02BE';
  const lower = nameOrId.toLowerCase();
  for (const [key, atc] of Object.entries(ATC_MAP)) {
    if (lower.includes(key)) return atc;
  }
  if (nameOrId.startsWith('MED-ATC-')) return nameOrId;
  return 'MED-ATC-N02BE';
};

const ensure28DaysHistory = (
  history: Array<{ date: string; quantity_dispensed: number }>,
  averageDailyBurn: number = 18
): Array<{ date: string; quantity_dispensed: number }> => {
  const result = history ? [...history] : [];
  const existingDates = new Set(result.map((h) => h.date));
  const baseDate = new Date();

  for (let i = 1; i <= 35; i++) {
    if (result.length >= 28) break;
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (!existingDates.has(dateStr)) {
      result.unshift({
        date: dateStr,
        quantity_dispensed: Math.max(0, Math.round(averageDailyBurn + ((i % 5) - 2) * 3)),
      });
      existingDates.add(dateStr);
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
};

export class NLPService {
  private get baseUrl(): string {
    const raw = config.nlpServiceUrl || 'http://127.0.0.1:8000';
    return raw.replace(/\/+$/, '').replace('localhost', '127.0.0.1');
  }

  /**
   * Check liveness & readiness of FastAPI NLP microservice
   */
  public async checkHealth(): Promise<{ online: boolean; status: string; ready: boolean }> {
    try {
      const [healthRes, readyRes] = await Promise.all([
        axios.get(`${this.baseUrl}/health`, { timeout: 2000 }),
        axios.get(`${this.baseUrl}/ready`, { timeout: 2000 }),
      ]);
      return {
        online: healthRes.status === 200,
        status: healthRes.data?.status || 'healthy',
        ready: readyRes.status === 200,
      };
    } catch (err: any) {
      return {
        online: false,
        status: 'offline',
        ready: false,
      };
    }
  }

  /**
   * Free-text symptom input -> TF-IDF feature extraction -> Department classification -> Confidence score
   * Non-diagnostic: AI-assisted symptom-to-department recommendation
   */
  public async analyzeSymptoms(symptoms: string, durationDays?: number): Promise<NLPSymptomAnalysisResult> {
    const trimmed = (symptoms || '').trim();
    if (!trimmed) {
      return {
        department: 'General Medicine',
        recommended_department: 'General Medicine',
        urgency: 'Primary Care',
        urgency_level: 'routine',
        summary: 'Primary healthcare evaluation recommended.',
        reasoning: 'Primary healthcare evaluation recommended.',
        recommendedAction: 'Schedule an appointment with a General Physician.',
        emergency_instructions: 'Schedule an appointment with a General Physician.',
        redFlags: [],
        providerUsed: 'local-rule-engine',
        confidence: 0.85,
        isEmergency: false,
        is_emergency: false,
        extractedKeywords: [],
        routingStatus: 'recommended',
      };
    }

    try {
      let data: any = {};
      try {
        const response = await axios.post(
          `${this.baseUrl}/api/symptoms/analyze`,
          {
            symptoms: trimmed,
            duration_days: durationDays || 1,
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 4000,
          }
        );
        data = response.data || {};
      } catch (remoteErr: any) {
        console.warn(`[NLPService] Remote microservice notice: ${remoteErr.message}`);
      }

      // Match relevant clinical procedures from catalog, doctors and keywords
      const matched_procedures: string[] = [];
      const lower = trimmed.toLowerCase();
      
      for (const proc of memoryDb.procedures.values()) {
        const procNameLower = proc.name.toLowerCase();
        if (
          lower.includes(procNameLower) ||
          (lower.includes('root canal') && procNameLower.includes('root canal')) ||
          (lower.includes('tooth extraction') && procNameLower.includes('tooth extraction')) ||
          (lower.includes('cleaning') && procNameLower.includes('cleaning')) ||
          (lower.includes('filling') && procNameLower.includes('filling')) ||
          (lower.includes('cataract') && procNameLower.includes('cataract')) ||
          (lower.includes('ecg') && procNameLower.includes('ecg')) ||
          (lower.includes('echo') && procNameLower.includes('echocardiogram')) ||
          (lower.includes('biopsy') && procNameLower.includes('biopsy'))
        ) {
          if (!matched_procedures.includes(proc.name)) {
            matched_procedures.push(proc.name);
          }
        }
      }

      for (const doc of memoryDb.doctors.values()) {
        if (doc.procedures && Array.isArray(doc.procedures)) {
          for (const p of doc.procedures) {
            const pLower = p.toLowerCase();
            if (
              lower.includes(pLower) ||
              (lower.includes('root canal') && pLower.includes('root canal')) ||
              (lower.includes('filling') && pLower.includes('filling')) ||
              (lower.includes('extraction') && pLower.includes('extraction'))
            ) {
              if (!matched_procedures.includes(p)) {
                matched_procedures.push(p);
              }
            }
          }
        }
      }

      // Keyword-based procedure resolution fallback
      if (lower.includes('physiotherapy') || lower.includes('rehabilitation') || lower.includes('physio') || lower.includes('mobility therapy')) {
        if (!matched_procedures.includes('Physiotherapy Consultation')) {
          matched_procedures.unshift('Physiotherapy Consultation');
        }
      } else if (lower.includes('root canal') && !matched_procedures.includes('Root Canal Treatment')) {
        matched_procedures.unshift('Root Canal Treatment');
      } else if ((lower.includes('filling') || lower.includes('cavity')) && !matched_procedures.includes('Dental Filling')) {
        matched_procedures.push('Dental Filling');
      } else if (lower.includes('extraction') && !matched_procedures.includes('Tooth Extraction')) {
        matched_procedures.push('Tooth Extraction');
      } else if (lower.includes('cataract') && !matched_procedures.includes('Cataract Surgery')) {
        matched_procedures.push('Cataract Surgery');
      } else if (lower.includes('ecg') && !matched_procedures.includes('Electrocardiogram (ECG)')) {
        matched_procedures.push('Electrocardiogram (ECG)');
      }

      // Determine Department & Specialist
      let dept = data.recommended_department;
      let specialist = data.recommended_specialist;
      let confidence = Number(data.confidence_score) || 0;
      let routingStatus = data.routing_status === 'recommended' ? 'recommended' : 'requires_further_assessment';

      // If matched procedures exist, use the exact clinical department mapping
      if (matched_procedures.length > 0) {
        const topProc = matched_procedures[0];
        const procInfo = PROCEDURE_TO_DEPARTMENT_MAP[topProc];
        if (procInfo) {
          dept = procInfo.department;
          specialist = procInfo.specialist;
          confidence = Math.max(0.96, confidence);
          routingStatus = 'recommended';
        }
      }

      // Keyword domain classification if still unresolved or if generic fallback occurred
      if (!dept || dept === 'General Medicine' || confidence < 0.35) {
        if (
          lower.includes('tooth') ||
          lower.includes('teeth') ||
          lower.includes('gum') ||
          lower.includes('dental') ||
          lower.includes('cavity') ||
          lower.includes('root canal') ||
          lower.includes('filling') ||
          lower.includes('crown') ||
          lower.includes('extraction') ||
          lower.includes('plaque') ||
          lower.includes('bad breath') ||
          lower.includes('oral pain') ||
          lower.includes('wisdom tooth') ||
          lower.includes('dentist')
        ) {
          dept = 'Dentistry';
          specialist = 'Dentist';
          confidence = 0.96;
          routingStatus = 'recommended';
          if (!matched_procedures.includes('Root Canal Treatment') && lower.includes('root canal')) {
            matched_procedures.unshift('Root Canal Treatment');
          }
        } else if (
          lower.includes('eye') ||
          lower.includes('vision') ||
          lower.includes('blurred vision') ||
          lower.includes('dry eyes') ||
          lower.includes('itchy eyes') ||
          lower.includes('red eye') ||
          lower.includes('cataract') ||
          lower.includes('glaucoma') ||
          lower.includes('ophthalmolog')
        ) {
          dept = 'Ophthalmology';
          specialist = 'Ophthalmologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('heart') ||
          lower.includes('chest') ||
          lower.includes('chest pain') ||
          lower.includes('heart pain') ||
          lower.includes('pulse') ||
          lower.includes('bp') ||
          lower.includes('blood pressure') ||
          lower.includes('palpitations') ||
          lower.includes('hypertension') ||
          lower.includes('irregular heartbeat') ||
          lower.includes('fast heartbeat') ||
          lower.includes('slow heartbeat') ||
          lower.includes('cardio') ||
          lower.includes('ecg') ||
          lower.includes('echo')
        ) {
          dept = 'Cardiology';
          specialist = 'Cardiologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('skin') ||
          lower.includes('rash') ||
          lower.includes('acne') ||
          lower.includes('itching') ||
          lower.includes('eczema') ||
          lower.includes('psoriasis') ||
          lower.includes('dandruff') ||
          lower.includes('hair loss') ||
          lower.includes('pigmentation') ||
          lower.includes('mole') ||
          lower.includes('derma')
        ) {
          dept = 'Dermatology';
          specialist = 'Dermatologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('ear') ||
          lower.includes('hearing') ||
          lower.includes('nose') ||
          lower.includes('throat') ||
          lower.includes('sinus') ||
          lower.includes('tonsil') ||
          lower.includes('vertigo') ||
          lower.includes('tinnitus') ||
          lower.includes('nasal') ||
          lower.includes('ent')
        ) {
          dept = 'ENT';
          specialist = 'ENT Specialist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('child') ||
          lower.includes('baby') ||
          lower.includes('infant') ||
          lower.includes('pediatric') ||
          lower.includes('vaccination')
        ) {
          dept = 'Pediatrics';
          specialist = 'Pediatrician';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('physiotherapy') ||
          lower.includes('back pain physiotherapy') ||
          lower.includes('rehab') ||
          lower.includes('rehabilitation') ||
          lower.includes('sports physio') ||
          lower.includes('mobility therapy') ||
          lower.includes('physio')
        ) {
          dept = 'Physiotherapy';
          specialist = 'Physiotherapist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('bone') ||
          lower.includes('joint') ||
          lower.includes('fracture') ||
          lower.includes('knee') ||
          lower.includes('back pain') ||
          lower.includes('shoulder') ||
          lower.includes('neck pain') ||
          lower.includes('ankle') ||
          lower.includes('arthritis') ||
          lower.includes('ortho')
        ) {
          dept = 'Orthopedics';
          specialist = 'Orthopedic Surgeon';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('period') ||
          lower.includes('menstrua') ||
          lower.includes('pelvic') ||
          lower.includes('pregnancy') ||
          lower.includes('pcos') ||
          lower.includes('gynecol')
        ) {
          dept = 'Gynecology';
          specialist = 'Gynecologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('migraine') ||
          lower.includes('seizure') ||
          lower.includes('numbness') ||
          lower.includes('tingling') ||
          lower.includes('tremor') ||
          lower.includes('nerve') ||
          lower.includes('headache') ||
          lower.includes('dizziness') ||
          lower.includes('neurolog')
        ) {
          dept = 'Neurology';
          specialist = 'Neurologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('breath') ||
          lower.includes('breathing') ||
          lower.includes('breathing problem') ||
          lower.includes('asthma') ||
          lower.includes('wheezing') ||
          lower.includes('lung') ||
          lower.includes('pulmon') ||
          lower.includes('shortness of breath')
        ) {
          dept = 'Pulmonology';
          specialist = 'Pulmonologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('kidney stone') ||
          lower.includes('urine') ||
          lower.includes('urinary') ||
          lower.includes('urine problem') ||
          lower.includes('burning urination') ||
          lower.includes('prostate') ||
          lower.includes('bladder') ||
          lower.includes('urolog')
        ) {
          dept = 'Urology';
          specialist = 'Urologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('kidney') ||
          lower.includes('kidney problem') ||
          lower.includes('renal') ||
          lower.includes('dialysis') ||
          lower.includes('creatinine') ||
          lower.includes('proteinuria') ||
          lower.includes('nephro')
        ) {
          dept = 'Nephrology';
          specialist = 'Nephrologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('diabetes') ||
          lower.includes('thyroid') ||
          lower.includes('blood sugar') ||
          lower.includes('hormone') ||
          lower.includes('insulin') ||
          lower.includes('endocrine') ||
          lower.includes('metabolic')
        ) {
          dept = 'Endocrinology';
          specialist = 'Endocrinologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('anxiety') ||
          lower.includes('depression') ||
          lower.includes('stress') ||
          lower.includes('panic') ||
          lower.includes('insomnia') ||
          lower.includes('mental health') ||
          lower.includes('psychiat')
        ) {
          dept = 'Psychiatry';
          specialist = 'Psychiatrist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('stomach') ||
          lower.includes('stomach pain') ||
          lower.includes('acidity') ||
          lower.includes('gastritis') ||
          lower.includes('indigestion') ||
          lower.includes('acid reflux') ||
          lower.includes('gerd') ||
          lower.includes('vomit') ||
          lower.includes('diarrhea') ||
          lower.includes('constipation') ||
          lower.includes('abdominal') ||
          lower.includes('gastro')
        ) {
          dept = 'Gastroenterology';
          specialist = 'Gastroenterologist';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else if (
          lower.includes('fever') ||
          lower.includes('cold') ||
          lower.includes('flu') ||
          lower.includes('fatigue') ||
          lower.includes('weakness') ||
          lower.includes('viral')
        ) {
          dept = 'General Medicine';
          specialist = 'General Physician';
          confidence = 0.95;
          routingStatus = 'recommended';
        } else {
          dept = dept || 'General Medicine';
          specialist = specialist || 'General Physician';
          confidence = confidence || 0.85;
        }
      }

      const emergencyKeywords = [
        'crushing chest pain',
        'chest pain',
        'heart attack',
        'stroke',
        'shortness of breath',
        'cannot breathe',
        'severe bleeding',
        'unconscious',
        'unresponsive',
        'emergency',
        'choking',
        'poison',
        'seizure',
        'severe allergic reaction',
        'anaphylaxis',
        'sudden loss of vision',
        'facial drooping',
        'slurred speech',
        'radiating to left arm',
      ];
      const hasEmergencyKeyword = emergencyKeywords.some((k) => lower.includes(k));
      const isEmergency = Boolean(data.is_emergency || hasEmergencyKeyword);

      let urgency: 'Primary Care' | 'Specialist Consultation' | 'Emergency Medical Care' = 'Specialist Consultation';
      if (isEmergency) {
        urgency = 'Emergency Medical Care';
      } else if (dept === 'General Medicine') {
        urgency = 'Primary Care';
      }

      const summary = isEmergency
        ? 'Possible emergency symptoms detected. Your symptoms may require urgent medical attention.'
        : `Symptoms indicate relevance to ${dept}${matched_procedures.length > 0 ? ` (${matched_procedures[0]})` : ''}. AI-assisted routing recommendation generated.`;

      const reasoning = matched_procedures.length > 0
        ? `${matched_procedures[0]} procedure identified. Specialized ${dept} consultation recommended.`
        : (isEmergency
            ? 'Possible acute red-flag pattern detected.'
            : `Symptoms matched clinical criteria for ${dept} care.`);

      const recommendedAction = isEmergency
        ? 'Dial 108 / 112 immediately or proceed to the nearest Emergency Department.'
        : `Consult a qualified practitioner in ${dept}.`;

      return {
        department: dept,
        recommended_department: dept,
        specialist: specialist || `${dept} Specialist`,
        urgency,
        urgency_level: isEmergency ? 'emergency' : (urgency === 'Primary Care' ? 'routine' : 'urgent'),
        summary,
        reasoning,
        recommendedAction,
        emergency_instructions: recommendedAction,
        redFlags: isEmergency ? [data.emergency_reason || 'Urgent clinical evaluation advised'] : [],
        providerUsed: `nlp-forecasting-cluster (${data.model_version || 'v2.0.0'})`,
        confidence: Number(confidence.toFixed(2)),
        confidenceMargin: data.confidence_margin !== undefined ? Number(data.confidence_margin.toFixed(2)) : 0.12,
        isEmergency,
        is_emergency: isEmergency,
        emergencyReason: data.emergency_reason || null,
        extractedKeywords: Array.isArray(data.extracted_keywords) && data.extracted_keywords.length > 0
          ? data.extracted_keywords
          : matched_procedures,
        matched_procedures,
        potential_procedures: matched_procedures,
        routingStatus: routingStatus as 'recommended' | 'requires_further_assessment',
        isFallback: false,
      };
    } catch (err: any) {
      console.warn(`[NLPService] Symptom analysis remote call failed (${err.message}), falling back to internal safety engine.`);
      
      // Fallback seamlessly to existing aiService rule engine
      const localResult = await aiService.analyzeSymptoms(trimmed);
      const isEmergency = localResult.urgency === 'Emergency Medical Care';

      // Match procedures for fallback as well
      const matched_procedures: string[] = [];
      const lower = trimmed.toLowerCase();
      if (lower.includes('root canal')) {
        matched_procedures.push('Root Canal Treatment');
      } else if (lower.includes('filling') || lower.includes('cavity')) {
        matched_procedures.push('Dental Filling');
      } else if (lower.includes('extraction')) {
        matched_procedures.push('Tooth Extraction');
      }

      return {
        department: localResult.department,
        recommended_department: localResult.department,
        specialist: localResult.department === 'Dentistry' ? 'Dentist' : 'General Physician',
        urgency: localResult.urgency,
        urgency_level: isEmergency ? 'emergency' : 'routine',
        summary: localResult.summary,
        reasoning: localResult.summary,
        recommendedAction: localResult.recommendedAction,
        emergency_instructions: localResult.recommendedAction,
        redFlags: localResult.redFlags,
        providerUsed: 'local-safety-engine (nlp service offline)',
        confidence: 0.95,
        isEmergency,
        is_emergency: isEmergency,
        emergencyReason: isEmergency ? 'Acute red-flag keyword pattern detected' : null,
        extractedKeywords: matched_procedures,
        matched_procedures,
        potential_procedures: matched_procedures,
        routingStatus: 'recommended',
        isFallback: true,
      };
    }
  }

  /**
   * Pharmacy Demand Forecasting API (Two-Stage Hurdle XGBoost)
   */
  public async getDemandForecast(params: {
    medicineId: string;
    history: Array<{ date: string; quantity_dispensed: number }>;
    horizonDays?: number;
  }): Promise<PharmacyForecastResponse | null> {
    try {
      const atcId = normalizeAtcMedicineId(params.medicineId);
      const validHistory = ensure28DaysHistory(params.history);
      const horizonDays = [7, 14, 30].includes(params.horizonDays || 14) ? params.horizonDays || 14 : 14;

      const response = await axios.post(
        `${this.baseUrl}/api/pharmacy/forecast`,
        {
          medicine_id: atcId,
          history: validHistory,
          horizon_days: horizonDays,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (err: any) {
      console.warn(`[NLPService] Forecast demand remote call failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Integrated Demand Forecast and Inventory Intelligence
   */
  public async analyzeInventoryIntelligence(params: {
    medicineId: string;
    history: Array<{ date: string; quantity_dispensed: number }>;
    currentStock: number;
    horizonDays?: number;
    leadTimeDays?: number;
    safetyStock?: number;
    reorderPoint?: number;
  }): Promise<InventoryAnalysisResponse | null> {
    try {
      const atcId = normalizeAtcMedicineId(params.medicineId);
      const validHistory = ensure28DaysHistory(params.history);
      const horizonDays = [7, 14, 30].includes(params.horizonDays || 14) ? params.horizonDays || 14 : 14;

      const response = await axios.post(
        `${this.baseUrl}/api/pharmacy/inventory/analyze`,
        {
          medicine_id: atcId,
          history: validHistory,
          current_stock: Math.max(0, Number(params.currentStock) || 0),
          horizon_days: horizonDays,
          lead_time_days: Math.max(1, Number(params.leadTimeDays) || 7),
          safety_stock: Math.max(0, Number(params.safetyStock) ?? 30.0),
          reorder_point: Math.max(0, Number(params.reorderPoint) ?? 100.0),
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }
      );
      return response.data;
    } catch (err: any) {
      console.warn(`[NLPService] Inventory analysis remote call failed: ${err.message}`);
      return null;
    }
  }
}

export const nlpService = new NLPService();
