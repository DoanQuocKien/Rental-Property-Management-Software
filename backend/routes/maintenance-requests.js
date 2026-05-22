const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/maintenance-requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT mr.*, 
             COALESCE(u.full_name, u.name) as tenantName, u.email as tenantEmail, u.phone_number as tenantPhone,
             COALESCE(s.full_name, s.name) as staffName,
             r.name as roomName
      FROM maintenance_requests mr
      JOIN users u ON mr.tenant_id = u.id
      LEFT JOIN users s ON mr.staff_id = s.id
      LEFT JOIN rooms r ON mr.room_id = r.id
    `;
    const params = [];

    const isTenant = req.user.role.toLowerCase() === 'tenant';

    if (isTenant) {
      query += ` WHERE mr.tenant_id = ?`;
      params.push(req.user.id);
    } else {
      query += ` WHERE (r.landlord_id = ? OR mr.room_id IS NULL)`;
      params.push(req.user.id);
    }

    query += ` ORDER BY mr.created_at DESC`;

    const requests = await db.allAsync(query, params);
    return res.json({ status: 'success', data: requests });
  } catch (error) {
    console.error('Fetch requests error:', error);
    return res.status(500).json({ status: 'error', message: 'Có lỗi khi lấy danh sách yêu cầu bảo trì. Vui lòng thử lại sau.' });
  }
});

// GET /api/maintenance-requests/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const reqId = Number(req.params.id);
  if (!Number.isInteger(reqId)) {
    return res.status(400).json({ status: 'error', message: 'Mã yêu cầu không hợp lệ.' });
  }

  try {
    const request = await db.getAsync(`SELECT * FROM maintenance_requests WHERE id = ?`, [reqId]);
    if (!request) {
      return res.status(404).json({ status: 'error', message: 'Yêu cầu bảo trì không tồn tại.' });
    }

    if (req.user.role.toLowerCase() === 'tenant' && request.tenant_id !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Truy cập bị từ chối.' });
    }

    return res.json({ status: 'success', data: request });
  } catch (error) {
    console.error('Fetch request error:', error);
    return res.status(500).json({ status: 'error', message: 'Có lỗi khi lấy thông tin yêu cầu bảo trì. Vui lòng thử lại sau.' });
  }
});

// POST /api/maintenance-requests
router.post('/', authenticateToken, upload.single('issuePhoto'), async (req, res) => {
  const { contractID, roomID, description, category, priority } = req.body;
  
  if (!description) {
    return res.status(400).json({ status: 'error', message: 'Mô tả sự cố là trường bắt buộc.' });
  }

  const tenantId = req.user.id;
  const issuePhoto = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = await db.runAsync(
      `INSERT INTO maintenance_requests 
       (contract_id, room_id, tenant_id, description, category, priority, status, issue_photo)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        contractID ? Number(contractID) : null,
        roomID ? Number(roomID) : null,
        tenantId,
        description,
        category || 'general',
        priority || 'normal',
        issuePhoto
      ]
    );

    return res.status(201).json({
      status: 'success',
      message: 'Yêu cầu bảo trì đã được gửi thành công.',
      data: {
        id: result.lastID,
        contractID, roomID, tenantId, description, category, priority, status: 'pending', issuePhoto
      }
    });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ status: 'error', message: 'Có lỗi khi gửi yêu cầu bảo trì. Vui lòng thử lại sau.' });
  }
});

