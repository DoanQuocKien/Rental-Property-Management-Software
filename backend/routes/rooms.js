const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const VALID_ROOM_STATUSES = ['available', 'occupied', 'maintenance', 'reserved', 'cleaning'];

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
        return res.status(500).json({ error: 'Failed to fetch available rooms' });
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
      return res.status(500).json({ error: 'Failed to fetch rooms' });
    }
    res.json({ rooms: rooms.map(mapRoomRecord) });
  });
});

// US3: Add a room
router.post('/', authenticateToken, requireRole('landlord'), (req, res) => {
  const { name, description, price, area, status, category, maxOccupants } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Room name and price are required' });
  }

  if (price < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const normalizedStatus = String(status || '').trim().toLowerCase();
  const roomStatus = VALID_ROOM_STATUSES.includes(normalizedStatus) ? normalizedStatus : 'available';
  const roomCategory = category && String(category).trim() ? String(category).trim() : 'Standard';
  const parsedMaxOccupants = maxOccupants !== undefined ? Number(maxOccupants) : Number(req.body.capacity);
  const roomMaxOccupants = Number.isFinite(parsedMaxOccupants) && parsedMaxOccupants > 0 ? parsedMaxOccupants : 1;

  db.run(
    `INSERT INTO rooms (name, description, category, price, area, max_occupants, status, landlord_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, description || '', roomCategory, price, area || null, roomMaxOccupants, roomStatus, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add room' });
      }

      db.get('SELECT * FROM rooms WHERE id = ?', [this.lastID], (err, room) => {
        if (err) {
          return res.status(500).json({ error: 'Room created but failed to retrieve' });
        }
        res.status(201).json({ message: 'Room added successfully', room: mapRoomRecord(room) });
      });
    }
  );
});

// US3: Update a room
router.put('/:id', authenticateToken, requireRole('landlord'), (req, res) => {
  const roomId = req.params.id;
  const { name, description, price, area, status, category, maxOccupants } = req.body;

  db.get(
    'SELECT * FROM rooms WHERE id = ? AND landlord_id = ?',
    [roomId, req.user.id],
    (err, room) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to find room' });
      }
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
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
        return res.status(400).json({ error: 'Room name cannot be empty' });
      }

      if (updatedPrice < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }

      if (!Number.isFinite(updatedMaxOccupants) || updatedMaxOccupants < 1) {
        return res.status(400).json({ error: 'Max occupants must be a positive number' });
      }

      db.run(
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
        ],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update room' });
          }

          db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, updatedRoom) => {
            if (err) {
              return res.status(500).json({ error: 'Room updated but failed to retrieve' });
            }
            res.json({ message: 'Room updated successfully', room: mapRoomRecord(updatedRoom) });
          });
        }
      );
    }
  );
});

// US3: Delete a room
router.delete('/:id', authenticateToken, requireRole('landlord'), (req, res) => {
  const roomId = req.params.id;

  db.get(
    'SELECT * FROM rooms WHERE id = ? AND landlord_id = ?',
    [roomId, req.user.id],
    (err, room) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to find room' });
      }
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      db.run('DELETE FROM rooms WHERE id = ? AND landlord_id = ?', [roomId, req.user.id], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete room' });
        }
        res.json({ message: 'Room deleted successfully' });
      });
    }
  );
});

module.exports = router;
