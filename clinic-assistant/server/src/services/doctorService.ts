import { dbStore } from '../db/database.js';
import { Doctor, DoctorStatus } from '../types/index.js';

export class DoctorService {
  public static getDoctors(): Doctor[] {
    return dbStore.doctors;
  }

  public static getDoctorById(id: string): Doctor | undefined {
    return dbStore.doctors.find((d) => d.id === id);
  }

  public static updateDoctorStatus(id: string, status: DoctorStatus, currentPatients?: number): Doctor | null {
    const doctor = dbStore.doctors.find((d) => d.id === id);
    if (!doctor) return null;
    doctor.status = status;
    if (currentPatients !== undefined) {
      doctor.currentPatients = currentPatients;
    }
    return doctor;
  }
}
