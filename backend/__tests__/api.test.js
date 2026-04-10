const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use a test database
process.env.DB_PATH = path.join(__dirname, 'test.db');
process.env.JWT_SECRET = 'test_secret';

// Clean up test db before tests
if (fs.existsSync(process.env.DB_PATH)) {
  fs.unlinkSync(process.env.DB_PATH);
}

const app = require('../server');

afterAll(() => {
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
      expect(res.body.user.role).toBe('landlord');
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
        .send({ name: 'Room X', price: 1000000 });
      expect(res.statusCode).toBe(403);
    });

    it('should reject missing room name', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ price: 1000000 });
      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({ name: 'Room Z', price: 1000000 });
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
