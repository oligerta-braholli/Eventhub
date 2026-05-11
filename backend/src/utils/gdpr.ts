import { Types } from 'mongoose';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { Waitlist } from '../models/Waitlist';
import { Ticket } from '../models/Ticket';

export async function anonymizeUser(userId: string): Promise<void> {
  const uid = new Types.ObjectId(userId);
  const anon = `anon_${uid.toString().slice(-8)}`;

  await User.findByIdAndUpdate(uid, {
    name: 'Anonymized User',
    email: `${anon}@anonymized.invalid`,
    isAnonymized: true,
  });

  await Promise.all([
    Booking.updateMany({ participant: uid }, { isAnonymized: true }),
    Review.updateMany({ author: uid }, { isAnonymized: true }),
    Waitlist.updateMany({ participant: uid }, { isAnonymized: true }),
    Ticket.updateMany({ participant: uid }, { isAnonymized: true }),
  ]);
}

export async function anonymizeEventParticipants(eventId: string): Promise<void> {
  const eid = new Types.ObjectId(eventId);
  await Promise.all([
    Booking.updateMany({ event: eid }, { isAnonymized: true }),
    Review.updateMany({ event: eid }, { isAnonymized: true }),
    Waitlist.updateMany({ event: eid }, { isAnonymized: true }),
    Ticket.updateMany({ event: eid }, { isAnonymized: true }),
  ]);
}

export async function exportUserData(userId: string) {
  const uid = new Types.ObjectId(userId);
  const [user, bookings, reviews, waitlists] = await Promise.all([
    User.findById(uid).select('-password'),
    Booking.find({ participant: uid }).populate('event', 'title startDate'),
    Review.find({ author: uid }).populate('event', 'title'),
    Waitlist.find({ participant: uid }).populate('event', 'title'),
  ]);
  return { user, bookings, reviews, waitlists };
}
