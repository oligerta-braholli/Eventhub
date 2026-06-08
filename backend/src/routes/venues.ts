import { Router } from 'express';
import { listVenues, createVenue, getVenue } from '../controllers/venueController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schemas';
import { createVenueSchema } from '../schemas/venue.schemas';

const router = Router();

router.get('/', listVenues);
router.get('/:id', validateParams(idParamSchema), getVenue);
router.post('/', authenticate, authorize('admin'), validateBody(createVenueSchema), createVenue);

export default router;
