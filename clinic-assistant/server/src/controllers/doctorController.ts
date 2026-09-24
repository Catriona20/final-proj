import { Request, Response } from 'express';
import { DoctorService } from '../services/doctorService.js';

export const getDoctors = (req: Request, res: Response): void => {
  try {
    const doctors = DoctorService.getDoctors();
    res.json({
      success: true,
      data: doctors,
      count: doctors.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDoctorStatus = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, currentPatients } = req.body;

    if (!id || !status) {
      res.status(400).json({ success: false, message: 'Doctor ID and status are required' });
      return;
    }

    const doctor = DoctorService.updateDoctorStatus(id, status, currentPatients);
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found' });
      return;
    }

    res.json({
      success: true,
      data: doctor,
      message: 'Doctor status updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
