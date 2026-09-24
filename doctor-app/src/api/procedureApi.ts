import { apiClient } from './apiClient';
import { Procedure, DoctorProcedure } from '../types';

export const procedureApi = {
  getCatalog: async (department?: string): Promise<{ procedures: Procedure[] }> => {
    const params = department ? { department } : {};
    const res = await apiClient.get('/doctors/procedures/catalog', { params });
    return res.data;
  },

  getMyProcedures: async (): Promise<{ procedures: DoctorProcedure[] }> => {
    const res = await apiClient.get('/doctors/auth/procedures');
    return res.data;
  },

  addProcedure: async (procedureName: string, procedureId?: string): Promise<{ procedures: DoctorProcedure[] }> => {
    const res = await apiClient.post('/doctors/auth/procedures', {
      action: 'add',
      procedureName,
      procedureId,
    });
    return res.data;
  },

  removeProcedure: async (procedureName: string): Promise<{ procedures: DoctorProcedure[] }> => {
    const res = await apiClient.post('/doctors/auth/procedures', {
      action: 'remove',
      procedureName,
    });
    return res.data;
  },
};
