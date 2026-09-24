import { apiClient } from './apiClient';
import { ScheduleDay, ScheduleException } from '../types';

export const scheduleApi = {
  getSchedule: async (): Promise<{
    schedule: Record<string, ScheduleDay>;
    workingDays: string[];
    consultationDuration: string;
    exceptions: ScheduleException[];
  }> => {
    const res = await apiClient.get('/doctors/auth/schedule');
    return res.data;
  },

  updateSchedule: async (payload: {
    schedule?: Record<string, ScheduleDay>;
    availableDays?: string[];
    consultationDuration?: string;
    newException?: { date: string; reason: string; isFullDay?: boolean };
  }): Promise<{
    schedule: Record<string, ScheduleDay>;
    workingDays: string[];
    consultationDuration: string;
    exceptions: ScheduleException[];
  }> => {
    const res = await apiClient.put('/doctors/auth/schedule', payload);
    return res.data;
  },
};
