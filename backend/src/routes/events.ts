import { Router } from 'express';
import { listEvents, createEvent, getEvent, updateEvent, deleteEvent, changeEventStatus, recalculateEventCounts, getCalendarEvents } from '../controllers/eventController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schemas';
import { createEventSchema, updateEventSchema, updateStatusSchema, listEventsQuerySchema, calendarQuerySchema } from '../schemas/event.schemas';

const router = Router();

router.get('/', validateQuery(listEventsQuerySchema), listEvents);
router.get('/calendar', validateQuery(calendarQuerySchema), getCalendarEvents);
router.get('/:id', validateParams(idParamSchema), getEvent);

router.post('/', authenticate, authorize('organizer', 'admin'), validateBody(createEventSchema), createEvent);
router.put('/:id', authenticate, authorize('organizer', 'admin'), validateParams(idParamSchema), validateBody(updateEventSchema), updateEvent);
router.patch('/:id/status', authenticate, authorize('organizer', 'admin'), validateParams(idParamSchema), validateBody(updateStatusSchema), changeEventStatus);
router.delete('/:id', authenticate, authorize('organizer', 'admin'), validateParams(idParamSchema), deleteEvent);
router.post('/:id/recalculate', authenticate, authorize('organizer', 'admin'), validateParams(idParamSchema), recalculateEventCounts);

export default router;
