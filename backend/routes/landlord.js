const express = require('express');
const db = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  calculateInvoiceTotal,
  BillingValidationError,
  ServicePricingConfigError,
} = require('../services/invoiceCalculator');
const { getPreviousMeterReading } = require('../services/meterReadingService');

const router = express.Router();

// GET /api/landlord/tenants — Danh sách tất cả khách thuê của landlord
// (những người đang có hợp đồng active với phòng của landlord này)
router.get('/tenants', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const tenants = await db.allAsync(
      `SELECT
        u.id,
        COALESCE(u.full_name, u.name) as fullName,
        u.email,
        u.phone_number as phoneNumber,
        u.citizen_id as citizenID,
        u.permanent_address as permanentAddress,
        u.created_at as createdAt,
        lc.id as contractID,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.status as contractStatus,
        lc.rental_price as rentalPrice,
        lc.deposit,
        r.id as roomID,
        r.name as roomName
       FROM users u
       JOIN lease_contracts lc ON lc.tenant_id = u.id
       JOIN rooms r ON lc.room_id = r.id
       WHERE r.landlord_id = ? AND lc.status = 'active'
       ORDER BY lc.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      status: 'success',
      data: tenants,
    });
  } catch (err) {
    console.error('Get landlord tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy danh sách khách thuê. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/tenants/pending — Danh sách khách thuê chưa được phê duyệt
// (những người vừa đăng ký và chưa có hợp đồng)
router.get('/tenants/pending', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const pendingTenants = await db.allAsync(
      `SELECT
        u.id,
        COALESCE(u.full_name, u.name) as fullName,
        u.email,
        u.phone_number as phoneNumber,
        u.citizen_id as citizenID,
        u.permanent_address as permanentAddress,
        u.created_at as createdAt,
        u.status
       FROM users u
       WHERE u.role IN ('tenant', 'Tenant') 
       AND u.status = 'pending'
       AND NOT EXISTS (
         SELECT 1 FROM lease_contracts lc 
         JOIN rooms r ON lc.room_id = r.id 
         WHERE lc.tenant_id = u.id AND r.landlord_id = ?
       )
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      status: 'success',
      data: pendingTenants,
    });
  } catch (err) {
    console.error('Get pending tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy danh sách khách thuê chưa duyệt. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// PUT /api/landlord/tenants/:tenantId/approve — Phê duyệt khách thuê
router.put('/tenants/:tenantId/approve', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Update tenant status to active
    await db.runAsync(
      `UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role IN ('tenant', 'Tenant')`,
      [tenantId]
    );

    res.json({
      status: 'success',
      message: 'Khách thuê đã được phê duyệt thành công',
    });
  } catch (err) {
    console.error('Approve tenant error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi phê duyệt khách thuê. Vui lòng thử lại sau.',
    });
  }
});

