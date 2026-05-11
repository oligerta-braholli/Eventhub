import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { Ticket } from '../models/Ticket';
import { Waitlist } from '../models/Waitlist';
import { AuthenticatedRequest } from '../types';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';

export const bookingValidation = [
  body('eventId').notEmpty().withMessage('eventId is required'),
  body('ticketTypeName').trim().notEmpty().withMessage('ticketTypeName is required'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('quantity must be between 1 and 10'),
];

function generateTicketNumber(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function createBooking(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { eventId, ticketTypeName, quantity } = req.body as {
      eventId: string;
      ticketTypeName: string;
      quantity: number;
    };

    const event = await Event.findById(eventId).session(session);
    if (!event || event.status !== 'published') return next(new NotFoundError('Event'));

    const ticketType = event.ticketTypes.find((t) => t.name === ticketTypeName);
    if (!ticketType) return next(new BadRequestError('Ticket type not found'));

    const available = ticketType.quantity - ticketType.sold;
    if (available < quantity) {
      await session.abortTransaction();

      // Auto-join waitlist if completely full
      if (event.bookedCount >= event.capacity) {
        const existing = await Waitlist.findOne({
          event: eventId,
          participant: req.user!.userId,
        });
        if (!existing) {
          const position = (await Waitlist.countDocuments({ event: eventId })) + 1;
          await Waitlist.create({ event: eventId, participant: req.user!.userId, position });
        }
        res.status(409).json({
          status: 'waitlisted',
          message: 'Event is full — you have been added to the waitlist',
        });
      } else {
        res.status(409).json({ status: 'error', message: 'Not enough tickets available' });
      }
      return;
    }

    const totalPrice = ticketType.price * quantity;

    const booking = await Booking.create(
      [{ event: eventId, participant: req.user!.userId, ticketTypeName, quantity, totalPrice }],
      { session }
    );

    // Create individual ticket records
    const tickets = Array.from({ length: quantity }, () => ({
      event: eventId,
      booking: booking[0]._id,
      participant: req.user!.userId,
      ticketTypeName,
      price: ticketType.price,
      ticketNumber: generateTicketNumber(),
    }));
    await Ticket.insertMany(tickets, { session });

    // Update sold count and bookedCount
    ticketType.sold += quantity;
    event.bookedCount += quantity;
    await event.save({ session });

    await session.commitTransaction();
    res.status(201).json({ status: 'success', data: { booking: booking[0] } });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    await session.endSession();
  }
}

export async function getMyBookings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bookings = await Booking.find({ participant: req.user!.userId })
      .populate('event', 'title startDate status')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { bookings } });
  } catch (err) {
    next(err);
  }
}

export async function getEventBookings(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return next(new NotFoundError('Event'));

    const isOwner = event.organizer.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('Access denied'));
    }

    const bookings = await Booking.find({ event: req.params.eventId, isAnonymized: false })
      .populate('participant', 'name email')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { bookings } });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) return next(new NotFoundError('Booking'));

    const isOwner = booking.participant.toString() === req.user!.userId;
    if (!isOwner && req.user!.role !== 'admin') {
      return next(new ForbiddenError('Access denied'));
    }

    if (booking.status === 'cancelled') {
      return next(new ConflictError('Booking already cancelled'));
    }

    booking.status = 'cancelled';
    await booking.save({ session });

    // Restore capacity
    const event = await Event.findById(booking.event).session(session);
    if (event) {
      const ticketType = event.ticketTypes.find((t) => t.name === booking.ticketTypeName);
      event.bookedCount = Math.max(0, event.bookedCount - booking.quantity);
      if (ticketType) ticketType.sold = Math.max(0, ticketType.sold - booking.quantity);

      // Promote first waitlist person and auto-book them
      const waitlisted = await Waitlist.findOne({ event: event._id }).sort({ position: 1 }).session(session);
      if (waitlisted && ticketType) {
        await Waitlist.deleteOne({ _id: waitlisted._id }).session(session);
        await Waitlist.updateMany(
          { event: event._id, position: { $gt: waitlisted.position } },
          { $inc: { position: -1 } }
        ).session(session);

        const autoBooking = await Booking.create(
          [{ event: event._id, participant: waitlisted.participant, ticketTypeName: booking.ticketTypeName, quantity: 1, totalPrice: ticketType.price }],
          { session }
        );
        await Ticket.insertMany(
          [{ event: event._id, booking: autoBooking[0]._id, participant: waitlisted.participant, ticketTypeName: booking.ticketTypeName, price: ticketType.price, ticketNumber: generateTicketNumber() }],
          { session }
        );
        event.bookedCount += 1;
        ticketType.sold += 1;
      }

      await event.save({ session });
    }

    await session.commitTransaction();
    res.json({ status: 'success', message: 'Booking cancelled' });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    await session.endSession();
  }
}
