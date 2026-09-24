import { Router, Response } from 'express';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { PatientModel, SavedLocationModel } from '../database/models';

export const patientRouter = Router();

// GET /api/patient/profile
patientRouter.get('/profile', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patient = req.patient!;
    const { password_hash, ...safePatient } = patient;
    res.status(200).json({ success: true, user: safePatient });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch patient profile.' });
  }
});

// PUT /api/patient/profile
patientRouter.put('/profile', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patient = req.patient!;
    const {
      name,
      bloodGroup,
      age,
      gender,
      address,
      emergencyContact,
      preferredSpecialization,
      preferredDoctor,
      notificationsEnabled,
      themePreference,
    } = req.body;

    const updated = await PatientModel.update(patient.id, {
      ...(name && { name }),
      ...(bloodGroup && { blood_group: bloodGroup }),
      ...(age && { age: parseInt(age, 10) }),
      ...(gender && { gender }),
      ...(address && { address }),
      ...(emergencyContact && { emergency_contact: emergencyContact }),
      ...(preferredSpecialization && { preferred_specialization: preferredSpecialization }),
      ...(preferredDoctor && { preferred_doctor: preferredDoctor }),
      ...(notificationsEnabled !== undefined && { notifications_enabled: notificationsEnabled }),
      ...(themePreference && { theme_preference: themePreference }),
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Patient not found.' });
      return;
    }

    const { password_hash, ...safePatient } = updated;
    res.status(200).json({ success: true, user: safePatient });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update patient profile.' });
  }
});

// GET /api/patient/saved-locations
patientRouter.get('/saved-locations', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patient = req.patient!;
    const locations = await SavedLocationModel.getByPatientId(patient.id);
    res.status(200).json({ success: true, locations });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch saved locations.' });
  }
});

// POST /api/patient/saved-locations
patientRouter.post('/saved-locations', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patient = req.patient!;
    const { label, name, locality, latitude, longitude, address } = req.body;

    if (!label || !name || !locality || !latitude || !longitude) {
      res.status(400).json({ success: false, error: 'Missing required location fields.' });
      return;
    }

    const newLoc = await SavedLocationModel.create({
      patient_id: patient.id,
      label,
      name,
      locality,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || locality,
    });

    res.status(201).json({ success: true, location: newLoc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to save location.' });
  }
});
