import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function TenantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cRes, iRes, mRes] = await Promise.all([
          api.get('/tenants/contract').catch(() => ({ data: { contract: null } })),
          api.get('/tenants/invoices').catch(() => ({ data: { invoices: [] } })),
          api.get('/tenants/maintenance').catch(() => ({ data: { requests: [] } })),
        ]);

        setContract(cRes.data.contract || null);
        setInvoices(iRes.data.invoices || []);
        setMaintenanceList(mRes.data.requests || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Logic tính toán
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
  const totalDebt = unpaidInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const pendingMaintenance = maintenanceList.filter(m => m.status === 'pending' || m.status === 'in_progress').length;

  const contractDaysLeft = contract
    ? Math.max(0, Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  // --- Render Helpers ---
  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>⏳ Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="tenant-dashboard-wrapper">
      {/* 1. Tiêu đề chào mừng (Bỏ Layout cũ, dùng Div đơn giản) */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Xin chào, {user?.name} 👋</h2>
        <p style={{ color: '#718096' }}>Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* 2. Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="content-card" style={{ borderLeft: '5px solid #38b2ac', padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '5px' }}>Phòng hiện tại</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{contract ? contract.room_name : 'Chưa có'}</div>
        </div>

        <div className="content-card" style={{ borderLeft: '5px solid #e53e3e', padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '5px' }}>Tiền phòng chưa đóng</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e53e3e' }}>
            {totalDebt > 0 ? `${Number(totalDebt).toLocaleString()}đ` : '0đ'}
          </div>
        </div>

        <div className="content-card" style={{ borderLeft: '5px solid #667eea', padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '5px' }}>Hạn hợp đồng</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{contractDaysLeft !== null ? `${contractDaysLeft} ngày` : '—'}</div>
        </div>
      </div>

      {/* 3. Cảnh báo quan trọng */}
      {contractDaysLeft !== null && contractDaysLeft < 30 && (
        <div style={{ background: '#fffbeb', borderLeft: '4px solid #d69e2e', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#744210' }}>
          ⚠️ <strong>Chú ý:</strong> Hợp đồng của bạn sắp hết hạn. Vui lòng liên hệ chủ trọ sớm!
        </div>
      )}

      {/* 4. Nội dung chi tiết */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="content-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>💰 Hóa đơn mới nhất</h3>
          {invoices.length > 0 ? (
            invoices.slice(0, 3).map(inv => (
              <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f7fafc' }}>
                <span>Tháng {inv.month}</span>
                <strong>{Number(inv.total_amount).toLocaleString()}đ</strong>
              </div>
            ))
          ) : <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>Chưa có hóa đơn nào.</p>}
        </div>

        <div className="content-card">
          <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>📋 Tóm tắt hợp đồng</h3>
          {contract ? (
            <div style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
              <div>• Giá thuê: <strong>{Number(contract.rental_price).toLocaleString()}đ</strong></div>
              <div>• Tiền cọc: {Number(contract.deposit).toLocaleString()}đ</div>
              <div>• Ngày hết hạn: {new Date(contract.end_date).toLocaleDateString('vi-VN')}</div>
            </div>
          ) : <p style={{ color: '#a0aec0' }}>Bạn chưa có hợp đồng chính thức.</p>}
        </div>
      </div>
    </div>
  );
}