import { Router } from 'express';
import { listVenues, createVenue, getVenue, venueValidation } from '../controllers/venueController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/', listVenues);
router.get('/:id', getVenue);
router.post('/', authenticate, authorize('admin'), venueValidation, validate, createVenue);

export default router;
