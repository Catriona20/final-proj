import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { MedicalFileModel, PrescriptionModel, AppointmentModel, ConsultationModel } from '../database/models';
import { memoryDb } from '../database/db';

export const recordsRouter = Router();

// GET /api/records
recordsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let authenticatedPatientId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as any;
        if (decoded && decoded.id) {
          authenticatedPatientId = decoded.id;
        }
      } catch (e) {
        // Invalid or expired token
      }
    }

    const queryPatientId = req.query.patientId as string;
    const patientId = authenticatedPatientId || queryPatientId;

    if (!patientId) {
      res.status(200).json({ success: true, records: [], visits: [] });
      return;
    }

    const files = await MedicalFileModel.getByPatientId(patientId);
    const prescriptions = await PrescriptionModel.getByPatientId(patientId);
    const appointments = await AppointmentModel.getByPatientId(patientId);
    const consultations = await ConsultationModel.getByPatientId(patientId);

    const isCompleted = (a: any) =>
      ['completed'].includes(a.status?.toLowerCase() || '') ||
      ['completed'].includes(a.appointmentStatus?.toLowerCase() || '');

    const completedAppointments = appointments.filter(isCompleted);

    // Build authoritative visits list
    const visits: any[] = [];
    const seenVisitAppointmentIds = new Set<string>();

    for (const apt of completedAppointments) {
      seenVisitAppointmentIds.add(apt.id);
      const cons = consultations.find((c) => c.appointment_id === apt.id);
      const rx = prescriptions.find((p) => p.appointment_id === apt.id || p.id === `rx-${apt.id}`);

      visits.push({
        id: `visit-${apt.id}`,
        appointmentId: apt.id,
        patientId: apt.patient_id,
        doctorId: apt.doctor_id,
        doctorName: apt.doctor_name,
        doctorSpecialization: apt.doctor_specialization,
        doctorAvatar: apt.doctor_avatar,
        clinicId: apt.clinic_id,
        clinicName: apt.clinic_name,
        clinicAddress: apt.clinic_address,
        date: apt.date || apt.appointmentDate,
        time: apt.time,
        duration: apt.duration,
        tokenNumber: apt.token_number || apt.queueToken || '#01',
        reason: apt.reason || 'General Consultation',
        diagnosis: cons?.diagnosis || rx?.diagnosis || apt.reason || 'General Consultation',
        clinicalNotes: cons?.clinical_notes || cons?.assessment || rx?.clinical_notes || '',
        symptoms: cons?.symptoms || apt.symptoms || [],
        prescriptionAvailable: !!rx || apt.prescription_available,
        prescriptionId: rx?.id || (apt.prescription_available ? `rx-${apt.id}` : undefined),
        medicines: rx?.medicines || [],
        status: 'Completed',
      });
    }

    // Include completed consultations that might not have a matching appointment entity (e.g. walk-ins)
    for (const c of consultations) {
      if (!seenVisitAppointmentIds.has(c.appointment_id)) {
        seenVisitAppointmentIds.add(c.appointment_id);
        const doc = memoryDb.doctors.get(c.doctor_id);
        const rx = prescriptions.find((p) => p.appointment_id === c.appointment_id || p.id === `rx-${c.appointment_id}`);
        visits.push({
          id: `visit-${c.id}`,
          appointmentId: c.appointment_id,
          patientId: c.patient_id,
          doctorId: c.doctor_id,
          doctorName: doc?.name || 'Attending Physician',
          doctorSpecialization: doc?.specialization || 'General Medicine',
          doctorAvatar: doc?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
          clinicId: c.clinic_id || doc?.clinic_id,
          clinicName: doc?.clinic_name || 'Healthcare Clinic',
          clinicAddress: (doc as any)?.clinic_address || 'Chennai',
          date: new Date(c.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: '11:00 AM',
          duration: '20 min',
          tokenNumber: '#01',
          reason: c.diagnosis || 'Clinical Consultation',
          diagnosis: c.diagnosis,
          clinicalNotes: c.clinical_notes || c.assessment || '',
          symptoms: c.symptoms || [],
          prescriptionAvailable: !!rx,
          prescriptionId: rx?.id,
          medicines: rx?.medicines || [],
          status: 'Completed',
        });
      }
    }

    // Format composite health records for patient UI
    const records = [
      ...prescriptions.map((rx) => ({
        id: rx.id || `rec-rx-${rx.appointment_id}`,
        type: 'prescription' as const,
        title: `Prescription — ${rx.doctor_name}`,
        clinic: rx.clinic_name,
        clinicId: rx.clinic_id,
        date: rx.date,
        doctor: rx.doctor_name,
        doctorId: rx.doctor_id,
        appointmentId: rx.appointment_id,
        patientId: rx.patient_id,
        status: 'Active',
        prescriptionAvailable: true,
        reason: rx.diagnosis,
        doctorLicense: rx.doctor_registration_number,
        details: rx.clinical_notes,
        medicines: rx.medicines,
        fileSize: '460 KB',
      })),
      ...files.map((file) => ({
        id: file.id,
        type: file.category === 'Lab report' ? ('lab' as const) : ('report' as const),
        title: file.test_name,
        clinic: file.clinic_performed,
        clinicId: file.clinic_id,
        date: file.upload_date,
        doctor: 'Attending Physician',
        status: 'Verified',
        reason: file.reason_for_test,
        details: file.notes,
        fileSize: file.file_size || '1.2 MB',
        downloadUrl: file.uri || `https://medlink.health/records/${file.id}.pdf`,
      })),
      ...visits.map((v) => ({
        id: `rec-${v.id}`,
        type: 'report' as const,
        title: `OPD Consultation — ${v.clinicName}`,
        clinic: v.clinicName,
        clinicId: v.clinicId,
        date: v.date,
        doctor: v.doctorName,
        doctorId: v.doctorId,
        appointmentId: v.appointmentId,
        patientId: v.patientId,
        status: 'Completed',
        prescriptionAvailable: v.prescriptionAvailable,
        reason: v.reason,
        details: v.clinicalNotes || `Completed OPD Consultation for ${v.doctorSpecialization}. Symptoms: ${v.symptoms?.join(', ') || 'None noted'}.`,
        doctorLicense: 'Verified Licensed Physician',
        medicines: v.medicines,
      })),
    ];

    res.status(200).json({ success: true, records, visits });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch health records.' });
  }
});

