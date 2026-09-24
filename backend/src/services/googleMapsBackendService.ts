import axios from 'axios';
import { config } from '../config/env';
import { ClinicEntity, ClinicModel } from '../database/models';

export interface RouteElement {
  destinationIndex: number;
  distanceMeters: number;
  durationSeconds: number;
}

// Broad Chennai Geographic Grid Cells
export const CHENNAI_GEOGRAPHIC_CELLS = [
  { name: 'Central Chennai (Mylapore/Alwarpet)', lat: 13.0338, lng: 80.2677 },
  { name: 'Central Chennai (T Nagar/Nungambakkam)', lat: 13.0418, lng: 80.2341 },
  { name: 'South Chennai (Adyar/Besant Nagar)', lat: 13.0062, lng: 80.2583 },
  { name: 'South Chennai (Velachery/Guindy)', lat: 12.9815, lng: 80.2180 },
  { name: 'South Chennai (OMR/Thoraipakkam)', lat: 12.9348, lng: 80.2312 },
  { name: 'South Chennai (Tambaram/Chromepet)', lat: 12.9249, lng: 80.1478 },
  { name: 'West Chennai (Anna Nagar/Shenoy Nagar)', lat: 13.0850, lng: 80.2101 },
  { name: 'West Chennai (Porur/Ramapuram)', lat: 13.0382, lng: 80.1565 },
  { name: 'West Chennai (Ambattur/Avadi)', lat: 13.1143, lng: 80.1548 },
  { name: 'North Chennai (Royapuram/George Town)', lat: 13.1075, lng: 80.2936 },
];

