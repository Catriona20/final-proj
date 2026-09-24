import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService.js';

export const getDashboardSummary = (req: Request, res: Response): void => {
  try {
    const summary = DashboardService.getSummary();
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
