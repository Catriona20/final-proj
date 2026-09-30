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
    category: 'Dentistry',
    keywords: ['dentist', 'dentistry', 'dental', 'tooth', 'teeth', 'toothache', 'tooth pain', 'oral', 'orthodontist', 'root canal', 'braces', 'dental clinic', 'dental doctor', 'dental hospital', 'cavity', 'gums', 'bleeding gums'],
    placesQuery: 'dental clinic OR dentist',
  },
  {
    category: 'General Medicine',
    keywords: ['general physician', 'general medicine', 'general practitioner', 'family doctor', 'internal medicine', 'primary care', 'fever', 'cold', 'cough', 'viral fever', 'body ache', 'checkup', 'physician', 'doctor', 'clinic near me', 'clinic', 'hospital near me', 'hospital', 'medical center'],
    placesQuery: 'medical clinic OR general physician OR health center',
  },
  {
    category: 'Cardiology',
    keywords: ['cardiologist', 'cardiology', 'cardiac', 'heart', 'heart specialist', 'heart doctor', 'cardiac doctor', 'heart hospital', 'chest pain', 'palpitations', 'ecg', 'hypertension', 'angina', 'angio', 'blood pressure'],
    placesQuery: 'cardiology clinic OR heart hospital OR cardiologist',
  },
  {
    category: 'Dermatology',
    keywords: ['dermatologist', 'dermatology', 'skin specialist', 'skin doctor', 'skin', 'skin rash', 'rash', 'acne', 'eczema', 'psoriasis', 'hair fall', 'laser', 'cosmetology', 'skin clinic'],
    placesQuery: 'skin clinic OR dermatologist OR cosmetology',
  },
  {
    category: 'Ophthalmology',
    keywords: ['ophthalmologist', 'ophthalmology', 'eye specialist', 'eye doctor', 'eye', 'eye irritation', 'vision', 'blurred vision', 'cataract', 'glaucoma', 'retina', 'cornea', 'lasik', 'spectacle', 'glasses', 'eye clinic', 'eye hospital'],
    placesQuery: 'eye hospital OR ophthalmologist OR eye clinic',
  },
  {
    category: 'ENT',
    keywords: ['ent', 'ent specialist', 'ent doctor', 'ear nose throat', 'otolaryngologist', 'ear pain', 'ear infection', 'sore throat', 'tonsil', 'sinus', 'sinusitis', 'audiologist', 'hearing', 'ent clinic', 'ent hospital'],
    placesQuery: 'ENT clinic OR ear nose throat specialist',
  },
  {
    category: 'Pediatrics',
    keywords: ['pediatrician', 'paediatrician', 'pediatrics', 'paediatrics', 'child specialist', 'child doctor', 'kids doctor', 'baby doctor', 'infant', 'child fever', 'vaccination', 'newborn', 'children hospital', 'pediatric clinic'],
    placesQuery: 'pediatric clinic OR child specialist hospital',
  },
  {
    category: 'Orthopedics',
    keywords: ['orthopedic', 'orthopaedic', 'orthopedics', 'orthopaedics', 'bone specialist', 'bone doctor', 'joint pain', 'knee pain', 'fracture', 'spine', 'arthritis', 'back pain', 'joint swelling', 'bone hospital', 'orthopedic clinic'],
    placesQuery: 'orthopedic clinic OR bone specialist hospital',
  },
  {
    category: 'Gynecology',
    keywords: ['gynecologist', 'gynaecologist', 'gynecology', 'gynaecology', 'obstetrician', 'obstetrics', 'ob-gyn', 'obgyn', 'ob gyn', 'gynae', 'gyno', "women's health", 'womens health', 'pregnancy specialist', 'pregnancy', 'maternity', 'pcos', 'antenatal', 'prenatal', 'irregular periods', 'pelvic pain', 'fertility', 'maternity hospital', 'female doctor'],
    placesQuery: 'gynecology clinic OR maternity hospital OR obstetrician',
  },
  {
    category: 'Neurology',
    keywords: ['neurologist', 'neurology', 'brain specialist', 'brain doctor', 'nerve specialist', 'migraine', 'headache', 'vertigo', 'dizziness', 'epilepsy', 'stroke', 'seizure', 'tremor', 'nerve', 'neuro clinic'],
    placesQuery: 'neurology clinic OR brain spine center OR neurologist',
  },
  {
    category: 'Pulmonology',
    keywords: ['pulmonologist', 'pulmonology', 'lung specialist', 'lung doctor', 'chest specialist', 'respiratory specialist', 'breathing problem', 'difficulty breathing', 'shortness of breath', 'asthma', 'wheezing', 'chronic cough', 'bronchitis', 'chest congestion', 'pulmonary'],
    placesQuery: 'pulmonology clinic OR chest hospital OR pulmonologist',
  },
  {
    category: 'Nephrology',
    keywords: ['nephrologist', 'nephrology', 'kidney specialist', 'kidney doctor', 'renal specialist', 'kidney problem', 'kidney disease', 'dialysis', 'creatinine', 'proteinuria', 'renal care', 'foamy urine', 'renal'],
    placesQuery: 'nephrology clinic OR kidney hospital OR nephrologist',
  },
  {
    category: 'Gastroenterology',
    keywords: ['gastroenterologist', 'gastroenterology', 'stomach specialist', 'stomach doctor', 'digestive specialist', 'stomach pain', 'acidity', 'gerd', 'acid reflux', 'gastric', 'liver', 'abdominal pain', 'gastritis', 'digestive health'],
    placesQuery: 'gastroenterology clinic OR digestive health OR gastroenterologist',
  },
  {
    category: 'Endocrinology',
    keywords: ['endocrinologist', 'endocrinology', 'diabetologist', 'diabetes specialist', 'thyroid specialist', 'hormone specialist', 'diabetes', 'thyroid', 'blood sugar', 'insulin', 'metabolic', 'hormone'],
    placesQuery: 'endocrinology clinic OR diabetes center OR endocrinologist',
  },
  {
    category: 'Urology',
    keywords: ['urologist', 'urology', 'urinary specialist', 'kidney stone', 'urine problem', 'urinary infection', 'uti', 'burning urination', 'bladder', 'prostate', 'dysuria', 'urine'],
    placesQuery: 'urology clinic OR urologist OR kidney stone center',
  },
  {
    category: 'Physiotherapy',
    keywords: ['physiotherapist', 'physiotherapy', 'physical therapist', 'physical therapy', 'physio', 'rehabilitation', 'rehab', 'back pain physiotherapy', 'mobility', 'posture', 'sports physio'],
    placesQuery: 'physiotherapy clinic OR rehabilitation center OR physiotherapist',
  },
  {
    category: 'Psychiatry',
    keywords: ['psychiatrist', 'psychiatry', 'mental health doctor', 'mental health specialist', 'psychologist', 'mental health', 'anxiety', 'depression', 'insomnia', 'stress', 'panic attacks', 'counseling', 'psych'],
    placesQuery: 'psychiatry clinic OR mental health center OR psychiatrist',
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
