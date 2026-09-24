import { Router, Request, Response } from 'express';
import { NotificationModel, NotificationEntity } from '../database/models';

export const notificationRouter = Router();

// GET /api/notifications
notificationRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const patientId = req.query.patientId as string;
    const doctorId = req.query.doctorId as string;
    const clinicId = req.query.clinicId as string;
    const category = req.query.category as string;

    let notifications: NotificationEntity[] = [];

    if (doctorId) {
      notifications = await NotificationModel.getByDoctorId(doctorId);
    } else if (clinicId) {
      notifications = await NotificationModel.getByClinicId(clinicId);
    } else {
      notifications = await NotificationModel.getByPatientId(patientId || 'pat-101');
    }

    if (category && category !== 'All') {
      notifications = notifications.filter((n) => n.category === category);
    }

    const unreadCount = notifications.filter((n) => !n.read && !n.is_read).length;

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/:id/read
notificationRouter.put('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await NotificationModel.markAsRead(req.params.id);
    res.status(200).json({ success, message: success ? 'Marked notification as read.' : 'Notification not found.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update notification.' });
  }
});

// PUT /api/notifications/read-all
notificationRouter.put('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const recipientId = (req.body.recipientId || req.body.patientId || req.body.doctorId || req.body.clinicId || req.query.patientId || 'pat-101') as string;
    const count = await NotificationModel.markAllAsRead(recipientId);
    res.status(200).json({ success: true, markedCount: count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to mark all as read.' });
  }
});

// DELETE /api/notifications/clear
notificationRouter.delete('/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const recipientId = (req.body.recipientId || req.body.patientId || req.body.doctorId || req.body.clinicId || req.query.patientId || 'pat-101') as string;
    const count = await NotificationModel.clearAll(recipientId);
    res.status(200).json({ success: true, clearedCount: count });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to clear notifications.' });
  }
});
