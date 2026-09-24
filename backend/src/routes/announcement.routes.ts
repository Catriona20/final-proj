import { Router, Request, Response } from 'express';
import { AnnouncementModel } from '../database/models';

export const announcementRouter = Router();

// GET /api/announcements
announcementRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const announcements = await AnnouncementModel.getAll();
    res.status(200).json({ success: true, announcements });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch clinic announcements.' });
  }
});
