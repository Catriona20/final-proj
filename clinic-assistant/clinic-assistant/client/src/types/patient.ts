export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | string;
  email?: string;
  address?: string;
  lastVisit?: string;
  status?: 'Active' | 'In Queue' | 'Completed' | 'Scheduled' | 'Inactive';
  notes?: string;
  bloodGroup?: string;
  emergencyContact?: string;
}
