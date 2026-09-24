import { Router, Request, Response } from 'express';
import { memoryDb } from '../database/db';
import { timeService } from '../services/timeService';
import { DoctorModel, ClinicModel, resolveCanonicalDoctorId, resolveCanonicalClinicId, AvailabilityRequestModel } from '../database/models';
import { queueManager } from '../services/queueManager';

export const dashboardRouter = Router();

// GET /api/dashboard
dashboardRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const clinicId = req.query.clinicId as string;
    const todayStr = timeService.getTodayDateString();

    let totalAppointments = 0;
    let upcomingAppointments = 0;
    let checkedIn = 0;
    let waiting = 0;
    let inConsultation = 0;
    let completed = 0;
    let noShows = 0;
    let cancelled = 0;
    let totalWaitMins = 0;
    let waitCount = 0;

    const canonicalClinic = clinicId ? resolveCanonicalClinicId(clinicId) : undefined;

    for (const apt of memoryDb.appointments.values()) {
      if (canonicalClinic) {
        const aptCanonical = resolveCanonicalClinicId(apt.clinic_id);
        const nameMatches = apt.clinic_name && apt.clinic_name.toLowerCase().includes(clinicId.toLowerCase());
        if (aptCanonical !== canonicalClinic && !nameMatches) {
          continue;
        }
      }

      const aptDate = timeService.normalizeDateString(apt.date || apt.appointmentDate);
      const normStatus = (apt.status || '').toUpperCase().replace(/[\s_-]+/g, '');

      if (timeService.isFutureDate(aptDate)) {
        if (!['CANCELLED', 'NOSHOW'].includes(normStatus)) {
          upcomingAppointments++;
        }
        continue;
      }

      if (aptDate === todayStr) {
        totalAppointments++;

        if (['CHECKEDIN', 'ARRIVED'].includes(normStatus)) {
          checkedIn++;
          waiting++;
        } else if (['WAITING', 'ALMOSTYOURTURN', 'NEXT'].includes(normStatus)) {
          waiting++;
        } else if (normStatus === 'INCONSULTATION') {
          checkedIn++;
          inConsultation++;
        } else if (normStatus === 'COMPLETED') {
          completed++;
        } else if (normStatus === 'NOSHOW') {
          noShows++;
        } else if (normStatus === 'CANCELLED') {
          cancelled++;
        }

        const waitMins = parseInt(apt.estimated_wait?.replace(/[^0-9]/g, '') || '0', 10);
        if (waitMins > 0) {
          totalWaitMins += waitMins;
          waitCount++;
        }
      }
    }

    let walkInsCount = 0;
    for (const w of memoryDb.walk_ins.values()) {
      if (canonicalClinic) {
        const wCanonical = resolveCanonicalClinicId(w.clinic_id);
        if (wCanonical !== canonicalClinic) continue;
      }
      walkInsCount++;
      if (w.status === 'WAITING') waiting++;
      else if (w.status === 'IN_CONSULTATION') inConsultation++;
      else if (w.status === 'COMPLETED') completed++;
    }

    let activeDoctors = 0;
    let totalDoctors = 0;
    for (const doc of memoryDb.doctors.values()) {
      if (canonicalClinic) {
        const docCanonical = resolveCanonicalClinicId(doc.clinic_id);
        const matchesAffiliation = doc.clinic_affiliations?.some(
          (aff: string) => resolveCanonicalClinicId(aff) === canonicalClinic
        );
        if (docCanonical !== canonicalClinic && !matchesAffiliation) {
          continue;
        }
      }
      totalDoctors++;
      let isAvailable = doc.status !== 'OFFLINE' && doc.is_available_today !== false;
      if (isAvailable && canonicalClinic) {
        const requests = await AvailabilityRequestModel.getRequests({
          doctorId: doc.id,
          clinicId: canonicalClinic,
        });
        isAvailable = requests.some((r) => r.status === 'APPROVED');
      }
      if (isAvailable) {
        activeDoctors++;
      }
    }

    const averageWaitTime = waitCount > 0 ? Math.round(totalWaitMins / waitCount) : 12;

    const remainingApts = Math.max(0, totalAppointments - completed - noShows - cancelled);

    res.status(200).json({
      success: true,
      stats: {
        totalAppointments,
        upcomingAppointments,
        checkedIn,
        waiting,
        inConsultation,
        completed,
        noShows,
        cancelled,
        walkIns: walkInsCount,
        activeDoctors,
        totalDoctors: totalDoctors || 0,
        averageWaitTime: `${averageWaitTime} min`,
      },
      summary: {
        todayAppointments: {
          total: totalAppointments,
          remaining: remainingApts,
        },
        checkedIn: {
          total: checkedIn,
          subtitle: 'Patients checked in today',
        },
        waiting: {
          total: waiting,
          subtitle: 'Currently in waiting queue',
        },
        availableDoctors: {
          available: activeDoctors,
          total: totalDoctors,
          subtitle: `Out of ${totalDoctors} doctors online`,
        },
        walkIns: {
          total: walkInsCount,
          subtitle: "Today's registered walk-ins",
        },
        totalAppointments,
        upcomingAppointments,
        inConsultation,
        completedConsultations: completed,
        noShows,
        cancelled,
        activeDoctors,
        averageWaitTime: `${averageWaitTime} min`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics.' });
  }
});

