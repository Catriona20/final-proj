import { Router, Request, Response } from 'express';
import { AppointmentModel, DoctorModel, ClinicModel, MedicalFileModel, PatientModel } from '../database/models';
import { memoryDb } from '../database/db';
import { queueManager } from '../services/queueManager';
import { notificationService } from '../services/notificationService';
import { twilioService } from '../services/twilioService';
import { resendService } from '../services/resendService';
import { emitToPatient, emitToAppointment, emitToDoctor, emitToClinic, emitBroadcast } from '../services/socketService';
import { timeService } from '../services/timeService';
import { doctorAvailabilityService } from '../services/doctorAvailabilityService';

import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const appointmentRouter = Router();

// In-flight booking locks to prevent double-click / rapid concurrent submissions
const activeBookingLocks = new Set<string>();

export const clearActiveBookingLocks = (): void => {
  activeBookingLocks.clear();
};

export const getActiveBookingLocksCount = (): number => {
  return activeBookingLocks.size;
};

function standardizeTime(t?: string): string {
  if (!t) return '';
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return t.trim().toUpperCase();
  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  const meridiem = (match[3] || 'AM').toUpperCase();
  return `${hours}:${minutes} ${meridiem}`;
}

// BOOK APPOINTMENT HANDLER
const bookAppointmentHandler = async (req: Request, res: Response): Promise<void> => {
  let bookingLockKey: string | null = null;
  try {
    // 1. Authenticated Identity Resolution
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

    const {
      doctorId,
      clinicId,
      department,
      date,
      time,
      reason = 'General consultation',
      customReasonText,
      symptoms = [],
      uploadedFiles = [],
      notes,
      expectedDuration = '20 min',
      consultationFee,
    } = req.body;

    const patientId = authenticatedPatientId || req.body.patientId || (req as any).user?.id || 'pat-demo-01';

    if (!doctorId || !clinicId || !date || !time) {
      res.status(400).json({ success: false, error: 'Missing required booking parameters (doctorId, clinicId, date, time).' });
      return;
    }

    const doctor = await DoctorModel.getById(doctorId);
    const clinic = await ClinicModel.getById(clinicId);
    const patient = await PatientModel.findById(patientId);

    if (!doctor || !clinic) {
      res.status(404).json({ success: false, error: 'Selected doctor or clinic not found in healthcare registry.' });
      return;
    }

    const normalizedDate = timeService.normalizeDateString(date);
    const normalizedTime = standardizeTime(time);

    // 2. In-flight concurrency lock (prevent rapid double clicks)
    bookingLockKey = `${doctor.id}:${normalizedDate}:${normalizedTime}`;
    if (activeBookingLocks.has(bookingLockKey)) {
      res.status(409).json({
        success: false,
        code: 'BOOKING_IN_PROGRESS',
        error: 'A booking for this slot is currently being processed. Please wait.',
      });
      return;
    }
    activeBookingLocks.add(bookingLockKey);

    // 3. Duplicate Booking Check: Check if slot is already booked or if patient has active booking
    for (const existingApt of memoryDb.appointments.values()) {
      const existingDocId = existingApt.doctor_id || existingApt.doctorId;
      const existingDate = timeService.normalizeDateString(existingApt.date || existingApt.appointmentDate);
      const existingTime = standardizeTime(existingApt.time || existingApt.slotStartTime);
      const isActive = !['Cancelled', 'CANCELLED', 'No Show', 'NO_SHOW', 'No-Show'].includes(existingApt.status);

      if (isActive && existingDate === normalizedDate && existingTime === normalizedTime) {
        if (existingApt.patient_id === patientId) {
          res.status(409).json({
            success: false,
            code: 'DUPLICATE_BOOKING',
            error: 'You already have an appointment scheduled for this time slot.',
            appointment: formatAppointmentResponse(existingApt),
          });
          return;
        }

        if (existingDocId === doctor.id) {
          res.status(409).json({
            success: false,
            code: 'SLOT_NO_LONGER_AVAILABLE',
            error: 'This slot is no longer available. Please select another time slot.',
          });
          return;
        }
      }
    }

    // Comprehensive Authoritative Backend Slot Validation
    const durMins = parseInt(String(expectedDuration).replace(/[^0-9]/g, ''), 10) || 20;
    const validation = await doctorAvailabilityService.validateSlotAvailability(
      doctor.id,
      clinic.id,
      normalizedDate,
      normalizedTime,
      { consultationDurationMinutes: durMins }
    );

    if (!validation.valid) {
      const isConflict = validation.code === 'SLOT_NO_LONGER_AVAILABLE';
      res.status(isConflict ? 409 : 400).json({
        success: false,
        code: validation.code,
        error: validation.error,
      });
      return;
    }

    // 4. Assign unique token, queue position & estimated wait
    const queueData = await queueManager.assignTokenAndQueue(doctorId, normalizedDate);

    // 5. Persist appointment in relational store
    const newAppointment = await AppointmentModel.create({
      patient_id: patientId,
      patient_name: patient?.name || req.body.patientName || 'Patient',
      patient_phone: patient?.phone || req.body.patientPhone || '+91 99999 99999',
      doctor_id: doctor.id,
      doctor_name: doctor.name,
      doctor_specialization: doctor.specialization,
      doctor_avatar: doctor.avatar,
      clinic_id: clinic.id,
      clinic_name: clinic.name,
      clinic_address: clinic.address,
      department: department || doctor.specialization,
      date: normalizedDate,
      time: normalizedTime,
      duration: expectedDuration || '25 min',
      status: 'Booked',
      appointmentStatus: 'BOOKED',
      queue_number: queueData.queuePosition,
      token_number: queueData.tokenNumber,
      queue_position: queueData.queuePosition,
      patients_ahead: queueData.patientsAhead,
      estimated_wait: queueData.estimatedWait,
      travel_time: '12 min',
      distance: '1.4 km',
      reason,
      custom_reason_text: customReasonText,
      symptoms,
      consultation_fee: consultationFee || doctor.consultation_fee || '₹400',
      notes,
      prescription_available: false,
    });

    // 6. Save any uploaded files attached to appointment
    for (const file of uploadedFiles) {
      await MedicalFileModel.create({
        patient_id: patientId,
        appointment_id: newAppointment.id,
        clinic_id: clinic.id,
        file_name: file.fileName || 'medical_report.pdf',
        file_type: file.fileType || 'application/pdf',
        file_size: file.fileSize || '1.2 MB',
        uri: file.uri,
        upload_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        test_name: file.testName || 'Patient Uploaded Document',
        category: file.category || 'Medical document',
        clinic_performed: clinic.name,
        test_date: normalizedDate,
        reason_for_test: reason,
        notes: file.notes,
      });
    }

    // 7. Send Multi-Channel Notifications (In-App, Real-Time Socket, SMS, Email)
    await notificationService.notifyAppointmentBooked(newAppointment, patient?.email, patient?.phone);

    // 8. Emit socket event strictly to scoped participants & broadcast availability update
    const formatted = formatAppointmentResponse(newAppointment);
    emitToPatient(patientId, 'appointment:created', formatted);
    emitToClinic(clinic.id, 'appointment:created', formatted);
    emitToDoctor(doctor.id, 'appointment:created', formatted);
    emitBroadcast('appointment:created', formatted);
    emitBroadcast('doctor:availability_updated', {
      doctorId: doctor.id,
      doctorName: doctor.name,
      clinicId: clinic.id,
      date: normalizedDate,
      slot: normalizedTime,
      action: 'BOOKING',
      appointmentId: newAppointment.id,
    });

    res.status(201).json({
      success: true,
      appointment: formatted,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('slot is no longer available')) {
      res.status(409).json({ success: false, error: 'This slot is no longer available.' });
      return;
    }
    console.error('Booking appointment error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to complete appointment booking.' });
  } finally {
    if (bookingLockKey) {
      activeBookingLocks.delete(bookingLockKey);
    }
  }
};

