const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function isValidDate(value) {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return false;
  }

  const parsedDate = new Date(value);
  return !Number.isNaN(parsedDate.getTime());
}

function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { roomID, tenantID, startDate, endDate, deposit, rentalPrice } = req.body;

  const parsedRoomID = Number(roomID);
  const parsedTenantID = Number(tenantID);
  const parsedDeposit = Number(deposit);
  const parsedRentalPrice = Number(rentalPrice);

  if (!Number.isInteger(parsedRoomID) || !Number.isInteger(parsedTenantID)) {
    return res.status(400).json({
      status: 'error',
      message: 'roomID and tenantID are required.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({
      status: 'error',
      message: 'startDate and endDate must be valid dates.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  const normalizedStartDate = toIsoDate(startDate);
  const normalizedEndDate = toIsoDate(endDate);

  if (new Date(normalizedEndDate) <= new Date(normalizedStartDate)) {
    return res.status(400).json({
      status: 'error',
      message: 'endDate must be after startDate.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  if (!Number.isFinite(parsedDeposit) || parsedDeposit < 0 || !Number.isFinite(parsedRentalPrice) || parsedRentalPrice < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'deposit and rentalPrice must be positive numbers.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  try {
    const tenant = await db.getAsync(
      `SELECT id, name, full_name, citizen_id, role
       FROM users
       WHERE id = ?`,
      [parsedTenantID]
    );

    if (!tenant || tenant.role !== 'tenant') {
      return res.status(404).json({
        status: 'error',
        message: 'Tenant not found or account not activated.',
        errorCode: 'TENANT_INVALID',
      });
    }

    const room = await db.getAsync(
      `SELECT id, status, landlord_id
       FROM rooms
       WHERE id = ?`,
      [parsedRoomID]
    );

    if (!room || room.landlord_id !== req.user.id) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found.',
        errorCode: 'ROOM_NOT_FOUND',
      });
    }

    if (String(room.status || '').toLowerCase() !== 'available') {
      return res.status(400).json({
        status: 'error',
        message: 'Room is not available for rent.',
        errorCode: 'ROOM_UNAVAILABLE',
      });
    }

    await db.runAsync('BEGIN TRANSACTION');

    const insertResult = await db.runAsync(
      `INSERT INTO lease_contracts
       (tenant_id, room_id, start_date, end_date, deposit, rental_price, status, is_expired)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 0)`,
      [parsedTenantID, parsedRoomID, normalizedStartDate, normalizedEndDate, parsedDeposit, parsedRentalPrice]
    );

    await db.runAsync(
      `UPDATE rooms
       SET status = 'occupied', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [parsedRoomID]
    );

    await db.runAsync('COMMIT');

    return res.status(201).json({
      status: 'success',
      message: 'Contract created successfully. Room status updated to Occupied.',
      data: {
        contractID: insertResult.lastID,
        roomID: parsedRoomID,
        tenantID: parsedTenantID,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        deposit: parsedDeposit,
        rentalPrice: parsedRentalPrice,
        isExpired: false,
      },
    });
  } catch (error) {
    await db.runAsync('ROLLBACK').catch(() => {});
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create contract.',
      errorCode: 'CONTRACT_CREATE_FAILED',
    });
  }
});

// 1. API lấy hợp đồng hiện tại của chính người thuê (Dành cho Tenant)
router.get('/my-contract', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const contract = await db.getAsync(
      `SELECT c.*, r.name as room_name, r.area, r.description as room_desc
       FROM lease_contracts c
       JOIN rooms r ON c.room_id = r.id
       WHERE c.tenant_id = ? AND c.status = 'active' AND c.is_expired = 0
       ORDER BY c.id DESC LIMIT 1`,
      [req.user.id] // Lấy ID từ token đã đăng nhập
    );

    if (!contract) {
      return res.status(404).json({ status: 'error', message: 'Bạn hiện chưa có hợp đồng nào.' });
    }

    res.json({ status: 'success', data: contract });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Lỗi server: ' + error.message });
  }
});

// 2. API lấy chi tiết hợp đồng theo ID (Dành cho Chủ trọ quản lý)
router.get('/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const contract = await db.getAsync(
      `SELECT c.*, r.name as room_name, u.name as tenant_name, u.phone as tenant_phone
       FROM lease_contracts c
       JOIN rooms r ON c.room_id = r.id
       JOIN users u ON c.tenant_id = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!contract) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hợp đồng.' });
    }

    res.json({ status: 'success', data: contract });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Lỗi server: ' + error.message });
  }
});

module.exports = router;