const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { roomID, electricityIndex, waterIndex, recordedDate } = req.body;
  const parsedRoomID = Number(roomID);

  if (!Number.isInteger(parsedRoomID)) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã phòng là trường bắt buộc và phải là một số nguyên dương.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  // Validate electricityIndex and waterIndex
  const eIndex = Number(electricityIndex);
  const wIndex = Number(waterIndex);

  if (!Number.isFinite(eIndex) || eIndex < 0 || !Number.isFinite(wIndex) || wIndex < 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Chỉ số điện và chỉ số nước phải là các số dương.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  const recDate = recordedDate ? new Date(recordedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  try {
    const room = await db.getAsync(
      'SELECT id FROM rooms WHERE id = ? AND landlord_id = ?',
      [parsedRoomID, req.user.id]
    );

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Phòng không tồn tại hoặc bạn không có quyền truy cập vào nó.',
        errorCode: 'ROOM_NOT_FOUND'
      });
    }

    const prevReading = await db.getAsync(
      'SELECT electricity_index, water_index FROM meter_readings WHERE room_id = ? ORDER BY recorded_date DESC, id DESC LIMIT 1',
      [parsedRoomID]
    );

    const prevElectricity = prevReading ? prevReading.electricity_index : 0;
    const prevWater = prevReading ? prevReading.water_index : 0;

    if (eIndex < prevElectricity || wIndex < prevWater) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ số tháng mới không thể nhỏ hơn chỉ số tháng trước đó.',
        errorCode: 'INVALID_INDEX_VALUES'
      });
    }

    const result = await db.runAsync(
      `INSERT INTO meter_readings 
       (room_id, electricity_index, water_index, prev_electricity_index, prev_water_index, recorded_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [parsedRoomID, eIndex, wIndex, prevElectricity, prevWater, recDate]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Chỉ số điện nước đã được ghi thành công.',
      data: {
        id: result.lastID,
        roomID: parsedRoomID,
        electricityIndex: eIndex,
        waterIndex: wIndex,
        prevElectricityIndex: prevElectricity,
        prevWaterIndex: prevWater,
        recordedDate: recDate
      }
    });

  } catch (error) {
    console.error('Lỗi tạo chỉ số điện nước:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không thể ghi chỉ số điện nước. Vui lòng thử lại sau.',
      errorCode: 'METER_READING_CREATE_FAILED'
    });
  }
});

module.exports = router;
