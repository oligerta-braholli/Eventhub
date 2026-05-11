import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getEventBookings,
  cancelBooking,
  bookingValidation,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.post('/', authenticate, authorize('participant', 'admin'), bookingValidation, validate, createBooking);
router.get('/my', authenticate, getMyBookings);
router.get('/event/:eventId', authenticate, authorize('organizer', 'admin'), getEventBookings);
router.delete('/:id', authenticate, cancelBooking);

export default router;
