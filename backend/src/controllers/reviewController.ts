import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { Event } from '../models/Event';
import { AuthenticatedRequest } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export const reviewValidation = [
  body('eventId').notEmpty().withMessage('eventId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
  body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 1000 }),
];

export async function createReview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId, rating, comment } = req.body as {
      eventId: string;
      rating: number;
      comment: string;
    };

    const event = await Event.findById(eventId);
    if (!event) return next(new NotFoundError('Event'));

    if (event.status !== 'completed') {
      return next(new BadRequestError('Reviews can only be submitted for completed events'));
    }

    // Must have a confirmed booking
    const booking = await Booking.findOne({
      event: eventId,
      participant: req.user!.userId,
      status: 'confirmed',
    });
    if (!booking) {
      return next(new ForbiddenError('You must have attended this event to leave a review'));
    }

    const review = await Review.create({
      event: eventId,
      author: req.user!.userId,
      rating,
      comment,
    });

    const populated = await review.populate('author', 'name');
    res.status(201).json({ status: 'success', data: { review: populated } });
  } catch (err) {
    next(err);
  }
}

export async function getEventReviews(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reviews = await Review.find({ event: req.params.eventId, isAnonymized: false })
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    res.json({ status: 'success', data: { reviews, avgRating } });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new NotFoundError('Review'));

    const isOwner = review.author.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('Access denied'));
    }

    await review.deleteOne();
    res.json({ status: 'success', message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
}
