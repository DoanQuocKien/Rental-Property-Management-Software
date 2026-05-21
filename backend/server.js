require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const { assertAuthConfig } = require('./config/auth');

const authRoutes     = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const roomRoutes     = require('./routes/rooms');
const tenantRoutes   = require('./routes/tenants');
const landlordRoutes = require('./routes/landlord');
const meterReadingRoutes = require('./routes/meter-readings');
const invoiceRoutes = require('./routes/invoices');
const maintenanceRoutes = require('./routes/maintenance-requests');
const notificationRoutes = require('./routes/notifications');
const path = require('path');

const app       = express();
const isTestEnv = process.env.NODE_ENV === 'test';
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rate limiters ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,                 // tăng lên 200 để NotificationBell polling không bị chặn
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

// ── Health check (dùng để giữ kết nối / liveness probe) ──────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rental Property Management API is running', ts: Date.now() });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contracts', apiLimiter, contractRoutes);
app.use('/api/rooms', apiLimiter, roomRoutes);
app.use('/api/tenants', apiLimiter, tenantRoutes);
app.use('/api/landlord', apiLimiter, landlordRoutes);
app.use('/api/meter-readings', apiLimiter, meterReadingRoutes);
app.use('/api/invoices', apiLimiter, invoiceRoutes);
app.use('/api/maintenance-requests', apiLimiter, maintenanceRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  try {
    assertAuthConfig();
  } catch (error) {
    console.error(`${error.message}. Create backend/.env from backend/.env.example first.`);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // ── Keep-alive: tránh bị timeout bởi reverse proxy (Nginx/Render/Railway…)
  server.keepAliveTimeout = 65000;   // 65s (lớn hơn timeout 60s mặc định của Nginx)
  server.headersTimeout   = 66000;

  // ── Graceful shutdown ─────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully…`);
    server.close(() => {
      console.log('HTTP server closed.');
      // Đóng SQLite connection
      try {
        const db = require('./database');
        db.stopBackgroundJobs();
        db.close((err) => {
          if (err) console.error('Error closing DB:', err.message);
          else console.log('SQLite connection closed.');
          process.exit(0);
        });
      } catch {
        process.exit(0);
      }
    });

    // Force exit sau 10s nếu stuck
    setTimeout(() => {
      console.error('Force exit after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // ── Bắt unhandled promise rejections (tránh crash im lặng)
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Không exit ngay — ghi log rồi để graceful shutdown xử lý nếu cần
  });
}

module.exports = app;