import { Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { AuthenticatedRequest, EventFilterQuery } from '../types';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { anonymizeEventParticipants } from '../utils/gdpr';

export const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
  body('startDate').isISO8601().withMessage('Valid startDate required'),
  body('endDate').isISO8601().withMessage('Valid endDate required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('ticketTypes').optional().isArray(),
];

export const calendarQueryValidation = [
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
];

export async function listEvents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { from, to, venue, search, page = '1', limit = '20', status } =
      req.query as EventFilterQuery;

    const filter: Record<string, unknown> = status
      ? { status }
      : { status: { $in: ['published', 'completed'] } };

    if (from || to) {
      filter.startDate = {};
      if (from) (filter.startDate as Record<string, unknown>)['$gte'] = new Date(from);
      if (to) (filter.startDate as Record<string, unknown>)['$lte'] = new Date(to);
    }

    if (venue) filter.venue = venue;

    if (search) {
      filter['$or'] = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('venue', 'name address city')
        .populate('organizer', 'name')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Event.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { events, total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startDate, endDate } = req.body as { startDate: string; endDate: string };
    if (new Date(endDate) <= new Date(startDate)) {
      return next(new BadRequestError('endDate must be after startDate'));
    }

    const event = await Event.create({ ...req.body, organizer: req.user!.userId });
    const populated = await event.populate('venue', 'name address city');
    res.status(201).json({ status: 'success', data: { event: populated } });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.id)
      .populate('venue', 'name address city country')
      .populate('organizer', 'name');
    if (!event) return next(new NotFoundError('Event'));
    res.json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new NotFoundError('Event'));

    const isOwner = event.organizer.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('You can only update your own events'));
    }

    Object.assign(event, req.body);
    await event.save();
    res.json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}

export const statusValidation = [
  body('status')
    .isIn(['published', 'cancelled', 'completed'])
    .withMessage('Status must be published, cancelled or completed'),
];

const validTransitions: Record<string, string[]> = {
  draft: ['published', 'cancelled'],
  published: ['cancelled', 'completed'],
  cancelled: ['published'],
  completed: ['published'],
};

export async function changeEventStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status } = req.body as { status: string };
    const event = await Event.findById(req.params.id);
    if (!event) return next(new NotFoundError('Event'));

    const isOwner = event.organizer.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('Access denied'));
    }

    if (!validTransitions[event.status]?.includes(status)) {
      return next(new BadRequestError(`Cannot transition from '${event.status}' to '${status}'`));
    }

    event.status = status as 'published' | 'cancelled' | 'completed';

    if (status === 'cancelled') {
      await Booking.updateMany(
        { event: event._id, status: 'confirmed' },
        { $set: { status: 'cancelled' } }
      );
      await Event.updateOne(
        { _id: event._id },
        { $set: { bookedCount: 0, 'ticketTypes.$[].sold': 0 } }
      );
    }

    await event.save();

    if (status === 'completed') {
      await anonymizeEventParticipants(event._id.toString());
    }

    res.json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new NotFoundError('Event'));

    const isOwner = event.organizer.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('Du kan bara radera dina egna events'));
    }

    await event.deleteOne();
    res.json({ status: 'success', message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getCalendarEvents(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { from, to } = req.query as { from: string; to: string };

    const events = await Event.find({
      status: { $in: ['published', 'completed'] },
      startDate: { $gte: new Date(from), $lte: new Date(to) },
    })
      .populate('venue', 'name address city')
      .populate('organizer', 'name')
      .sort({ startDate: 1 });

    const grouped: Record<string, typeof events> = {};
    for (const event of events) {
      const dateKey = new Date(event.startDate).toISOString().slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    }

    const days = Object.entries(grouped).map(([date, dayEvents]) => ({
      date,
      events: dayEvents,
    }));

    res.json({ status: 'success', data: { from, to, total: events.length, days } });
  } catch (err) {
    next(err);
  }
}

export async function recalculateEventCounts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return next(new NotFoundError('Event'));

    const isOwner = event.organizer.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('Access denied'));
    }

    const confirmedBookings = await Booking.find({ event: event._id, status: 'confirmed' });

    event.bookedCount = confirmedBookings.reduce((sum, b) => sum + b.quantity, 0);
    for (const ticketType of event.ticketTypes) {
      ticketType.sold = confirmedBookings
        .filter((b) => b.ticketTypeName === ticketType.name)
        .reduce((sum, b) => sum + b.quantity, 0);
    }

    await event.save();
    res.json({ status: 'success', data: { event } });
  } catch (err) {
    next(err);
  }
}
