import { Request, Response } from 'express';
import { WalkInService } from '../services/walkinService.js';

export const getWalkIns = (req: Request, res: Response): void => {
  try {
    const walkIns = WalkInService.getWalkIns();
    res.json({
      success: true,
      data: walkIns,
      count: walkIns.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addWalkIn = (req: Request, res: Response): void => {
  try {
    const { patientName, phone, reason, preferredDoctor, priority, addToQueueAuto } = req.body;

    if (!patientName || !phone || !reason || !preferredDoctor) {
      res.status(400).json({
        success: false,
        message: 'Patient name, phone, reason for visit, and preferred doctor are required',
      });
      return;
    }

    const result = WalkInService.addWalkIn({
      patientName,
      phone,
      reason,
      preferredDoctor,
      priority,
      addToQueueAuto,
    });

    res.status(201).json({
      success: true,
      data: result.walkIn,
      queueEntry: result.queueEntry,
      message: `Walk-in patient ${patientName} registered successfully`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
