import { Router } from 'express';
import { createReview, getEventReviews, deleteReview, updateReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema, eventIdParamSchema } from '../schemas/common.schemas';
import { createReviewSchema } from '../schemas/review.schemas';

const router = Router();

router.get('/event/:eventId', validateParams(eventIdParamSchema), getEventReviews);
router.post('/', authenticate, validateBody(createReviewSchema), createReview);
router.patch('/:id', authenticate, validateParams(idParamSchema), validateBody(createReviewSchema), updateReview);
router.delete('/:id', authenticate, validateParams(idParamSchema), deleteReview);

export default router;
