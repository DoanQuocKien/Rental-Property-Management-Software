import { useState, useEffect } from 'react';
import api from '../api';
import TenantLayout from '../components/layout/TenantLayout';

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
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/invoices');
      setInvoices(res.data.invoices || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  const handlePay = async () => {
    if (!payMethod) { setPayError('Vui lòng chọn phương thức thanh toán'); return; }
    setPayLoading(true);
    setPayError('');
    try {
      await api.post(`/tenants/invoices/${payingInvoice.id}/pay`, { payment_method: payMethod });
      setPaySuccess('Thanh toán thành công! 🎉');
      fetchInvoices();
      setTimeout(() => { setPayingInvoice(null); setPaySuccess(''); setPayMethod(''); }, 2000);
    } catch (err) {
      setPayError(err.response?.data?.error || 'Thanh toán thất bại');
    } finally {
      setPayLoading(false);
    }
  };

  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total_amount, 0);

  return (
    <TenantLayout title="Hóa đơn" subtitle="Quản lý và thanh toán các hóa đơn hàng tháng">

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
        <div className="stat-card-new" style={{ borderLeft: '4px solid #667eea' }}>
          <div className="stat-icon">🧾</div>
          <div className="stat-info">
            <span className="stat-value">{invoices.length}</span>
            <span className="stat-label">Tổng hóa đơn</span>
          </div>
        </div>
        <div className="stat-card-new" style={{ borderLeft: '4px solid #e53e3e' }}>
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <span className="stat-value">{invoices.filter(i => i.status === 'unpaid').length}</span>
            <span className="stat-label">Chưa thanh toán</span>
          </div>
        </div>
        <div className="stat-card-new" style={{ borderLeft: '4px solid #e53e3e' }}>
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <span className="stat-value" style={{ fontSize: '1.1rem', color: totalUnpaid > 0 ? '#e53e3e' : '#38b2ac' }}>
              {Number(totalUnpaid).toLocaleString('vi-VN')}đ
            </span>
            <span className="stat-label">Tổng nợ</span>
          </div>
        </div>
      </div>

      <div className="content-card">
        {/* Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="tab-group">
            {[['all', 'Tất cả'], ['unpaid', 'Chưa TT'], ['paid', 'Đã TT']].map(([key, label]) => (
              <button key={key} className={`tab-item ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#aaa' }}>
            <div style={{ fontSize: '2.5rem' }}>🧾</div>
            <p style={{ marginTop: '12px' }}>Không có hóa đơn nào</p>
          </div>
        ) : (
          <table className="rooms-table">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Kỳ</th>
                <th>Tiền phòng</th>
                <th>Điện + Nước</th>
                <th>Tổng tiền</th>
                <th>Hạn TT</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const sc = STATUS_MAP[inv.status] || STATUS_MAP.unpaid;
                return (
                  <tr key={inv.id}>
                    <td className="font-bold">{inv.room_name}</td>
                    <td>Tháng {inv.month}/{inv.year}</td>
                    <td>{Number(inv.rent_amount || 0).toLocaleString('vi-VN')}đ</td>
                    <td>{Number((inv.electricity_amount || 0) + (inv.water_amount || 0)).toLocaleString('vi-VN')}đ</td>
                    <td className="font-bold" style={{ color: '#333' }}>{Number(inv.total_amount).toLocaleString('vi-VN')}đ</td>
                    <td style={{ color: inv.due_date && new Date(inv.due_date) < new Date() && inv.status === 'unpaid' ? '#e53e3e' : '#555' }}>
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td>
                      <span className="badge" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="edit-link" onClick={() => setSelectedInvoice(inv)}>Chi tiết</button>
                        {inv.status === 'unpaid' && (
                          <button className="delete-link" style={{ color: '#38b2ac' }}
                            onClick={() => { setPayingInvoice(inv); setPayMethod(''); setPayError(''); setPaySuccess(''); }}>
                            Thanh toán
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>🧾 Chi tiết hóa đơn</h2>
              <button onClick={() => setSelectedInvoice(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333' }}>{selectedInvoice.room_name}</div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>Tháng {selectedInvoice.month}/{selectedInvoice.year}</div>
            </div>
            {[
              ['🏠 Tiền phòng', selectedInvoice.rent_amount],
              ['⚡ Tiền điện', selectedInvoice.electricity_amount],
              ['💧 Tiền nước', selectedInvoice.water_amount],
              ['🔧 Dịch vụ khác', selectedInvoice.service_amount],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f2f5', fontSize: '0.9rem' }}>
                <span style={{ color: '#555' }}>{label}</span>
                <span style={{ fontWeight: '600' }}>{Number(val || 0).toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1rem', fontWeight: '700', color: '#333' }}>
              <span>Tổng cộng</span>
              <span style={{ color: '#667eea' }}>{Number(selectedInvoice.total_amount).toLocaleString('vi-VN')}đ</span>
            </div>
            {selectedInvoice.status === 'unpaid' && (
              <button
                onClick={() => { setSelectedInvoice(null); setPayingInvoice(selectedInvoice); setPayMethod(''); setPayError(''); setPaySuccess(''); }}
                className="btn-primary" style={{ marginTop: '8px' }}>
                Thanh toán ngay
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingInvoice && (
        <div className="modal-overlay" onClick={() => !payLoading && setPayingInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>💳 Thanh toán hóa đơn</h2>

            {paySuccess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '3rem' }}>✅</div>
                <p style={{ color: '#38b2ac', fontWeight: '600', marginTop: '12px' }}>{paySuccess}</p>
              </div>
            ) : (
              <>
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '600' }}>{payingInvoice.room_name} — Tháng {payingInvoice.month}/{payingInvoice.year}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#667eea', marginTop: '6px' }}>
                    {Number(payingInvoice.total_amount).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <p style={{ fontWeight: '600', marginBottom: '12px', color: '#555' }}>Chọn phương thức thanh toán:</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { id: 'qr_code', icon: '📱', label: 'QR Code' },
                    { id: 'e_wallet', icon: '💰', label: 'Ví điện tử' },
                    { id: 'bank_transfer', icon: '🏦', label: 'Chuyển khoản' },
                    { id: 'cash', icon: '💵', label: 'Tiền mặt' },
                  ].map(opt => (
                    <button key={opt.id}
                      onClick={() => setPayMethod(opt.id)}
                      style={{
                        padding: '14px', border: payMethod === opt.id ? '2px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '10px', background: payMethod === opt.id ? '#f0f4ff' : 'white',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        fontWeight: '600', color: payMethod === opt.id ? '#667eea' : '#555', fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}>
                      <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {payMethod === 'qr_code' && (
                  <div style={{ textAlign: 'center', background: '#f0f4ff', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#667eea', fontWeight: '600' }}>📲 Quét mã QR để thanh toán</div>
                    <div style={{ margin: '10px auto', width: '100px', height: '100px', background: '#ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.7rem' }}>
                      QR Code
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Nội dung: HD{payingInvoice.id?.toString().padStart(6, '0')}</div>
                  </div>
                )}

                {payError && <div className="error-message">{payError}</div>}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={() => setPayingInvoice(null)} disabled={payLoading} style={{ flex: 1 }}>
                    Hủy
                  </button>
                  <button className="btn-primary" onClick={handlePay} disabled={payLoading || !payMethod}
                    style={{ flex: 2, marginTop: 0 }}>
                    {payLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </TenantLayout>
  );
}
