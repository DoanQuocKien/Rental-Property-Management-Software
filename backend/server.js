require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { assertAuthConfig } = require('./config/auth');

const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const roomRoutes = require('./routes/rooms');
const tenantRoutes = require('./routes/tenants');
const landlordRoutes = require('./routes/landlord');

const app = express();
const isTestEnv = process.env.NODE_ENV === 'test';

app.use(cors());
app.use(express.json());

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
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rental Property Management API is running' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contracts', apiLimiter, contractRoutes);
app.use('/api/rooms', apiLimiter, roomRoutes);
app.use('/api/tenants', apiLimiter, tenantRoutes);
app.use('/api/landlord', apiLimiter, landlordRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  try {
    assertAuthConfig();
  } catch (error) {
    console.error(`${error.message}. Create backend/.env from backend/.env.example first.`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;