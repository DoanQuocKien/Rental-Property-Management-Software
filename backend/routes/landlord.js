const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/landlord/tenants — Danh sách tất cả khách thuê của landlord
// (những người đang có hợp đồng active với phòng của landlord này)
router.get('/tenants', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const tenants = await db.allAsync(
      `SELECT
        u.id,
        COALESCE(u.full_name, u.name) as fullName,
        u.email,
        u.phone_number as phoneNumber,
        u.citizen_id as citizenID,
        u.permanent_address as permanentAddress,
        u.created_at as createdAt,
        lc.id as contractID,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.status as contractStatus,
        lc.rental_price as rentalPrice,
        lc.deposit,
        r.id as roomID,
        r.name as roomName
       FROM users u
       JOIN lease_contracts lc ON lc.tenant_id = u.id
       JOIN rooms r ON lc.room_id = r.id
       WHERE r.landlord_id = ? AND lc.status = 'active'
       ORDER BY lc.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      status: 'success',
      data: tenants,
    });
  } catch (err) {
    console.error('Get landlord tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenants.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/tenants/all — Tất cả tài khoản tenant trong hệ thống
// (để landlord tìm kiếm khi tạo hợp đồng mới)
router.get('/tenants/all', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { search } = req.query;

  let query = `
    SELECT
      u.id,
      COALESCE(u.full_name, u.name) as fullName,
      u.email,
      u.phone_number as phoneNumber,
      u.citizen_id as citizenID,
      u.permanent_address as permanentAddress,
      u.created_at as createdAt,
      CASE WHEN EXISTS (
        SELECT 1 FROM lease_contracts lc2
        WHERE lc2.tenant_id = u.id AND lc2.status = 'active'
      ) THEN 1 ELSE 0 END as hasActiveContract
    FROM users u
    WHERE u.role IN ('tenant', 'Tenant')
  `;
  const params = [];

  if (search && search.trim()) {
    query += ` AND (
      COALESCE(u.full_name, u.name) LIKE ? OR
      u.email LIKE ? OR
      u.citizen_id LIKE ? OR
      u.phone_number LIKE ?
    )`;
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ` ORDER BY u.created_at DESC`;

  try {
    const tenants = await db.allAsync(query, params);
    return res.json({
      status: 'success',
      data: tenants,
    });
  } catch (err) {
    console.error('Get all tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenants.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/tenants/:id — Chi tiết một khách thuê
router.get('/tenants/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const tenantId = Number(req.params.id);

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid tenant ID.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  try {
    const tenant = await db.getAsync(
      `SELECT
        id,
        COALESCE(full_name, name) as fullName,
        email,
        phone_number as phoneNumber,
        citizen_id as citizenID,
        permanent_address as permanentAddress,
        date_of_birth as dateOfBirth,
        gender,
        created_at as createdAt
       FROM users
       WHERE id = ? AND role IN ('tenant', 'Tenant')`,
      [tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found.',
        errorCode: 'TENANT_NOT_FOUND',
      });
    }

    // Lịch sử hợp đồng của tenant này với phòng của landlord
    const contracts = await db.allAsync(
      `SELECT
        lc.id as contractID,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.deposit,
        lc.rental_price as rentalPrice,
        lc.status,
        r.id as roomID,
        r.name as roomName
       FROM lease_contracts lc
       JOIN rooms r ON lc.room_id = r.id
       WHERE lc.tenant_id = ? AND r.landlord_id = ?
       ORDER BY lc.created_at DESC`,
      [tenantId, req.user.id]
    );

    return res.json({
      status: 'success',
      data: { ...tenant, contracts },
    });
  } catch (err) {
    console.error('Get tenant detail error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tenant.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/maintenance — Yêu cầu bảo trì cho landlord xem
router.get('/maintenance', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT
      mr.id,
      mr.description,
      mr.category,
      mr.priority,
      mr.status,
      mr.resolution_note as resolutionNote,
      mr.created_at as createdAt,
      mr.updated_at as updatedAt,
      COALESCE(u.full_name, u.name) as tenantName,
      u.phone_number as tenantPhone,
      r.id as roomID,
      r.name as roomName
    FROM maintenance_requests mr
    JOIN users u ON mr.tenant_id = u.id
    JOIN rooms r ON mr.room_id = r.id
    WHERE r.landlord_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ` AND mr.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY
    CASE mr.priority WHEN 'high' THEN 0 ELSE 1 END,
    mr.created_at DESC`;

  try {
    const requests = await db.allAsync(query, params);
    return res.json({
      status: 'success',
      data: requests,
    });
  } catch (err) {
    console.error('Get maintenance requests error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch maintenance requests.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// PUT /api/landlord/maintenance/:id — Cập nhật trạng thái yêu cầu bảo trì
router.put('/maintenance/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const requestId = Number(req.params.id);
  const { status, resolutionNote } = req.body;

  const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request ID.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      errorCode: 'INVALID_STATUS',
    });
  }

  try {
    // Đảm bảo yêu cầu này thuộc về phòng của landlord
    const request = await db.getAsync(
      `SELECT mr.id FROM maintenance_requests mr
       JOIN rooms r ON mr.room_id = r.id
       WHERE mr.id = ? AND r.landlord_id = ?`,
      [requestId, req.user.id]
    );

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Maintenance request not found.',
        errorCode: 'REQUEST_NOT_FOUND',
      });
    }

    await db.runAsync(
      `UPDATE maintenance_requests
       SET status = ?, resolution_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, resolutionNote || null, requestId]
    );

    return res.json({
      status: 'success',
      message: 'Maintenance request updated successfully.',
    });
  } catch (err) {
    console.error('Update maintenance error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update maintenance request.',
      errorCode: 'UPDATE_FAILED',
    });
  }
});

module.exports = router;