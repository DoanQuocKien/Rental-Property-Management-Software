const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getAuditLogs, getActionTypes, getEntityTypes } = require('../services/auditLog');

const router = express.Router();

// ──────────────────────────────────────────────────────────
// GET /api/audit-logs  — Get audit logs with filtering
// Query: ?action=&entityType=&startDate=&endDate=&limit=&offset=
// ──────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const { action, entityType, startDate, endDate, limit = 100, offset = 0 } = req.query;

    const logs = await getAuditLogs(req.user.id, {
      action,
      entityType,
      startDate,
      endDate,
      limit: Math.min(Number(limit) || 100, 500),
      offset: Math.max(Number(offset) || 0, 0)
    });

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM audit_logs WHERE landlord_id = ?`;
    const countParams = [req.user.id];

    if (action) {
      countQuery += ` AND action = ?`;
      countParams.push(action);
    }
    if (entityType) {
      countQuery += ` AND entity_type = ?`;
      countParams.push(entityType);
    }
    if (startDate) {
      countQuery += ` AND DATE(created_at) >= DATE(?)`;
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ` AND DATE(created_at) <= DATE(?)`;
      countParams.push(endDate);
    }

    const countRow = await db.getAsync(countQuery, countParams);
    const total = countRow?.total || 0;

    return res.json({
      status: 'success',
      data: logs,
      pagination: {
        total,
        limit: Math.min(Number(limit) || 100, 500),
        offset: Math.max(Number(offset) || 0, 0),
        count: logs.length
      }
    });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tải nhật ký kiểm tra.',
      errorCode: 'FETCH_FAILED'
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/audit-logs/filters/actions  — Get available action types
// ──────────────────────────────────────────────────────────
router.get('/filters/actions', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const actions = await getActionTypes(req.user.id);
    return res.json({
      status: 'success',
      data: actions
    });
  } catch (err) {
    console.error('Get action types error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tải loại hành động.',
      errorCode: 'FETCH_FAILED'
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/audit-logs/filters/entity-types  — Get available entity types
// ──────────────────────────────────────────────────────────
router.get('/filters/entity-types', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const entityTypes = await getEntityTypes(req.user.id);
    return res.json({
      status: 'success',
      data: entityTypes
    });
  } catch (err) {
    console.error('Get entity types error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tải loại thực thể.',
      errorCode: 'FETCH_FAILED'
    });
  }
});

module.exports = router;
