import { Router, Request, Response } from 'express';
import { ClinicModel, DepartmentModel, DoctorModel } from '../database/models';
import { mapRoutingBackendService, googleMapsBackendService, CHENNAI_GEOGRAPHIC_CELLS } from '../services/mapRoutingBackendService';
import { chennaiClinicDiscoveryService } from '../services/chennaiClinicDiscoveryService';
import { recommendationEngine } from '../services/recommendationEngine';

export const clinicRouter = Router();

// GET /api/clinics/route
clinicRouter.get('/route', async (req: Request, res: Response): Promise<void> => {
  try {
    const originLat = parseFloat((req.query.originLat as string) || '13.0338');
    const originLng = parseFloat((req.query.originLng as string) || '80.2677');
    const destLat = parseFloat((req.query.destLat as string) || '13.0368');
    const destLng = parseFloat((req.query.destLng as string) || '80.2647');

    const route = await mapRoutingBackendService.calculateRouteGeometry(originLat, originLng, destLat, destLng);
    res.status(200).json({ success: true, route });
  } catch (err: any) {
    console.error('Route calculation error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate route geometry.' });
  }
});

// GET /api/clinics/reverse-geocode
clinicRouter.get('/reverse-geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const lat = parseFloat((req.query.latitude || req.query.lat) as string);
    const lng = parseFloat((req.query.longitude || req.query.lng) as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: 'Valid latitude and longitude required.' });
      return;
    }

    const localityInfo = await mapRoutingBackendService.reverseGeocode(lat, lng);
    res.status(200).json({
      success: true,
      name: localityInfo.name,
      locality: localityInfo.locality,
      latitude: lat,
      longitude: lng,
    });
  } catch (err: any) {
    console.error('Reverse geocode error:', err);
    res.status(500).json({ success: false, error: 'Failed to reverse geocode coordinates.' });
  }
});

// GET /api/clinics/geocode
clinicRouter.get('/geocode', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.query as string) || '';
    if (!query.trim()) {
      res.status(200).json({ success: true, locations: [] });
      return;
    }

    const locations = await mapRoutingBackendService.geocodeQuery(query);
    res.status(200).json({ success: true, locations });
  } catch (err: any) {
    console.error('Geocode search error:', err);
    res.status(500).json({ success: false, error: 'Failed to geocode query.' });
  }
});

// GET /api/clinics/specializations
clinicRouter.get('/specializations', async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await DepartmentModel.getAll();
    res.status(200).json({ success: true, specializations: departments, departments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch specializations.' });
  }
});

// GET /api/clinics/departments
clinicRouter.get('/departments', async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await DepartmentModel.getAll();
    res.status(200).json({ success: true, departments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch departments.' });
  }
});

// GET /api/clinics/discovery
clinicRouter.get('/discovery', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.query as string) || '';
    const department = (req.query.department as string) || '';
    const lat = parseFloat((req.query.latitude as string) || '13.0338');
    const lng = parseFloat((req.query.longitude as string) || '80.2677');
    const radius = parseFloat((req.query.radius as string) || '20');
    const userPrefSpecialty = (req.query.preference as string) || null;
    const openNow = req.query.openNow === 'true';
    const minRating = parseFloat((req.query.minRating as string) || '0');
    const sort = ((req.query.sort as string) || 'best') as 'best' | 'fastest' | 'shortest';

    // 1. Chennai-Wide Grid Discovery (Geoapify + OSM + PostgreSQL)
    const discovery = await chennaiClinicDiscoveryService.discoverClinics({
      query,
      department,
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      userPreference: userPrefSpecialty,
      openNow,
      minRating,
      sort,
    });

    // 2. Attach real verified doctor counts only for platform-connected clinics
    const allDoctors = await DoctorModel.getAll();
    const enrichedClinics = discovery.clinics.map((clinic) => {
      if (clinic.isConnected) {
        const docs = allDoctors.filter(
          (d) => d.clinic_id === clinic.id || d.clinic_affiliations?.includes(clinic.name)
        );
        return {
          ...clinic,
          doctors_count: docs.length,
          consultation_fee: docs.length > 0 ? docs[0].consultation_fee : clinic.consultation_fee,
          wait_time: docs.length > 0 ? `${docs[0].wait_time} wait` : clinic.wait_time,
        };
      }
      return clinic;
    });

    res.status(200).json({
      success: true,
      count: enrichedClinics.length,
      source: discovery.source,
      totalPlatform: discovery.totalPlatform,
      totalExternal: discovery.totalExternal,
      departments: discovery.departments,
      clinics: enrichedClinics,
      results: enrichedClinics,
    });
  } catch (err: any) {
    console.error('Clinic discovery error:', err);
    res.status(500).json({ success: false, error: 'Failed to discover nearby clinics.' });
  }
});

// GET /api/clinics
clinicRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let clinics = await ClinicModel.getAll();
    const dept = ((req.query.department || req.query.specialty) as string || '').trim().toLowerCase();
    if (dept) {
      clinics = clinics.filter((c: any) => {
        const depts: string[] = (c.departments || []).map((d: string) => d.toLowerCase());
        const specs: string[] = (c.specialties || []).map((s: string) => s.toLowerCase());
        return depts.includes(dept) || specs.includes(dept) || depts.some((d: string) => d.includes(dept) || dept.includes(d));
      });
    }
    res.status(200).json({ success: true, count: clinics.length, clinics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch clinics.' });
  }
});

// GET /api/clinics/:id
clinicRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinic = await ClinicModel.getById(req.params.id);
    if (!clinic) {
      res.status(404).json({ success: false, error: 'Clinic not found.' });
      return;
    }

    const doctors = await DoctorModel.getByClinic(clinic.id);
    res.status(200).json({
      success: true,
      clinic: {
        ...clinic,
        doctors,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch clinic details.' });
  }
});

// GET /api/clinics/:id/doctors
clinicRouter.get('/:id/doctors', async (req: Request, res: Response): Promise<void> => {
  try {
    const doctors = await DoctorModel.getByClinic(req.params.id);
    res.status(200).json({ success: true, doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch clinic doctors.' });
  }
});

import { emitBroadcast } from '../services/socketService';

// POST /api/clinics (Clinic Registration Endpoint)
const registerClinicHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      address,
      latitude,
      longitude,
      phone = '+91 44 2811 0000',
      email,
      category = 'Dental Care',
      departments = ['Dentistry'],
      openHours = '09:00 AM - 05:00 PM',
      consultationFee = '₹400',
    } = req.body;

    if (!name || !name.trim() || !address || !address.trim()) {
      res.status(400).json({ success: false, error: 'Clinic name and address are required.' });
      return;
    }

    let lat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
    let lng = typeof longitude === 'number' ? longitude : parseFloat(longitude);

    // If coordinates are missing, zero, or default standard fallback, resolve accurately from address
    const isDefaultCoords = (lat === 13.0078 && lng === 80.2567) || (lat === 13.0338 && lng === 80.2677);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0) || isDefaultCoords) {
      const geocoded = await mapRoutingBackendService.geocodeQuery(address);
      if (geocoded.length > 0) {
        lat = geocoded[0].latitude;
        lng = geocoded[0].longitude;
      } else {
        // Check if address matches any Chennai cell centroid
        const cleanAddr = address.toLowerCase();
        const matchedCell = CHENNAI_GEOGRAPHIC_CELLS.find((c) => cleanAddr.includes(c.name.toLowerCase()));
        if (matchedCell) {
          lat = matchedCell.lat;
          lng = matchedCell.lng;
        } else if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
          lat = 13.1075; // Standard Chennai centroid
          lng = 80.2060;
        }
      }
    }

    const id = `clinic-${Date.now()}`;
    const newClinic = await ClinicModel.create({
      id,
      name: name.trim(),
      address: address.trim(),
      latitude: lat,
      longitude: lng,
      rating: 4.85,
      reviews_count: 15,
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
      category: category || 'Dentistry',
      doctors_count: 0,
      open_hours: openHours,
      phone,
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min',
      consultation_fee: consultationFee,
      departments: Array.isArray(departments) ? departments : [departments],
      created_at: new Date().toISOString(),
    });

    // Broadcast real-time clinic creation event
    emitBroadcast('clinic:created', newClinic);

    res.status(201).json({
      success: true,
      message: 'Clinic registered successfully.',
      clinic: newClinic,
    });
  } catch (err: any) {
    console.error('Error registering clinic:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to register clinic.' });
  }
};

clinicRouter.post('/', registerClinicHandler);
clinicRouter.post('/register', registerClinicHandler);

