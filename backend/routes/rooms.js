const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { auditMutations } = require('../middleware/audit');

const router = express.Router();
const VALID_ROOM_STATUSES = ['available', 'occupied', 'maintenance', 'reserved', 'cleaning'];

function buildDemoRoomName(letterIndex, numberIndex) {
  return `${String.fromCharCode(65 + letterIndex)}${numberIndex}`;
}

function mapRoomRecord(room) {
  const roomID = room.id;
  const maxOccupants = room.max_occupants || 1;

  return {
    roomID,
    category: room.category,
    price: room.price,
    area: room.area,
    maxOccupants,
    status: room.status,
    name: room.name,
    description: room.description,
    landlordName: room.landlord_name,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    id: roomID,
    capacity: maxOccupants,
    landlord_name: room.landlord_name,
  };
}

// Tạo hàng loạt phòng trống mẫu cho landlord hiện tại.
router.post('/seed-demo', authenticateToken, requireRole('landlord'), async (req, res) => {
  const letters = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
  const numbers = Array.from({ length: 21 }, (_, index) => index);

  try {
    const existingRooms = await db.allAsync(
      `SELECT name
       FROM rooms
       WHERE landlord_id = ?`,
      [req.user.id]
    );

    const existingNames = new Set(existingRooms.map((room) => room.name));
    const roomsToInsert = [];

    letters.forEach((_, letterIndex) => {
      numbers.forEach((numberIndex) => {
        const roomName = buildDemoRoomName(letterIndex, numberIndex);

        if (existingNames.has(roomName)) {
          return;
        }

        const sequentialIndex = letterIndex * numbers.length + numberIndex;
        roomsToInsert.push({
          name: roomName,
          description: `Phòng trống mẫu ${roomName}`,
          category: 'Demo',
          price: 1200000 + sequentialIndex * 15000,
          area: 12 + (numberIndex % 9) + (letterIndex % 4),
          maxOccupants: 1 + (numberIndex % 3 === 0 ? 1 : 0),
          status: 'available',
        });
      });
    });

    if (roomsToInsert.length === 0) {
      return res.status(200).json({
        message: 'Phòng demo đã tồn tại.',
        createdCount: 0,
      });
    }

    await db.runAsync('BEGIN TRANSACTION');

    let createdCount = 0;
    try {
      for (const room of roomsToInsert) {
        await db.runAsync(
          `INSERT INTO rooms (name, description, category, price, area, max_occupants, status, landlord_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [room.name, room.description, room.category, room.price, room.area, room.maxOccupants, room.status, req.user.id]
        );
        createdCount += 1;
      }

      await db.runAsync('COMMIT');
      return res.status(201).json({
        message: `Created ${createdCount} demo rooms.`,
        createdCount,
      });
    } catch (insertError) {
      await db.runAsync('ROLLBACK').catch(() => {});
      throw insertError;
    }
  } catch (error) {
    console.error('Seed demo rooms error:', error);
    return res.status(500).json({
      error: 'Có lỗi khi tạo phòng demo.',
    });
  }
});

// US4: View available rooms (accessible to landlords)
router.get('/available', authenticateToken, requireRole('landlord'), (req, res) => {
  db.all(
    `SELECT r.*, COALESCE(u.full_name, u.name) as landlord_name
     FROM rooms r
     JOIN users u ON r.landlord_id = u.id
     WHERE r.landlord_id = ? AND r.status = 'available'
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, rooms) => {
      if (err) {
        return res.status(500).json({ error: 'Có lỗi khi tải phòng có sẵn.' });
      }
      res.json({ rooms: rooms.map(mapRoomRecord) });
    }
  );
});

// US3: Get all rooms for a landlord
router.get('/', authenticateToken, requireRole('landlord'), (req, res) => {
  const { status, category } = req.query;

  let query = `
    SELECT r.*, COALESCE(u.full_name, u.name) as landlord_name
    FROM rooms r
    JOIN users u ON r.landlord_id = u.id
    WHERE r.landlord_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ` AND r.status = ?`;
    params.push(status);
  }

  if (category) {
    query += ` AND r.category = ?`;
    params.push(category);
  }

  query += ` ORDER BY r.created_at DESC`;

  db.all(query, params, (err, rooms) => {
    if (err) {
      return res.status(500).json({ error: 'Có lỗi khi tải phòng.' });
    }
    res.json({ rooms: rooms.map(mapRoomRecord) });
  });
});

// US3: Add a room
router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { name, description, price, area, status, category, maxOccupants } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Tên phòng và giá phòng là bắt buộc!' });
  }

  if (price < 0) {
    return res.status(400).json({ error: 'Giá phòng phải là một số dương!' });
  }

  const normalizedStatus = String(status || '').trim().toLowerCase();
  const roomStatus = VALID_ROOM_STATUSES.includes(normalizedStatus) ? normalizedStatus : 'available';
  const roomCategory = category && String(category).trim() ? String(category).trim() : 'Standard';
  const parsedMaxOccupants = maxOccupants !== undefined ? Number(maxOccupants) : Number(req.body.capacity);
  const roomMaxOccupants = Number.isFinite(parsedMaxOccupants) && parsedMaxOccupants > 0 ? parsedMaxOccupants : 1;

  try {
    // Check if room name is already used by this landlord
    const existingRoom = await db.getAsync(
      'SELECT id FROM rooms WHERE name = ? AND landlord_id = ?',
      [name, req.user.id]
    );

    if (existingRoom) {
      return res.status(400).json({ error: 'Tên phòng đã tồn tại, vui lòng nhập tên phòng khác!' });
    }

    const result = await db.runAsync(
      `INSERT INTO rooms (name, description, category, price, area, max_occupants, status, landlord_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || '', roomCategory, price, area || null, roomMaxOccupants, roomStatus, req.user.id]
    );

    const room = await db.getAsync('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Thêm phòng thành công!', room: mapRoomRecord(room) });
  } catch (err) {
    console.error('Add room error:', err);
    return res.status(500).json({ error: 'Thêm phòng thất bại!' });
  }
});

