import { Router } from 'express';
import {
  listEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  changeEventStatus,
  eventValidation,
  calendarQueryValidation,
  statusValidation,
} from '../controllers/eventController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

// Calendar view (public)
router.get('/', calendarQueryValidation, validate, listEvents);
router.get('/:id', getEvent);

// Organizer / Admin only
router.post('/', authenticate, authorize('organizer', 'admin'), eventValidation, validate, createEvent);
router.put('/:id', authenticate, authorize('organizer', 'admin'), validate, updateEvent);
router.patch('/:id/status', authenticate, authorize('organizer', 'admin'), statusValidation, validate, changeEventStatus);
router.delete('/:id', authenticate, authorize('admin'), deleteEvent);

export default router;
