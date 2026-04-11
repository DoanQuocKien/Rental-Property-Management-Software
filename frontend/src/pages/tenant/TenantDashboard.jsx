import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import TenantLayout from '../../components/layout/TenantLayout';

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
        setContract(cRes.data.contract);
        setInvoices(iRes.data.invoices || []);
        setMaintenanceList(mRes.data.requests || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
  const totalDebt = unpaidInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const pendingMaintenance = maintenanceList.filter(m => m.status === 'pending' || m.status === 'in_progress').length;

  const contractDaysLeft = contract
    ? Math.max(0, Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const statusColor = (status) => {
    if (status === 'paid') return { bg: '#e6fffa', color: '#38b2ac' };
    if (status === 'unpaid') return { bg: '#fff5f5', color: '#e53e3e' };
    return { bg: '#fffbeb', color: '#d69e2e' };
  };

  const maintenanceStatusLabel = (status) => {
    const map = { pending: '⏳ Chờ xử lý', in_progress: '🔨 Đang sửa', completed: '✅ Hoàn thành', cancelled: '❌ Hủy' };
    return map[status] || status;
  };

  return (
    <TenantLayout title={`Xin chào, ${user?.name} 👋`} subtitle="Tổng quan tài khoản thuê phòng của bạn">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card-new" style={{ borderLeft: '4px solid #38b2ac' }}>
              <div className="stat-icon">🏠</div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: '1.3rem' }}>
                  {contract ? contract.room_name : '—'}
                </span>
                <span className="stat-label">Phòng hiện tại</span>
              </div>
            </div>

            <div className="stat-card-new" style={{ borderLeft: '4px solid #e53e3e' }}>
              <div className="stat-icon">💳</div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: '1.4rem', color: unpaidInvoices.length > 0 ? '#e53e3e' : '#38b2ac' }}>
                  {unpaidInvoices.length > 0
                    ? `${Number(totalDebt).toLocaleString('vi-VN')}đ`
                    : 'Đã thanh toán'}
                </span>
                <span className="stat-label">Nợ chưa thanh toán</span>
              </div>
            </div>

            <div className="stat-card-new" style={{ borderLeft: '4px solid #667eea' }}>
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: '1.4rem', color: contractDaysLeft !== null && contractDaysLeft < 30 ? '#d69e2e' : '#333' }}>
                  {contractDaysLeft !== null ? `${contractDaysLeft} ngày` : '—'}
                </span>
                <span className="stat-label">Hợp đồng còn lại</span>
              </div>
            </div>

            <div className="stat-card-new" style={{ borderLeft: '4px solid #d69e2e' }}>
              <div className="stat-icon">🔧</div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: '1.6rem', color: pendingMaintenance > 0 ? '#d69e2e' : '#38b2ac' }}>
                  {pendingMaintenance}
                </span>
                <span className="stat-label">Yêu cầu đang xử lý</span>
              </div>
            </div>
          </div>

          {/* Warning banners */}
          {contractDaysLeft !== null && contractDaysLeft < 30 && contractDaysLeft > 0 && (
            <div style={{
              background: '#fffbeb', border: '1px solid #f6e05e', borderLeft: '4px solid #d69e2e',
              borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px', color: '#744210'
            }}>
              ⚠️ <strong>Hợp đồng sắp hết hạn:</strong> Còn {contractDaysLeft} ngày. Vui lòng liên hệ chủ trọ để gia hạn.
            </div>
          )}
          {unpaidInvoices.length > 0 && (
            <div style={{
              background: '#fff5f5', border: '1px solid #feb2b2', borderLeft: '4px solid #e53e3e',
              borderRadius: '8px', padding: '14px 18px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px', color: '#742a2a'
            }}>
              🔔 <strong>Bạn có {unpaidInvoices.length} hóa đơn chưa thanh toán.</strong>
              <button
                onClick={() => navigate('/tenant/invoices')}
                style={{ marginLeft: 'auto', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Xem ngay
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Recent Invoices */}
            <div className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: '#333' }}>💰 Hóa đơn gần đây</h3>
                <button onClick={() => navigate('/tenant/invoices')}
                  style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                  Xem tất cả →
                </button>
              </div>
              {invoices.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Chưa có hóa đơn nào</p>
              ) : (
                invoices.slice(0, 4).map(inv => {
                  const sc = statusColor(inv.status);
                  return (
                    <div key={inv.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 0', borderBottom: '1px solid #f0f2f5'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{inv.room_name}</div>
                        <div style={{ color: '#888', fontSize: '0.8rem' }}>Tháng {inv.month}/{inv.year}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '700', color: '#333' }}>{Number(inv.total_amount).toLocaleString('vi-VN')}đ</div>
                        <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {inv.status === 'paid' ? 'Đã TT' : 'Chưa TT'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Maintenance requests */}
            <div className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: '#333' }}>🔧 Yêu cầu sửa chữa</h3>
                <button onClick={() => navigate('/tenant/maintenance')}
                  style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                  Gửi yêu cầu →
                </button>
              </div>
              {maintenanceList.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '20px' }}>Chưa có yêu cầu nào</p>
              ) : (
                maintenanceList.slice(0, 4).map(req => (
                  <div key={req.id} style={{
                    padding: '10px 0', borderBottom: '1px solid #f0f2f5'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: '0.9rem', color: '#333', flex: 1, marginRight: '10px' }}>
                        {req.description.length > 50 ? req.description.slice(0, 50) + '...' : req.description}
                      </div>
                      <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {maintenanceStatusLabel(req.status)}
                      </span>
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '4px' }}>
                      {new Date(req.created_at).toLocaleDateString('vi-VN')}
                      {req.priority === 'high' && <span style={{ marginLeft: '8px', color: '#e53e3e', fontWeight: '600' }}>🚨 Ưu tiên cao</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contract summary */}
          {contract && (
            <div className="content-card" style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>📋 Thông tin hợp đồng hiện tại</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Phòng', value: contract.room_name },
                  { label: 'Giá thuê', value: `${Number(contract.rental_price).toLocaleString('vi-VN')}đ/tháng` },
                  { label: 'Ngày bắt đầu', value: new Date(contract.start_date).toLocaleDateString('vi-VN') },
                  { label: 'Ngày kết thúc', value: new Date(contract.end_date).toLocaleDateString('vi-VN') },
                  { label: 'Tiền đặt cọc', value: `${Number(contract.deposit).toLocaleString('vi-VN')}đ` },
                  { label: 'Chủ trọ', value: contract.landlord_name },
                ].map(item => (
                  <div key={item.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontWeight: '600', color: '#333' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!contract && !loading && (
            <div className="content-card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏠</div>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>Bạn chưa có hợp đồng thuê phòng nào</p>
              <p style={{ fontSize: '0.9rem' }}>Vui lòng liên hệ chủ trọ để tạo hợp đồng</p>
            </div>
          )}
        </>
      )}
    </TenantLayout>
  );
}
