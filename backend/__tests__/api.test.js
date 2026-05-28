const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use a test database
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(__dirname, `test-${process.pid}.db`);
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

jest.mock('../routes/reports', () => {
  const express = require('express');
  const router = express.Router();

  router.get('/temporary-residence', (_req, res) => res.status(501).json({ error: 'Reports mocked in tests' }));
  router.get('/tax', (_req, res) => res.status(501).json({ error: 'Reports mocked in tests' }));

  return router;
});

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
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('refreshToken');
      expect(res.body.user.status).toBe('pending');
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
        email: 'landlord@test.com',
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
        email: 'landlord@test.com',
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
  let contractRoomId;

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

    const contractRoomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        name: 'Contract Room 201',
        description: 'Room reserved for contract creation tests',
        price: 4200000,
        area: 30,
        capacity: 2,
        status: 'available'
      });
    contractRoomId = contractRoomRes.body.room.id;
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

  describe('POST /api/contracts', () => {
    it('should create a contract and update room status to occupied', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: contractRoomId,
          tenantID: 1,
          startDate: '2026-05-01',
          endDate: '2027-05-01',
          deposit: 3000000,
          rentalPrice: 2500000
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.roomID).toBe(contractRoomId);
      expect(res.body.data.tenantID).toBe(1);

      const roomRes = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${landlordToken}`);

      const createdRoom = roomRes.body.rooms.find((room) => room.id === contractRoomId);
      expect(createdRoom.status).toBe('occupied');
    });

    it('should reject creating a contract when the room is not available', async () => {
      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: contractRoomId,
          tenantID: 1,
          startDate: '2026-06-01',
          endDate: '2027-06-01',
          deposit: 3000000,
          rentalPrice: 2500000
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('ROOM_UNAVAILABLE');
    });

    it('should reject invalid tenant', async () => {
      const availableRoomRes = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          name: 'Contract Room 202',
          description: 'Room reserved for invalid tenant test',
          price: 4300000,
          area: 28,
          capacity: 2,
          status: 'available'
        });

      const res = await request(app)
        .post('/api/contracts')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: availableRoomRes.body.room.id,
          tenantID: 99999,
          startDate: '2026-07-01',
          endDate: '2027-07-01',
          deposit: 3000000,
          rentalPrice: 2500000
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.errorCode).toBe('TENANT_INVALID');
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

describe('Landlord Billing API', () => {
  let landlordToken;
  let roomId;

  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Billing Tenant',
      email: 'billing-tenant@test.com',
      password: 'password123',
      role: 'tenant'
    });

    await request(app).post('/api/auth/register').send({
      name: 'Billing Landlord',
      email: 'billing-landlord@test.com',
      password: 'password123',
      role: 'landlord'
    });

    const landlordRes = await request(app).post('/api/auth/login').send({
      email: 'billing-landlord@test.com',
      password: 'password123'
    });
    landlordToken = landlordRes.body.token;

    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        name: 'Billing Room 301',
        description: 'Room used for billing API tests',
        price: 2500000,
        area: 30,
        capacity: 2,
        status: 'available'
      });

    roomId = roomRes.body.room.id;

    await db.runAsync(
      `INSERT INTO meter_readings
       (room_id, electricity_index, water_index, prev_electricity_index, prev_water_index, recorded_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [roomId, 120, 60, 0, 0, '2026-03-31']
    );
  });

  describe('GET /api/landlord/rooms/:roomID/previous-reading', () => {
    it('should return previous month reading when available', async () => {
      const res = await request(app)
        .get(`/api/landlord/rooms/${roomId}/previous-reading?month=4&year=2026`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.previousReading).toBeTruthy();
      expect(res.body.data.previousReading.electricityIndex).toBe(120);
      expect(res.body.data.previousReading.waterIndex).toBe(60);
    });

    it('should return 400 when month/year is outside valid range', async () => {
      const res = await request(app)
        .get(`/api/landlord/rooms/${roomId}/previous-reading?month=13&year=1999`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_PAYLOAD');
    });
  });

  describe('GET/PUT /api/landlord/settings', () => {
    it('should return default service settings before they are saved', async () => {
      const res = await request(app)
        .get('/api/landlord/settings')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toEqual({
        electricity_price: 0,
        water_price: 0,
        wifi_price: 0,
        garbage_price: 0,
        parking_price: 0,
      });
    });

    it('should save and reload landlord service settings', async () => {
      const payload = {
        electricity_price: 4000,
        water_price: 18000,
        wifi_price: 100000,
        garbage_price: 30000,
        parking_price: 120000,
      };

      const saveRes = await request(app)
        .put('/api/landlord/settings')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send(payload);

      expect(saveRes.statusCode).toBe(200);
      expect(saveRes.body.status).toBe('success');
      expect(saveRes.body.data).toEqual(payload);

      const reloadRes = await request(app)
        .get('/api/landlord/settings')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(reloadRes.statusCode).toBe(200);
      expect(reloadRes.body.data).toEqual(payload);
    });

    it('should reject negative service settings', async () => {
      const res = await request(app)
        .put('/api/landlord/settings')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          electricity_price: -1,
          water_price: 18000,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_SERVICE_SETTING');
    });
  });

  describe('PUT /api/tenants/profile', () => {
    it('should update profile aliases used by the frontend', async () => {
      const res = await request(app)
        .put('/api/tenants/profile')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          fullName: 'Billing Landlord Updated',
          phoneNumber: '0912345678',
          citizenID: '012345678901',
          permanentAddress: '123 Test Street',
        });

      expect(res.statusCode).toBe(200);

      const profileRes = await request(app)
        .get('/api/tenants/profile')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(profileRes.statusCode).toBe(200);
      expect(profileRes.body.user.name).toBe('Billing Landlord Updated');
      expect(profileRes.body.user.full_name).toBe('Billing Landlord Updated');
      expect(profileRes.body.user.phone).toBe('0912345678');
      expect(profileRes.body.user.phone_number).toBe('0912345678');
      expect(profileRes.body.user.phoneNumber).toBe('0912345678');
      expect(profileRes.body.user.citizen_id).toBe('012345678901');
      expect(profileRes.body.user.permanent_address).toBe('123 Test Street');
    });
  });

  describe('GET /api/invoices/:id/pdf', () => {
    it('should return a PDF for a landlord invoice', async () => {
      const createRes = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: roomId,
          month: 5,
          year: 2026,
          rentAmount: 2500000,
          electricityAmount: 0,
          waterAmount: 0,
          serviceAmount: 150000,
          totalAmount: 2650000,
          dueDate: '2026-05-31',
        });

      expect(createRes.statusCode).toBe(201);

      const pdfRes = await request(app)
        .get(`/api/invoices/${createRes.body.data.id}/pdf`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .buffer();

      expect(pdfRes.statusCode).toBe(200);
      expect(pdfRes.headers['content-type']).toContain('application/pdf');
      expect(pdfRes.body.length).toBeGreaterThan(100);
    });
  });

  describe('POST /api/landlord/invoices/calculate', () => {
    it('should calculate invoice total using previous reading from DB', async () => {
      const res = await request(app)
        .post('/api/landlord/invoices/calculate')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: roomId,
          month: 4,
          year: 2026,
          currentElectricityIndex: 150,
          currentWaterIndex: 70,
          serviceFees: {
            wifiFee: 100000,
            trashFee: 50000
          },
          serviceUnitPrices: {
            electricityUnitPrice: 4000,
            waterUnitPrice: 15000
          }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.resolvedPreviousIndexes.prevElectricityIndex).toBe(120);
      expect(res.body.data.resolvedPreviousIndexes.prevWaterIndex).toBe(60);
      expect(res.body.data.breakdown.electricityUsage).toBe(30);
      expect(res.body.data.breakdown.waterUsage).toBe(10);
      expect(res.body.data.totalAmount).toBe(2920000);
    });

    it('should return validation error when current index is lower than previous index', async () => {
      const res = await request(app)
        .post('/api/landlord/invoices/calculate')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: roomId,
          month: 4,
          year: 2026,
          currentElectricityIndex: 100,
          currentWaterIndex: 70,
          serviceFees: {
            wifiFee: 100000,
            trashFee: 50000
          },
          serviceUnitPrices: {
            electricityUnitPrice: 4000,
            waterUnitPrice: 15000
          }
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('BILLING_VALIDATION_ERROR');
    });

    it('should return config error when service unit prices are missing', async () => {
      const res = await request(app)
        .post('/api/landlord/invoices/calculate')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          roomID: roomId,
          month: 4,
          year: 2026,
          currentElectricityIndex: 150,
          currentWaterIndex: 70,
          serviceFees: {
            wifiFee: 100000,
            trashFee: 50000
          },
          serviceUnitPrices: {
            electricityUnitPrice: 4000
          }
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('SERVICE_PRICE_CONFIG_MISSING');
      expect(Array.isArray(res.body.missingFields)).toBe(true);
      expect(res.body.missingFields).toContain('waterUnitPrice');
    });
  });
});