appointmentRouter.post('/book', bookAppointmentHandler);
appointmentRouter.post('/', bookAppointmentHandler);

function formatAppointmentResponse(apt: any) {
  if (!apt) return null;
  const todayStr = timeService.getTodayDateString();
  const aptDate = timeService.normalizeDateString(apt.date || apt.appointmentDate);

  let liveQueuePosition = apt.queue_position !== undefined ? apt.queue_position : apt.queuePosition;
  let livePatientsAhead = apt.patients_ahead !== undefined ? apt.patients_ahead : apt.patientsAhead;
  let liveEstimatedWait = apt.estimated_wait || apt.estimatedWait;
  let liveStatus = apt.status;
  let currentServingToken: string | undefined = undefined;
  let currentServingPatient: string | undefined = undefined;

  if (
    aptDate === todayStr &&
    !['Cancelled', 'CANCELLED', 'No Show', 'NO_SHOW', 'No-Show', 'Completed', 'COMPLETED'].includes(apt.status)
  ) {
    const queue = queueManager.getQueue(apt.clinic_id, apt.doctor_id, todayStr);
    const activeItem = queue.find((q) => q.status === 'IN_CONSULTATION');
    if (activeItem) {
      currentServingToken = activeItem.tokenNumber || activeItem.token || activeItem.queueNumber;
      currentServingPatient = activeItem.patientName;
    }
    const myQueueEntry = queue.find(
      (q) => q.appointmentId === apt.id || q.id === apt.id || q.id === `q-${apt.id}`
    );
    if (myQueueEntry) {
      liveQueuePosition = myQueueEntry.queuePosition;
      livePatientsAhead = myQueueEntry.patientsAhead;
      liveEstimatedWait = myQueueEntry.estimatedWaitText || `${myQueueEntry.estimatedWait} min`;
      if (myQueueEntry.status === 'IN_CONSULTATION') {
        liveStatus = 'In Consultation';
      } else if (
        ['Checked In', 'CHECKED_IN', 'Waiting', 'WAITING'].includes(apt.status) ||
        myQueueEntry.status === 'WAITING'
      ) {
        liveStatus =
          myQueueEntry.patientsAhead === 0
            ? 'Next'
            : myQueueEntry.patientsAhead === 1
            ? 'Almost Your Turn'
            : 'Waiting';
      }
    }
  }

  return {
    ...apt,
    doctorId: apt.doctor_id || apt.doctorId,
    clinicId: apt.clinic_id || apt.clinicId,
    patientId: apt.patient_id || apt.patientId,
    patientName: apt.patient_name || apt.patientName || 'Patient',
    doctorName: apt.doctor_name || apt.doctorName,
    doctorSpecialization: apt.doctor_specialization || apt.doctorSpecialization,
    doctorAvatar: apt.doctor_avatar || apt.doctorAvatar,
    clinicName: apt.clinic_name || apt.clinicName,
    clinicAddress: apt.clinic_address || apt.clinicAddress,
    tokenNumber: apt.token_number || apt.tokenNumber,
    queuePosition: liveQueuePosition,
    patientsAhead: livePatientsAhead,
    estimatedWait: liveEstimatedWait,
    status: liveStatus,
    currentServingToken,
    currentServingPatient,
    travelTime: apt.travel_time || apt.travelTime,
    consultationFee: apt.consultation_fee || apt.consultationFee,
    prescriptionAvailable: apt.prescription_available !== undefined ? apt.prescription_available : apt.prescriptionAvailable,
    customReasonText: apt.custom_reason_text || apt.customReasonText,
    startDateTime: apt.created_at,
    referenceId: (apt.id || '').toUpperCase(),
  };
}

