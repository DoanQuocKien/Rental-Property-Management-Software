const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────────────
// GET /api/invoices  — Danh sách hóa đơn của landlord
// Query: ?roomID=&month=&year=&status=
// ──────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { roomID, month, year, status, contractID } = req.query;

  let query = `
    SELECT
      i.*,
      r.name  AS room_name,
      r.price AS room_price_list
    FROM invoices i
    JOIN rooms r ON i.room_id = r.id
    WHERE r.landlord_id = ?
  `;
  const params = [req.user.id];

  if (roomID) { query += ' AND i.room_id = ?';    params.push(Number(roomID)); }
  if (month)  { query += ' AND i.month = ?';       params.push(Number(month)); }
  if (year)   { query += ' AND i.year = ?';        params.push(Number(year)); }
  if (status) { query += ' AND i.status = ?';      params.push(status); }
  if (contractID) { query += ' AND i.contract_id = ?'; params.push(Number(contractID)); }

  query += ' ORDER BY i.created_at DESC';

  try {
    const invoices = await db.allAsync(query, params);
    return res.json({ status: 'success', data: invoices });
  } catch (err) {
    console.error('Get invoices error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch invoices.', errorCode: 'FETCH_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/invoices  — Tạo hóa đơn mới (landlord)
// ──────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const {
    roomID, contractID, readingID, month, year,
    rentAmount, electricityAmount, waterAmount, serviceAmount, totalAmount, dueDate
  } = req.body;

  const parsedRoomID = Number(roomID);
  const parsedTotal  = Number(totalAmount);

  if (!Number.isInteger(parsedRoomID)) {
    return res.status(400).json({ status: 'error', message: 'roomID is required and must be an integer.', errorCode: 'INVALID_PAYLOAD' });
  }
  if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
    return res.status(400).json({ status: 'error', message: 'totalAmount is required and must be a positive number.', errorCode: 'INVALID_PAYLOAD' });
  }

  const invoiceMonth = Number.isInteger(Number(month)) ? Number(month) : new Date().getMonth() + 1;
  const invoiceYear  = Number.isInteger(Number(year))  ? Number(year)  : new Date().getFullYear();
  const dDate = dueDate ? new Date(dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  try {
    const room = await db.getAsync('SELECT id FROM rooms WHERE id = ? AND landlord_id = ?', [parsedRoomID, req.user.id]);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Room not found or you do not have permission.', errorCode: 'ROOM_NOT_FOUND' });
    }

    await db.runAsync('BEGIN TRANSACTION');

    const result = await db.runAsync(
      `INSERT INTO invoices
       (room_id, contract_id, reading_id, month, year, rent_amount, electricity_amount, water_amount, service_amount, total_amount, due_date, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'Unpaid')`,
      [
        parsedRoomID,
        contractID ? Number(contractID) : null,
        readingID  ? Number(readingID)  : null,
        invoiceMonth, invoiceYear,
        Number(rentAmount)        || 0,
        Number(electricityAmount) || 0,
        Number(waterAmount)       || 0,
        Number(serviceAmount)     || 0,
        parsedTotal,
        dDate
      ]
    );

    if (readingID) {
      await db.runAsync('UPDATE meter_readings SET invoice_id = ? WHERE id = ?', [result.lastID, Number(readingID)]);
    }

    await db.runAsync('COMMIT');

    return res.status(201).json({
      status: 'success',
      message: 'Invoice created successfully.',
      data: {
        id: result.lastID, roomID: parsedRoomID,
        contractID: contractID ? Number(contractID) : null,
        month: invoiceMonth, year: invoiceYear,
        totalAmount: parsedTotal, dueDate: dDate, status: 'unpaid'
      }
    });
  } catch (error) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Invoice creation error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to create invoice.', errorCode: 'INVOICE_CREATE_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/invoices/:id  — Chi tiết hóa đơn
// ──────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Invalid invoice ID.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const inv = await db.getAsync(
      `SELECT i.*, r.name AS room_name, r.landlord_id
       FROM invoices i JOIN rooms r ON i.room_id = r.id
       WHERE i.id = ?`,
      [id]
    );
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice not found.', errorCode: 'NOT_FOUND' });

    // Landlord sees own rooms; tenant sees via contract
    const isLandlord = req.user.role === 'landlord' && inv.landlord_id === req.user.id;
    const isTenant   = req.user.role === 'tenant'; // further check can be done

    if (!isLandlord && !isTenant) {
      return res.status(403).json({ status: 'error', message: 'Access denied.', errorCode: 'FORBIDDEN' });
    }

    return res.json({ status: 'success', data: inv });
  } catch (err) {
    console.error('Get invoice detail error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch invoice.', errorCode: 'FETCH_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/invoices/:id/pay  — Ghi nhận thanh toán (landlord)
// ──────────────────────────────────────────────────────────
router.put('/:id/pay', authenticateToken, requireRole('landlord'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Invalid invoice ID.', errorCode: 'INVALID_PAYLOAD' });
  }

  const { payment_method } = req.body;
  if (!payment_method) {
    return res.status(400).json({ status: 'error', message: 'payment_method is required.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    // Verify this invoice belongs to landlord's room
    const inv = await db.getAsync(
      `SELECT i.id, i.status, r.landlord_id
       FROM invoices i JOIN rooms r ON i.room_id = r.id
       WHERE i.id = ?`,
      [id]
    );

    if (!inv || inv.landlord_id !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Invoice not found.', errorCode: 'NOT_FOUND' });
    }
    if (inv.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'Invoice is already paid.', errorCode: 'ALREADY_PAID' });
    }

    await db.runAsync(
      `UPDATE invoices
       SET status = 'paid', payment_status = 'Paid',
           payment_method = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payment_method, id]
    );

    return res.json({ status: 'success', message: 'Invoice marked as paid successfully.' });
  } catch (err) {
    console.error('Pay invoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update invoice.', errorCode: 'UPDATE_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/invoices/:id  — Cập nhật hóa đơn chung
// ──────────────────────────────────────────────────────────
router.patch('/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Invalid invoice ID.' });
  }

  const { status, payment_status, payment_method, paid_at } = req.body;

  try {
    const inv = await db.getAsync(
      `SELECT i.id FROM invoices i JOIN rooms r ON i.room_id = r.id WHERE i.id = ? AND r.landlord_id = ?`,
      [id, req.user.id]
    );
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice not found.' });

    await db.runAsync(
      `UPDATE invoices
       SET status = COALESCE(?, status),
           payment_status = COALESCE(?, payment_status),
           payment_method = COALESCE(?, payment_method),
           paid_at = COALESCE(?, paid_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, payment_status, payment_method, paid_at || null, id]
    );

    return res.json({ status: 'success', message: 'Invoice updated.' });
  } catch (err) {
    console.error('Patch invoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to update invoice.' });
  }
});

module.exports = router;