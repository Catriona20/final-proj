import { Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService.js';
import { NoShowService } from '../services/noShowService.js';

export const getTodayAppointments = (req: Request, res: Response): void => {
  try {
    const appointments = AppointmentService.getTodayAppointments();
    res.json({
      success: true,
      data: appointments,
      count: appointments.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkInAppointment = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { doctorId, notes } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'Appointment ID is required' });
      return;
    }

    const result = AppointmentService.checkInAppointment(id, doctorId, notes);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json({
      success: true,
      data: result.appointment,
      queueEntry: result.queueEntry,
      message: result.message,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleNoShowAppointment = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Appointment ID is required' });
      return;
    }

    const result = NoShowService.handleNoShow(id);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
