const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách thông báo
router.get('/', authenticateToken, async (req, res) => {
  const role = req.user.role.toLowerCase();

  try {
    let notifications = [];

    if (role === 'tenant') {
      // Tìm phòng hiện tại của tenant đang ở
      const contract = await db.getAsync(
        `SELECT room_id FROM lease_contracts WHERE tenant_id = ? AND status = 'active'`,
        [req.user.id]
      );

      // Nếu tenant có phòng (contract) thì lấy thông báo chung (room_id IS NULL) 
      // VÀ thông báo riêng cho phòng đó. Nếu chưa có phòng thì chỉ lấy thông báo chung
      // Tuy nhiên nếu tenant chưa có phòng thì có thông báo chung nào không? 
      // "thông báo chung" thường được gửi từ landlord của tòa nhà mà tenant đang thuê.
      // Giải pháp: Join để lấy thông báo chung từ landlord của toà nhà đó.

      let query = `
        SELECT n.id, n.title, n.content, n.created_at, n.room_id, COALESCE(u.full_name, u.name) as senderName
        FROM notifications n
        JOIN users u ON n.sender_id = u.id
        WHERE n.room_id IS NULL
      `;
      const params = [];

      if (contract && contract.room_id) {
        // Tìm landlord của phòng
        const room = await db.getAsync(`SELECT landlord_id FROM rooms WHERE id = ?`, [contract.room_id]);
        if (room) {
          query = `
             SELECT n.id, n.title, n.content, n.created_at, n.room_id, COALESCE(u.full_name, u.name) as senderName
             FROM notifications n
             JOIN users u ON n.sender_id = u.id
             WHERE (n.room_id = ? OR (n.room_id IS NULL AND n.sender_id = ?))
             ORDER BY n.created_at DESC
           `;
          params.push(contract.room_id, room.landlord_id);
        }
      } else {
        // Nếu chưa thuê phòng, không check thông báo chung được vì không biết của chủ nhà nào -> chỉ lấy các thông báo đã public (nếu hệ thống thực sự có)
        // Để an toàn, ko public thông báo khi ko biết landlord.
        query = `
           SELECT n.id, n.title, n.content, n.created_at, n.room_id, COALESCE(u.full_name, u.name) as senderName
             FROM notifications n
             JOIN users u ON n.sender_id = u.id
             WHERE 1=0
         `;
      }

      notifications = await db.allAsync(query, params);

    } else {
      // Landlord/Manager/Owner -> lấy những thông báo do họ gửi đi
      notifications = await db.allAsync(
        `SELECT n.id, n.title, n.content, n.created_at, n.room_id, r.name as roomName
         FROM notifications n
         LEFT JOIN rooms r ON n.room_id = r.id
         WHERE n.sender_id = ?
         ORDER BY n.created_at DESC`,
        [req.user.id]
      );
    }

    return res.json({
      status: 'success',
      data: notifications
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch notifications.' });
  }
});

// Gửi thông báo mới
router.post('/', authenticateToken, async (req, res) => {
  const role = req.user.role.toLowerCase();

  if (role === 'tenant') {
    return res.status(403).json({ status: 'error', message: 'Tenants cannot send notifications.' });
  }

  const { title, content, roomId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ status: 'error', message: 'Title and content are required.' });
  }

  const parsedRoomId = roomId ? Number(roomId) : null;

  try {
    const result = await db.runAsync(
      `INSERT INTO notifications (sender_id, room_id, title, content)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, parsedRoomId, title, content]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Notification sent successfully.',
      data: {
        id: result.lastID,
        senderId: req.user.id,
        roomId: parsedRoomId,
        title,
        content
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to send notification.' });
  }
});

module.exports = router;