// GET /api/landlord/dashboard/tenants — Lấy tất cả khách thuê (active + pending) cho dashboard
router.get('/dashboard/tenants', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    // Fetch active tenants with contracts
    const activeTenants = await db.allAsync(
      `SELECT
        u.id,
        COALESCE(u.full_name, u.name) as fullName,
        u.email,
        u.phone_number as phoneNumber,
        u.citizen_id as citizenID,
        u.permanent_address as permanentAddress,
        u.created_at as createdAt,
        u.status,
        lc.id as contractID,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.status as contractStatus,
        lc.rental_price as rentalPrice,
        lc.deposit,
        r.id as roomID,
        r.name as roomName
       FROM users u
       JOIN lease_contracts lc ON lc.tenant_id = u.id
       JOIN rooms r ON lc.room_id = r.id
       WHERE r.landlord_id = ? AND u.status = 'active' AND lc.status = 'active'
       ORDER BY lc.created_at DESC`,
      [req.user.id]
    );

    // Fetch pending tenants without contracts
    const pendingTenants = await db.allAsync(
      `SELECT
        u.id,
        COALESCE(u.full_name, u.name) as fullName,
        u.email,
        u.phone_number as phoneNumber,
        u.citizen_id as citizenID,
        u.permanent_address as permanentAddress,
        u.created_at as createdAt,
        u.status,
        NULL as contractID,
        NULL as startDate,
        NULL as endDate,
        NULL as contractStatus,
        NULL as rentalPrice,
        NULL as deposit,
        NULL as roomID,
        NULL as roomName
       FROM users u
       WHERE u.role IN ('tenant', 'Tenant') 
       AND u.status = 'pending'
       AND NOT EXISTS (
         SELECT 1 FROM lease_contracts lc 
         JOIN rooms r ON lc.room_id = r.id 
         WHERE lc.tenant_id = u.id AND r.landlord_id = ?
       )
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );

    const allTenants = [...activeTenants, ...pendingTenants];

    return res.json({
      status: 'success',
      data: {
        activeTenants,
        pendingTenants,
        allTenants,
      },
    });
  } catch (err) {
    console.error('Get dashboard tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy danh sách khách thuê. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/all — Danh sách tất cả khách thuê (active + pending) cho dropdown/selection
router.get('/all', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const allTenants = await db.allAsync(
      `SELECT
        u.id,
        COALESCE(u.full_name, u.name) as fullName,
        u.email,
        u.phone_number as phoneNumber,
        u.citizen_id as citizenID,
        u.permanent_address as permanentAddress,
        u.created_at as createdAt,
        u.status,
        CASE WHEN EXISTS (
          SELECT 1 FROM lease_contracts lc2
          WHERE lc2.tenant_id = u.id AND lc2.status = 'active'
        ) THEN 1 ELSE 0 END as hasActiveContract
       FROM users u
       WHERE u.role IN ('tenant', 'Tenant')
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      status: 'success',
      data: allTenants,
    });
  } catch (err) {
    console.error('Get all tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy danh sách khách thuê. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/tenants/all — Tất cả tài khoản tenant trong hệ thống
// (để landlord tìm kiếm khi tạo hợp đồng mới)
router.get('/tenants/all', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { search } = req.query;

  let query = `
    SELECT
      u.id,
      COALESCE(u.full_name, u.name) as fullName,
      u.email,
      u.phone_number as phoneNumber,
      u.citizen_id as citizenID,
      u.permanent_address as permanentAddress,
      u.created_at as createdAt,
      CASE WHEN EXISTS (
        SELECT 1 FROM lease_contracts lc2
        WHERE lc2.tenant_id = u.id AND lc2.status = 'active'
      ) THEN 1 ELSE 0 END as hasActiveContract
    FROM users u
    WHERE u.role IN ('tenant', 'Tenant')
  `;
  const params = [];

  if (search && search.trim()) {
    query += ` AND (
      COALESCE(u.full_name, u.name) LIKE ? OR
      u.email LIKE ? OR
      u.citizen_id LIKE ? OR
      u.phone_number LIKE ?
    )`;
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += ` ORDER BY u.created_at DESC`;

  try {
    const tenants = await db.allAsync(query, params);
    return res.json({
      status: 'success',
      data: tenants,
    });
  } catch (err) {
    console.error('Get all tenants error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy danh sách khách thuê. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/tenants/:id — Chi tiết một khách thuê
router.get('/tenants/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const tenantId = Number(req.params.id);

  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã người thuê không hợp lệ.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  try {
    const tenant = await db.getAsync(
      `SELECT
        id,
        COALESCE(full_name, name) as fullName,
        email,
        phone_number as phoneNumber,
        citizen_id as citizenID,
        permanent_address as permanentAddress,
        date_of_birth as dateOfBirth,
        gender,
        created_at as createdAt
       FROM users
       WHERE id = ? AND role IN ('tenant', 'Tenant')`,
      [tenantId]
    );

    if (!tenant) {
      return res.status(404).json({
        status: 'error',
        message: 'Người thuê không tồn tại.',
        errorCode: 'TENANT_NOT_FOUND',
      });
    }

    // Lịch sử hợp đồng của tenant này với phòng của landlord
    const contracts = await db.allAsync(
      `SELECT
        lc.id as contractID,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.deposit,
        lc.rental_price as rentalPrice,
        lc.status,
        r.id as roomID,
        r.name as roomName
       FROM lease_contracts lc
       JOIN rooms r ON lc.room_id = r.id
       WHERE lc.tenant_id = ? AND r.landlord_id = ?
       ORDER BY lc.created_at DESC`,
      [tenantId, req.user.id]
    );

    return res.json({
      status: 'success',
      data: { ...tenant, contracts },
    });
  } catch (err) {
    console.error('Get tenant detail error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy thông tin người thuê. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// GET /api/landlord/maintenance — Yêu cầu bảo trì cho landlord xem
router.get('/maintenance', authenticateToken, requireRole('landlord'), async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT
      mr.id,
      mr.description,
      mr.category,
      mr.priority,
      mr.status,
      mr.resolution_note as resolutionNote,
      mr.created_at as createdAt,
      mr.updated_at as updatedAt,
      COALESCE(u.full_name, u.name) as tenantName,
      u.phone_number as tenantPhone,
      r.id as roomID,
      r.name as roomName
    FROM maintenance_requests mr
    JOIN users u ON mr.tenant_id = u.id
    JOIN rooms r ON mr.room_id = r.id
    WHERE r.landlord_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ` AND mr.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY
    CASE mr.priority WHEN 'high' THEN 0 ELSE 1 END,
    mr.created_at DESC`;

  try {
    const requests = await db.allAsync(query, params);
    return res.json({
      status: 'success',
      data: requests,
    });
  } catch (err) {
    console.error('Get maintenance requests error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi lấy yêu cầu bảo trì. Vui lòng thử lại sau.',
      errorCode: 'FETCH_FAILED',
    });
  }
});

// PUT /api/landlord/maintenance/:id — Cập nhật trạng thái yêu cầu bảo trì
router.put('/maintenance/:id', authenticateToken, requireRole('landlord'), async (req, res) => {
  const requestId = Number(req.params.id);
  const { status, resolutionNote } = req.body;

  const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã yêu cầu không hợp lệ.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Trạng thái phải là một trong các giá trị: ${VALID_STATUSES.join(', ')}`,
      errorCode: 'INVALID_STATUS',
    });
  }

  try {
    // Đảm bảo yêu cầu này thuộc về phòng của landlord
    const request = await db.getAsync(
      `SELECT mr.id FROM maintenance_requests mr
       JOIN rooms r ON mr.room_id = r.id
       WHERE mr.id = ? AND r.landlord_id = ?`,
      [requestId, req.user.id]
    );

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy yêu cầu bảo trì.',
        errorCode: 'REQUEST_NOT_FOUND',
      });
    }

    await db.runAsync(
      `UPDATE maintenance_requests
       SET status = ?, resolution_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, resolutionNote || null, requestId]
    );

    return res.json({
      status: 'success',
      message: 'Yêu cầu bảo trì đã được cập nhật thành công.',
    });
  } catch (err) {
    console.error('Update maintenance error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi khi cập nhật yêu cầu bảo trì. Vui lòng thử lại sau.',
      errorCode: 'UPDATE_FAILED',
    });
  }
});

// GET /api/landlord/rooms/:roomID/previous-reading?month=&year=
// Lấy chỉ số gần nhất trước kỳ hiện tại để đối chiếu khi lập hóa đơn.
router.get('/rooms/:roomID/previous-reading', authenticateToken, requireRole('landlord'), async (req, res) => {
  const roomID = Number(req.params.roomID);
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (
    !Number.isInteger(roomID) ||
    roomID <= 0 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 9999
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã phòng phải là số nguyên dương, tháng phải từ 1 đến 12, và năm phải từ 2000 đến 9999.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  try {
    const room = await db.getAsync('SELECT id FROM rooms WHERE id = ? AND landlord_id = ?', [roomID, req.user.id]);

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy phòng.',
        errorCode: 'ROOM_NOT_FOUND',
      });
    }

    const previousReading = await getPreviousMeterReading(roomID, month, year);

    return res.json({
      status: 'success',
      data: {
        previousReading,
      },
    });
  } catch (error) {
    console.error('Get previous meter reading error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không thể lấy chỉ số trước đó. Vui lòng kiểm tra phòng và chỉ số máy đo.',
      errorCode: 'PREVIOUS_READING_FAILED',
    });
  }
});

