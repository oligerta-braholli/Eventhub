import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';

export const bearer = (token: string) => `Bearer ${token}`;

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role?: 'participant' | 'organizer';
}) {
  return request(app).post('/api/auth/register').send(data);
}

export async function loginUser(email: string, password: string) {
  return request(app).post('/api/auth/login').send({ email, password });
}

export async function createParticipant(suffix = '') {
  const res = await registerUser({
    name: 'Test Participant',
    email: `participant${suffix}@test.com`,
    password: 'Password1',
    role: 'participant',
  });
  return { token: res.body.token as string, user: res.body.data?.user };
}

export async function createOrganizer(suffix = '') {
  const res = await registerUser({
    name: 'Test Organizer',
    email: `organizer${suffix}@test.com`,
    password: 'Password1',
    role: 'organizer',
  });
  return { token: res.body.token as string, user: res.body.data?.user };
}

export async function createAdminDirectly() {
  const user = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Password1',
    role: 'admin',
  });
  const token = signToken({ userId: (user._id as unknown as string).toString(), role: 'admin' });
  return { token, user };
}

export async function createVenue(adminToken: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/venues')
    .set('Authorization', bearer(adminToken))
    .send({
      name: 'Test Venue',
      address: '1 Main Street',
      city: 'Malmö',
      country: 'Sweden',
      capacity: 200,
      ...overrides,
    });
  return res.body.data?.venue;
}

export async function createEvent(
  organizerToken: string,
  venueId: string,
  overrides: Record<string, unknown> = {}
) {
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const res = await request(app)
    .post('/api/events')
    .set('Authorization', bearer(organizerToken))
    .send({
      title: 'Test Event',
      description: 'A test event for automated testing',
      venue: venueId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      capacity: 50,
      ticketTypes: [{ name: 'General', price: 0, quantity: 50 }],
      ...overrides,
    });
  return res.body.data?.event;
}

export async function createBooking(
  participantToken: string,
  eventId: string,
  ticketTypeName = 'General',
  quantity = 1
) {
  return request(app)
    .post('/api/bookings')
    .set('Authorization', bearer(participantToken))
    .send({ eventId, ticketTypeName, quantity });
}
