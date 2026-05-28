const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

function toMoneyNumber(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

// Check if an invoice is a utility bill (contains electricity or water charges)
function isUtilityBill(electricityAmount, waterAmount) {
  const elec = toMoneyNumber(electricityAmount) || 0;
  const water = toMoneyNumber(waterAmount) || 0;
  return elec > 0 || water > 0;
}

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

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
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải danh sách hóa đơn.', errorCode: 'FETCH_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/invoices  — Tạo hóa đơn mới (landlord)
// Automatically syncs electricity/water unit prices from active contract
// ──────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const {
    roomID, contractID, readingID, month, year,
    rentAmount, electricityAmount, waterAmount, serviceAmount, totalAmount, dueDate
  } = req.body;

  const parsedRoomID = Number(roomID);
  const parsedTotal  = Number(totalAmount);

  if (!Number.isInteger(parsedRoomID)) {
    return res.status(400).json({ status: 'error', message: 'Mã phòng là bắt buộc và phải là số nguyên.', errorCode: 'INVALID_PAYLOAD' });
  }
  if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
    return res.status(400).json({ status: 'error', message: 'Tổng tiền là bắt buộc và phải là số dương.', errorCode: 'INVALID_PAYLOAD' });
  }

  const invoiceMonth = Number.isInteger(Number(month)) ? Number(month) : new Date().getMonth() + 1;
  const invoiceYear  = Number.isInteger(Number(year))  ? Number(year)  : new Date().getFullYear();
  const dDate = dueDate ? new Date(dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  try {
    const room = await db.getAsync('SELECT id FROM rooms WHERE id = ? AND landlord_id = ?', [parsedRoomID, req.user.id]);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy phòng hoặc bạn không có quyền.', errorCode: 'ROOM_NOT_FOUND' });
    }

    // Fetch contract pricing if contractID is provided
    let syncedElectricityAmount = Number(electricityAmount) || 0;
    let syncedWaterAmount = Number(waterAmount) || 0;
    let pricingSyncMessage = '';

    if (contractID) {
      const contract = await db.getAsync(
        `SELECT lc.id, lc.electricity_price, lc.water_price, lc.start_date
         FROM lease_contracts lc
         JOIN rooms r ON lc.room_id = r.id
         WHERE lc.id = ? AND r.landlord_id = ? AND lc.status = 'active'`,
        [Number(contractID), req.user.id]
      );

      if (contract) {
        // ──────────────────────────────────────────────────────
        // Invoice Period Validation: Check if billing period >= contract start date
        // ──────────────────────────────────────────────────────
        const contractStartDate = new Date(contract.start_date);
        const contractStartYear = contractStartDate.getFullYear();
        const contractStartMonth = contractStartDate.getMonth() + 1;
        
        // Create a date from invoice year/month (first day of billing period)
        const invoiceDate = new Date(invoiceYear, invoiceMonth - 1, 1);
        
        // If invoice period is before contract start, reject it
        if (invoiceDate < new Date(contractStartYear, contractStartMonth - 1, 1)) {
          return res.status(400).json({
            status: 'error',
            message: `Kỳ hóa đơn (Tháng ${invoiceMonth}/${invoiceYear}) không thể trước ngày khởi tạo hợp đồng (${contractStartDate.toLocaleDateString('vi-VN')}).`,
            errorCode: 'BILLING_PERIOD_INVALID',
            details: {
              billingPeriod: `${invoiceMonth}/${invoiceYear}`,
              contractStartDate: contract.start_date,
              message: 'Vui lòng chọn kỳ hóa đơn bằng hoặc sau ngày khởi tạo hợp đồng.'
            }
          });
        }

        // If electricity/water amounts not provided, they will be calculated based on readings
        // If provided, we sync the rates but amounts depend on actual consumption
        if (contract.electricity_price > 0) {
          pricingSyncMessage = '✅ Giá điện được cập nhật từ hợp đồng. ';
        }
        if (contract.water_price > 0) {
          pricingSyncMessage += '✅ Giá nước được cập nhật từ hợp đồng.';
        }
      }
    }

    // Check if this is a utility bill and validate uniqueness constraint
    if (isUtilityBill(syncedElectricityAmount || electricityAmount, syncedWaterAmount || waterAmount)) {
      const existingUtilityBill = await db.getAsync(
        `SELECT id FROM invoices 
         WHERE room_id = ? AND month = ? AND year = ? 
         AND (electricity_amount > 0 OR water_amount > 0)`,
        [parsedRoomID, invoiceMonth, invoiceYear]
      );
      
      if (existingUtilityBill) {
        return res.status(400).json({
          status: 'error',
          message: `Hóa đơn tiện ích (điện/nước) đã tồn tại cho phòng ${parsedRoomID} trong tháng ${invoiceMonth}/${invoiceYear}.`,
          errorCode: 'DUPLICATE_UTILITY_BILL'
        });
      }
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
        syncedElectricityAmount || Number(electricityAmount) || 0,
        syncedWaterAmount || Number(waterAmount) || 0,
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
      message: pricingSyncMessage ? `Tạo hóa đơn thành công. ${pricingSyncMessage}` : 'Tạo hóa đơn thành công.',
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
    return res.status(500).json({ status: 'error', message: 'Không thể tạo hóa đơn.', errorCode: 'INVOICE_CREATE_FAILED' });
  }
});

