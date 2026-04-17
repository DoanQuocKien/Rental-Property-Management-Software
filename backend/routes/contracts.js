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

  if (!Number.isFinite(parsedRentalPrice) || parsedRentalPrice <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'rentalPrice must be a positive number.',
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

    if (!tenant || !['tenant', 'Tenant'].includes(tenant.role)) {
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

    // Kiểm tra tenant chưa có hợp đồng active với phòng này
    const existingContract = await db.getAsync(
      `SELECT id FROM lease_contracts
       WHERE tenant_id = ? AND status = 'active'`,
      [parsedTenantID]
    );
 
    if (existingContract) {
      return res.status(400).json({
        status: 'error',
        message: 'Tenant already has an active contract.',
        errorCode: 'TENANT_HAS_ACTIVE_CONTRACT',
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
    console.error('Contract creation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create contract.',
      errorCode: 'CONTRACT_CREATE_FAILED',
    });
  }
});

// GET /api/contracts — Danh sách hợp đồng của landlord
router.get('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { status } = req.query;
 
  let query = `
    SELECT
      lc.id as contractID,
      lc.tenant_id as tenantID,
      lc.room_id as roomID,
      lc.start_date as startDate,
      lc.end_date as endDate,
      lc.deposit,
      lc.rental_price as rentalPrice,
      lc.status,
      lc.is_expired as isExpired,
      lc.created_at as createdAt,
      r.name as roomName,
      r.price as roomPrice,
      COALESCE(u.full_name, u.name) as tenantName,
      u.email as tenantEmail,
      u.phone_number as tenantPhone,
      u.citizen_id as tenantCitizenID
    FROM lease_contracts lc
    JOIN rooms r ON lc.room_id = r.id
    JOIN users u ON lc.tenant_id = u.id
    WHERE r.landlord_id = ?
  `;
  const params = [req.user.id];
 
  if (status) {
    query += ` AND lc.status = ?`;
    params.push(status);
  }
 
  query += ` ORDER BY lc.created_at DESC`;
 
  try {
    const contracts = await db.allAsync(query, params);
    return res.json({
      status: 'success',
      data: contracts,
    });
  } catch (err) {
    console.error('Get contracts error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch contracts.',
      errorCode: 'FETCH_FAILED',
    });
  }
});
 
// GET /api/contracts/:id — Chi tiết hợp đồng (cho cả Chủ trọ và Khách thuê)
router.get('/:id', authenticateToken, async (req, res) => {
  const contractId = Number(req.params.id);
 
  if (!Number.isInteger(contractId) || contractId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid contract ID.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }
 
  try {
    const contract = await db.getAsync(
      `SELECT
        lc.id as contractID,
        lc.tenant_id as tenantID,
        lc.room_id as roomID,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.deposit,
        lc.rental_price as rentalPrice,
        lc.status,
        lc.is_expired as isExpired,
        lc.created_at as createdAt,
        r.name as roomName,
        r.price as roomPrice,
        r.area as roomArea,
        COALESCE(u.full_name, u.name) as tenantName,
        u.email as tenantEmail,
        u.phone_number as tenantPhone,
        u.citizen_id as tenantCitizenID,
        u.permanent_address as tenantAddress,
        COALESCE(l.full_name, l.name) as landlordName,
        l.email as landlordEmail,
        l.phone_number as landlordPhone
       FROM lease_contracts lc
       JOIN rooms r ON lc.room_id = r.id
       JOIN users u ON lc.tenant_id = u.id
       JOIN users l ON r.landlord_id = l.id
       WHERE lc.id = ? AND (r.landlord_id = ? OR lc.tenant_id = ?)`,
      [contractId, req.user.id, req.user.id]
    );
 
    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found or access denied.',
        errorCode: 'CONTRACT_NOT_FOUND',
      });
    }
 
    return res.json({
      status: 'success',
      data: contract,
    });
  } catch (err) {
    console.error('Get contract detail error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch contract.',
      errorCode: 'FETCH_FAILED',
    });
  }
});
 
// PUT /api/contracts/:id/terminate — Chấm dứt hợp đồng
router.put('/:id/terminate', authenticateToken, requireRole('landlord'), async (req, res) => {
  const contractId = Number(req.params.id);
 
  if (!Number.isInteger(contractId) || contractId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid contract ID.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }
 
  try {
    const contract = await db.getAsync(
      `SELECT lc.id, lc.room_id, lc.status, r.landlord_id
       FROM lease_contracts lc
       JOIN rooms r ON lc.room_id = r.id
       WHERE lc.id = ? AND r.landlord_id = ?`,
      [contractId, req.user.id]
    );
 
    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Contract not found.',
        errorCode: 'CONTRACT_NOT_FOUND',
      });
    }
 
    if (contract.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Only active contracts can be terminated.',
        errorCode: 'CONTRACT_NOT_ACTIVE',
      });
    }
 
    await db.runAsync('BEGIN TRANSACTION');
 
    await db.runAsync(
      `UPDATE lease_contracts
       SET status = 'terminated', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [contractId]
    );
 
    await db.runAsync(
      `UPDATE rooms
       SET status = 'available', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [contract.room_id]
    );
 
    await db.runAsync('COMMIT');
 
    return res.json({
      status: 'success',
      message: 'Contract terminated successfully. Room status updated to Available.',
    });
  } catch (err) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Terminate contract error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to terminate contract.',
      errorCode: 'TERMINATE_FAILED',
    });
  }
});
 
module.exports = router;