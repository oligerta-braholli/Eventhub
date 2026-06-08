import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Booking, IBooking } from '../models/Booking';
import { Ticket } from '../models/Ticket';
import { Waitlist } from '../models/Waitlist';
import { AuthenticatedRequest } from '../types';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';

export const bookingValidation = [
  body('eventId').notEmpty().withMessage('eventId krävs'),
  body('ticketTypeName').trim().notEmpty().withMessage('ticketTypeName krävs'),
  body('quantity').isInt({ min: 1, max: 10 }).withMessage('Antal måste vara mellan 1 och 10'),
];

function generateTicketNumber(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function createBooking(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { eventId, ticketTypeName, quantity } = req.body as {
      eventId: string;
      ticketTypeName: string;
      quantity: number;
    };

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const event = await Event.findById(eventId).session(session);
        if (!event || event.status !== 'published') throw new NotFoundError('Event');

        const existingBooking = await Booking.findOne({ event: eventId, participant: req.user!.userId }).session(session);
        if (existingBooking?.status === 'confirmed') throw new ConflictError('Du har redan en bokning för detta evenemang');

        const ticketType = event.ticketTypes.find((t) => t.name === ticketTypeName);
        if (!ticketType) throw new BadRequestError('Biljetttypen hittades inte');

        const remainingSpots = Math.max(0, event.capacity - event.bookedCount);
        const availableByType = Math.max(0, ticketType.quantity - ticketType.sold);
        const available = Math.min(availableByType, remainingSpots);

        let bookQuantity = quantity;
        let waitQuantity = 0;
        if (available < quantity) {
          if (available <= 0) {
            bookQuantity = 0;
            waitQuantity = quantity;
          } else {
            bookQuantity = available;
            waitQuantity = quantity - available;
          }
        }

        const totalPrice = ticketType.price * bookQuantity;
        let bookingDoc: IBooking | null = null;

        if (bookQuantity > 0) {
          if (existingBooking) {
            existingBooking.ticketTypeName = ticketTypeName;
            existingBooking.quantity = bookQuantity;
            existingBooking.totalPrice = totalPrice;
            existingBooking.status = 'confirmed';
            bookingDoc = await existingBooking.save({ session });
          } else {
            const created = await Booking.create([
              { event: eventId, participant: req.user!.userId, ticketTypeName, quantity: bookQuantity, totalPrice },
            ], { session });
            bookingDoc = created[0];
          }

          await Ticket.deleteMany({ booking: bookingDoc._id }).session(session);
          const tickets = Array.from({ length: bookQuantity }, () => ({
            event: eventId,
            booking: bookingDoc!._id,
            participant: req.user!.userId,
            ticketTypeName,
            price: ticketType.price,
            ticketNumber: generateTicketNumber(),
          }));
          await Ticket.insertMany(tickets, { session });

          ticketType.sold += bookQuantity;
          event.bookedCount += bookQuantity;
          await event.save({ session });
        }

        let waitlistEntry: any = null;
        if (waitQuantity > 0) {
          const existingWait = await Waitlist.findOne({ event: eventId, participant: req.user!.userId }).session(session);
          if (!existingWait) {
            const position = (await Waitlist.countDocuments({ event: eventId }).session(session)) + 1;
            const created = await Waitlist.create([{ event: eventId, participant: req.user!.userId, position, quantity: waitQuantity }], { session });
            waitlistEntry = created[0];
          } else {
            existingWait.quantity = (existingWait.quantity || 0) + waitQuantity;
            waitlistEntry = await existingWait.save({ session });
          }
        }

        (res as any).locals.bookingResponse = {
          booking: bookingDoc,
          waitlist: waitlistEntry,
          bookedNow: bookQuantity,
          waitlisted: waitQuantity,
        };
      });

      const out = (res as any).locals.bookingResponse;
      res.status(out.bookedNow > 0 ? 201 : 409).json({ status: out.bookedNow > 0 ? 'success' : 'waitlisted', data: out });
    } finally {
      session.endSession();
    }
  } catch (err) {
    next(err);
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
      return next(new ForbiddenError('Åtkomst nekad'));
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
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const booking = await Booking.findById(req.params.id).session(session);
        if (!booking) throw new NotFoundError('Beställning');

        const isOwner = booking.participant.toString() === req.user!.userId;
        if (!isOwner && req.user!.role !== 'admin') throw new ForbiddenError('Åtkomst nekad');

        if (booking.status === 'cancelled') throw new ConflictError('Beställningen är redan avbokad');

        booking.status = 'cancelled';
        await booking.save({ session });

        const event = await Event.findById(booking.event).session(session);
        if (event) {
          const ticketType = event.ticketTypes.find((t) => t.name === booking.ticketTypeName);
          event.bookedCount = Math.max(0, event.bookedCount - booking.quantity);
          if (ticketType) ticketType.sold = Math.max(0, ticketType.sold - booking.quantity);

          const waitlisted = await Waitlist.findOne({ event: event._id }).sort({ position: 1 }).session(session);
          if (waitlisted && ticketType) {
            await Waitlist.deleteOne({ _id: waitlisted._id }).session(session);
            await Waitlist.updateMany(
              { event: event._id, position: { $gt: waitlisted.position } },
              { $inc: { position: -1 } }
            ).session(session);

            const existingForWaitlisted = await Booking.findOne({
              event: event._id,
              participant: waitlisted.participant,
            }).session(session);

            const availableAfterCancel = event.capacity - event.bookedCount;
            const autoQty = Math.min(waitlisted.quantity, availableAfterCancel);

            let autoBooking: IBooking;
            if (existingForWaitlisted) {
              existingForWaitlisted.ticketTypeName = booking.ticketTypeName;
              existingForWaitlisted.quantity = autoQty;
              existingForWaitlisted.totalPrice = ticketType.price * autoQty;
              existingForWaitlisted.status = 'confirmed';
              autoBooking = await existingForWaitlisted.save({ session });
            } else {
              const created = await Booking.create([
                {
                  event: event._id,
                  participant: waitlisted.participant,
                  ticketTypeName: booking.ticketTypeName,
                  quantity: autoQty,
                  totalPrice: ticketType.price * autoQty,
                },
              ], { session });
              autoBooking = created[0];
            }

            const tickets = Array.from({ length: autoQty }, () => ({
              event: event._id,
              booking: autoBooking._id,
              participant: waitlisted.participant,
              ticketTypeName: booking.ticketTypeName,
              price: ticketType.price,
              ticketNumber: generateTicketNumber(),
            }));
            await Ticket.insertMany(tickets, { session });
            event.bookedCount += autoQty;
            ticketType.sold += autoQty;
          }

          await event.save({ session });
        }
      });

      res.json({ status: 'success', message: 'Beställning avbokad' });
    } finally {
      session.endSession();
    }
  } catch (err) {
    next(err);
  }
}