// US3: Update a room
router.put('/:id', authenticateToken, auditMutations('rooms'), requireRole('landlord'), async (req, res) => {
  const roomId = req.params.id;
  const { name, description, price, area, status, category, maxOccupants } = req.body;

  try {
    const room = await db.getAsync(
      'SELECT * FROM rooms WHERE id = ? AND landlord_id = ?',
      [roomId, req.user.id]
    );

    if (!room) {
      return res.status(404).json({ error: 'Không tìm thấy phòng!' });
    }

    const updatedName = name !== undefined ? name : room.name;
    const updatedDescription = description !== undefined ? description : room.description;
    const updatedPrice = price !== undefined ? price : room.price;
    const updatedArea = area !== undefined ? area : room.area;
    const updatedStatusCandidate = status !== undefined ? String(status).trim().toLowerCase() : room.status;
    const updatedStatus = VALID_ROOM_STATUSES.includes(updatedStatusCandidate)
      ? updatedStatusCandidate
      : room.status;
    const updatedCategory = category !== undefined
      ? (String(category).trim() || 'Standard')
      : (room.category || 'Standard');
    const rawMaxOccupants = maxOccupants !== undefined ? maxOccupants : req.body.capacity;
    const updatedMaxOccupants = rawMaxOccupants !== undefined
      ? Number(rawMaxOccupants)
      : (room.max_occupants || 1);

    if (!updatedName) {
      return res.status(400).json({ error: 'Tên phòng không được để trống' });
    }

    if (updatedPrice < 0) {
      return res.status(400).json({ error: 'Giá phòng phải là một số dương' });
    }

    if (!Number.isFinite(updatedMaxOccupants) || updatedMaxOccupants < 1) {
      return res.status(400).json({ error: 'Số lượng người ở tối đa phải là một số dương' });
    }

    // Check if new room name is already used by this landlord (if name is being changed)
    if (updatedName !== room.name) {
      const existingRoom = await db.getAsync(
        'SELECT id FROM rooms WHERE name = ? AND landlord_id = ? AND id != ?',
        [updatedName, req.user.id, roomId]
      );

      if (existingRoom) {
        return res.status(400).json({ error: 'Tên phòng đã tồn tại, vui lòng nhập tên phòng khác!' });
      }
    }

    await db.runAsync(
      `UPDATE rooms SET name = ?, description = ?, category = ?, price = ?, area = ?, max_occupants = ?, status = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ? AND landlord_id = ?`,
      [
        updatedName,
        updatedDescription,
        updatedCategory,
        updatedPrice,
        updatedArea,
        updatedMaxOccupants,
        updatedStatus,
        roomId,
        req.user.id,
      ]
    );

    const updatedRoom = await db.getAsync('SELECT * FROM rooms WHERE id = ?', [roomId]);
    res.json({ message: 'Cập nhật phòng thành công!', room: mapRoomRecord(updatedRoom) });
  } catch (err) {
    console.error('Update room error:', err);
    return res.status(500).json({ error: 'Cập nhật phòng thất bại!' });
  }
});

// US3: Delete a room
router.delete('/:id', authenticateToken, auditMutations('rooms'), requireRole('landlord'), async (req, res) => {
  const roomId = req.params.id;

  try {
    // Verify room exists and belongs to landlord
    const room = await db.getAsync(
      'SELECT * FROM rooms WHERE id = ? AND landlord_id = ?',
      [roomId, req.user.id]
    );
    
    if (!room) {
      return res.status(404).json({ error: 'Phòng không tồn tại!' });
    }

    // Start transaction for cascade deletion
    await db.runAsync('BEGIN TRANSACTION');

    // Delete associated invoices first (cascade delete)
    const invoices = await db.allAsync(
      'SELECT id FROM invoices WHERE room_id = ?',
      [roomId]
    );

    for (const invoice of invoices) {
      // Delete meter readings associated with this invoice
      await db.runAsync(
        'DELETE FROM meter_readings WHERE invoice_id = ?',
        [invoice.id]
      );
    }

    // Delete all invoices for this room
    await db.runAsync(
      'DELETE FROM invoices WHERE room_id = ?',
      [roomId]
    );

    // Delete meter readings not linked to invoices
    await db.runAsync(
      'DELETE FROM meter_readings WHERE room_id = ?',
      [roomId]
    );

    // Delete the room itself
    await db.runAsync(
      'DELETE FROM rooms WHERE id = ? AND landlord_id = ?',
      [roomId, req.user.id]
    );

    await db.runAsync('COMMIT');

    const successMessage = invoices.length > 0 
      ? `✅ Xóa phòng thành công! Đã xóa ${invoices.length} hóa đơn liên quan để giữ dữ liệu sạch sẽ.`
      : '✅ Xóa phòng thành công!';

    return res.json({ 
      message: successMessage,
      deletedInvoicesCount: invoices.length 
    });
  } catch (err) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Delete room error:', err);
    return res.status(500).json({ error: 'Xóa phòng thất bại!' });
  }
});

module.exports = router;
