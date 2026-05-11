import { Router } from 'express';
import { createReview, getEventReviews, deleteReview, reviewValidation } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.get('/event/:eventId', getEventReviews);
router.post('/', authenticate, reviewValidation, validate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
