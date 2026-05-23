const express = require('express');
const router = express.Router();
const db = require('../database');
const PDFDocument = require('pdfkit-table');
const ExcelJS = require('exceljs');
const path = require('path');

router.get('/temporary-residence', async (req, res) => {
  try {
    // Lấy danh sách khách thuê đang active từ các hợp đồng chưa hết hạn hoặc đang ở trạng thái active
    const query = `
      SELECT u.full_name, u.citizen_id, u.date_of_birth, u.permanent_address, c.start_date
      FROM users u
      JOIN lease_contracts c ON u.id = c.tenant_id
      WHERE c.status = 'active' OR c.is_expired = 0
      GROUP BY u.id
    `;
    const tenants = await db.allAsync(query);

    // Cấu hình lề và kích thước A4 để in ấn hợp lệ
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Danh_sach_tam_tru.pdf');

    doc.pipe(res);

    const fontRegular = path.join(__dirname, '..', 'fonts', 'arial.ttf');
    const fontBold = path.join(__dirname, '..', 'fonts', 'arialbd.ttf');

    // ======= PHẦN TIÊU ĐỀ CHUẨN MẪU =======
    doc.font(fontBold).fontSize(13)
       .text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' })
       .text('Độc lập - Tự do - Hạnh phúc', { align: 'center', underline: true });
    
    doc.moveDown(2);
    
    doc.font(fontBold).fontSize(14)
       .text('DANH SÁCH NGƯỜI LƯU TRÚ KÈM THEO', { align: 'center' })
       .fontSize(12).font(fontRegular)
       .text('(Phụ lục cho thông báo lưu trú)', { align: 'center', oblique: true });

    doc.moveDown(2);

    // ======= PHẦN BẢNG DỮ LIỆU =======
    // pdfkit-table format
    const tableArray = {
      headers: [
        { label: "STT", property: "stt", width: 30, align: "center", headerColor: "#E0E0E0" },
        { label: "Họ và tên", property: "name", width: 120, headerColor: "#E0E0E0" },
        { label: "Ngày sinh", property: "dob", width: 70, align: "center", headerColor: "#E0E0E0" },
        { label: "Số CCCD", property: "cccd", width: 90, align: "center", headerColor: "#E0E0E0" },
        { label: "Quê quán", property: "address", width: 130, headerColor: "#E0E0E0" },
        { label: "Ngày chuyển vào", property: "move_in", width: 75, align: "center", headerColor: "#E0E0E0" }
      ],
      datas: tenants.map((t, index) => ({
        stt: String(index + 1),
        name: t.full_name || '',
        dob: t.date_of_birth || '',
        cccd: t.citizen_id || '',
        address: t.permanent_address || '',
        move_in: t.start_date || ''
      }))
    };

    await doc.table(tableArray, {
      prepareHeader: () => doc.font(fontBold).fontSize(10),
      prepareRow: () => doc.font(fontRegular).fontSize(10),
      padding: 5
    });

    // ======= KÝ TÊN Ở CUỐI =======
    doc.moveDown(2);
    // Move to right side for signature
    doc.font(fontRegular).fontSize(11)
       .text('Người khai báo lưu trú', { align: 'right', continued: false })
       .text('(Ký, ghi rõ họ tên)', { align: 'right', oblique: true });

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

router.get('/tax', async (req, res) => {
  try {
    const query = `
      SELECT i.month, i.year, r.name as room_name,
             i.rent_amount, i.electricity_amount, i.water_amount, i.service_amount, i.total_amount
      FROM invoices i
      JOIN rooms r ON i.room_id = r.id
      WHERE LOWER(i.status) = 'paid' OR LOWER(i.payment_status) = 'paid'
      ORDER BY i.year DESC, i.month DESC, r.name ASC
    `;
    const invoices = await db.allAsync(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo Cáo Thuế');

    worksheet.columns = [
      { header: 'Tháng/Năm', key: 'month_year', width: 15 },
      { header: 'Tên phòng', key: 'room', width: 20 },
      { header: 'Tiền phòng', key: 'rent', width: 15 },
      { header: 'Tiền điện', key: 'electric', width: 15 },
      { header: 'Tiền nước', key: 'water', width: 15 },
      { header: 'Tiền dịch vụ', key: 'service', width: 15 },
      { header: 'Tổng cộng', key: 'total', width: 20 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    let grandTotal = 0;

    invoices.forEach(inv => {
      worksheet.addRow({
        month_year: `${inv.month}/${inv.year}`,
        room: inv.room_name,
        rent: inv.rent_amount || 0,
        electric: inv.electricity_amount || 0,
        water: inv.water_amount || 0,
        service: inv.service_amount || 0,
        total: inv.total_amount || 0
      });
      grandTotal += (inv.total_amount || 0);
    });

    // Add empty row then grand total
    worksheet.addRow({});
    const totalRow = worksheet.addRow({
      room: 'TỔNG DOANH THU',
      total: grandTotal
    });
    totalRow.font = { bold: true };
    totalRow.getCell('total').numFmt = '#,##0';

    // Format all number columns
    worksheet.getColumn('rent').numFmt = '#,##0';
    worksheet.getColumn('electric').numFmt = '#,##0';
    worksheet.getColumn('water').numFmt = '#,##0';
    worksheet.getColumn('service').numFmt = '#,##0';
    worksheet.getColumn('total').numFmt = '#,##0';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Bao_cao_thue.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Tax Excel:', error);
    res.status(500).json({ error: 'Failed to generate tax report' });
  }
});

module.exports = router;
