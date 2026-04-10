const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// US4: View available rooms (accessible to landlords)
router.get('/available', authenticateToken, requireRole('landlord'), (req, res) => {
  db.all(
    `SELECT r.*, u.name as landlord_name
     FROM rooms r
     JOIN users u ON r.landlord_id = u.id
     WHERE r.landlord_id = ? AND r.status = 'available'
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, rooms) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch available rooms' });
      }
      res.json({ rooms });
    }
  );
});

// US3: Get all rooms for a landlord
router.get('/', authenticateToken, requireRole('landlord'), (req, res) => {
  db.all(
    `SELECT r.*, u.name as landlord_name
     FROM rooms r
     JOIN users u ON r.landlord_id = u.id
     WHERE r.landlord_id = ?
     ORDER BY r.created_at DESC`,
    [req.user.id],
    (err, rooms) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch rooms' });
      }
      res.json({ rooms });
    }
  );
});

// US3: Add a room
router.post('/', authenticateToken, requireRole('landlord'), (req, res) => {
  const { name, description, price, area, status } = req.body;

  if (!name || price === undefined || price === null) {
    return res.status(400).json({ error: 'Room name and price are required' });
  }

  if (price < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const roomStatus = ['available', 'occupied'].includes(status) ? status : 'available';

  db.run(
    `INSERT INTO rooms (name, description, price, area, status, landlord_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description || '', price, area || null, roomStatus, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add room' });
      }

      db.get('SELECT * FROM rooms WHERE id = ?', [this.lastID], (err, room) => {
        if (err) {
          return res.status(500).json({ error: 'Room created but failed to retrieve' });
        }
        res.status(201).json({ message: 'Room added successfully', room });
      });
    }
  );
});

// US3: Update a room
router.put('/:id', authenticateToken, requireRole('landlord'), (req, res) => {
  const roomId = req.params.id;
  const { name, description, price, area, status } = req.body;

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
      const updatedStatus = status !== undefined ? status : room.status;

      if (!updatedName) {
        return res.status(400).json({ error: 'Room name cannot be empty' });
      }

      if (updatedPrice < 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }

      db.run(
        `UPDATE rooms SET name = ?, description = ?, price = ?, area = ?, status = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = ? AND landlord_id = ?`,
        [updatedName, updatedDescription, updatedPrice, updatedArea, updatedStatus, roomId, req.user.id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update room' });
          }

          db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, updatedRoom) => {
            if (err) {
              return res.status(500).json({ error: 'Room updated but failed to retrieve' });
            }
            res.json({ message: 'Room updated successfully', room: updatedRoom });
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
