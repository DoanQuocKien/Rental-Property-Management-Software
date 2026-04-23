import { useState, useEffect } from 'react';
import api from '../../api';

// --- HỆ THỐNG ICON SVG ---
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);
const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
const IconFile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>
);

const STATUS_MAP = {
  paid: { label: 'Đã thanh toán', icon: <IconCheck />, bg: '#e6fffa', color: '#2d6a4f' },
  unpaid: { label: 'Chưa thanh toán', icon: <IconAlert />, bg: '#fff5f5', color: '#e53e3e' },
  overdue: { label: 'Quá hạn', icon: <IconAlert />, bg: '#fffbeb', color: '#d69e2e' },
};

export default function TenantInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payMethod, setPayMethod] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const tenantColor = '#2d6a4f';

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/invoices');
      setInvoices(res.data.invoices || []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total_amount, 0);

  const handlePay = async () => {
    if (!payMethod) return;
    setPayLoading(true);
    try {
      await api.post(`/tenants/invoices/${payingInvoice.id}/pay`, { payment_method: payMethod });
      alert('Thanh toán thành công! 🎉');
      setPayingInvoice(null);
      setPayMethod('');
      fetchInvoices();
    } catch { alert('Thanh toán thất bại.'); }
    finally { setPayLoading(false); }
  };

  const handleOpenInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setSelectedLoading(true);
    try {
      const res = await api.get(`/tenants/invoices/${invoice.id}`);
      setSelectedInvoice(res.data.invoice || invoice);
    } catch {
      setSelectedInvoice(invoice);
    } finally {
      setSelectedLoading(false);
    }
  };

  return (
    <div className="tenant-invoices-container">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Hóa đơn & Thanh toán</h2>
        <p style={{ color: '#718096' }}>Tra cứu lịch sử và thực hiện nghĩa vụ tài chính</p>
      </div>

      {/* 1. Thẻ Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="content-card" style={{ borderLeft: `5px solid ${tenantColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#718096', fontSize: '0.85rem' }}>Tổng hóa đơn</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{invoices.length}</div>
          </div>
          <div style={{ color: tenantColor, opacity: 0.3 }}><IconFile /></div>
        </div>
        <div className="content-card" style={{ borderLeft: '5px solid #e53e3e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#718096', fontSize: '0.85rem' }}>Còn nợ</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#e53e3e' }}>{Number(totalUnpaid).toLocaleString()}đ</div>
          </div>
          <div style={{ color: '#e53e3e', opacity: 0.3 }}><IconWallet /></div>
        </div>
      </div>

      {/* 2. Danh sách */}
      <div className="content-card">
        <div className="tab-group" style={{ marginBottom: '20px' }}>
          {[['all', 'Tất cả'], ['unpaid', 'Chưa TT'], ['paid', 'Đã TT']].map(([key, label]) => (
            <button
              key={key}
              className={`tab-item ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
              style={{ color: filter === key ? tenantColor : '#666', fontWeight: filter === key ? '700' : '400' }}
            >
              {label}
            </button>
          ))}
        </div>

        <table className="rooms-table">
          <thead>
            <tr>
              <th>Kỳ hóa đơn</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td style={{ fontWeight: '600' }}>Tháng {inv.month}/{inv.year}</td>
                <td>{Number(inv.total_amount).toLocaleString()}đ</td>
                <td>
                  <span className="badge" style={{
                    background: STATUS_MAP[inv.status]?.bg,
                    color: STATUS_MAP[inv.status]?.color,
                    display: 'inline-flex', alignItems: 'center', gap: '5px'
                  }}>
                    {STATUS_MAP[inv.status]?.icon} {STATUS_MAP[inv.status]?.label}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => handleOpenInvoice(inv)} style={{ color: tenantColor, border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', marginRight: '15px' }}>
                    <IconInfo /> Chi tiết
                  </button>
                  {inv.status === 'unpaid' && (
                    <button type="button" onClick={() => setPayingInvoice(inv)} style={{ color: 'white', background: tenantColor, border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Thanh toán
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0 }}>Chi tiết hóa đơn</h3>
              <button type="button" onClick={() => setSelectedInvoice(null)} style={{ border: 'none', background: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            {selectedLoading ? (
              <p>Đang tải chi tiết...</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px', fontSize: '0.92rem' }}>
                <div><strong>Kỳ hóa đơn:</strong> Tháng {selectedInvoice.month}/{selectedInvoice.year}</div>
                <div><strong>Phòng:</strong> {selectedInvoice.room_name || selectedInvoice.roomName || 'N/A'}</div>
                <div><strong>Tiền phòng:</strong> {Number(selectedInvoice.rent_amount || 0).toLocaleString('vi-VN')}đ</div>
                <div><strong>Tiền điện:</strong> {Number(selectedInvoice.electricity_amount || 0).toLocaleString('vi-VN')}đ</div>
                <div><strong>Tiền nước:</strong> {Number(selectedInvoice.water_amount || 0).toLocaleString('vi-VN')}đ</div>
                <div><strong>Phí dịch vụ:</strong> {Number(selectedInvoice.service_amount || 0).toLocaleString('vi-VN')}đ</div>
                <div><strong>Tổng tiền:</strong> {Number(selectedInvoice.total_amount || 0).toLocaleString('vi-VN')}đ</div>
                <div><strong>Hạn thanh toán:</strong> {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                <div><strong>Trạng thái:</strong> {(STATUS_MAP[selectedInvoice.status] || STATUS_MAP.unpaid).label}</div>
                {selectedInvoice.payment_method && <div><strong>Phương thức:</strong> {selectedInvoice.payment_method}</div>}
                {selectedInvoice.paid_at && <div><strong>Đã thanh toán lúc:</strong> {new Date(selectedInvoice.paid_at).toLocaleString('vi-VN')}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL THANH TOÁN --- */}
      {payingInvoice && (
        <div className="modal-overlay" onClick={() => setPayingInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '20px' }}>💳 Phương thức thanh toán</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {['Chuyển khoản QR', 'Ví điện tử MoMo', 'Tiền mặt'].map(m => (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  style={{
                    padding: '12px', borderRadius: '8px', textAlign: 'left',
                    border: payMethod === m ? `2px solid ${tenantColor}` : '1px solid #ddd',
                    background: payMethod === m ? '#f0fff4' : 'white'
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <button onClick={handlePay} disabled={!payMethod || payLoading} className="btn-primary" style={{ width: '100%', background: tenantColor }}>
              {payLoading ? 'Đang thực hiện...' : 'Xác nhận trả tiền'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