// POST /api/landlord/invoices/calculate
// Tính preview tổng tiền hóa đơn, không ghi DB.
router.post('/invoices/calculate', authenticateToken, requireRole('landlord'), async (req, res) => {
  const {
    roomID,
    month,
    year,
    roomPrice,
    prevElectricityIndex,
    currentElectricityIndex,
    prevWaterIndex,
    currentWaterIndex,
    serviceFees,
    serviceUnitPrices,
  } = req.body || {};

  const parsedRoomID = Number(roomID);
  const parsedMonth = Number(month);
  const parsedYear = Number(year);

  if (!Number.isInteger(parsedRoomID) || parsedRoomID <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Mã phòng không hợp lệ.',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 || !Number.isInteger(parsedYear)) {
    return res.status(400).json({
      status: 'error',
      message: 'Tháng và Năm phải là số nguyên hợp lệ (tháng 1-12, năm 2000-9999).',
      errorCode: 'INVALID_PAYLOAD',
    });
  }

  try {
    const room = await db.getAsync('SELECT id, price FROM rooms WHERE id = ? AND landlord_id = ?', [parsedRoomID, req.user.id]);

    if (!room) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy phòng.',
        errorCode: 'ROOM_NOT_FOUND',
      });
    }

    const previousReading = await getPreviousMeterReading(parsedRoomID, parsedMonth, parsedYear);

    const resolvedPrevElectricity = prevElectricityIndex ?? previousReading?.electricityIndex ?? 0;
    const resolvedPrevWater = prevWaterIndex ?? previousReading?.waterIndex ?? 0;

    const invoiceResult = calculateInvoiceTotal({
      roomPrice: roomPrice ?? room.price,
      prevElectricityIndex: resolvedPrevElectricity,
      currentElectricityIndex,
      prevWaterIndex: resolvedPrevWater,
      currentWaterIndex,
      serviceFees,
      serviceUnitPrices,
    });

    return res.json({
      status: 'success',
      data: {
        roomID: parsedRoomID,
        month: parsedMonth,
        year: parsedYear,
        previousReading,
        resolvedPreviousIndexes: {
          prevElectricityIndex: resolvedPrevElectricity,
          prevWaterIndex: resolvedPrevWater,
        },
        ...invoiceResult,
      },
    });
  } catch (error) {
    if (error instanceof BillingValidationError) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
        errorCode: error.code,
        details: error.details,
      });
    }

    if (error instanceof ServicePricingConfigError) {
      return res.status(400).json({
        status: 'error',
        message: `${error.message} Please review service price settings.`,
        errorCode: error.code,
        missingFields: error.missingFields,
      });
    }

    console.error('Invoice calculation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Thanh toán thất bại. Vui lòng kiểm tra cấu hình giá dịch vụ.',
      errorCode: 'INVOICE_CALCULATION_FAILED',
    });
  }
});