// GET /api/records/prescriptions (Patient-isolated prescription list)
recordsRouter.get('/prescriptions', async (req: Request, res: Response): Promise<void> => {
  try {
    let authenticatedPatientId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret) as any;
        if (decoded && decoded.id) {
          authenticatedPatientId = decoded.id;
        }
      } catch (e) {}
    }

    const patientId = authenticatedPatientId || (req.query.patientId as string);
    if (!patientId) {
      res.status(200).json({ success: true, prescriptions: [] });
      return;
    }

    const prescriptions = await PrescriptionModel.getByPatientId(patientId);
    res.status(200).json({ success: true, prescriptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch prescriptions.' });
  }
});

// GET /api/records/prescriptions/:appointmentId
recordsRouter.get('/prescriptions/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    let prescription = await PrescriptionModel.getByAppointmentId(appointmentId);
    if (!prescription) {
      prescription = await PrescriptionModel.getById(appointmentId);
    }
    if (!prescription) {
      res.status(404).json({ success: false, error: 'Digital prescription not found for this consultation.' });
      return;
    }
    res.status(200).json({ success: true, prescription });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch digital prescription.' });
  }
});

// POST /api/records/upload
recordsRouter.post('/upload', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patientId = 'pat-101',
      appointmentId,
      clinicId,
      fileName = 'Diagnostic_Report.pdf',
      fileType = 'application/pdf',
      fileSize = '1.2 MB',
      uri,
      testName,
      category = 'Lab report',
      clinicPerformed = 'MetroCare Diagnostics Lab',
      testDate,
      reasonForTest,
      notes,
    } = req.body;

    if (!testName) {
      res.status(400).json({ success: false, error: 'Please enter the test or document name.' });
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newFile = await MedicalFileModel.create({
      patient_id: patientId,
      appointment_id: appointmentId,
      clinic_id: clinicId,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      uri: uri || `https://medlink.health/records/doc-${Date.now()}.pdf`,
      upload_date: todayStr,
      test_name: testName,
      category,
      clinic_performed: clinicPerformed,
      test_date: testDate || todayStr,
      reason_for_test: reasonForTest,
      notes,
    });

    res.status(201).json({ success: true, file: newFile });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to upload medical document.' });
  }
});
