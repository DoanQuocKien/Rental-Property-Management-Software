const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/tenants/profile - Lấy thông tin cá nhân người thuê
router.get('/profile', authenticateToken, requireRole('tenant'), (req, res) => {
  db.get('SELECT id, name, email, phone, citizen_id, permanent_address, date_of_birth, gender, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Không thể lấy thông tin' });
      if (!user) return res.status(404).json({ error: 'Người dùng không tìm thấy' });
      res.json({ user });
    }
  );
});

// PUT /api/tenants/profile - Cập nhật thông tin cá nhân
router.put('/profile', authenticateToken, requireRole('tenant'), (req, res) => {
  const { name, phone, citizen_id, permanent_address, date_of_birth, gender } = req.body;

  if (!name) return res.status(400).json({ error: 'Tên không được để trống' });

  db.run(
    `UPDATE users SET name = ?, phone = ?, citizen_id = ?, permanent_address = ?,
     date_of_birth = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, phone || null, citizen_id || null, permanent_address || null,
     date_of_birth || null, gender || null, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Cập nhật thất bại' });
      res.json({ message: 'Cập nhật thành công' });
    }
  );
});

// GET /api/tenants/contract - Lấy hợp đồng hiện tại của người thuê
router.get('/contract', authenticateToken, requireRole('tenant'), (req, res) => {
  db.get(
    `SELECT lc.*, r.name as room_name, r.price as room_price, r.area as room_area,
            u.name as landlord_name, u.phone as landlord_phone
     FROM lease_contracts lc
     JOIN rooms r ON lc.room_id = r.id
     JOIN users u ON r.landlord_id = u.id
     WHERE lc.tenant_id = ? AND lc.status = 'active'
     ORDER BY lc.created_at DESC LIMIT 1`,
    [req.user.id],
    (err, contract) => {
      if (err) return res.status(500).json({ error: 'Không thể lấy hợp đồng' });
      res.json({ contract: contract || null });
    }
  );
});

// GET /api/tenants/invoices - Lấy danh sách hóa đơn của người thuê
router.get('/invoices', authenticateToken, requireRole('tenant'), (req, res) => {
  db.all(
    `SELECT i.*, r.name as room_name
     FROM invoices i
     JOIN lease_contracts lc ON i.contract_id = lc.id
     JOIN rooms r ON lc.room_id = r.id
     WHERE lc.tenant_id = ?
     ORDER BY i.created_at DESC`,
    [req.user.id],
    (err, invoices) => {
      if (err) return res.status(500).json({ error: 'Không thể lấy hóa đơn' });
      res.json({ invoices: invoices || [] });
    }
  );
});

// GET /api/tenants/invoices/:id - Lấy chi tiết hóa đơn
router.get('/invoices/:id', authenticateToken, requireRole('tenant'), (req, res) => {
  db.get(
    `SELECT i.*, r.name as room_name, r.price as room_price,
            mr.electricity_index as curr_elec, mr.water_index as curr_water,
            mr.prev_electricity_index as prev_elec, mr.prev_water_index as prev_water
     FROM invoices i
     JOIN lease_contracts lc ON i.contract_id = lc.id
     JOIN rooms r ON lc.room_id = r.id
     LEFT JOIN meter_readings mr ON mr.invoice_id = i.id
     WHERE i.id = ? AND lc.tenant_id = ?`,
    [req.params.id, req.user.id],
    (err, invoice) => {
      if (err) return res.status(500).json({ error: 'Không thể lấy chi tiết hóa đơn' });
      if (!invoice) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
      res.json({ invoice });
    }
  );
});

// POST /api/tenants/invoices/:id/pay - Thanh toán hóa đơn
router.post('/invoices/:id/pay', authenticateToken, requireRole('tenant'), (req, res) => {
  const { payment_method } = req.body;
  if (!payment_method) return res.status(400).json({ error: 'Vui lòng chọn phương thức thanh toán' });

  db.get(
    `SELECT i.* FROM invoices i
     JOIN lease_contracts lc ON i.contract_id = lc.id
     WHERE i.id = ? AND lc.tenant_id = ? AND i.status = 'unpaid'`,
    [req.params.id, req.user.id],
    (err, invoice) => {
      if (err) return res.status(500).json({ error: 'Lỗi xử lý' });
      if (!invoice) return res.status(404).json({ error: 'Không tìm thấy hóa đơn chưa thanh toán' });

      db.run(
        `UPDATE invoices SET status = 'paid', payment_method = ?, paid_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [payment_method, req.params.id],
        function (err) {
          if (err) return res.status(500).json({ error: 'Thanh toán thất bại' });
          res.json({ message: 'Thanh toán thành công' });
        }
      );
    }
  );
});

// GET /api/tenants/maintenance - Lấy danh sách yêu cầu bảo trì
router.get('/maintenance', authenticateToken, requireRole('tenant'), (req, res) => {
  db.all(
    `SELECT mr.* FROM maintenance_requests mr
     JOIN lease_contracts lc ON mr.contract_id = lc.id
     WHERE lc.tenant_id = ?
     ORDER BY mr.created_at DESC`,
    [req.user.id],
    (err, requests) => {
      if (err) return res.status(500).json({ error: 'Không thể lấy danh sách' });
      res.json({ requests: requests || [] });
    }
  );
});

// POST /api/tenants/maintenance - Gửi yêu cầu bảo trì mới
router.post('/maintenance', authenticateToken, requireRole('tenant'), (req, res) => {
  const { description, category } = req.body;

  if (!description || description.trim().length === 0) {
    return res.status(400).json({ error: 'Vui lòng nhập mô tả vấn đề' });
  }

  // Lấy contract_id hiện tại của tenant
  db.get(
    `SELECT id, room_id FROM lease_contracts WHERE tenant_id = ? AND status = 'active' LIMIT 1`,
    [req.user.id],
    (err, contract) => {
      if (err) return res.status(500).json({ error: 'Lỗi hệ thống' });
      if (!contract) return res.status(400).json({ error: 'Bạn chưa có hợp đồng thuê phòng nào đang hoạt động' });

      // Tự động xác định priority dựa trên từ khóa (UC-14 SAF-2)
      const highPriorityKeywords = ['gas', 'điện giật', 'cháy', 'nổ', 'nguy hiểm', 'khẩn cấp', 'rò rỉ'];
      const isHighPriority = highPriorityKeywords.some(kw => description.toLowerCase().includes(kw));
      const priority = isHighPriority ? 'high' : 'normal';

      db.run(
        `INSERT INTO maintenance_requests (contract_id, room_id, tenant_id, description, category, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [contract.id, contract.room_id, req.user.id, description.trim(), category || 'general', priority],
        function (err) {
          if (err) return res.status(500).json({ error: 'Gửi yêu cầu thất bại' });
          res.status(201).json({
            message: 'Gửi yêu cầu thành công',
            requestId: this.lastID,
            priority
          });
        }
      );
    }
  );
});

module.exports = router;
