import request from 'supertest';
import app from '../app';
import { setupDB } from './setup';
import { createOrganizer, createParticipant, createAdminDirectly, createVenue, bearer } from './helpers';

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

const eventPayload = () => {
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    title: 'Jazz Night',
    description: 'A great jazz evening for everyone',
    venue: venueId,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    capacity: 50,
    ticketTypes: [{ name: 'General', price: 0, quantity: 50 }],
  };
};

describe('Events CRUD', () => {
  it('POST /api/events — organizer creates an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', bearer(organizerToken))
      .send(eventPayload());
    expect(res.status).toBe(201);
    expect(res.body.data.event.title).toBe('Jazz Night');
  });

  it('POST /api/events — participant gets 403', async () => {
    const { token } = await createParticipant();
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', bearer(token))
      .send(eventPayload());
    expect(res.status).toBe(403);
  });

  it('GET /api/events — returns list of events', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', bearer(organizerToken))
      .send(eventPayload());
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.events)).toBe(true);
    expect(res.body.data.events.length).toBeGreaterThan(0);
  });

  it('GET /api/events/:id — returns single event', async () => {
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', bearer(organizerToken))
      .send(eventPayload());
    const eventId = created.body.data.event._id;

    const res = await request(app).get(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.event._id).toBe(eventId);
  });

  it('GET /api/events/:id — returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/events/000000000000000000000000');
    expect(res.status).toBe(404);
  });

  it('PUT /api/events/:id — owner can update event', async () => {
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', bearer(organizerToken))
      .send(eventPayload());
    const eventId = created.body.data.event._id;

    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', bearer(organizerToken))
      .send({ ...eventPayload(), title: 'Updated Jazz Night' });
    expect(res.status).toBe(200);
    expect(res.body.data.event.title).toBe('Updated Jazz Night');
  });

  it('DELETE /api/events/:id — owner can delete event', async () => {
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', bearer(organizerToken))
      .send(eventPayload());
    const eventId = created.body.data.event._id;

    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', bearer(organizerToken));
    expect(res.status).toBe(200);
  });
});
