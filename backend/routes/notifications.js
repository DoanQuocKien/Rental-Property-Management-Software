const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ──────────────────────────────────────────────────────────
// POST /api/notifications  — Gửi thông báo (landlord only)
// Body: { 
//   title, message, 
//   recipientType: 'all_tenants'|'room'|'tenant'|'selected_tenants',
//   recipientId: (optional, for 'room' or 'tenant' types),
//   selectedTenantIds: (optional array of tenant IDs for 'selected_tenants' type)
// }
// ──────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { title, message, recipientType, recipientId, selectedTenantIds } = req.body;

  // Validation
  if (!title || !title.trim()) {
    return res.status(400).json({
      status: 'error',
      message: 'Tiêu đề thông báo là trường bắt buộc.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  if (!message || !message.trim()) {
    return res.status(400).json({
      status: 'error',
      message: 'Nội dung thông báo là trường bắt buộc.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  if (title.length > 200) {
    return res.status(400).json({
      status: 'error',
      message: 'Tiêu đề không được vượt quá 200 ký tự.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  if (message.length > 2000) {
    return res.status(400).json({
      status: 'error',
      message: 'Nội dung không được vượt quá 2000 ký tự.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  const type = recipientType || 'all_tenants';
  const rid = recipientId ? Number(recipientId) : null;

  try {
    await db.runAsync('BEGIN TRANSACTION');

    if (type === 'all_tenants') {
      // Get all active tenants from the landlord's lease contracts
      const tenants = await db.allAsync(
        `SELECT DISTINCT lc.tenant_id
         FROM lease_contracts lc
         JOIN rooms r ON lc.room_id = r.id
         WHERE r.landlord_id = ? AND lc.status = 'active'`,
        [req.user.id]
      );

      // Send notification to each tenant
      const results = [];
      for (const tenant of tenants) {
        const result = await db.runAsync(
          `INSERT INTO notifications (from_user_id, recipient_type, recipient_id, title, message)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, type, tenant.tenant_id, title.trim(), message.trim()]
        );
        results.push(result.lastID);
      }

      await db.runAsync('COMMIT');

      return res.status(201).json({
        status: 'success',
        message: `✅ Gửi thông báo thành công đến ${tenants.length} người dùng!`,
        data: {
          notificationCount: tenants.length,
          recipientCount: tenants.length
        }
      });
    } else if (type === 'room') {
      // Send to all active tenants in a specific room
      if (!rid || rid <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Mã phòng là bắt buộc cho thông báo theo phòng.',
          errorCode: 'INVALID_PAYLOAD'
        });
      }

      // Verify room belongs to landlord
      const room = await db.getAsync(
        'SELECT id FROM rooms WHERE id = ? AND landlord_id = ?',
        [rid, req.user.id]
      );

      if (!room) {
        return res.status(404).json({
          status: 'error',
          message: 'Phòng không tồn tại hoặc bạn không có quyền.',
          errorCode: 'ROOM_NOT_FOUND'
        });
      }

      // Get active tenants in this room
      const tenants = await db.allAsync(
        `SELECT DISTINCT lc.tenant_id
         FROM lease_contracts lc
         WHERE lc.room_id = ? AND lc.status = 'active'`,
        [rid]
      );

      const results = [];
      for (const tenant of tenants) {
        const result = await db.runAsync(
          `INSERT INTO notifications (from_user_id, recipient_type, recipient_id, title, message)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, type, tenant.tenant_id, title.trim(), message.trim()]
        );
        results.push(result.lastID);
      }

      await db.runAsync('COMMIT');

      return res.status(201).json({
        status: 'success',
        message: `✅ Gửi thông báo thành công đến ${tenants.length} người dùng ở phòng này!`,
        data: {
          notificationCount: tenants.length,
          recipientCount: tenants.length
        }
      });
    } else if (type === 'tenant') {
      // Send to specific tenant
      if (!rid || rid <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Mã người thuê là bắt buộc cho thông báo cá nhân.',
          errorCode: 'INVALID_PAYLOAD'
        });
      }

      // Verify tenant exists and has active lease
      const tenant = await db.getAsync(
        `SELECT u.id FROM users u
         JOIN lease_contracts lc ON u.id = lc.tenant_id
         JOIN rooms r ON lc.room_id = r.id
         WHERE u.id = ? AND r.landlord_id = ? AND lc.status = 'active'`,
        [rid, req.user.id]
      );

      if (!tenant) {
        return res.status(404).json({
          status: 'error',
          message: 'Người thuê không tồn tại hoặc không có hợp đồng kích hoạt.',
          errorCode: 'TENANT_NOT_FOUND'
        });
      }

      const result = await db.runAsync(
        `INSERT INTO notifications (from_user_id, recipient_type, recipient_id, title, message)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, type, rid, title.trim(), message.trim()]
      );

      await db.runAsync('COMMIT');

      return res.status(201).json({
        status: 'success',
        message: '✅ Gửi thông báo thành công!',
        data: {
          notificationId: result.lastID,
          recipientId: rid
        }
      });
    } else if (type === 'selected_tenants') {
      // Send to selected tenant accounts
      if (!Array.isArray(selectedTenantIds) || selectedTenantIds.length === 0) {
        await db.runAsync('ROLLBACK').catch(() => {});
        return res.status(400).json({
          status: 'error',
          message: 'Vui lòng chọn ít nhất một người thuê để gửi thông báo.',
          errorCode: 'INVALID_PAYLOAD'
        });
      }

      // Verify all selected tenants belong to landlord's properties
      const placeholders = selectedTenantIds.map(() => '?').join(',');
      const validTenants = await db.allAsync(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN lease_contracts lc ON u.id = lc.tenant_id
         JOIN rooms r ON lc.room_id = r.id
         WHERE r.landlord_id = ? AND lc.status = 'active' AND u.id IN (${placeholders})`,
        [req.user.id, ...selectedTenantIds]
      );

      if (validTenants.length === 0) {
        await db.runAsync('ROLLBACK').catch(() => {});
        return res.status(400).json({
          status: 'error',
          message: 'Những người thuê được chọn không có hợp đồng hoạt động hoặc bạn không có quyền.',
          errorCode: 'INVALID_TENANTS'
        });
      }

      // Send notification to each selected tenant
      const results = [];
      for (const tenant of validTenants) {
        const result = await db.runAsync(
          `INSERT INTO notifications (from_user_id, recipient_type, recipient_id, title, message)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, 'selected_tenants', tenant.id, title.trim(), message.trim()]
        );
        results.push(result.lastID);
      }

      await db.runAsync('COMMIT');

      return res.status(201).json({
        status: 'success',
        message: `✅ Gửi thông báo thành công đến ${validTenants.length} tài khoản được chọn!`,
        data: {
          notificationCount: validTenants.length,
          recipientCount: validTenants.length,
          selectedCount: validTenants.length
        }
      });
    } else {
      await db.runAsync('ROLLBACK').catch(() => {});
      return res.status(400).json({
        status: 'error',
        message: 'Loại người nhận không hợp lệ. Sử dụng: all_tenants, room, tenant, hoặc selected_tenants.',
        errorCode: 'INVALID_PAYLOAD'
      });
    }
  } catch (error) {
    await db.runAsync('ROLLBACK').catch(() => {});
    console.error('Send notification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không thể gửi thông báo. Vui lòng thử lại sau.',
      errorCode: 'NOTIFICATION_SEND_FAILED'
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/notifications  — Danh sách thông báo cho người dùng
// Query: ?isRead=true|false (optional filter)
// ──────────────────────────────────────────────────────────
router.get('/', authenticateToken, async (req, res) => {
  const { isRead } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let query;
    let params;

    if (userRole === 'landlord') {
      // Landlords see notifications they sent
      query = `SELECT * FROM notifications WHERE from_user_id = ?`;
      params = [userId];
    } else {
      // Tenants see notifications sent to them
      query = `SELECT * FROM notifications 
               WHERE (recipient_type = 'all_tenants' OR recipient_id = ?)
               ORDER BY created_at DESC`;
      params = [userId];
    }

    // Apply read filter if provided
    if (isRead === 'true') {
      query += ' AND is_read = 1';
    } else if (isRead === 'false') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC';

    const notifications = await db.allAsync(query, params);

    return res.json({
      status: 'success',
      data: notifications || []
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tải thông báo.',
      errorCode: 'FETCH_FAILED'
    });
  }
});

// ──────────────────────────────────────────────────────────
// GET /api/notifications/unread-count  — Số lượng thông báo chưa đọc
// ──────────────────────────────────────────────────────────
router.get('/unread-count', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    let query;
    let params;

    if (userRole === 'landlord') {
      // Landlords check unread of their sent notifications
      query = `SELECT COUNT(*) as count FROM notifications 
               WHERE from_user_id = ? AND is_read = 0`;
      params = [userId];
    } else {
      // Tenants check unread notifications sent to them
      query = `SELECT COUNT(*) as count FROM notifications 
               WHERE (recipient_type = 'all_tenants' OR recipient_id = ?) 
               AND is_read = 0`;
      params = [userId];
    }

    const result = await db.getAsync(query, params);
    const count = result?.count || 0;

    return res.json({
      status: 'success',
      data: { unreadCount: count }
    });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tính thông báo chưa đọc.',
      errorCode: 'FETCH_FAILED'
    });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/notifications/:id/read  — Đánh dấu thông báo là đã đọc
// ──────────────────────────────────────────────────────────
router.put('/:id/read', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã thông báo không hợp lệ.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  try {
    // Get notification
    const notification = await db.getAsync(
      `SELECT * FROM notifications WHERE id = ?`,
      [id]
    );

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông báo.',
        errorCode: 'NOT_FOUND'
      });
    }

    // Verify user has access to this notification
    const isFromUser = notification.from_user_id === userId;
    const isForUser = notification.recipient_type === 'all_tenants' || notification.recipient_id === userId;

    if (!isFromUser && !isForUser) {
      return res.status(403).json({
        status: 'error',
        message: 'Truy cập bị từ chối.',
        errorCode: 'FORBIDDEN'
      });
    }

    // Mark as read
    await db.runAsync(
      `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    return res.json({
      status: 'success',
      message: 'Thông báo đã được đánh dấu là đã đọc.'
    });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi cập nhật thông báo.',
      errorCode: 'UPDATE_FAILED'
    });
  }
});

// ──────────────────────────────────────────────────────────
// DELETE /api/notifications/:id  — Xóa thông báo
// ──────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã thông báo không hợp lệ.',
      errorCode: 'INVALID_PAYLOAD'
    });
  }

  try {
    // Get notification
    const notification = await db.getAsync(
      `SELECT * FROM notifications WHERE id = ?`,
      [id]
    );

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy thông báo.',
        errorCode: 'NOT_FOUND'
      });
    }

    // Verify user has access - both sender and recipient can delete
    const isFromUser = notification.from_user_id === userId;
    const isForUser = notification.recipient_type === 'all_tenants' || notification.recipient_id === userId;

    if (!isFromUser && !isForUser) {
      return res.status(403).json({
        status: 'error',
        message: 'Truy cập bị từ chối.',
        errorCode: 'FORBIDDEN'
      });
    }

    // Delete notification
    await db.runAsync('DELETE FROM notifications WHERE id = ?', [id]);

    return res.json({
      status: 'success',
      message: '✅ Xóa thông báo thành công!'
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xóa thông báo.',
      errorCode: 'DELETE_FAILED'
    });
  }
});

module.exports = router;