// GET /api/appointments
appointmentRouter.get('/', async (req: Request, res: Response): Promise<void> => {
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
    const clinicId = req.query.clinicId as string;
    const doctorId = req.query.doctorId as string;

    let appointments: any[] = [];
    if (clinicId) {
      appointments = await AppointmentModel.getByClinicId(clinicId);
    } else if (doctorId) {
      appointments = await AppointmentModel.getByDoctorId(doctorId);
    } else {
      const targetPatientId = authenticatedPatientId || queryPatientId;
      if (targetPatientId) {
        appointments = await AppointmentModel.getByPatientId(targetPatientId);
      } else {
        // Strict isolation: Never default to pat-demo-01
        appointments = [];
      }
    }

    // Deduplicate appointments strictly by appointment id
    const seenIds = new Set<string>();
    const deduplicatedList: any[] = [];
    for (const a of appointments) {
      if (!seenIds.has(a.id)) {
        seenIds.add(a.id);
        deduplicatedList.push(formatAppointmentResponse(a));
      }
    }

    res.status(200).json({ success: true, appointments: deduplicatedList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch appointments.' });
  }
});

// GET /api/appointments/patient/:patientId
appointmentRouter.get('/patient/:patientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const targetPatientId = req.params.patientId;
    const appointments = await AppointmentModel.getByPatientId(targetPatientId);
    res.status(200).json({
      success: true,
      appointments: appointments.map(formatAppointmentResponse),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch patient appointments.' });
  }
});

// GET /api/appointments/today
appointmentRouter.get('/today', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.query.clinicId as string;
    const doctorId = req.query.doctorId as string;
    const status = req.query.status as string;

    const appointments = await AppointmentModel.getTodayAppointments({ clinicId, doctorId, status });
    const formatted = appointments.map((a) => formatAppointmentResponse(a));

    res.status(200).json({
      success: true,
      count: formatted.length,
      appointments: formatted,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch today appointments.' });
  }
});

// GET /api/appointments/upcoming
appointmentRouter.get('/upcoming', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.query.clinicId as string;
    const doctorId = req.query.doctorId as string;
    const patientId = req.query.patientId as string;

    const list: any[] = [];
    for (const apt of memoryDb.appointments.values()) {
      const aptDate = apt.date || apt.appointmentDate;
      if (!timeService.isFutureDate(aptDate)) {
        continue;
      }
      if (['Cancelled', 'CANCELLED', 'NO_SHOW', 'No Show'].includes(apt.status)) {
        continue;
      }
      if (clinicId && apt.clinic_id !== clinicId && !apt.clinic_name.toLowerCase().includes(clinicId.toLowerCase())) {
        continue;
      }
      if (doctorId && apt.doctor_id !== doctorId && !apt.doctor_name.toLowerCase().includes(doctorId.toLowerCase())) {
        continue;
      }
      if (patientId && apt.patient_id !== patientId) {
        continue;
      }
      list.push(apt);
    }

    list.sort((a, b) => {
      const dateCmp = (a.date || '').localeCompare(b.date || '');
      if (dateCmp !== 0) return dateCmp;
      return (a.time || '').localeCompare(b.time || '');
    });

    const formatted = list.map((a) => formatAppointmentResponse(a));
    res.status(200).json({
      success: true,
      count: formatted.length,
      appointments: formatted,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch upcoming appointments.' });
  }
});

// GET /api/appointments/:id
appointmentRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await AppointmentModel.getById(req.params.id);
    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }
    res.status(200).json({ success: true, appointment: formatAppointmentResponse(appointment) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch appointment.' });
  }
});

