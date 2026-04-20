const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { 
    roomID, contractID, readingID, month, year, 
    rentAmount, electricityAmount, waterAmount, serviceAmount, totalAmount, dueDate 
  } = req.body;

  const parsedRoomID = Number(roomID);
  const parsedTotal = Number(totalAmount);

  if (!Number.isInteger(parsedRoomID)) {
    return res.status(400).json({
      status: 'error',
      message: 'roomID is required and must be an integer.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'totalAmount is required and must be a positive number.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  const invoiceMonth = Number.isInteger(Number(month)) ? Number(month) : new Date().getMonth() + 1;
  const invoiceYear = Number.isInteger(Number(year)) ? Number(year) : new Date().getFullYear();
  const dDate = dueDate ? new Date(dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  try {
    const room = await db.getAsync(
      'SELECT id FROM rooms WHERE id = ? AND landlord_id = ?',
      [parsedRoomID, req.user.id]
    );

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Room not found or you do not have permission to access it.',
        errorCode: 'ROOM_NOT_FOUND'
      });
    }

    await db.runAsync('BEGIN TRANSACTION');

    const result = await db.runAsync(
      `INSERT INTO invoices 
       (room_id, contract_id, reading_id, month, year, rent_amount, electricity_amount, water_amount, service_amount, total_amount, due_date, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'Unpaid')`,
      [
        parsedRoomID, 
        contractID ? Number(contractID) : null, 
        readingID ? Number(readingID) : null, 
        invoiceMonth, 
        invoiceYear,
        Number(rentAmount) || 0, 
        Number(electricityAmount) || 0, 
        Number(waterAmount) || 0, 
        Number(serviceAmount) || 0, 
        parsedTotal, 
        dDate
      ]
    );

    if (readingID) {
      await db.runAsync(
        `UPDATE meter_readings SET invoice_id = ? WHERE id = ?`,
        [result.lastID, Number(readingID)]
      );
    }

    await db.runAsync('COMMIT');

    return res.status(201).json({
      status: 'success',
      message: 'Invoice created successfully.',
      data: {
        id: result.lastID,
        roomID: parsedRoomID,
        contractID: contractID ? Number(contractID) : null,
        month: invoiceMonth,
        year: invoiceYear,
        totalAmount: parsedTotal,
        dueDate: dDate,
        status: 'unpaid'
      }
    });

  } catch (error) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Invoice creation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create invoice.',
      errorCode: 'INVOICE_CREATE_FAILED'
    });
  }
});

module.exports = router;
