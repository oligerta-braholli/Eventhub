import request from 'supertest';
import app from '../app';
import { setupDB } from './setup';
import {
  createOrganizer,
  createParticipant,
  createAdminDirectly,
  createVenue,
  createEvent,
  createBooking,
  bearer,
} from './helpers';

setupDB();

let organizerToken: string;
let venueId: string;

beforeEach(async () => {
  const organizer = await createOrganizer();
  organizerToken = organizer.token;
  const admin = await createAdminDirectly();
  const venue = await createVenue(admin.token);
  venueId = venue._id;
});

describe('Booking flow', () => {
  it('participant can book a spot on a published event', async () => {
    const event = await createEvent(organizerToken, venueId);
    const { token } = await createParticipant();

    const res = await createBooking(token, event._id);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.booking).toBeDefined();
  });

  it('returns 401 when booking without authentication', async () => {
    const event = await createEvent(organizerToken, venueId);
    const res = await request(app)
      .post('/api/bookings')
      .send({ eventId: event._id, ticketTypeName: 'General', quantity: 1 });
    expect(res.status).toBe(401);
  });

  it('auto-adds to waitlist when event is full', async () => {
    const event = await createEvent(organizerToken, venueId, {
      capacity: 1,
      ticketTypes: [{ name: 'General', price: 0, quantity: 1 }],
    });

    const { token: p1 } = await createParticipant('1');
    const { token: p2 } = await createParticipant('2');

    await createBooking(p1, event._id);
    const res = await createBooking(p2, event._id);

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('waitlisted');
  });

  it('participant can see their own bookings', async () => {
    const event = await createEvent(organizerToken, venueId);
    const { token } = await createParticipant();
    await createBooking(token, event._id);

    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.data.bookings.length).toBeGreaterThan(0);
  });

  it('participant can cancel their booking', async () => {
    const event = await createEvent(organizerToken, venueId);
    const { token } = await createParticipant();
    const bookRes = await createBooking(token, event._id);
    const bookingId = bookRes.body.data.booking._id;

    const res = await request(app)
      .delete(`/api/bookings/${bookingId}`)
      .set('Authorization', bearer(token));
    expect(res.status).toBe(200);
  });
});
