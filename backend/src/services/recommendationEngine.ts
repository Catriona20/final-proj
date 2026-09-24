import { ClinicEntity, DoctorModel } from '../database/models';
import { memoryDb } from '../database/db';

export interface RecommendationWeights {
  distance: number; // default 0.30
  eta: number; // default 0.20
  availability: number; // default 0.20
  waitTime: number; // default 0.15
  rating: number; // default 0.10
  preference: number; // default 0.05
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  distance: 0.30,
  eta: 0.20,
  availability: 0.20,
  waitTime: 0.15,
  rating: 0.10,
  preference: 0.05,
};

export interface ScoredClinic extends ClinicEntity {
  recommendationScore: number;
  recommendationReason: string;
  scoreBreakdown: {
    distanceScore: number;
    etaScore: number;
    availabilityScore: number;
    waitScore: number;
    ratingScore: number;
    preferenceScore: number;
    procedureScore?: number;
  };
  matchedProcedures?: string[];
  matchedDoctors?: Array<{ id: string; name: string; specialization: string }>;
  distanceMeters?: number;
  travelDurationSeconds?: number;
  distance?: string;
  travelTime?: string;
}

export const recommendationEngine = {
  /**
   * Scores an individual clinic with normalized weights and procedure-matching bonus.
   */
  scoreClinic(
    clinic: ClinicEntity & { distanceMeters?: number; travelDurationSeconds?: number; wait_time?: string },
    userPrefSpecialty?: string | null,
    procedureQuery?: string | null,
    weights: RecommendationWeights = DEFAULT_WEIGHTS
  ): {
    score: number;
    reason: string;
    breakdown: ScoredClinic['scoreBreakdown'];
    matchedProcedures: string[];
    matchedDoctors: Array<{ id: string; name: string; specialization: string }>;
  } {
    // 1. Distance Score (0.0 to 1.0, max range 15 km)
    const distKm = (clinic.distanceMeters ?? 5000) / 1000;
    const distanceScore = Math.max(0, Math.min(1, 1 - distKm / 15));

    // 2. ETA Score (0.0 to 1.0, max range 45 mins)
    const travelMins = (clinic.travelDurationSeconds ?? 1200) / 60;
    const etaScore = Math.max(0, Math.min(1, 1 - travelMins / 45));

    // 3. Availability Score (1.0 if open, 0.2 if closed)
    const availabilityScore = clinic.is_open ? 1.0 : 0.2;

    // 4. Wait Time Score (0.0 to 1.0, max wait 60 mins)
    const waitMins = parseInt((clinic.wait_time || '15 min').replace(/[^0-9]/g, ''), 10) || 15;
    const waitScore = Math.max(0, Math.min(1, 1 - waitMins / 60));

    // 5. Rating Score (0.0 to 1.0, scaled out of 5)
    const ratingScore = Math.min(1, (clinic.rating || 4.0) / 5.0);

    // 6. Preference Score (1.0 if matches user preferred specialty, else 0.0)
    let preferenceScore = 0;
    if (
      userPrefSpecialty &&
      (clinic.category?.toLowerCase() === userPrefSpecialty.toLowerCase() ||
        clinic.departments?.some((d) => d.toLowerCase() === userPrefSpecialty.toLowerCase()))
    ) {
      preferenceScore = 1.0;
    }

    // 7. Procedure / Service Matching
    const matchedProcedures: string[] = [];
    const matchedDoctors: Array<{ id: string; name: string; specialization: string }> = [];
    let procedureScore = 0;

    const searchTerm = (procedureQuery || userPrefSpecialty || '').toLowerCase().trim();
    if (searchTerm.length >= 3) {
      for (const doc of memoryDb.doctors.values()) {
        if (doc.clinic_id === clinic.id || doc.clinic_affiliations?.includes(clinic.name)) {
          const docProcs = doc.procedures || [];
          const procMatch = docProcs.find(
            (p: string) => p.toLowerCase().includes(searchTerm) || searchTerm.includes(p.toLowerCase())
          );
          const specMatch =
            doc.specialization.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(doc.specialization.toLowerCase());

          if (procMatch || specMatch) {
            if (procMatch && !matchedProcedures.includes(procMatch)) {
              matchedProcedures.push(procMatch);
            }
            if (!matchedDoctors.some((d) => d.id === doc.id)) {
              matchedDoctors.push({
                id: doc.id,
                name: doc.name,
                specialization: doc.specialization,
                is_verified: doc.is_verified || doc.verification_status === 'VERIFIED',
              } as any);
            }
          }
        }
      }

      // Prioritize verified doctors offering the procedure
      matchedDoctors.sort((a: any, b: any) => {
        const aVerified = a.is_verified ? 1 : 0;
        const bVerified = b.is_verified ? 1 : 0;
        return bVerified - aVerified;
      });

      const hasVerifiedProcedureMatch = matchedDoctors.some(
        (d: any) => d.is_verified && matchedProcedures.length > 0
      );

      const clinicMatchesSpecialty =
        clinic.category?.toLowerCase() === searchTerm ||
        clinic.departments?.some((d) => d.toLowerCase() === searchTerm || searchTerm.includes(d.toLowerCase()));

      if (hasVerifiedProcedureMatch) {
        procedureScore = 1.0;
      } else if (matchedProcedures.length > 0) {
        procedureScore = 0.85;
      } else if (clinicMatchesSpecialty) {
        procedureScore = 0.75;
      } else if (matchedDoctors.length > 0) {
        procedureScore = 0.70;
      } else {
        procedureScore = 0.0;
      }
    }

    let totalScore =
      weights.distance * distanceScore +
      weights.eta * etaScore +
      weights.availability * availabilityScore +
      weights.waitTime * waitScore +
      weights.rating * ratingScore +
      weights.preference * preferenceScore;

    // Apply strong procedure & verification priority ranking
    if (procedureScore > 0) {
      if (procedureScore === 1.0) {
        // Verified doctor offering exact requested procedure (e.g. Moon Dental / Dr. Arun Kumar)
        totalScore = Math.min(0.99, totalScore * 0.40 + 0.60 * procedureScore + 0.20);
      } else {
        totalScore = Math.min(0.95, totalScore * 0.55 + 0.45 * procedureScore);
      }
    } else if (searchTerm.length >= 3) {
      // Demote unrelated specialty clinics when searching for specific procedure/specialty
      const isDentalSearch = searchTerm.includes('dental') || searchTerm.includes('root canal') || searchTerm.includes('tooth') || searchTerm.includes('teeth');
      const isCardioSearch = searchTerm.includes('cardio') || searchTerm.includes('heart') || searchTerm.includes('ecg');
      const isEyeSearch = searchTerm.includes('eye') || searchTerm.includes('cataract') || searchTerm.includes('ophthalmolog');
      const isDermaSearch = searchTerm.includes('skin') || searchTerm.includes('derma') || searchTerm.includes('acne');
      const isEntSearch = searchTerm.includes('ent') || searchTerm.includes('ear') || searchTerm.includes('throat') || searchTerm.includes('sinus');

      if (
        (isDentalSearch && clinic.category !== 'Dentistry') ||
        (isCardioSearch && clinic.category !== 'Cardiology') ||
        (isEyeSearch && clinic.category !== 'Ophthalmology') ||
        (isDermaSearch && clinic.category !== 'Dermatology') ||
        (isEntSearch && clinic.category !== 'ENT')
      ) {
        totalScore = totalScore * 0.30; // Strongly demote non-matching clinics
      }
    }

    // Generate human-readable reason
    const reasons: string[] = [];
    const hasVerifiedDoc = matchedDoctors.some((d: any) => d.is_verified && matchedProcedures.length > 0);
    if (hasVerifiedDoc && matchedProcedures.length > 0) {
      reasons.push(`${matchedProcedures[0]} available (Verified: ${matchedDoctors[0].name})`);
    } else if (matchedProcedures.length > 0 && matchedDoctors.length > 0) {
      reasons.push(`${matchedProcedures[0]} available (${matchedDoctors[0].name})`);
    } else if (matchedDoctors.length > 0) {
      reasons.push(`${matchedDoctors[0].specialization} specialist on duty`);
    }
    if (etaScore >= 0.75) reasons.push(`${Math.round(travelMins)} min estimated travel`);
    if (availabilityScore === 1.0 && waitScore >= 0.75) reasons.push('Low waiting time');
    if (ratingScore >= 0.95) reasons.push(`Top rated (${clinic.rating}★)`);
    if (reasons.length === 0) reasons.push('Nearest available healthcare facility');

    return {
      score: Math.round(totalScore * 100) / 100,
      reason: reasons.slice(0, 3).join(' • '),
      matchedProcedures,
      matchedDoctors,
      breakdown: {
        distanceScore: Math.round(distanceScore * 100) / 100,
        etaScore: Math.round(etaScore * 100) / 100,
        availabilityScore: Math.round(availabilityScore * 100) / 100,
        waitScore: Math.round(waitScore * 100) / 100,
        ratingScore: Math.round(ratingScore * 100) / 100,
        preferenceScore: Math.round(preferenceScore * 100) / 100,
        procedureScore: Math.round(procedureScore * 100) / 100,
      },
    };
  },

  /**
   * Ranks a list of clinics based on recommendation scoring.
   */
  rankClinics(
    clinics: Array<ClinicEntity & { distanceMeters?: number; travelDurationSeconds?: number; distance?: string; travelTime?: string }>,
    userPrefSpecialty?: string | null,
    procedureQuery?: string | null,
    customWeights?: Partial<RecommendationWeights>
  ): ScoredClinic[] {
    const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

    const scored = clinics.map((clinic) => {
      const { score, reason, breakdown, matchedProcedures, matchedDoctors } = this.scoreClinic(
        clinic,
        userPrefSpecialty,
        procedureQuery,
        weights
      );
      return {
        ...clinic,
        recommendationScore: score,
        recommendationReason: reason,
        scoreBreakdown: breakdown,
        matchedProcedures,
        matchedDoctors,
      };
    });

    return scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  },
};