// Healthcare query normalization map with aliases
export const HEALTHCARE_TERM_MAP: Array<{
  category: string;
  keywords: string[];
  placesQuery: string;
}> = [
  {
    category: 'Ophthalmology',
    keywords: ['eye', 'opt', 'vision', 'ophthalmolog', 'retina', 'cornea', 'glaucoma', 'cataract', 'spectacle', 'lasik', 'eye specialist', 'eye doctor', 'eye clinic', 'glasses', 'eye hospital'],
    placesQuery: 'eye hospital OR ophthalmologist OR eye clinic',
  },
  {
    category: 'Dentistry',
    keywords: ['dent', 'tooth', 'teeth', 'oral', 'orthodont', 'root canal', 'braces', 'dental clinic', 'dental doctor', 'dentist', 'dental hospital'],
    placesQuery: 'dental clinic OR dentist',
  },
  {
    category: 'Cardiology',
    keywords: ['cardio', 'heart', 'ecg', 'cardiac', 'hypertension', 'angio', 'blood pressure', 'cardiologist', 'heart specialist', 'cardiac doctor', 'heart doctor', 'heart hospital'],
    placesQuery: 'cardiology clinic OR heart hospital OR cardiologist',
  },
  {
    category: 'Dermatology',
    keywords: ['derm', 'skin', 'laser', 'acne', 'cosmet', 'hair', 'eczema', 'dermatologist', 'skin doctor', 'skin specialist', 'skin clinic'],
    placesQuery: 'skin clinic OR dermatologist OR cosmetology',
  },
  {
    category: 'ENT',
    keywords: ['ent', 'ear', 'nose', 'throat', 'sinus', 'audiolog', 'tonsil', 'ent specialist', 'ear nose throat', 'ent doctor', 'ent clinic', 'ent hospital'],
    placesQuery: 'ENT clinic OR ear nose throat specialist',
  },
  {
    category: 'Pediatrics',
    keywords: ['pediat', 'child', 'baby', 'infant', 'vaccination', 'newborn', 'children doctor', 'child specialist', 'kids doctor', 'children hospital'],
    placesQuery: 'pediatric clinic OR child specialist hospital',
  },
  {
    category: 'Orthopedics',
    keywords: ['ortho', 'bone', 'joint', 'spine', 'fracture', 'knee', 'orthopedic', 'bone doctor', 'orthopedic specialist', 'joint pain', 'back pain', 'bone hospital'],
    placesQuery: 'orthopedic clinic OR bone specialist hospital',
  },
  {
    category: 'Gynecology',
    keywords: ['gyn', 'women', 'maternity', 'pregnancy', 'obstetric', 'female', 'gynecologist', 'fertility', 'pregnant', 'period', 'pelvic', 'maternity hospital'],
    placesQuery: 'gynecology clinic OR maternity hospital OR obstetrician',
  },
  {
    category: 'Neurology',
    keywords: ['neuro', 'brain', 'migraine', 'nerve', 'vertigo', 'tremor', 'headache', 'neurologist', 'epilepsy', 'stroke', 'brain doctor', 'neuro clinic'],
    placesQuery: 'neurology clinic OR brain spine center OR neurologist',
  },
  {
    category: 'Pulmonology',
    keywords: ['pulmon', 'lung', 'breath', 'breathing', 'asthma', 'wheez', 'respiratory', 'chest congestion', 'pulmonologist', 'lung specialist'],
    placesQuery: 'pulmonology clinic OR chest hospital OR pulmonologist',
  },
  {
    category: 'Nephrology',
    keywords: ['nephro', 'kidney', 'renal', 'dialysis', 'creatinine', 'proteinuria', 'kidney specialist', 'nephrologist'],
    placesQuery: 'nephrology clinic OR kidney care center OR nephrologist',
  },
  {
    category: 'Gastroenterology',
    keywords: ['gastro', 'stomach', 'digest', 'acid reflux', 'gerd', 'liver', 'endoscopy', 'colon', 'gut', 'gastroenterologist', 'stomach pain'],
    placesQuery: 'gastroenterology clinic OR digestive health OR gastroenterologist',
  },
  {
    category: 'Endocrinology',
    keywords: ['endocrin', 'diabetes', 'thyroid', 'hormone', 'blood sugar', 'insulin', 'metabolic', 'diabetologist', 'endocrinologist'],
    placesQuery: 'diabetes center OR endocrinologist OR thyroid clinic',
  },
  {
    category: 'Urology',
    keywords: ['uro', 'urolog', 'urine', 'urinary', 'kidney stone', 'bladder', 'prostate', 'burning urination', 'urologist'],
    placesQuery: 'urology clinic OR urologist OR kidney stone center',
  },
  {
    category: 'Physiotherapy',
    keywords: ['physio', 'physiotherapy', 'rehab', 'rehabilitation', 'mobility', 'posture', 'muscle pain', 'sports physio', 'physiotherapist'],
    placesQuery: 'physiotherapy clinic OR rehabilitation center OR physiotherapist',
  },
  {
    category: 'Psychiatry',
    keywords: ['psych', 'mental', 'anxiety', 'depress', 'stress', 'insomnia', 'counsel', 'psychotherapy', 'panic', 'psychiatrist'],
    placesQuery: 'psychiatry clinic OR mental wellness clinic OR psychiatrist',
  },
  {
    category: 'General Medicine',
    keywords: ['general', 'physician', 'doctor', 'fever', 'cold', 'cough', 'family doctor', 'checkup', 'primary care', 'clinic near me', 'clinic', 'hospital near me', 'hospital', 'internal medicine', 'medical center'],
    placesQuery: 'medical clinic OR general physician OR health center',
  },
];

