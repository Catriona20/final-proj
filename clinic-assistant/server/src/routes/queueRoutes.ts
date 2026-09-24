import { Router } from 'express';
import { getQueue, addToQueue, updateQueueStatus } from '../controllers/queueController.js';

const router = Router();

router.get('/', getQueue);
router.post('/', addToQueue);
router.patch('/:id/status', updateQueueStatus);
router.put('/:id/status', updateQueueStatus);

export default router;
