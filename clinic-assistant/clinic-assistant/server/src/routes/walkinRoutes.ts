import { Router } from 'express';
import { getWalkIns, addWalkIn } from '../controllers/walkinController.js';

const router = Router();

router.get('/', getWalkIns);
router.post('/', addWalkIn);

export default router;
