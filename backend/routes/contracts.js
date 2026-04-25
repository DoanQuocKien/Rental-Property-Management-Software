const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function isValidDate(value) {
  if (typeof value !== 'string' && !(value instanceof Date)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function toIsoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// POST /api/contracts — Tạo hợp đồng mới (landlord)
// ─────────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { roomID, tenantID, startDate, endDate, deposit, rentalPrice } = req.body;

  const parsedRoomID     = Number(roomID);
  const parsedTenantID   = Number(tenantID);
  const parsedDeposit    = Number(deposit);
  const parsedRentalPrice = Number(rentalPrice);

  if (!Number.isInteger(parsedRoomID) || !Number.isInteger(parsedTenantID)) {
    return res.status(400).json({ status: 'error', message: 'Mã phòng và Mã người thuê là những trường bắt buộc.', errorCode: 'INVALID_PAYLOAD' });
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({ status: 'error', message: 'Ngày bắt đầu và Ngày kết thúc không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  const normalizedStartDate = toIsoDate(startDate);
  const normalizedEndDate   = toIsoDate(endDate);

  if (new Date(normalizedEndDate) <= new Date(normalizedStartDate)) {
    return res.status(400).json({ status: 'error', message: 'Ngày kết thúc phải sau ngày bắt đầu.', errorCode: 'INVALID_PAYLOAD' });
  }

  if (!Number.isFinite(parsedDeposit) || parsedDeposit < 0 || !Number.isFinite(parsedRentalPrice) || parsedRentalPrice <= 0) {
    return res.status(400).json({ status: 'error', message: 'Tiền cọc và giá thuê phải là các số dương.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const tenant = await db.getAsync(
      `SELECT id, name, full_name, citizen_id, role FROM users WHERE id = ?`,
      [parsedTenantID]
    );
    if (!tenant || !['tenant', 'Tenant'].includes(tenant.role)) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người thuê hoặc tài khoản người thuê chưa được kích hoạt.', errorCode: 'TENANT_INVALID' });
    }

    const room = await db.getAsync(
      `SELECT id, status, landlord_id FROM rooms WHERE id = ?`,
      [parsedRoomID]
    );
    if (!room || room.landlord_id !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng.', errorCode: 'ROOM_NOT_FOUND' });
    }
    if (String(room.status || '').toLowerCase() !== 'available') {
      return res.status(400).json({ status: 'error', message: 'Phòng không khả dụng để cho thuê.', errorCode: 'ROOM_UNAVAILABLE' });
    }

    const existingContract = await db.getAsync(
      `SELECT id FROM lease_contracts WHERE tenant_id = ? AND status = 'active'`,
      [parsedTenantID]
    );
    if (existingContract) {
      return res.status(400).json({ status: 'error', message: 'Người thuê đã có hợp đồng hoạt động.', errorCode: 'TENANT_HAS_ACTIVE_CONTRACT' });
    }

    await db.runAsync('BEGIN TRANSACTION');

    const insertResult = await db.runAsync(
      `INSERT INTO lease_contracts (tenant_id, room_id, start_date, end_date, deposit, rental_price, status, is_expired)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 0)`,
      [parsedTenantID, parsedRoomID, normalizedStartDate, normalizedEndDate, parsedDeposit, parsedRentalPrice]
    );

    await db.runAsync(
      `UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [parsedRoomID]
    );

    await db.runAsync('COMMIT');

    return res.status(201).json({
      status: 'success',
      message: 'Hợp đồng được tạo thành công. Trạng thái phòng đã được cập nhật thành Đã thuê.',
      data: {
        contractID:  insertResult.lastID,
        roomID:      parsedRoomID,
        tenantID:    parsedTenantID,
        startDate:   normalizedStartDate,
        endDate:     normalizedEndDate,
        deposit:     parsedDeposit,
        rentalPrice: parsedRentalPrice,
        isExpired:   false,
      },
    });
  } catch (error) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Contract creation error:', error);
    return res.status(500).json({ status: 'error', message: 'Tạo hợp đồng thất bại.', errorCode: 'CONTRACT_CREATE_FAILED' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/contracts — Danh sách hợp đồng (landlord)
// ─────────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT
      lc.id             AS contractID,
      lc.tenant_id      AS tenantID,
      lc.room_id        AS roomID,
      lc.start_date     AS startDate,
      lc.end_date       AS endDate,
      lc.deposit,
      lc.rental_price   AS rentalPrice,
      lc.status,
      lc.is_expired     AS isExpired,
      lc.created_at     AS createdAt,
      r.name            AS roomName,
      r.price           AS roomPrice,
      COALESCE(u.full_name, u.name) AS tenantName,
      u.email           AS tenantEmail,
      u.phone_number    AS tenantPhone,
      u.citizen_id      AS tenantCitizenID
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
    return res.json({ status: 'success', data: contracts });
  } catch (err) {
    console.error('Get contracts error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải danh sách hợp đồng.', errorCode: 'FETCH_FAILED' });
  }
});

// ─────────────────────────────────────────────────────────────
// ★ GET /api/contracts/my-contract — Hợp đồng của tenant (PHẢI TRƯỚC /:id)
// ─────────────────────────────────────────────────────────────
router.get('/my-contract', authenticateToken, async (req, res) => {
  // Cho phép cả tenant lẫn landlord gọi; tenant chỉ thấy hợp đồng của mình
  try {
    const contract = await db.getAsync(
      `SELECT
        lc.id,
        lc.tenant_id,
        lc.room_id,
        lc.start_date,
        lc.end_date,
        lc.deposit,
        lc.rental_price,
        lc.status,
        lc.is_expired,
        lc.created_at,
        r.name                        AS room_name,
        r.price                       AS room_price,
        r.area                        AS room_area,
        COALESCE(l.full_name, l.name) AS landlord_name,
        l.phone_number                AS landlord_phone,
        l.email                       AS landlord_email,
        l.citizen_id                  AS landlord_id_card
       FROM lease_contracts lc
       JOIN rooms   r ON lc.room_id     = r.id
       JOIN users   l ON r.landlord_id  = l.id
       WHERE lc.tenant_id = ?
         AND lc.status    = 'active'
       ORDER BY lc.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    return res.json({ status: 'success', data: contract || null });
  } catch (err) {
    console.error('Get my-contract error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải hợp đồng.', errorCode: 'FETCH_FAILED' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/contracts/:id — Chi tiết hợp đồng (landlord + tenant)
// ─────────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  const contractId = Number(req.params.id);

  if (!Number.isInteger(contractId) || contractId <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hợp đồng không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const contract = await db.getAsync(
      `SELECT
        lc.id             AS contractID,
        lc.tenant_id      AS tenantID,
        lc.room_id        AS roomID,
        lc.start_date     AS startDate,
        lc.end_date       AS endDate,
        lc.deposit,
        lc.rental_price   AS rentalPrice,
        lc.status,
        lc.is_expired     AS isExpired,
        lc.created_at     AS createdAt,
        r.name            AS roomName,
        r.price           AS roomPrice,
        r.area            AS roomArea,
        COALESCE(u.full_name, u.name) AS tenantName,
        u.email           AS tenantEmail,
        u.phone_number    AS tenantPhone,
        u.citizen_id      AS tenantCitizenID,
        u.permanent_address           AS tenantAddress,
        COALESCE(l.full_name, l.name) AS landlordName,
        l.email           AS landlordEmail,
        l.phone_number    AS landlordPhone
       FROM lease_contracts lc
       JOIN rooms r ON lc.room_id     = r.id
       JOIN users u ON lc.tenant_id   = u.id
       JOIN users l ON r.landlord_id  = l.id
       WHERE lc.id = ? AND (r.landlord_id = ? OR lc.tenant_id = ?)`,
      [contractId, req.user.id, req.user.id]
    );

    if (!contract) {
      return res.status(404).json({ status: 'error', message: 'Hợp đồng không tìm thấy hoặc truy cập bị từ chối.', errorCode: 'CONTRACT_NOT_FOUND' });
    }

    return res.json({ status: 'success', data: contract });
  } catch (err) {
    console.error('Get contract detail error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải hợp đồng.', errorCode: 'FETCH_FAILED' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/contracts/:id/terminate — Chấm dứt hợp đồng (landlord)
// ─────────────────────────────────────────────────────────────
router.put('/:id/terminate', authenticateToken, requireRole('landlord'), async (req, res) => {
  const contractId = Number(req.params.id);

  if (!Number.isInteger(contractId) || contractId <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hợp đồng không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
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
      return res.status(404).json({ status: 'error', message: 'Hợp đồng không tìm thấy hoặc truy cập bị từ chối.', errorCode: 'CONTRACT_NOT_FOUND' });
    }
    if (contract.status !== 'active') {
      return res.status(400).json({ status: 'error', message: 'Chỉ có thể chấm dứt các hợp đồng đang hoạt động.', errorCode: 'CONTRACT_NOT_ACTIVE' });
    }

    await db.runAsync('BEGIN TRANSACTION');
    await db.runAsync(
      `UPDATE lease_contracts SET status = 'terminated', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [contractId]
    );
    await db.runAsync(
      `UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [contract.room_id]
    );
    await db.runAsync('COMMIT');

    return res.json({ status: 'success', message: 'Hợp đồng đã được chấm dứt thành công. Trạng thái phòng đã được cập nhật thành Available.' });
  } catch (err) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Lỗi khi chấm dứt hợp đồng:', err);
    return res.status(500).json({ status: 'error', message: 'Không thể chấm dứt hợp đồng.', errorCode: 'TERMINATE_FAILED' });
  }
});

module.exports = router;