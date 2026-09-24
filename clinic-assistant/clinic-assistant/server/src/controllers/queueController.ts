import { Request, Response } from 'express';
import { QueueService } from '../services/queueService.js';

export const getQueue = (req: Request, res: Response): void => {
  try {
    const queue = QueueService.getQueue();
    res.json({
      success: true,
      data: queue,
      count: queue.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToQueue = (req: Request, res: Response): void => {
  try {
    const { patientName, doctorName, priority, appointmentId, walkInId, estimatedWait } = req.body;

    if (!patientName || !doctorName) {
      res.status(400).json({
        success: false,
        message: 'Patient name and doctor name are required',
      });
      return;
    }

    const entry = QueueService.addToQueue({
      patientName,
      doctorName,
      priority,
      appointmentId,
      walkInId,
      estimatedWait,
    });

    res.status(201).json({
      success: true,
      data: entry,
      message: `${patientName} added to waiting queue as ${entry.queueNumber}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQueueStatus = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      res.status(400).json({ success: false, message: 'ID and status are required' });
      return;
    }

    const entry = QueueService.updateQueueStatus(id, status);
    if (!entry) {
      res.status(404).json({ success: false, message: 'Queue entry not found' });
      return;
    }

    res.json({
      success: true,
      data: entry,
      message: 'Queue status updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