export const googleMapsBackendService = {
  /**
   * Normalizes search input and resolves category / department aliases.
   */
  normalizeQuery(query: string): { category: string; placesQuery: string; normalizedTerm: string } {
    const clean = (query || '').trim().toLowerCase();
    if (!clean || clean === 'all') {
      return {
        category: 'General Medicine',
        placesQuery: 'medical clinic OR hospital',
        normalizedTerm: 'all clinics',
      };
    }

    for (const entry of HEALTHCARE_TERM_MAP) {
      const match = entry.keywords.some((k) => clean.includes(k)) ||
        clean.includes(entry.category.toLowerCase()) ||
        entry.category.toLowerCase().includes(clean);
      if (match) {
        return {
          category: entry.category,
          placesQuery: entry.placesQuery,
          normalizedTerm: entry.category,
        };
      }
    }

    return {
      category: 'General Medicine',
      placesQuery: `${clean} medical clinic OR hospital`,
      normalizedTerm: clean,
    };
  },

  /**
   * Calculate Haversine geographical distance in km.
   */
  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Computes route matrix elements for origin and destination list using Google Routes API (New).
   */
  async computeRouteMatrix(
    originLat: number,
    originLng: number,
    destinations: { latitude: number; longitude: number }[]
  ): Promise<RouteElement[]> {
    if (!config.googleRoutesApiKey || destinations.length === 0) {
      return destinations.map((dest, idx) => {
        const distKm = this.calculateHaversineDistance(originLat, originLng, dest.latitude, dest.longitude);
        const distanceMeters = Math.floor(distKm * 1000);
        const durationSeconds = Math.max(60, Math.floor((distKm / 30) * 3600)); // Estimated 30 km/h traffic
        return { destinationIndex: idx, distanceMeters, durationSeconds };
      });
    }

    try {
      const response = await axios.post(
        'https://routes.googleapis.com/v1/computeRouteMatrix',
        {
          origins: [
            {
              waypoint: {
                location: {
                  latLng: { latitude: originLat, longitude: originLng },
                },
              },
            },
          ],
          destinations: destinations.map((dest) => ({
            waypoint: {
              location: {
                latLng: { latitude: dest.latitude, longitude: dest.longitude },
              },
            },
          })),
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': config.googleRoutesApiKey,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration,status',
          },
          timeout: 4000,
        }
      );

      const items = response.data || [];
      return items.map((element: any) => {
        const durationStr = element.duration || '0s';
        const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 0;
        return {
          destinationIndex: element.destinationIndex ?? 0,
          distanceMeters: element.distanceMeters ?? 0,
          durationSeconds,
        };
      });
    } catch (err: any) {
      console.warn('Google Routes API matrix fallback to Haversine speed estimation:', err.message);
      return destinations.map((dest, idx) => {
        const distKm = this.calculateHaversineDistance(originLat, originLng, dest.latitude, dest.longitude);
        return {
          destinationIndex: idx,
          distanceMeters: Math.floor(distKm * 1000),
          durationSeconds: Math.max(60, Math.floor((distKm / 30) * 3600)),
        };
      });
    }
  },

  /**
   * Performs Google Places Text Search (New) across regions if API key is present.
   */
  async searchGooglePlaces(
    queryText: string,
    originLat: number,
    originLng: number,
    radiusMeters: number = 15000
  ): Promise<ClinicEntity[]> {
    if (!config.googlePlacesApiKey) {
      return [];
    }

    const { category, placesQuery } = this.normalizeQuery(queryText);

    try {
      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: placesQuery,
          locationBias: {
            circle: {
              center: { latitude: originLat, longitude: originLng },
              radius: radiusMeters,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': config.googlePlacesApiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours,places.currentOpeningHours,places.photos,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.businessStatus',
          },
          timeout: 5000,
        }
      );

      const places = response.data.places || [];

      return places.map((place: any) => {
        const placeLat = place.location?.latitude || originLat;
        const placeLng = place.location?.longitude || originLng;
        const photoName = place.photos?.[0]?.name;
        const imageUrl = photoName
          ? `https://places.googleapis.com/v1/${photoName}/media?key=${config.googlePlacesApiKey}&maxHeightPx=400`
          : 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80';

        // Extract real Google Places opening hours
        const openingHours = place.currentOpeningHours || place.regularOpeningHours;
        const isOpen = openingHours?.openNow ?? true;
        const weekdayDesc = openingHours?.weekdayDescriptions?.[0] || 'Hours unavailable';

        return {
          id: `gp-${place.id}`,
          name: place.displayName?.text || 'Healthcare Clinic',
          address: place.formattedAddress || 'Chennai, Tamil Nadu',
          latitude: placeLat,
          longitude: placeLng,
          rating: place.rating || 4.5,
          reviews_count: place.userRatingCount || 20,
          image: imageUrl,
          category,
          doctors_count: 0, // Never invent doctors for Google-only clinics
          open_hours: weekdayDesc,
          phone: place.nationalPhoneNumber || '+91 44 2811 0000',
          is_open: isOpen,
          opens_at: isOpen ? 'Open Now' : 'Closed',
          is_popular: (place.userRatingCount || 0) > 100,
          is_nearby: true,
          wait_time: '15 min wait',
          consultation_fee: '₹500',
          google_place_id: place.id,
          departments: [category],
        };
      });
    } catch (err: any) {
      console.warn('Google Places API search notice:', err.message);
      return [];
    }
  },

  /**
   * Discovers and ranks healthcare clinics using multi-cell Chennai discovery,
   * Google Places + Platform connected clinics, Haversine pre-filter, and Google Routes matrix.
   */
  async discoverClinics(
    queryText: string,
    lat: number,
    lng: number,
    radiusKm: number = 15
  ): Promise<Array<ClinicEntity & { distanceMeters: number; travelDurationSeconds: number; distance: string; travelTime: string }>> {
    const { category } = this.normalizeQuery(queryText);
    const cleanQ = (queryText || '').trim().toLowerCase();

    // 1. Fetch connected platform clinics from database
    const platformClinics = await ClinicModel.getAll();

    // 2. Fetch Google Places results if API key is configured
    let googleClinics: ClinicEntity[] = [];
    if (config.googlePlacesApiKey) {
      googleClinics = await this.searchGooglePlaces(queryText, lat, lng, radiusKm * 1000);
    }

    // 3. Merge & Deduplicate candidates using place_id and name
    const combinedMap = new Map<string, ClinicEntity>();

    // Platform clinics prioritized
    platformClinics.forEach((clinic) => {
      combinedMap.set(clinic.id, clinic);
    });

    // Google clinics merged
    googleClinics.forEach((gClinic) => {
      const existingKey = Array.from(combinedMap.keys()).find((k) => {
        const item = combinedMap.get(k);
        return (
          (item?.google_place_id && item.google_place_id === gClinic.google_place_id) ||
          (item?.name.toLowerCase() === gClinic.name.toLowerCase())
        );
      });

      if (!existingKey) {
        combinedMap.set(gClinic.id, gClinic);
      }
    });

    const allCandidates = Array.from(combinedMap.values());

    // 4. Filter by query/specialization
    const matched = allCandidates.filter((clinic) => {
      if (!cleanQ || cleanQ === 'all' || cleanQ === 'medical clinic' || cleanQ === 'hospital') return true;

      const catMatch =
        clinic.category.toLowerCase() === category.toLowerCase() ||
        clinic.departments?.some((d) => d.toLowerCase() === category.toLowerCase() || d.toLowerCase().includes(cleanQ));
      const nameMatch = clinic.name.toLowerCase().includes(cleanQ) || clinic.address.toLowerCase().includes(cleanQ);

      return catMatch || nameMatch;
    });

    const candidateList = matched.length > 0 ? matched : allCandidates;

    // 5. Haversine Pre-filtering: Filter within radiusKm + buffer
    const withinRadius = candidateList.filter((c) => {
      const distKm = this.calculateHaversineDistance(lat, lng, c.latitude, c.longitude);
      return distKm <= radiusKm * 1.5;
    });

    const finalCandidates = withinRadius.length > 0 ? withinRadius : candidateList;

    // 6. Compute road distances & ETAs using Route Matrix
    const routeElements = await this.computeRouteMatrix(
      lat,
      lng,
      finalCandidates.map((c) => ({ latitude: c.latitude, longitude: c.longitude }))
    );

    return finalCandidates.map((clinic, idx) => {
      const route = routeElements.find((r) => r.destinationIndex === idx);
      const distanceMeters = route && route.distanceMeters > 0
        ? route.distanceMeters
        : Math.floor(this.calculateHaversineDistance(lat, lng, clinic.latitude, clinic.longitude) * 1000);
      const travelDurationSeconds = route && route.durationSeconds > 0
        ? route.durationSeconds
        : Math.max(60, Math.floor(((distanceMeters / 1000) / 30) * 3600));

      const distKm = (distanceMeters / 1000).toFixed(1);
      const travelMins = Math.max(1, Math.round(travelDurationSeconds / 60));

      return {
        ...clinic,
        distanceMeters,
        travelDurationSeconds,
        distance: `${distKm} km`,
        travelTime: `${travelMins} min`,
      };
    });
  },
};
