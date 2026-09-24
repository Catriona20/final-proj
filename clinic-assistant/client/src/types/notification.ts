export type NotificationType = 'EARLIER_SLOT' | 'QUEUE_UPDATE' | 'NO_SHOW' | 'INFO' | 'EMERGENCY' | 'DELAY';

export type NotificationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'READ' | 'UNREAD';

export interface ClinicNotification {
  id: string;
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  status?: NotificationStatus;
  appointmentId?: string;
  originalSlot?: string;
  offeredSlot?: string;
  oldWaitTime?: number;
  newWaitTime?: number;
  oldEta?: string;
  newEta?: string;
}