// PUT & POST /api/appointments/:id/check-in
const handleCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, notes, forceDeskCheckIn } = req.body || {};
    const result = await queueManager.checkInAppointment(req.params.id, doctorId, notes, Boolean(forceDeskCheckIn));

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    if (result.appointment) {
      await notificationService.notifyPatientCheckIn(result.appointment);
    }

    res.status(200).json({
      success: true,
      appointment: formatAppointmentResponse(result.appointment),
      tokenNumber: result.tokenNumber,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, error: 'Failed to check in appointment.' });
  }
};
appointmentRouter.put('/:id/check-in', handleCheckIn);
appointmentRouter.post('/:id/check-in', handleCheckIn);

// PUT & POST /api/appointments/:id/no-show
const handleNoShow = async (req: Request, res: Response): Promise<void> => {
  try {
    const force = Boolean(req.body?.force || req.query?.force === 'true' || req.body?.forceNoShow);
    const result = await queueManager.handleNoShow(req.params.id, { force });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json({
      success: true,
      appointment: formatAppointmentResponse(result.appointment),
      affectedPatient: formatAppointmentResponse(result.affectedPatient),
      offeredSlot: result.offeredSlot,
      message: result.message,
    });
  } catch (err: any) {
    console.error('No-show handler error:', err);
    res.status(500).json({ success: false, error: 'Failed to process no-show.' });
  }
};
appointmentRouter.put('/:id/no-show', handleNoShow);
appointmentRouter.post('/:id/no-show', handleNoShow);

