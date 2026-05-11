import { Router } from 'express';
import { joinWaitlist, leaveWaitlist, getEventWaitlist } from '../controllers/waitlistController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.post('/:eventId', authenticate, joinWaitlist);
router.delete('/:eventId', authenticate, leaveWaitlist);
router.get('/:eventId', authenticate, authorize('organizer', 'admin'), getEventWaitlist);

export default router;