// --- SPRINT 4: API THỐNG KÊ TÀI CHÍNH (UC-12) ---
router.get('/financial-stats', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const landlordId = req.user.id;

    // 1. Doanh thu thực tế (Tổng tiền đã thanh toán)
    const revenueData = await db.getAsync(`
      SELECT SUM(paid_amount) as totalRevenue
      FROM invoices i
      JOIN rooms r ON i.room_id = r.id
      WHERE r.landlord_id = ? AND i.status = 'paid'`, [landlordId]);

    // 2. Tổng nợ xấu (Hóa đơn quá hạn hoặc chưa đóng đủ)
    const badDebtData = await db.getAsync(`
      SELECT SUM(total_amount - paid_amount) as totalBadDebt
      FROM invoices i
      JOIN rooms r ON i.room_id = r.id
      WHERE r.landlord_id = ? AND i.status IN ('unpaid', 'partial')`, [landlordId]);

    // 3. Tỷ lệ lấp đầy phòng
    const roomStats = await db.getAsync(`
      SELECT
        COUNT(*) as totalRooms,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupiedRooms
      FROM rooms WHERE landlord_id = ?`, [landlordId]);

    res.json({
      status: 'success',
      data: {
        totalRevenue: revenueData.totalRevenue || 0,
        badDebt: badDebtData.totalBadDebt || 0,
        occupancyRate: roomStats.totalRooms > 0
          ? Math.round((roomStats.occupiedRooms / roomStats.totalRooms) * 100)
          : 0,
        totalRooms: roomStats.totalRooms
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy thống kê' });
  }
});

// GET /api/landlord/settings — Lấy cấu hình dịch vụ của landlord
router.get('/settings', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    let settings = await db.getAsync(
      `SELECT * FROM landlord_settings WHERE landlord_id = ?`,
      [req.user.id]
    );

    // If no settings exist, return default values
    if (!settings) {
      settings = {
        landlord_id: req.user.id,
        electricity_price: 0,
        water_price: 0,
        wifi_price: 0,
        garbage_price: 0,
        parking_price: 0,
      };
    }

    res.json({
      status: 'success',
      data: settings,
    });
  } catch (err) {
    console.error('Get landlord settings error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy cấu hình. Vui lòng thử lại sau.',
    });
  }
});