// PUT /api/maintenance-requests/:id/status
router.put('/:id/status', authenticateToken, async (req, res) => {
  const reqId = Number(req.params.id);
  if (!Number.isInteger(reqId)) {
    return res.status(400).json({ status: 'error', message: 'Invalid ID' });
  }

  const { status, resolutionNote, staffId, cost } = req.body;
  if (!status) {
    return res.status(400).json({ status: 'error', message: 'Trạng thái là trường bắt buộc.' });
  }

  try {
    const existing = await db.getAsync(`SELECT id FROM maintenance_requests WHERE id = ?`, [reqId]);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Yêu cầu bảo trì không tồn tại.' });
    }

    if (req.user.role.toLowerCase() === 'tenant') {
      return res.status(403).json({ status: 'error', message: 'Chỉ quản lý hoặc chủ nhà mới có thể cập nhật trạng thái.' });
    }
    
    await db.runAsync(
      `UPDATE maintenance_requests 
       SET status = ?,
           resolution_note = COALESCE(?, resolution_note),
           staff_id = COALESCE(?, staff_id),
           cost = COALESCE(?, cost),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, resolutionNote, staffId, cost, reqId]
    );

    const updated = await db.getAsync(`SELECT id, status, resolution_note, staff_id, updated_at FROM maintenance_requests WHERE id = ?`, [reqId]);
    return res.json({ status: 'success', message: 'Trạng thái đã được cập nhật thành công.', data: updated });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ status: 'error', message: 'Có lỗi khi cập nhật trạng thái. Vui lòng thử lại sau.' });
  }
});

// PUT /api/maintenance-requests/:id
router.put('/:id', authenticateToken, upload.single('issuePhoto'), async (req, res) => {
  const reqId = Number(req.params.id);
  if (!Number.isInteger(reqId)) {
    return res.status(400).json({ status: 'error', message: 'Mã yêu cầu không hợp lệ.' });
  }

  const { description, category, priority, status, assignedTo, resolutionNote, staffId, cost } = req.body;
  const issuePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const existing = await db.getAsync(`SELECT * FROM maintenance_requests WHERE id = ?`, [reqId]);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Yêu cầu bảo trì không tồn tại.' });
    }

    if (req.user.role.toLowerCase() === 'tenant') {
      if (existing.tenant_id !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Truy cập bị từ chối.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ status: 'error', message: 'Không thể cập nhật yêu cầu đã được xử lý.' });
      }
      
      await db.runAsync(
        `UPDATE maintenance_requests 
         SET description = COALESCE(?, description), 
             category = COALESCE(?, category),
             issue_photo = COALESCE(?, issue_photo),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [description, category, issuePhoto !== undefined ? issuePhoto : existing.issue_photo, reqId]
      );
    } else {
      await db.runAsync(
        `UPDATE maintenance_requests 
         SET description = COALESCE(?, description), 
             category = COALESCE(?, category),
             priority = COALESCE(?, priority),
             status = COALESCE(?, status),
             assigned_to = COALESCE(?, assigned_to),
             resolution_note = COALESCE(?, resolution_note),
             staff_id = COALESCE(?, staff_id),
             cost = COALESCE(?, cost),
             issue_photo = COALESCE(?, issue_photo),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [description, category, priority, status, assignedTo, resolutionNote, staffId, cost, issuePhoto !== undefined ? issuePhoto : existing.issue_photo, reqId]
      );
    }

    const updated = await db.getAsync(`SELECT * FROM maintenance_requests WHERE id = ?`, [reqId]);
    return res.json({ status: 'success', message: 'Yêu cầu bảo trì đã được cập nhật thành công.', data: updated });
  } catch (error) {
    console.error('Update request error:', error);
    return res.status(500).json({ status: 'error', message: 'Có lỗi khi cập nhật yêu cầu bảo trì. Vui lòng thử lại sau.' });
  }
});

// DELETE /api/maintenance-requests/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  const reqId = Number(req.params.id);
  if (!Number.isInteger(reqId)) return res.status(400).json({ status: 'error', message: 'Invalid ID' });

  try {
    const existing = await db.getAsync(`SELECT * FROM maintenance_requests WHERE id = ?`, [reqId]);
    if (!existing) return res.status(404).json({ status: 'error', message: 'Yêu cầu bảo trì không tồn tại.' });

    if (req.user.role.toLowerCase() === 'tenant') {
       if (existing.tenant_id !== req.user.id) return res.status(403).json({ status: 'error', message: 'Truy cập bị từ chối.' });
       if (existing.status !== 'pending') return res.status(400).json({ status: 'error', message: 'Không thể xóa yêu cầu đã được xử lý.' });
    } else {
       // Check if landlord owns the room
       if (existing.room_id) {
           const room = await db.getAsync(`SELECT landlord_id FROM rooms WHERE id = ?`, [existing.room_id]);
           if (room && room.landlord_id !== req.user.id) {
               return res.status(403).json({ status: 'error', message: 'Truy cập bị từ chối.' });
           }
       }
    }

    if (existing.issue_photo) {
      const filePath = path.join(__dirname, '..', existing.issue_photo);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Error deleting photo:', err);
      });
    }

    await db.runAsync(`DELETE FROM maintenance_requests WHERE id = ?`, [reqId]);
    return res.json({ status: 'success', message: 'Yêu cầu bảo trì đã được xóa thành công.' });
  } catch (error) {
    console.error('Delete request error:', error);
    return res.status(500).json({ status: 'error', message: 'Có lỗi khi xóa yêu cầu bảo trì. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