// GET /api/invoices/:id/pdf  — Download invoice PDF
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const inv = await db.getAsync(
      `SELECT i.*, r.name AS room_name, r.landlord_id
       FROM invoices i JOIN rooms r ON i.room_id = r.id
       WHERE i.id = ?`,
      [id]
    );

    if (!inv) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.', errorCode: 'NOT_FOUND' });
    }

    const isLandlord = req.user.role === 'landlord' && inv.landlord_id === req.user.id;
    const isTenant = req.user.role === 'tenant';

    if (!isLandlord && !isTenant) {
      return res.status(403).json({ status: 'error', message: 'Truy cập bị từ chối.', errorCode: 'FORBIDDEN' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=HoaDon_${inv.id}_Thang${inv.month}_${inv.year}.pdf`);

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text('Rental Property Management', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(16).text(`Invoice #${inv.id}`, { align: 'center' });
    doc.moveDown(1.2);

    const rows = [
      ['Billing period', `Month ${inv.month}/${inv.year}`],
      ['Room', inv.room_name || `Room ${inv.room_id}`],
      ['Rent amount', formatVnd(inv.rent_amount)],
      ['Electricity amount', formatVnd(inv.electricity_amount)],
      ['Water amount', formatVnd(inv.water_amount)],
      ['Service amount', formatVnd(inv.service_amount)],
      ['Due date', inv.due_date || '-'],
      ['Payment status', inv.payment_status || inv.status || '-'],
      ['Payment method', inv.payment_method || '-'],
      ['Paid at', inv.paid_at || '-'],
    ];

    rows.forEach(([label, value]) => {
      doc.fontSize(11).fillColor('#555').text(label, { continued: true, width: 180 });
      doc.fillColor('#111').text(String(value));
      doc.moveDown(0.35);
    });

    doc.moveDown(0.6);
    doc.fontSize(14).fillColor('#111').text(`Total: ${formatVnd(inv.total_amount)}`, { align: 'right' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text('Generated by Rental Property Management Software', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Download invoice PDF error:', err);
    return res.status(500).json({ status: 'error', message: 'Không thể tạo PDF hóa đơn.', errorCode: 'PDF_CREATE_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/invoices/:id  — Chi tiết hóa đơn
// ──────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const inv = await db.getAsync(
      `SELECT i.*, r.name AS room_name, r.landlord_id
       FROM invoices i JOIN rooms r ON i.room_id = r.id
       WHERE i.id = ?`,
      [id]
    );
    if (!inv) return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.', errorCode: 'NOT_FOUND' });

    // Landlord sees own rooms; tenant sees via contract
    const isLandlord = req.user.role === 'landlord' && inv.landlord_id === req.user.id;
    const isTenant   = req.user.role === 'tenant'; // further check can be done

    if (!isLandlord && !isTenant) {
      return res.status(403).json({ status: 'error', message: 'Truy cập bị từ chối.', errorCode: 'FORBIDDEN' });
    }

    return res.json({ status: 'success', data: inv });
  } catch (err) {
    console.error('Get invoice detail error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải hóa đơn.', errorCode: 'FETCH_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/invoices/:id/pay  — Ghi nhận thanh toán (landlord)
// ──────────────────────────────────────────────────────────
router.put('/:id/pay', authenticateToken, requireRole('landlord'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  const { payment_method } = req.body;
  if (!payment_method) {
    return res.status(400).json({ status: 'error', message: 'Phương thức thanh toán là trường bắt buộc.', errorCode: 'INVALID_PAYLOAD' });
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
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.', errorCode: 'NOT_FOUND' });
    }
    if (inv.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'Hóa đơn này đã thanh toán.', errorCode: 'ALREADY_PAID' });
    }

    await db.runAsync(
      `UPDATE invoices
       SET status = 'paid', payment_status = 'Paid',
           payment_method = ?, paid_amount = total_amount,
           paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payment_method, id]
    );

    return res.json({ status: 'success', message: 'Hóa đơn đã được đánh dấu là thanh toán.' });
  } catch (err) {
    console.error('Pay invoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Không thể cập nhật hóa đơn', errorCode: 'UPDATE_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/invoices/mock-payment/:id  — Public invoice data for mock payment page
// ──────────────────────────────────────────────────────────
router.get('/mock-payment/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const invoice = await db.getAsync(
      `SELECT id, month, year, total_amount, paid_amount, status, payment_status
       FROM invoices
       WHERE id = ?`,
      [id]
    );

    if (!invoice) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.', errorCode: 'NOT_FOUND' });
    }

    const totalAmount = toMoneyNumber(invoice.total_amount);
    const paidAmount = toMoneyNumber(invoice.paid_amount || 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    return res.json({
      status: 'success',
      data: {
        ...invoice,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
      },
    });
  } catch (err) {
    console.error('Get mock payment invoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải hóa đơn.', errorCode: 'FETCH_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/invoices/mock-payment/confirm  — Public mock payment webhook-like endpoint
// Body: { invoiceId, amount }
// ──────────────────────────────────────────────────────────
router.post('/mock-payment/confirm', async (req, res) => {
  const invoiceId = Number(req.body?.invoiceId);
  const amount = toMoneyNumber(req.body?.amount);

  if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn phải là số nguyên dương.', errorCode: 'INVALID_PAYLOAD' });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ status: 'error', message: 'Số tiền phải là số dương.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    const invoice = await db.getAsync(
      `SELECT id, total_amount, paid_amount, status
       FROM invoices
       WHERE id = ?`,
      [invoiceId]
    );

    if (!invoice) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.', errorCode: 'NOT_FOUND' });
    }

    const totalAmount = toMoneyNumber(invoice.total_amount);
    const currentPaidAmount = toMoneyNumber(invoice.paid_amount || 0);

    if (invoice.status === 'paid' || currentPaidAmount >= totalAmount) {
      return res.status(400).json({ status: 'error', message: 'Hóa đơn đã được thanh toán.', errorCode: 'ALREADY_PAID' });
    }

    const newPaidAmount = currentPaidAmount + amount;
    const isPaidInFull = newPaidAmount >= totalAmount;
    const nextStatus = isPaidInFull ? 'paid' : 'partial';
    const nextPaymentStatus = isPaidInFull ? 'Paid' : 'Partial';

    await db.runAsync(
      `UPDATE invoices
       SET status = ?,
           payment_status = ?,
           payment_method = 'Mock QR Transfer',
           paid_amount = ?,
           paid_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE paid_at END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, nextPaymentStatus, newPaidAmount, isPaidInFull ? 1 : 0, invoiceId]
    );

    return res.json({
      status: 'success',
      message: isPaidInFull ? 'Hóa đơn đã được thanh toán.' : 'Ghi nhận thanh toán một phần thành công.',
      data: {
        invoiceId,
        paidAmount: newPaidAmount,
        remainingAmount: Math.max(0, totalAmount - newPaidAmount),
        invoiceStatus: nextStatus,
      },
    });
  } catch (err) {
    console.error('Mock payment confirm error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xử lý thanh toán giả lập.', errorCode: 'UPDATE_FAILED' });
  }
});

// ──────────────────────────────────────────────────────────
// PATCH /api/invoices/:id  — Cập nhật hóa đơn chung
// ──────────────────────────────────────────────────────────
router.patch('/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ.' });
  }

  const { status, payment_status, payment_method, paid_at } = req.body;

  try {
    const inv = await db.getAsync(
      `SELECT i.id FROM invoices i JOIN rooms r ON i.room_id = r.id WHERE i.id = ? AND r.landlord_id = ?`,
      [id, req.user.id]
    );
    if (!inv) return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.' });

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

    return res.json({ status: 'success', message: 'Hóa đơn đã được cập nhật.' });
  } catch (err) {
    console.error('Patch invoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật hóa đơn.' });
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/invoices/:id  — Xóa hóa đơn (landlord)
// Resets electricity and water usage metrics to zero
// ──────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ.', errorCode: 'INVALID_PAYLOAD' });
  }

  try {
    // Verify invoice belongs to landlord's room and get invoice details
    const inv = await db.getAsync(
      `SELECT i.id, i.status, i.reading_id, i.month, i.year, i.room_id, r.landlord_id
       FROM invoices i 
       JOIN rooms r ON i.room_id = r.id 
       WHERE i.id = ? AND r.landlord_id = ?`,
      [id, req.user.id]
    );

    if (!inv) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hóa đơn.', errorCode: 'NOT_FOUND' });
    }

    // Prevent deletion of paid invoices
    if (inv.status === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Không thể xóa hóa đơn đã thanh toán.',
        errorCode: 'CANNOT_DELETE_PAID_INVOICE'
      });
    }

    await db.runAsync('BEGIN TRANSACTION');

    try {
      // Reset meter readings for this room/month/year to zero
      // (keep the records but clear electricity and water indices)
      const monthStart = `${inv.year}-${String(inv.month).padStart(2, '0')}-01`;
      const monthEnd = new Date(inv.year, inv.month, 0).toISOString().slice(0, 10);
      
      await db.runAsync(
        `UPDATE meter_readings 
         SET electricity_index = 0, water_index = 0, invoice_id = NULL
         WHERE room_id = ? AND recorded_date >= ? AND recorded_date <= ?`,
        [inv.room_id, monthStart, monthEnd]
      );

      // Delete the invoice
      await db.runAsync('DELETE FROM invoices WHERE id = ?', [id]);

      await db.runAsync('COMMIT');

      return res.json({
        status: 'success',
        message: 'Xóa hóa đơn và đặt lại chỉ số thành công.'
      });
    } catch (txnErr) {
      await db.runAsync('ROLLBACK').catch(() => {});
      throw txnErr;
    }
  } catch (err) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Delete invoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa hóa đơn.', errorCode: 'DELETE_FAILED' });
  }
});

module.exports = router;
