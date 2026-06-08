import { Router } from 'express';
import { createBooking, getMyBookings, getEventBookings, cancelBooking } from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema, eventIdParamSchema } from '../schemas/common.schemas';
import { createBookingSchema } from '../schemas/booking.schemas';

const router = Router();

router.post('/', authenticate, authorize('participant', 'organizer', 'admin'), validateBody(createBookingSchema), createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/event/:eventId', authenticate, authorize('organizer', 'admin'), validateParams(eventIdParamSchema), getEventBookings);
router.delete('/:id', authenticate, validateParams(idParamSchema), cancelBooking);

export default router;
