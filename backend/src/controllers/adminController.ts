import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';
import { Waitlist } from '../models/Waitlist';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export async function getAdminStats(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalUsers,
      admins,
      organizers,
      participants,
      totalEvents,
      publishedEvents,
      draftEvents,
      cancelledEvents,
      completedEvents,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      waitlistCount,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'organizer' }),
      User.countDocuments({ role: 'participant' }),
      Event.countDocuments(),
      Event.countDocuments({ status: 'published' }),
      Event.countDocuments({ status: 'draft' }),
      Event.countDocuments({ status: 'cancelled' }),
      Event.countDocuments({ status: 'completed' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Waitlist.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    ]);

    res.json({
      status: 'success',
      data: {
        users: { total: totalUsers, admins, organizers, participants },
        events: { total: totalEvents, published: publishedEvents, draft: draftEvents, cancelled: cancelledEvents, completed: completedEvents },
        bookings: { total: totalBookings, confirmed: confirmedBookings, cancelled: cancelledBookings },
        waitlist: { total: waitlistCount },
        recentUsers,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body as { role: string };

    if (!['admin', 'organizer', 'participant'].includes(role)) {
      return next(new ForbiddenError('Ogiltig roll'));
    }

    if (id === req.user!.userId) {
      return next(new ForbiddenError('Du kan inte ändra din egen roll'));
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: 'name email role createdAt' }
    );

    if (!user) return next(new NotFoundError('Användaren'));

    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function getAdminUsers(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('name email role isAnonymized createdAt');

    res.json({ status: 'success', data: { users, total: users.length } });
  } catch (err) {
    next(err);
  }
}
