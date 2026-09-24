import { SymptomAnalysisResult, Clinic, Doctor, Appointment, PharmacyItem } from '../types';

export function analyzeSymptoms(
  rawInput: string,
  userCity: string = 'Mumbai',
  allClinics: Clinic[],
  allDoctors: Doctor[]
): SymptomAnalysisResult {
  const lower = rawInput.toLowerCase();

  let department = 'General Medicine';
  let priorityLevel: 'Standard' | 'Urgent' | 'Emergency' = 'Standard';
  let isEmergency = false;
  let estConsultationMin = 15;
  let explanation = 'Based on symptom pattern analysis and clinical triage guidelines.';

  if (lower.includes('chest') || lower.includes('heart') || lower.includes('palpitation') || lower.includes('cardiac') || lower.includes('left arm pain')) {
    department = 'Cardiology';
    isEmergency = lower.includes('severe') || lower.includes('crushing') || lower.includes('breath') || lower.includes('chest');
    priorityLevel = isEmergency ? 'Emergency' : 'Urgent';
    estConsultationMin = 25;
    explanation = isEmergency 
      ? '🚨 CRITICAL WARNING: Acute chest symptom cluster detected. Triage flagged for immediate emergency consultation.'
      : 'Cardiovascular symptom indicators detected. Prioritized for specialist evaluation.';
  } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itch') || lower.includes('acne') || lower.includes('allergy')) {
    department = 'Dermatology';
    priorityLevel = 'Standard';
    estConsultationMin = 12;
    explanation = 'Dermatological condition indicators matching standard clinic consultation protocols.';
  } else if (lower.includes('joint') || lower.includes('knee') || lower.includes('bone') || lower.includes('fracture') || lower.includes('back pain')) {
    department = 'Orthopedics';
    priorityLevel = lower.includes('fracture') || lower.includes('severe pain') ? 'Urgent' : 'Standard';
    estConsultationMin = 20;
    explanation = 'Musculoskeletal indicators evaluated. Recommending Orthopedics consultation.';
  } else if (lower.includes('brain') || lower.includes('headache') || lower.includes('seizure') || lower.includes('numbness') || lower.includes('dizziness')) {
    department = 'Neurology';
    priorityLevel = lower.includes('seizure') || lower.includes('paralysis') ? 'Emergency' : 'Urgent';
    estConsultationMin = 30;
    isEmergency = lower.includes('seizure') || lower.includes('paralysis');
    explanation = 'Neurological symptoms detected. Recommended specialist evaluation.';
  } else if (lower.includes('child') || lower.includes('baby') || lower.includes('pediatric') || lower.includes('infant')) {
    department = 'Pediatrics';
    priorityLevel = 'Urgent';
    estConsultationMin = 18;
    explanation = 'Pediatric age group triage applied.';
  } else if (lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('sinus')) {
    department = 'ENT';
    priorityLevel = 'Standard';
    estConsultationMin = 15;
  }

  // Doctor match
  const matchingDoctors = allDoctors.filter(d => d.specialization.toLowerCase() === department.toLowerCase());
  const bestDoctor = matchingDoctors.length > 0 ? matchingDoctors[0] : allDoctors[0];

  // Recommended clinic
  const recommendedClinic = allClinics.find(c => c.city.toLowerCase() === userCity.toLowerCase() && c.departments.includes(department))
    || allClinics[0];

  return {
    symptoms: rawInput.split(',').map(s => s.trim()),
    recommendedDepartment: department,
    possibleDoctorId: bestDoctor.id,
    possibleDoctorName: bestDoctor.name,
    priorityLevel,
    isEmergencyDetected: isEmergency,
    estimatedConsultationTimeMin: estConsultationMin,
    recommendedClinicId: recommendedClinic.id,
    confidenceScore: Math.floor(88 + Math.random() * 10),
    explanation,
  };
}

// Predict No-Show Risk for an Appointment
export function predictNoShowRisk(appointment: Appointment, patientAge: number, distanceKm: number): {
  riskScorePercent: number;
  category: 'Low' | 'Medium' | 'High';
  factors: string[];
} {
  let score = 10;
  const factors: string[] = [];

  if (appointment.timeSlot.includes('08:') || appointment.timeSlot.includes('09:')) {
    score += 15;
    factors.push('Early morning rush hour slot');
  }
  if (distanceKm > 5) {
    score += 20;
    factors.push(`Travel distance > ${distanceKm} km`);
  }
  if (patientAge > 65) {
    score += 15;
    factors.push('Senior citizen travel dependency');
  }
  if (appointment.status === 'Confirmed') {
    score -= 10;
    factors.push('Explicit OTP confirmed');
  }

  const finalScore = Math.min(Math.max(score, 5), 95);
  const category = finalScore > 40 ? 'High' : finalScore > 20 ? 'Medium' : 'Low';

  return { riskScorePercent: finalScore, category, factors };
}

// Pharmacy Stock Demand Predictor
export function forecastPharmacyDemand(items: PharmacyItem[]): {
  criticalRestockCount: number;
  highDemandCount: number;
  totalInventoryValue: number;
  reorderRecommendations: { itemName: string; suggestQty: number; urgency: string }[];
} {
  let criticalCount = 0;
  let highCount = 0;
  let totalValue = 0;
  const recommendations: { itemName: string; suggestQty: number; urgency: string }[] = [];

  items.forEach(item => {
    totalValue += item.stockQuantity * item.pricePerUnit;
    if (item.stockQuantity < item.minThreshold) {
      criticalCount++;
      recommendations.push({
        itemName: item.name,
        suggestQty: item.minThreshold * 3,
        urgency: 'IMMEDIATE REORDER',
      });
    } else if (item.aiDemandForecast === 'High') {
      highCount++;
      if (recommendations.length < 5) {
        recommendations.push({
          itemName: item.name,
          suggestQty: item.minThreshold * 2,
          urgency: 'RESTOCK WITHIN 3 DAYS',
        });
      }
    }
  });

  return {
    criticalRestockCount: criticalCount,
    highDemandCount: highCount,
    totalInventoryValue: totalValue,
    reorderRecommendations: recommendations,
  };
}

// Heatmap generator for peak hours
export const PEAK_HOURS_HEATMAP = [
  { hour: '08:00 AM', monday: 45, tuesday: 50, wednesday: 55, thursday: 60, friday: 70, saturday: 40 },
  { hour: '10:00 AM', monday: 95, tuesday: 98, wednesday: 92, thursday: 90, friday: 96, saturday: 85 },
  { hour: '12:00 PM', monday: 70, tuesday: 75, wednesday: 80, thursday: 78, friday: 82, saturday: 90 },
  { hour: '02:00 PM', monday: 40, tuesday: 42, wednesday: 45, thursday: 40, friday: 50, saturday: 60 },
  { hour: '04:00 PM', monday: 85, tuesday: 88, wednesday: 86, thursday: 90, friday: 94, saturday: 70 },
  { hour: '06:00 PM', monday: 90, tuesday: 92, wednesday: 95, thursday: 91, friday: 98, saturday: 50 },
];
