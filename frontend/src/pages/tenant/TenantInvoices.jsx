import { useState, useEffect } from 'react';
import api from '../../api';

const STATUS_MAP = {
  paid: { label: 'Đã thanh toán', bg: '#e6fffa', color: '#38b2ac' },
  unpaid: { label: 'Chưa thanh toán', bg: '#fff5f5', color: '#e53e3e' },
  overdue: { label: 'Quá hạn', bg: '#fffbeb', color: '#d69e2e' },
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
      fetchInvoices();
    } catch { alert('Thanh toán thất bại, vui lòng thử lại.'); }
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
      {/* 1. Header nội dung */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Hóa đơn & Thanh toán</h2>
        <p style={{ color: '#718096' }}>Theo dõi lịch sử và thanh toán tiền phòng hàng tháng</p>
      </div>

      {/* 2. Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="content-card" style={{ borderLeft: '5px solid #667eea' }}>
          <div style={{ color: '#718096', fontSize: '0.85rem' }}>Tổng hóa đơn</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{invoices.length}</div>
        </div>
        <div className="content-card" style={{ borderLeft: '5px solid #e53e3e' }}>
          <div style={{ color: '#718096', fontSize: '0.85rem' }}>Chưa thanh toán</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e53e3e' }}>{Number(totalUnpaid).toLocaleString()}đ</div>
        </div>
      </div>

      {/* 3. Bảng danh sách */}
      <div className="content-card">
        <div className="tab-group" style={{ marginBottom: '20px' }}>
          {[['all', 'Tất cả'], ['unpaid', 'Chưa TT'], ['paid', 'Đã TT']].map(([key, label]) => (
            <button key={key} className={`tab-item ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>

        {loading ? <p>Đang tải...</p> : (
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Kỳ hóa đơn</th>
                <th>Tổng tiền</th>
                <th>Hạn thanh toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: '600' }}>Tháng {inv.month}/{inv.year}</td>
                  <td>{Number(inv.total_amount).toLocaleString()}đ</td>
                  <td>{new Date(inv.due_date).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className="badge" style={{ background: STATUS_MAP[inv.status].bg, color: STATUS_MAP[inv.status].color }}>
                      {STATUS_MAP[inv.status].label}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleOpenInvoice(inv)} style={{ marginRight: '10px', color: '#667eea', border: 'none', background: 'none', cursor: 'pointer' }}>Chi tiết</button>
                    {inv.status === 'unpaid' && (
                      <button type="button" onClick={() => setPayingInvoice(inv)} style={{ color: '#38b2ac', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Thanh toán</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODALS (Giữ nguyên logic nhưng tối ưu UI) --- */}
      {payingInvoice && (
        <div className="modal-overlay" onClick={() => setPayingInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>💳 Chọn phương thức</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {['QR Code', 'Ví MoMo', 'Chuyển khoản'].map(m => (
                <button key={m} onClick={() => setPayMethod(m)} style={{ padding: '15px', borderRadius: '8px', border: payMethod === m ? '2px solid #2d6a4f' : '1px solid #ddd', background: payMethod === m ? '#f0fff4' : 'white' }}>{m}</button>
              ))}
            </div>
            <button onClick={handlePay} disabled={!payMethod || payLoading} className="btn-primary" style={{ width: '100%', background: '#2d6a4f' }}>
              {payLoading ? 'Đang xử lý...' : 'Xác nhận trả tiền'}
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}