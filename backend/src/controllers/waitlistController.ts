import { Response, NextFunction } from 'express';
import { Event } from '../models/Event';
import { Waitlist } from '../models/Waitlist';
import { AuthenticatedRequest } from '../types';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';

export async function joinWaitlist(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event || event.status !== 'published') return next(new NotFoundError('Event'));

    if (event.bookedCount < event.capacity) {
      return next(new BadRequestError('Event still has available spots — book directly'));
    }

    const existing = await Waitlist.findOne({
      event: req.params.eventId,
      participant: req.user!.userId,
    });
    if (existing) return next(new ConflictError('Already on the waitlist'));

    const position = (await Waitlist.countDocuments({ event: req.params.eventId })) + 1;
    const entry = await Waitlist.create({
      event: req.params.eventId,
      participant: req.user!.userId,
      position,
    });
    res.status(201).json({ status: 'success', data: { entry } });
  } catch (err) {
    next(err);
  }
}

export async function leaveWaitlist(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const entry = await Waitlist.findOneAndDelete({
      event: req.params.eventId,
      participant: req.user!.userId,
    });
    if (!entry) return next(new NotFoundError('Waitlist entry'));

    // Re-number remaining entries
    await Waitlist.updateMany(
      { event: req.params.eventId, position: { $gt: entry.position } },
      { $inc: { position: -1 } }
    );

    res.json({ status: 'success', message: 'Removed from waitlist' });
  } catch (err) {
    next(err);
  }
}

export async function getEventWaitlist(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return next(new NotFoundError('Event'));

    const entries = await Waitlist.find({ event: req.params.eventId, isAnonymized: false })
      .populate('participant', 'name email')
      .sort({ position: 1 });
    res.json({ status: 'success', data: { entries } });
  } catch (err) {
    next(err);
  }
}