// GET /api/dashboard/doctor/:doctorId
dashboardRouter.get('/doctor/:doctorId', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawDoctorId = req.params.doctorId;
    const doctorId = resolveCanonicalDoctorId(rawDoctorId);
    const clinicId = req.query.clinicId ? resolveCanonicalClinicId(req.query.clinicId as string) : undefined;

    const doctor = await DoctorModel.getById(doctorId);
    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor not found.' });
      return;
    }

    const appts: any[] = [];
    let waiting = 0;
    let inConsultation = 0;
    let completed = 0;

    for (const apt of memoryDb.appointments.values()) {
      if (resolveCanonicalDoctorId(apt.doctor_id) !== doctorId) continue;
      if (clinicId && resolveCanonicalClinicId(apt.clinic_id) !== clinicId) continue;

      const normStatus = (apt.status || '').toUpperCase().replace(/[\s_-]+/g, '');
      if (['WAITING', 'ARRIVED', 'CHECKEDIN'].includes(normStatus)) {
        waiting++;
      } else if (normStatus === 'INCONSULTATION') {
        inConsultation++;
      } else if (normStatus === 'COMPLETED') {
        completed++;
      }
      appts.push(apt);
    }

    const queue = queueManager.getQueue(clinicId, doctorId);

    res.status(200).json({
      success: true,
      doctorId,
      doctorName: doctor.name,
      activeClinicId: clinicId || doctor.clinic_id,
      waitingPatients: waiting,
      inConsultationPatients: inConsultation,
      completedPatients: completed,
      upcomingAppointments: appts,
      appointments: appts,
      queue,
      stats: {
        waiting,
        inConsultation,
        completed,
        totalAppointments: appts.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch doctor dashboard metrics.' });
  }
});

// GET /api/dashboard/clinic/:clinicId
dashboardRouter.get('/clinic/:clinicId', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawClinicId = req.params.clinicId;
    const clinicId = resolveCanonicalClinicId(rawClinicId);
    const clinic = await ClinicModel.getById(clinicId);
    if (!clinic) {
      res.status(404).json({ success: false, error: 'Clinic not found.' });
      return;
    }

    const queue = queueManager.getQueue(clinicId, undefined);
    const appts: any[] = [];
    let waiting = 0;
    let inConsultation = 0;
    let completed = 0;

    for (const apt of memoryDb.appointments.values()) {
      if (resolveCanonicalClinicId(apt.clinic_id) !== clinicId) continue;

      const normStatus = (apt.status || '').toUpperCase().replace(/[\s_-]+/g, '');
      if (['WAITING', 'ARRIVED', 'CHECKEDIN'].includes(normStatus)) {
        waiting++;
      } else if (normStatus === 'INCONSULTATION') {
        inConsultation++;
      } else if (normStatus === 'COMPLETED') {
        completed++;
      }
      appts.push(apt);
    }

    res.status(200).json({
      success: true,
      clinicId,
      clinicName: clinic.name,
      activeQueueCount: queue.length,
      queue,
      appointments: appts,
      stats: {
        activeQueue: queue.length,
        waiting,
        inConsultation,
        completed,
        totalAppointments: appts.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch clinic dashboard metrics.' });
  }
});