// POST /api/appointments/:id/cancel
appointmentRouter.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason = 'Patient requested cancellation' } = req.body || {};
    const apt = await AppointmentModel.getById(req.params.id);
    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    // Policy check
    const policyCheck = timeService.isCancellationAllowed(
      apt.status,
      apt.date || apt.appointmentDate || timeService.getTodayDateString(),
      apt.time || apt.slotStartTime || '09:00 AM'
    );

    if (!policyCheck.allowed) {
      res.status(400).json({ success: false, error: policyCheck.reason });
      return;
    }

    const nowIso = timeService.getCurrentClinicDate().toISOString();
    apt.status = 'Cancelled';
    apt.appointmentStatus = 'CANCELLED';
    apt.cancelledAt = nowIso;
    apt.cancellationReason = reason;
    apt.updated_at = nowIso;
    await AppointmentModel.update(apt.id, apt);
    memoryDb.appointment_queue.delete(apt.id);

    const cancelPayload = {
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      patientId: apt.patient_id,
      doctorId: apt.doctor_id,
      appointmentDate: apt.date,
      slotStartTime: apt.time,
      status: 'Cancelled',
      appointmentStatus: 'CANCELLED',
      cancellationReason: reason,
      cancelledAt: nowIso,
    };

    emitToPatient(apt.patient_id, 'appointment:cancelled', cancelPayload);
    emitToPatient(apt.patient_id, 'appointment:status', cancelPayload);
    emitToAppointment(apt.id, 'appointment:cancelled', cancelPayload);
    emitToDoctor(apt.doctor_id, 'appointment:cancelled', cancelPayload);
    if (apt.clinic_id) {
      emitToClinic(apt.clinic_id, 'appointment:cancelled', cancelPayload);
    }
    emitBroadcast('appointment:cancelled', cancelPayload);
    emitBroadcast('doctor:availability_updated', {
      doctorId: apt.doctor_id,
      clinicId: apt.clinic_id,
      date: apt.date || apt.appointmentDate,
      releasedSlot: apt.time || apt.slotStartTime,
      action: 'CANCELLATION',
      appointmentId: apt.id,
    });
    emitBroadcast('queue:updated', { freedAppointmentId: apt.id, message: 'Queue updated after cancellation.' });

    await notificationService.sendNotification({
      patientId: apt.patient_id,
      title: 'Appointment Cancelled ❌',
      message: `Your appointment with ${apt.doctor_name} on ${apt.date} at ${apt.time} has been cancelled. Slot is now released.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id },
    });

    res.status(200).json({ success: true, appointment: formatAppointmentResponse(apt), message: 'Appointment cancelled successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to cancel appointment.' });
  }
});

// POST /api/appointments/:id/switch-doctor
appointmentRouter.post('/:id/switch-doctor', async (req: Request, res: Response): Promise<void> => {
  try {
    const { newDoctorId, reason } = req.body || {};
    if (!newDoctorId) {
      res.status(400).json({ success: false, error: 'Missing newDoctorId parameter.' });
      return;
    }

    const result = await queueManager.switchDoctor(req.params.id, newDoctorId, reason);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json({
      success: true,
      appointment: formatAppointmentResponse(result.appointment),
      message: result.message,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to switch doctor.' });
  }
});

// POST /api/appointments/:id/reschedule
appointmentRouter.post('/:id/reschedule', async (req: Request, res: Response): Promise<void> => {
  let rescheduleLockKey: string | null = null;
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      res.status(400).json({ success: false, error: 'Both date and time are required for rescheduling.' });
      return;
    }

    const apt = await AppointmentModel.getById(req.params.id);
    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    if (['Cancelled', 'CANCELLED', 'Completed', 'COMPLETED', 'NO_SHOW', 'No Show'].includes(apt.status)) {
      res.status(400).json({ success: false, error: `Cannot reschedule an appointment with status ${apt.status}.` });
      return;
    }

    const normNewDate = timeService.normalizeDateString(date);
    const normNewTime = timeService.normalizeTimeString(time);

    // Concurrency Lock for Target Slot
    rescheduleLockKey = `${apt.doctor_id}:${normNewDate}:${normNewTime}`;
    if (activeBookingLocks.has(rescheduleLockKey)) {
      res.status(409).json({
        success: false,
        code: 'SLOT_NO_LONGER_AVAILABLE',
        error: 'This slot is currently being processed or booked. Please select another slot.',
      });
      return;
    }
    activeBookingLocks.add(rescheduleLockKey);

    // Comprehensive Backend Slot Validation (working hours, breaks, leave, past date/slot, active appointments)
    const durMins = parseInt(String(apt.duration || '20 min').replace(/[^0-9]/g, ''), 10) || 20;
    const validation = await doctorAvailabilityService.validateSlotAvailability(
      apt.doctor_id,
      apt.clinic_id,
      normNewDate,
      normNewTime,
      { excludeAppointmentId: apt.id, consultationDurationMinutes: durMins }
    );

    if (!validation.valid) {
      const isConflict = validation.code === 'SLOT_NO_LONGER_AVAILABLE';
      res.status(isConflict ? 409 : 400).json({
        success: false,
        code: validation.code,
        error: validation.error,
      });
      return;
    }

    const oldDate = apt.date || apt.appointmentDate;
    const oldTime = apt.time || apt.slotStartTime;

    const isNowToday = timeService.isToday(normNewDate);
    const newStatus = isNowToday ? 'Waiting' : 'Booked';

    const updated = await AppointmentModel.update(apt.id, {
      date: normNewDate,
      time: normNewTime,
      appointmentDate: normNewDate,
      slotStartTime: normNewTime,
      status: newStatus,
      appointmentStatus: 'BOOKED',
    });

    if (isNowToday) {
      memoryDb.appointment_queue.set(apt.id, {
        id: `queue-${apt.id}`,
        clinic_id: apt.clinic_id,
        doctor_id: apt.doctor_id,
        appointment_id: apt.id,
        token_number: apt.token_number,
        queue_position: apt.queue_position,
        patients_ahead: apt.patients_ahead,
        status: newStatus,
        estimated_wait_minutes: 10,
        updated_at: new Date().toISOString(),
      });
    } else {
      memoryDb.appointment_queue.delete(apt.id);
    }

    const reschedulePayload = {
      appointmentId: updated!.id,
      clinicId: updated!.clinic_id,
      patientId: updated!.patient_id,
      doctorId: updated!.doctor_id,
      oldDate,
      oldTime,
      newDate: normNewDate,
      newTime: normNewTime,
      status: newStatus,
      appointmentStatus: 'BOOKED',
    };

    emitToPatient(updated!.patient_id, 'appointment:rescheduled', reschedulePayload);
    emitToPatient(updated!.patient_id, 'appointment:status', reschedulePayload);
    emitToDoctor(updated!.doctor_id, 'appointment:rescheduled', reschedulePayload);
    if (updated!.clinic_id) {
      emitToClinic(updated!.clinic_id, 'appointment:rescheduled', reschedulePayload);
    }
    emitBroadcast('appointment:rescheduled', reschedulePayload);
    emitBroadcast('doctor:availability_updated', {
      doctorId: updated!.doctor_id,
      clinicId: updated!.clinic_id,
      releasedDate: oldDate,
      releasedSlot: oldTime,
      bookedDate: normNewDate,
      bookedSlot: normNewTime,
      action: 'RESCHEDULE',
      appointmentId: updated!.id,
    });
    emitBroadcast('queue:updated', { freedAppointmentId: apt.id, message: 'Queue updated after reschedule.' });

    await notificationService.sendNotification({
      patientId: updated!.patient_id,
      title: 'Appointment Rescheduled 📅',
      message: `Rescheduled with ${updated!.doctor_name} to ${normNewDate} at ${normNewTime}.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: updated!.id },
    });

    res.status(200).json({ success: true, appointment: formatAppointmentResponse(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to reschedule appointment.' });
  } finally {
    if (rescheduleLockKey) {
      activeBookingLocks.delete(rescheduleLockKey);
    }
  }
});

