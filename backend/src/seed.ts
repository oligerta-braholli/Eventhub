import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from './config/env';
import { User } from './models/User';
import { Venue } from './models/Venue';
import { Event } from './models/Event';

async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await Promise.all([
    User.deleteMany({}),
    Venue.deleteMany({}),
    Event.deleteMany({}),
  ]);

  // Users
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@eventhub.se',
    password: 'Admin1234!',
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

  // Event — Tech Meetup 2026
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
