const jwt = require('jsonwebtoken');
const db = require('../database');
const { getJwtSecret } = require('../config/auth');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  let user;
  try {
    user = jwt.verify(token, getJwtSecret());
  } catch (err) {
    if (err.message && err.message.includes('required')) {
      return res.status(500).json({ error: 'Server auth configuration is invalid' });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  if (user.type && user.type !== 'access') {
    return res.status(403).json({ error: 'Invalid token type' });
  }

  if (!user.jti) {
    return res.status(403).json({ error: 'Invalid token payload' });
  }

  db.get('SELECT jti FROM revoked_access_tokens WHERE jti = ?', [user.jti], (err, revokedToken) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to validate access token' });
    }
    if (revokedToken) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    return next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. ${role} role required.` });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };