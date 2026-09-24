import { Router } from 'express';
import {
  getTodayAppointments,
  checkInAppointment,
  handleNoShowAppointment,
} from '../controllers/appointmentController.js';

const router = Router();

router.get('/', getTodayAppointments);
router.get('/today', getTodayAppointments);
router.put('/:id/check-in', checkInAppointment);
router.post('/:id/check-in', checkInAppointment);
router.put('/:id/no-show', handleNoShowAppointment);
router.post('/:id/no-show', handleNoShowAppointment);

export default router;
