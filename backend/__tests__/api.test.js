const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use a test database
process.env.DB_PATH = path.join(__dirname, 'test.db');
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

// Clean up test db before tests
if (fs.existsSync(process.env.DB_PATH)) {
  fs.unlinkSync(process.env.DB_PATH);
}

const app = require('../server');
const db = require('../database');

afterAll(async () => {
  await db.closeAsync();
  if (fs.existsSync(process.env.DB_PATH)) {
    fs.unlinkSync(process.env.DB_PATH);
  }
});

describe('Authentication API', () => {
  // US1: Register
  describe('POST /api/auth/register', () => {
    it('should register a new tenant', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Tenant',
        email: 'tenant@test.com',
        password: 'password123',
        role: 'tenant'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.role).toBe('tenant');
    });

    it('should register a new landlord', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test Landlord',
        email: 'landlord@test.com',
        password: 'password123',
        role: 'landlord'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.role).toBe('landlord');
    });

    it('should normalize email before save', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Normalize User',
        email: 'Normalize@TEST.com ',
        password: 'password123',
        role: 'tenant'
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.user.email).toBe('normalize@test.com');
    });

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate',
        email: 'tenant@test.com',
        password: 'password123',
        role: 'tenant'
      });
      expect(res.statusCode).toBe(409);
    });

    it('should reject missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'missing@test.com'
      });
      expect(res.statusCode).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pass',
        email: 'short@test.com',
        password: '123'
      });
      expect(res.statusCode).toBe(400);
    });

    it('should reject weak password without numbers or letters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak Pass',
        email: 'weak@test.com',
        password: 'abcdefgh'
      });
      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad Email',
        email: 'bad-email-format',
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // US2: Login
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'landlord@test.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe('landlord@test.com');
    });

    it('should login with normalized email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: ' LANDLORD@TEST.COM ',
        password: 'password123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe('landlord@test.com');
    });

    it('should reject invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'landlord@test.com',
        password: 'wrongpassword'
      });
      expect(res.statusCode).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@test.com',
        password: 'password123'
      });
      expect(res.statusCode).toBe(401);
    });

    it('should reject missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
        password: 'password123'
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should rotate refresh token and issue new access token', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'tenant@test.com',
        password: 'password123'
      });
      const oldRefreshToken = loginRes.body.refreshToken;

      const refreshRes = await request(app).post('/api/auth/refresh').send({
        refreshToken: oldRefreshToken
      });

      expect(refreshRes.statusCode).toBe(200);
      expect(refreshRes.body).toHaveProperty('token');
      expect(refreshRes.body).toHaveProperty('refreshToken');
      expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);

      const oldTokenRes = await request(app).post('/api/auth/refresh').send({
        refreshToken: oldRefreshToken
      });
      expect(oldTokenRes.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout and /api/auth/revoke', () => {
    it('should logout and revoke current access/refresh token pair', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'landlord@test.com',
        password: 'password123'
      });

      const accessToken = loginRes.body.token;
      const refreshToken = loginRes.body.refreshToken;

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutRes.statusCode).toBe(200);

      const protectedRes = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(protectedRes.statusCode).toBe(403);

      const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
      expect(refreshRes.statusCode).toBe(401);
    });

    it('should revoke a refresh token explicitly', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'tenant@test.com',
        password: 'password123'
      });

      const accessToken = loginRes.body.token;
      const refreshToken = loginRes.body.refreshToken;

      const revokeRes = await request(app)
        .post('/api/auth/revoke')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(revokeRes.statusCode).toBe(200);

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });
      expect(refreshRes.statusCode).toBe(401);
    });
  });
});

describe('Rooms API', () => {
  let landlordToken;
  let tenantToken;
  let roomId;

  beforeAll(async () => {
    // Get landlord token
    const landlordRes = await request(app).post('/api/auth/login').send({
      email: 'landlord@test.com',
      password: 'password123'
    });
    landlordToken = landlordRes.body.token;

    // Get tenant token
    const tenantRes = await request(app).post('/api/auth/login').send({
      email: 'tenant@test.com',
      password: 'password123'
    });
    tenantToken = tenantRes.body.token;
  });

  // US3: Add room
  describe('POST /api/rooms', () => {
    it('should allow landlord to add a room', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          name: 'Room 101',
          description: 'A cozy room',
          price: 3000000,
          area: 25,
          capacity: 2,
          status: 'available'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.room.name).toBe('Room 101');
      roomId = res.body.room.id;
    });

    it('should reject tenant adding a room', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ name: 'Room X', price: 1000000, area: 20, capacity: 2 });
      expect(res.statusCode).toBe(403);
    });

    it('should reject missing room name', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ price: 1000000, area: 20, capacity: 2 });
      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({ name: 'Room Z', price: 1000000, area: 20, capacity: 2 });
      expect(res.statusCode).toBe(401);
    });
  });

  // US3: Get all rooms
  describe('GET /api/rooms', () => {
    it('should return rooms for landlord', async () => {
      const res = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('rooms');
      expect(Array.isArray(res.body.rooms)).toBe(true);
    });

    it('should reject tenant accessing rooms', async () => {
      const res = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${tenantToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // US3: Update room
  describe('PUT /api/rooms/:id', () => {
    it('should allow landlord to update a room', async () => {
      const res = await request(app)
        .put(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ name: 'Room 101 Updated', price: 3500000 });
      expect(res.statusCode).toBe(200);
      expect(res.body.room.name).toBe('Room 101 Updated');
    });

    it('should return 404 for non-existent room', async () => {
      const res = await request(app)
        .put('/api/rooms/99999')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ name: 'Ghost Room' });
      expect(res.statusCode).toBe(404);
    });
  });

  // US4: View available rooms
  describe('GET /api/rooms/available', () => {
    it('should return available rooms for landlord', async () => {
      const res = await request(app)
        .get('/api/rooms/available')
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('rooms');
      expect(res.body.rooms.every(r => r.status === 'available')).toBe(true);
    });

    it('should not include occupied rooms', async () => {
      // Mark room as occupied
      await request(app)
        .put(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ status: 'occupied' });

      const res = await request(app)
        .get('/api/rooms/available')
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res.statusCode).toBe(200);
      const occupiedRooms = res.body.rooms.filter(r => r.id === roomId);
      expect(occupiedRooms.length).toBe(0);
    });
  });

  // US3: Delete room
  describe('DELETE /api/rooms/:id', () => {
    it('should allow landlord to delete a room', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('should return 404 for non-existent room', async () => {
      const res = await request(app)
        .delete('/api/rooms/99999')
        .set('Authorization', `Bearer ${landlordToken}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
