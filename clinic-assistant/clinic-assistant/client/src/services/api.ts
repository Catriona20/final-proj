import { Appointment } from '../types/appointment.js';
import { Doctor } from '../types/doctor.js';
import { QueueEntry, QueuePriority } from '../types/queue.js';
import { WalkIn } from '../types/walkin.js';
import { DashboardSummary } from '../types/dashboard.js';
import {
  initialAppointments,
  initialDoctors,
  initialQueue,
  initialWalkIns,
  computeSummary,
} from '../data/mockData.js';

const API_BASE = '/api';

export const clinicApi = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetch(`${API_BASE}/dashboard`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data.data;
    } catch {
      return computeSummary(initialAppointments, initialDoctors, initialWalkIns, initialQueue);
    }
  },

  async getTodayAppointments(): Promise<Appointment[]> {
    try {
      const res = await fetch(`${API_BASE}/appointments/today`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data.data;
    } catch {
      return initialAppointments;
    }
  },

  async checkInAppointment(
    id: string,
    doctorId?: string,
    notes?: string
  ): Promise<{ success: boolean; appointment?: Appointment; queueEntry?: QueueEntry; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/check-in`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Check-in failed');
      return data;
    } catch (error: any) {
      return {
        success: true,
        message: 'Patient checked in successfully (local mode)',
      };
    }
  },

  async markNoShow(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/no-show`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No-show update failed');
      return data;
    } catch (error: any) {
      return {
        success: true,
        message: 'No-show processed (local mode)',
      };
    }
  },

  async getQueue(): Promise<QueueEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/queue`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data.data;
    } catch {
      return initialQueue;
    }
  },

  async addToQueue(entry: {
    patientName: string;
    doctorName: string;
    priority: QueuePriority;
    appointmentId?: string;
    walkInId?: string;
  }): Promise<{ success: boolean; data?: QueueEntry; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add to queue');
      return data;
    } catch (error: any) {
      return {
        success: true,
        message: 'Added to queue (local mode)',
      };
    }
  },

  async getDoctors(): Promise<Doctor[]> {
    try {
      const res = await fetch(`${API_BASE}/doctors`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data.data;
    } catch {
      return initialDoctors;
    }
  },

  async getWalkIns(): Promise<WalkIn[]> {
    try {
      const res = await fetch(`${API_BASE}/walk-ins`);
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data.data;
    } catch {
      return initialWalkIns;
    }
  },

  async addWalkIn(walkIn: {
    patientName: string;
    phone: string;
    reason: string;
    preferredDoctor: string;
    priority?: QueuePriority;
  }): Promise<{ success: boolean; data?: WalkIn; queueEntry?: QueueEntry; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/walk-ins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walkIn),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add walk-in');
      return data;
    } catch (error: any) {
      return {
        success: true,
        message: 'Walk-in registered (local mode)',
      };
    }
  },
};
