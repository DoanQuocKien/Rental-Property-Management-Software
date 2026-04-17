const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  getJwtSecret,
  getJwtRefreshSecret,
} = require('../config/auth');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildExpiryDate(secondsFromNow) {
  return new Date(Date.now() + (secondsFromNow * 1000)).toISOString();
}

function isStrongPassword(password) {
  if (typeof password !== 'string') {
    return false;
  }
  if (password.length < 8 || password.length > 72) {
    return false;
  }
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}

function validateEmail(email) {
  return email.length <= 254 && EMAIL_REGEX.test(email);
}

function toPublicUser(user) {
  const fullName = user.full_name || user.name || '';
  return {
    userID: user.id,
    id: user.id,
    name: user.name || fullName,
    fullName,
    phoneNumber: user.phone_number || '',
    citizenID: user.citizen_id || null,
    permanentAddress: user.permanent_address || null,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

async function saveRefreshToken(userId, refreshToken, jti) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = buildExpiryDate(REFRESH_TOKEN_EXPIRES_IN_SECONDS);

  await db.runAsync(
    `INSERT INTO refresh_tokens (user_id, token_hash, jti, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, jti, expiresAt]
  );
}

function signAccessToken(user, jti) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.fullName,
      jti,
      type: 'access',
    },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function signRefreshToken(userId, jti) {
  return jwt.sign(
    {
      id: userId,
      jti,
      type: 'refresh',
    },
    getJwtRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

async function issueTokens(user) {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const token = signAccessToken(user, accessJti);
  const refreshToken = signRefreshToken(user.id, refreshJti);
  await saveRefreshToken(user.id, refreshToken, refreshJti);

  return { token, refreshToken };
}

function authConfigGuard(req, res) {
  try {
    getJwtSecret();
    getJwtRefreshSecret();
    return true;
  } catch (err) {
    res.status(500).json({ error: 'Server auth configuration is invalid' });
    return false;
  }
}

// US1: Register account
router.post('/register', async (req, res) => {
  if (!authConfigGuard(req, res)) {
    return;
  }

  const { name, email, password, role, fullName, phoneNumber, citizenID, permanentAddress } = req.body;
  const safeFullName = String(fullName || name || '').trim();
  const safeName = safeFullName;
  const safePhoneNumber = String(phoneNumber || '').trim();
  const safeCitizenId = String(citizenID || '').trim();
  const safePermanentAddress = String(permanentAddress || '').trim();
  const normalizedEmail = normalizeEmail(email);

  if (!safeName || !safeFullName || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  if (safeName.length < 2 || safeName.length > 100) {
    return res.status(400).json({ error: 'Name must be between 2 and 100 characters' });
  }

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Email format is invalid' });
  }

  if (safePhoneNumber && !/^\+?[0-9]{8,15}$/.test(safePhoneNumber)) {
    return res.status(400).json({ error: 'Phone number format is invalid' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be 8-72 chars and include letters and numbers' });
  }

  const allowedRoles = ['landlord', 'tenant', 'Owner', 'Manager', 'Tenant', 'TechnicalStaff'];
  const userRole = allowedRoles.includes(role) ? role : 'tenant';

  if ((userRole === 'tenant' || userRole === 'Tenant') && safeCitizenId && safeCitizenId.length > 20) {
    return res.status(400).json({ error: 'Citizen ID must not exceed 20 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const initialStatus = (userRole === 'tenant' || userRole === 'Tenant') ? 'pending' : 'active';

    const insertResult = await db.runAsync(
      `INSERT INTO users
       (name, full_name, phone_number, email, password, role, citizen_id, permanent_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        safeName,
        safeFullName,
        safePhoneNumber,
        normalizedEmail,
        hashedPassword,
        userRole,
        safeCitizenId || null,
        safePermanentAddress || null,
        initialStatus,
      ]
    );

    const user = {
      id: insertResult.lastID,
      name: safeName,
      fullName: safeFullName,
      phoneNumber: safePhoneNumber,
      citizenID: safeCitizenId || null,
      permanentAddress: safePermanentAddress || null,
      email: normalizedEmail,
      role: userRole,
      status: initialStatus,
    };

    if (initialStatus === 'pending') {
      res.status(201).json({
        message: 'Đăng ký thành công. Tài khoản đang chờ Chủ trọ phê duyệt.',
        user,
      });
      return;
    }

    const { token, refreshToken } = await issueTokens(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      refreshToken,
      user,
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// US2: Login
router.post('/login', async (req, res) => {
  if (!authConfigGuard(req, res)) {
    return;
  }

  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Email format is invalid' });
  }

    try {
    const user = await db.getAsync(
      `SELECT id, name, full_name, phone_number, citizen_id, permanent_address, email, password, role, status
       FROM users
       WHERE email = ?`,
      [normalizedEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang chờ Chủ trọ phê duyệt.' });
    }
    
    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = toPublicUser(user);

    const { token, refreshToken } = await issueTokens(safeUser);

    return res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: safeUser,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh access token with refresh token rotation
router.post('/refresh', async (req, res) => {
  if (!authConfigGuard(req, res)) {
    return;
  }

  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  if (decoded.type !== 'refresh') {
    return res.status(401).json({ error: 'Invalid refresh token type' });
  }

  const currentTokenHash = hashToken(refreshToken);

  try {
    const tokenRow = await db.getAsync(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND user_id = ? AND revoked = 0`,
      [currentTokenHash, decoded.id]
    );

    if (!tokenRow) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    if (new Date(tokenRow.expires_at) <= new Date()) {
      await db.runAsync(
        'UPDATE refresh_tokens SET revoked = 1, revoked_at = CURRENT_TIMESTAMP WHERE id = ?',
        [tokenRow.id]
      );
      return res.status(401).json({ error: 'Refresh token has expired' });
    }

    const user = await db.getAsync(
      `SELECT id, name, full_name, phone_number, citizen_id, permanent_address, email, role, status
       FROM users
       WHERE id = ?`,
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (user.status === 'pending' || user.status === 'inactive') {
      return res.status(403).json({ error: 'Tài khoản bị khóa hoặc chưa được duyệt.' });
    }

    const newRefreshJti = crypto.randomUUID();
    const newAccessJti = crypto.randomUUID();

    const newToken = signAccessToken(user, newAccessJti);
    const newRefreshToken = signRefreshToken(user.id, newRefreshJti);

    await db.runAsync(
      `UPDATE refresh_tokens
       SET revoked = 1,
           revoked_at = CURRENT_TIMESTAMP,
           replaced_by_jti = ?,
           last_used_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newRefreshJti, tokenRow.id]
    );

    await saveRefreshToken(user.id, newRefreshToken, newRefreshJti);

    return res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken,
      user: toPublicUser(user),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout current session
router.post('/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body || {};

  try {
    if (req.user && req.user.jti && req.user.exp) {
      const accessExpiresAt = new Date(req.user.exp * 1000).toISOString();
      await db.runAsync(
        `INSERT OR IGNORE INTO revoked_access_tokens (jti, user_id, expires_at)
         VALUES (?, ?, ?)`,
        [req.user.jti, req.user.id, accessExpiresAt]
      );
    }

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await db.runAsync(
        `UPDATE refresh_tokens
         SET revoked = 1, revoked_at = CURRENT_TIMESTAMP
         WHERE token_hash = ? AND user_id = ? AND revoked = 0`,
        [tokenHash, req.user.id]
      );
    }

    return res.json({ message: 'Logout successful' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// Revoke a refresh token explicitly
router.post('/revoke', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  const tokenHash = hashToken(refreshToken);

  try {
    const result = await db.runAsync(
      `UPDATE refresh_tokens
       SET revoked = 1, revoked_at = CURRENT_TIMESTAMP
       WHERE token_hash = ? AND user_id = ? AND revoked = 0`,
      [tokenHash, req.user.id]
    );

    if (!result.changes) {
      return res.status(404).json({ error: 'Refresh token not found or already revoked' });
    }

    return res.json({ message: 'Refresh token revoked successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to revoke refresh token' });
  }
});

module.exports = router;
