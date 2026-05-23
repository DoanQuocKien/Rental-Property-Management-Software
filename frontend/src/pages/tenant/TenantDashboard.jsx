import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

// --- HỆ THỐNG ICON SVG SẮC NÉT ---
const Icons = {
  home: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  dollar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  tool: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
};

export default function TenantDashboard() {
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cRes, iRes, mRes] = await Promise.all([
          api.get('/contracts/my-contract').catch(() => ({ data: { data: null } })),
          api.get('/tenants/invoices').catch(() => ({ data: { invoices: [] } })),
          api.get('/tenants/maintenance').catch(() => ({ data: { requests: [] } })),
        ]);
        setContract(cRes.data.data || null);
        setInvoices(iRes.data.invoices || []);
        setMaintenanceList(mRes.data.requests || []);
      } catch (err) {
        console.error("Lỗi Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // --- LOGIC TÍNH TOÁN (ĐÃ BỌC AN TOÀN ĐỂ KHÔNG BAO GIỜ CRASH) ---
  const validContract = contract && contract.room_name ? contract : null;
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeMaintenance = Array.isArray(maintenanceList) ? maintenanceList : [];

  const unpaidInvoices = safeInvoices.filter(i => i.status === 'unpaid');
  const totalDebt = unpaidInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const pendingMaintenance = safeMaintenance.filter(m => m.status === 'pending' || m.status === 'in_progress');

  const contractDaysLeft = validContract && validContract.end_date
    ? Math.max(0, Math.ceil((new Date(validContract.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#718096' }}>⏳ Đang tải dữ liệu...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* 1. CHÀO MỪNG (WELCOME CARD) */}
      <div style={welcomeCardStyle}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '8px' }}>
            Xin chào, {user?.fullName || user?.name || 'Khách thuê'} 👋
          </h2>
          <p style={{ color: '#4a5568', marginBottom: '15px' }}>
            Chào mừng bạn đến với hệ thống quản lý phòng trọ.
          </p>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <span style={badgeStyle}><Icons.mail /> {user?.email}</span>
            <span style={badgeStyle}><Icons.home /> Phòng: {validContract ? validContract.room_name : 'Chưa xếp phòng'}</span>
          </div>
        </div>
        <div style={{ fontSize: '4rem', opacity: 0.1 }}><Icons.home /></div>
      </div>

      {/* CẢNH BÁO KHÁCH MỒ CÔI (Chỉ hiện khi chưa có phòng) */}
      {!validContract && (
        <div style={{
          background: '#fffbeb',
          borderLeft: '5px solid #d69e2e',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{
            margin: '0 0 8px 0',
            fontSize: '1.05rem',
            color: '#975a16',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ Tài khoản chưa được liên kết phòng
          </h4>
          <p style={{ margin: 0, lineHeight: 1.6, color: '#744210', fontSize: '0.95rem' }}>
            Bạn chưa được Chủ trọ tạo hợp đồng giao phòng. Vui lòng liên hệ và đợi Chủ trọ hoàn tất thủ tục để các tính năng thống kê bên dưới được cập nhật.
          </p>
        </div>
      )}

      {/* 2. CHỈ SỐ THỐNG KÊ (VẪN HIỂN THỊ ĐỂ DEMO UX) */}
      <div style={statsGridStyle}>
        <div className="content-card" style={statCardStyle}>
          <div style={iconWrapperStyle('#e6fffa', '#38b2ac')}><Icons.home /></div>
          <div>
            <p style={labelStyle}>Phòng đang thuê</p>
            <h4 style={valueStyle}>{validContract ? validContract.room_name : '---'}</h4>
          </div>
        </div>

        <div className="content-card" style={statCardStyle}>
          <div style={iconWrapperStyle('#fff5f5', '#e53e3e')}><Icons.dollar /></div>
          <div>
            <p style={labelStyle}>Tiền chưa đóng</p>
            <h4 style={{ ...valueStyle, color: '#e53e3e' }}>
                {totalDebt > 0 ? `${Number(totalDebt).toLocaleString()}đ` : '0đ'}
            </h4>
          </div>
        </div>

        <div className="content-card" style={statCardStyle}>
          <div style={iconWrapperStyle('#ebf8ff', '#3182ce')}><Icons.calendar /></div>
          <div>
            <p style={labelStyle}>Hạn hợp đồng</p>
            <h4 style={valueStyle}>{contractDaysLeft !== null ? `${contractDaysLeft} ngày` : '---'}</h4>
          </div>
        </div>

        <div className="content-card" style={statCardStyle}>
          <div style={iconWrapperStyle('#fffaf0', '#d69e2e')}><Icons.tool /></div>
          <div>
            <p style={labelStyle}>Bảo trì đang chờ</p>
            <h4 style={valueStyle}>{pendingMaintenance.length} yêu cầu</h4>
          </div>
        </div>
      </div>

      {/* 3. CẢNH BÁO HẠN HỢP ĐỒNG */}
      {contractDaysLeft !== null && contractDaysLeft < 30 && (
        <div style={alertStyle}>
          <strong>⚠️ Nhắc nhở:</strong> Hợp đồng sắp hết hạn trong {contractDaysLeft} ngày. Vui lòng liên hệ chủ trọ!
        </div>
      )}

      {/* 4. CHI TIẾT PHỤ (BẢO TRÌ & HÓA ĐƠN) - VẪN GIỮ ĐỂ DEMO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>

        {/* Cột trái: Tiến độ bảo trì */}
        <div className="content-card" style={{ padding: '24px' }}>
          <h3 style={sectionTitleStyle}><Icons.tool /> Yêu cầu sửa chữa gần đây</h3>
          {pendingMaintenance.length > 0 ? (
            pendingMaintenance.slice(0, 3).map(req => (
              <div key={req.id} style={maintenanceItemStyle}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{req.category || 'Khác'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>{req.description}</div>
                </div>
                <span style={{
                  fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold',
                  background: '#fffaf0',
                  color: '#d69e2e'
                }}>
                  Đang chờ
                </span>
              </div>
            ))
          ) : <p style={emptyTextStyle}>Chưa có yêu cầu sửa chữa nào.</p>}
        </div>

        {/* Cột phải: Hóa đơn chưa thanh toán */}
        <div className="content-card" style={{ padding: '24px' }}>
          <h3 style={sectionTitleStyle}><Icons.dollar /> Hóa đơn cần thanh toán</h3>
          {unpaidInvoices.length > 0 ? (
            unpaidInvoices.map(inv => (
              <div key={inv.id} style={invoiceItemStyle}>
                <div>
                  <div style={{ fontWeight: '600' }}>Tháng {inv.month}/{inv.year}</div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>Cập nhật: {new Date(inv.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#e53e3e', fontWeight: 'bold' }}>{Number(inv.total_amount).toLocaleString()}đ</div>
                  <div style={{ fontSize: '0.7rem', color: '#e53e3e' }}>Chờ đóng</div>
                </div>
              </div>
            ))
          ) : <p style={emptyTextStyle}>Không còn hoá đơn nào cần thanh toán</p>}
        </div>

      </div>
    </div>
  );
}

// --- HỆ THỐNG STYLES GỌN GÀNG ---
const welcomeCardStyle = { background: 'white', borderRadius: '20px', padding: '30px', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '24px', border: '1px solid #edf2f7' };
const badgeStyle = { background: '#f7fafc', padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', color: '#4a5568', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' };
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' };
const statCardStyle = { padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' };
const iconWrapperStyle = (bg, color) => ({ background: bg, color: color, padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' });
const labelStyle = { fontSize: '0.8rem', color: '#718096', margin: 0 };
const valueStyle = { fontSize: '1.2rem', fontWeight: '800', margin: '4px 0 0', color: '#2d3748' };
const alertStyle = { background: '#fffbeb', borderLeft: '5px solid #d69e2e', padding: '15px', borderRadius: '10px', marginTop: '24px', color: '#744210', fontSize: '0.9rem' };
const sectionTitleStyle = { fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const maintenanceItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' };
const invoiceItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f7fafc' };
const emptyTextStyle = { textAlign: 'center', color: '#a0aec0', padding: '20px', fontSize: '0.9rem' };