// POST /api/appointments/:id/accept-earlier-slot
appointmentRouter.post('/:id/accept-earlier-slot', async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await AppointmentModel.getById(req.params.id);
    if (!appointment || !appointment.earlier_slot_offered) {
      res.status(400).json({ success: false, error: 'No earlier slot offer pending for this appointment.' });
      return;
    }

    const offer = appointment.earlier_slot_offered;
    const updated = await AppointmentModel.update(appointment.id, {
      date: offer.newDate,
      time: offer.newTime,
      estimated_wait: offer.estimatedWait,
      earlier_slot_offered: undefined,
    });

    emitToPatient(appointment.patient_id, 'appointment:status', {
      appointmentId: appointment.id,
      date: offer.newDate,
      time: offer.newTime,
      status: appointment.status,
    });

    if (updated) {
      await notificationService.notifyEarlierSlotAccepted(updated);
    }

    res.status(200).json({ success: true, appointment: formatAppointmentResponse(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to accept earlier slot.' });
  }
});

// POST /api/appointments/:id/decline-earlier-slot
appointmentRouter.post('/:id/decline-earlier-slot', async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await AppointmentModel.update(req.params.id, {
      earlier_slot_offered: undefined,
    });

    res.status(200).json({ success: true, appointment: formatAppointmentResponse(updated) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to decline earlier slot.' });
  }
});
