import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './config/env';
import { User } from './models/User';
import { Venue } from './models/Venue';
import { Event } from './models/Event';
import { Booking } from './models/Booking';
import { Ticket } from './models/Ticket';
import { Review } from './models/Review';
import { Waitlist } from './models/Waitlist';

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({}),
    Venue.deleteMany({}),
    Event.deleteMany({}),
    Booking.deleteMany({}),
    Ticket.deleteMany({}),
    Review.deleteMany({}),
    Waitlist.deleteMany({}),
  ]);

  // Users
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@eventhub.se';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';

  await User.create({
    name: 'Admin User',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });

  const organizer = await User.create({
    name: 'Tech Events AB',
    email: 'organizer@eventhub.se',
    password: 'Organizer1234!',
    role: 'organizer',
  });

  await User.create({
    name: 'Anna Svensson',
    email: 'anna@example.se',
    password: 'Participant1234!',
    role: 'participant',
  });

  // Venue
  const venue = await Venue.create({
    name: 'Scandic S:t Jörgen',
    address: 'Stora Nygatan 35',
    city: 'Malmö',
    country: 'Sweden',
    capacity: 500,
  });

  // Event 1 — Tech Meetup 2026
  await Event.create({
    title: 'Tech Meetup 2026',
    description: 'Node.js, TypeScript workshop',
    venue: venue._id,
    organizer: organizer._id,
    startDate: new Date('2026-09-15T16:00:00.000Z'),
    endDate: new Date('2026-09-15T19:00:00.000Z'),
    capacity: 100,
    ticketTypes: [
      { name: 'Standard', price: 0, quantity: 80, sold: 0 },
      { name: 'VIP', price: 299, quantity: 20, sold: 0 },
    ],
    status: 'published',
  });

  // Event 2 — Startup Tech Malmö 2026
  await Event.create({
    title: 'Startup Tech Malmö 2026',
    description: 'Fem nya startups presenterar sina idéer för investerare och publik. Nätverkande och mingel efter eventet.',
    venue: venue._id,
    organizer: organizer._id,
    startDate: new Date('2026-07-06T16:00:00.000Z'),
    endDate: new Date('2026-07-06T18:00:00.000Z'),
    capacity: 150,
    ticketTypes: [
      { name: 'Standard', price: 0, quantity: 100, sold: 0 },
      { name: 'VIP med mingel', price: 200, quantity: 50, sold: 0 },
    ],
    status: 'published',
  });

  // Event 3 — AI & Framtiden
  await Event.create({
    title: 'AI & Framtiden – Föreläsning',
    description: 'Utforska hur artificiell intelligens förändrar arbetsmarknaden. Experter från industrin delar sina erfarenheter och svarar på frågor.',
    venue: venue._id,
    organizer: organizer._id,
    startDate: new Date('2026-08-20T17:00:00.000Z'),
    endDate: new Date('2026-08-20T19:00:00.000Z'),
    capacity: 200,
    ticketTypes: [
      { name: 'Student', price: 0, quantity: 100, sold: 0 },
      { name: 'Ordinarie', price: 199, quantity: 100, sold: 0 },
    ],
    status: 'published',
  });

  // Event 4 — Cybersecurity Workshop
  await Event.create({
    title: 'Cybersecurity Workshop',
    description: 'Lär dig grunderna i cybersäkerhet. Vi går igenom vanliga attacker och hur man skyddar sina applikationer.',
    venue: venue._id,
    organizer: organizer._id,
    startDate: new Date('2026-10-10T14:00:00.000Z'),
    endDate: new Date('2026-10-10T18:00:00.000Z'),
    capacity: 100,
    ticketTypes: [
      { name: 'Student', price: 149, quantity: 60, sold: 0 },
      { name: 'Standard', price: 249, quantity: 40, sold: 0 },
    ],
    status: 'published',
  });

  console.log('Seed complete');
  console.log('  Admin:     admin@eventhub.se / Admin1234!');
  console.log('  Organizer: organizer@eventhub.se / Organizer1234!');
  console.log('  User:      anna@example.se / Participant1234!');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
