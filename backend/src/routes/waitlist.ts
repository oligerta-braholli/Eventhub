import { Router } from 'express';
import { joinWaitlist, leaveWaitlist, getEventWaitlist, getMyWaitlist } from '../controllers/waitlistController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateParams } from '../middleware/validate';
import { eventIdParamSchema } from '../schemas/common.schemas';

const router = Router();

router.get('/my', authenticate, getMyWaitlist);
router.post('/:eventId', authenticate, validateParams(eventIdParamSchema), joinWaitlist);
router.delete('/:eventId', authenticate, validateParams(eventIdParamSchema), leaveWaitlist);
router.get('/:eventId', authenticate, authorize('organizer', 'admin'), validateParams(eventIdParamSchema), getEventWaitlist);

export default router;
