import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { PatientModel, PatientEntity, DoctorModel, DoctorEntity } from '../database/models';

export interface AuthenticatedRequest extends Request {
  patient?: PatientEntity;
}

export interface AuthenticatedDoctorRequest extends Request {
  doctor?: DoctorEntity;
}

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication token missing or invalid format.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role?: string };
    const patient = await PatientModel.findById(decoded.id);

    if (!patient) {
      res.status(401).json({ success: false, error: 'Patient account associated with token not found.' });
      return;
    }

    req.patient = patient;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Token expired. Please login again.' });
      return;
    }
    res.status(403).json({ success: false, error: 'Invalid or malformed authentication token.' });
  }
};

/**
 * Strict Doctor Role Authentication Middleware
 * Validates JWT has role: 'DOCTOR' and attaches doctor entity to req.doctor
 */
export const authenticateDoctorJwt = async (
  req: AuthenticatedDoctorRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Doctor authentication token required.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role?: string };

    if (decoded.role !== 'DOCTOR') {
      res.status(403).json({
        success: false,
        error: 'Access forbidden: Doctor authorization required. Patient accounts cannot access Doctor endpoints.',
      });
      return;
    }

    const doctor = await DoctorModel.getById(decoded.id);
    if (!doctor) {
      res.status(401).json({ success: false, error: 'Doctor account not found.' });
      return;
    }

    req.doctor = doctor;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Session expired. Please login again.' });
      return;
    }
    res.status(403).json({ success: false, error: 'Invalid or expired doctor credentials.' });
  }
};

