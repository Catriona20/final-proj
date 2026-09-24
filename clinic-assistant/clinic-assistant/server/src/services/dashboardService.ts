import { dbStore } from '../db/database.js';
import { DashboardSummary } from '../types/index.js';

export class DashboardService {
  public static getSummary(): DashboardSummary {
    const appointments = dbStore.appointments;
    const doctors = dbStore.doctors;
    const walkIns = dbStore.walkIns;
    const queueEntries = dbStore.queueEntries;

    // Total today's appointments
    const totalAppointments = appointments.length;
    
    // Remaining appointments (BOOKED or WAITING)
    const remainingAppointments = appointments.filter(
      (a) => a.status === 'BOOKED' || a.status === 'WAITING'
    ).length;

    // Checked in patients
    const checkedInCount = appointments.filter(
      (a) => a.status === 'CHECKED_IN' || a.status === 'WAITING' || a.status === 'IN_CONSULTATION'
    ).length;

    // Currently waiting in queue
    const waitingCount = queueEntries.filter((q) => q.status === 'WAITING').length;

    // Available doctors
    const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;
    const totalDoctors = doctors.length;

    // Walk-ins
    const totalWalkIns = walkIns.length;

    return {
      todayAppointments: {
        total: totalAppointments,
        remaining: remainingAppointments,
      },
      checkedIn: {
        total: checkedInCount,
        subtitle: 'Patients checked in today',
      },
      waiting: {
        total: waitingCount,
        subtitle: 'Currently waiting',
      },
      availableDoctors: {
        available: availableDoctors,
        total: totalDoctors,
        subtitle: `Out of ${totalDoctors} doctors`,
      },
      walkIns: {
        total: totalWalkIns,
        subtitle: "Today's walk-ins",
      },
    };
  }
}
