import { Clinic } from '../types';

export const clinicRecommendationService = {
  /**
   * Evaluates a recommendation score (0.0 to 1.0) for a given clinic.
   * Score = 30% Distance + 20% Travel Time + 20% Open Status + 15% Wait Time + 10% Rating + 5% Preference
   */
  scoreClinic(clinic: Clinic, userPrefSpecialty?: string | null): number {
    // 1. Distance score (weight 30%): Max distance considered 15 km
    const distanceKm = clinic.distanceMeters ? clinic.distanceMeters / 1000 : 10;
    const distanceScore = Math.max(1 - distanceKm / 15, 0);

    // 2. Travel time score (weight 20%): Max travel time considered 45 minutes
    const travelMins = clinic.travelDurationSeconds ? clinic.travelDurationSeconds / 60 : 30;
    const travelScore = Math.max(1 - travelMins / 45, 0);

    // 3. Availability score (weight 20%): 1 if open now, 0.2 if closed
    const availabilityScore = clinic.isOpen ? 1 : 0.2;

    // 4. Wait time score (weight 15%): Max wait considered 60 minutes
    const waitMins = clinic.waitTime ? parseInt(clinic.waitTime.replace(/[^0-9]/g, ''), 10) || 15 : 20;
    const waitScore = Math.max(1 - waitMins / 60, 0);

    // 5. Rating score (weight 10%): rating out of 5
    const ratingScore = (clinic.rating || 4.0) / 5;

    // 6. Preference score (weight 5%): 1 if matches user preferred specialty, else 0
    let preferenceScore = 0;
    if (userPrefSpecialty && clinic.category.toLowerCase() === userPrefSpecialty.toLowerCase()) {
      preferenceScore = 1;
    }

    const totalScore =
      0.3 * distanceScore +
      0.2 * travelScore +
      0.2 * availabilityScore +
      0.15 * waitScore +
      0.1 * ratingScore +
      0.05 * preferenceScore;

    return Math.round(totalScore * 100) / 100;
  },

  /**
   * Scores and sorts clinics in descending order of recommendation score.
   */
  rankClinics(clinics: Clinic[], userPrefSpecialty?: string | null): Clinic[] {
    const scored = clinics.map((c) => ({
      ...c,
      recommendationScore: this.scoreClinic(c, userPrefSpecialty),
    }));
    return scored.sort((a, b) => (b.recommendationScore ?? 0) - (a.recommendationScore ?? 0));
  },
};
