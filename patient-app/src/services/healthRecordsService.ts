import { HealthRecord, DigitalPrescription } from '../types';
import { apiClient } from './apiClient';
import { useAuthStore } from '../store/useAuthStore';

class HealthRecordsService {
  private records: HealthRecord[] = [];
  private visits: any[] = [];
  private listeners: Array<() => void> = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async fetchRecords(patientId?: string): Promise<HealthRecord[]> {
    try {
      const authUser = useAuthStore.getState().user;
      const pid = patientId || authUser?.id;
      const url = pid ? `/records?patientId=${encodeURIComponent(pid)}` : '/records';
      const res = await apiClient.get(url);
      if (res.data) {
        this.records = res.data.records || [];
        this.visits = res.data.visits || [];
        this.notify();
        return this.records;
      }
    } catch (err) {
      console.warn('Fetch health records API error, using cached records:', err);
    }
    return this.records;
  }

  getAllRecords(): HealthRecord[] {
    return [...this.records];
  }

  getAllVisits(): any[] {
    return [...this.visits];
  }

  getRecordsByType(type: 'lab' | 'prescription' | 'report'): HealthRecord[] {
    return this.records.filter((r) => r.type === type);
  }

  getRecordById(id: string): HealthRecord | undefined {
    return this.records.find((r) => r.id === id);
  }

  async getPrescriptionByAppointmentId(appointmentId: string): Promise<DigitalPrescription | null> {
    try {
      const res = await apiClient.get(`/records/prescriptions/${appointmentId}`);
      return res.data?.prescription || null;
    } catch (err) {
      return null;
    }
  }

  async addRecord(record: Omit<HealthRecord, 'id' | 'date'> & { date?: string }): Promise<HealthRecord> {
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const newRecord: HealthRecord = {
      ...record,
      id: `rec-${Date.now()}`,
      date: record.date || todayStr,
      fileSize: record.fileSize || '1.4 MB',
      downloadUrl: `https://medlink.health/records/rec-${Date.now()}.pdf`,
    };

    try {
      await apiClient.post('/records/upload', {
        testName: record.title,
        category: record.type === 'lab' ? 'Lab report' : 'Medical document',
        clinicPerformed: record.clinic,
        reasonForTest: record.reason || record.details,
        notes: record.details,
      });
    } catch (err) {
      console.warn('Upload medical document API error:', err);
    }

    this.records = [newRecord, ...this.records];
    this.notify();
    return newRecord;
  }
  async explainPrescription(prescriptionId?: string, prescriptionData?: any) {
    try {
      const res = await apiClient.post('/ai/explain-prescription', {
        prescriptionId,
        prescriptionData,
      });
      return res.data?.explanation || null;
    } catch (err) {
      console.warn('Explain prescription API notice:', err);
      return null;
    }
  }

  async summarizeReport(reportData: any) {
    try {
      const res = await apiClient.post('/ai/summarize-report', reportData);
      return res.data?.summary || null;
    } catch (err) {
      console.warn('Summarize report API notice:', err);
      return null;
    }
  }
}

export const healthRecordsService = new HealthRecordsService();