// PUT /api/landlord/settings — Lưu cấu hình dịch vụ của landlord
router.put('/settings', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const {
      electricity_price,
      water_price,
      wifi_price,
      garbage_price,
      parking_price,
      property_name,
      address,
      total_floors,
      total_rooms,
      rules,
      wifi_info,
      parking,
      deposit_months,
      notice_days,
    } = req.body;

    // Check if settings already exist for this landlord
    const existingSettings = await db.getAsync(
      `SELECT id FROM landlord_settings WHERE landlord_id = ?`,
      [req.user.id]
    );

    if (existingSettings) {
      // UPDATE existing settings
      await db.runAsync(
        `UPDATE landlord_settings
         SET electricity_price = ?,
             water_price = ?,
             wifi_price = ?,
             garbage_price = ?,
             parking_price = ?,
             property_name = ?,
             address = ?,
             total_floors = ?,
             total_rooms = ?,
             rules = ?,
             wifi_info = ?,
             parking = ?,
             deposit_months = ?,
             notice_days = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE landlord_id = ?`,
        [
          electricity_price || 0,
          water_price || 0,
          wifi_price || 0,
          garbage_price || 0,
          parking_price || 0,
          property_name || null,
          address || null,
          total_floors || null,
          total_rooms || null,
          rules || null,
          wifi_info || null,
          parking || null,
          deposit_months || 2,
          notice_days || 30,
          req.user.id,
        ]
      );
    } else {
      // INSERT new settings
      await db.runAsync(
        `INSERT INTO landlord_settings (
          landlord_id,
          electricity_price,
          water_price,
          wifi_price,
          garbage_price,
          parking_price,
          property_name,
          address,
          total_floors,
          total_rooms,
          rules,
          wifi_info,
          parking,
          deposit_months,
          notice_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          electricity_price || 0,
          water_price || 0,
          wifi_price || 0,
          garbage_price || 0,
          parking_price || 0,
          property_name || null,
          address || null,
          total_floors || null,
          total_rooms || null,
          rules || null,
          wifi_info || null,
          parking || null,
          deposit_months || 2,
          notice_days || 30,
        ]
      );
    }

    // Fetch and return the updated settings
    const updatedSettings = await db.getAsync(
      `SELECT * FROM landlord_settings WHERE landlord_id = ?`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      message: 'Cấu hình dịch vụ đã được lưu thành công',
      data: updatedSettings,
    });
  } catch (err) {
    console.error('Save landlord settings error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lưu cấu hình. Vui lòng thử lại sau.',
    });
  }
});

module.exports = router;
