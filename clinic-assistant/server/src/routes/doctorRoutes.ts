import { Router } from 'express';
import { getDoctors, updateDoctorStatus } from '../controllers/doctorController.js';

const router = Router();

router.get('/', getDoctors);
router.patch('/:id/status', updateDoctorStatus);
router.put('/:id/status', updateDoctorStatus);

export default router;
