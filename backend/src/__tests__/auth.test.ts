import request from 'supertest';
import app from '../app';
import { setupDB } from './setup';

setupDB();

describe('POST /api/auth/register', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('defaults role to participant', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });
    expect(res.body.data.user.role).toBe('participant');
  });

  it('returns 400 with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'not-an-email',
      password: 'Password1',
    });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when password has no uppercase letter', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password1',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password has no digit', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'PasswordOnly',
    });
    expect(res.status).toBe(400);
  });

  it('returns 409 when email already exists', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane Doe',
      email: 'john@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });
  });

  it('logs in with correct credentials and returns a token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'john@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.data.user.email).toBe('john@example.com');
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'john@example.com',
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 with unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  let token: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password1',
    });
    token = res.body.token;
  });

  it('returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('john@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
