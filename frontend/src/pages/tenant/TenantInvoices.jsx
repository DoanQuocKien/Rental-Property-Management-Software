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
  partial: { label: 'Thanh toán một phần', icon: <IconAlert />, bg: '#fffbea', color: '#b7791f' },
  overdue: { label: 'Quá hạn', icon: <IconAlert />, bg: '#fffbeb', color: '#d69e2e' },
};

function getRemainingAmount(invoice) {
  const total = Number(invoice?.total_amount || 0);
  const paid = Number(invoice?.paid_amount || 0);
  return Math.max(0, total - paid);
}

export default function TenantInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [copied, setCopied] = useState(false);
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchInvoices();
    }, 12000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentSuccess = query.get('paymentSuccess');

    if (paymentSuccess === '1') {
      const status = query.get('status');
      const invoiceId = query.get('invoiceId');
      if (status === 'paid') {
        alert(`Thanh toán hóa đơn #${invoiceId || ''} thành công.`);
      } else {
        alert(`Đã ghi nhận thanh toán một phần cho hóa đơn #${invoiceId || ''}.`);
      }
      query.delete('paymentSuccess');
      query.delete('status');
      query.delete('invoiceId');

      const newQuery = query.toString();
      const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`;
      window.history.replaceState({}, '', newUrl);
      fetchInvoices();
    }
  }, []);

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);
  const totalUnpaid = invoices
    .filter(i => i.status === 'unpaid' || i.status === 'partial')
    .reduce((s, i) => s + getRemainingAmount(i), 0);

  const buildMockPaymentLink = (invoice) => {
    const amount = getRemainingAmount(invoice);
    const base = `${window.location.origin}/mock-payment`;
    const returnUrl = `${window.location.origin}/tenant/invoices`;
    return `${base}?invoiceId=${invoice.id}&amount=${Math.round(amount)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  const handleCopyLink = async (invoice) => {
    try {
      await navigator.clipboard.writeText(buildMockPaymentLink(invoice));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
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
          {[['all', 'Tất cả'], ['unpaid', 'Chưa TT'], ['partial', 'Một phần'], ['paid', 'Đã TT']].map(([key, label]) => (
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
                    background: (STATUS_MAP[inv.status] || STATUS_MAP.unpaid).bg,
                    color: (STATUS_MAP[inv.status] || STATUS_MAP.unpaid).color,
                    display: 'inline-flex', alignItems: 'center', gap: '5px'
                  }}>
                    {(STATUS_MAP[inv.status] || STATUS_MAP.unpaid).icon} {(STATUS_MAP[inv.status] || STATUS_MAP.unpaid).label}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => handleOpenInvoice(inv)} style={{ color: tenantColor, border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', marginRight: '15px' }}>
                    <IconInfo /> Chi tiết
                  </button>
                  {(inv.status === 'unpaid' || inv.status === 'partial') && (
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
                <div><strong>Đã thanh toán:</strong> {Number(selectedInvoice.paid_amount || 0).toLocaleString('vi-VN')}đ</div>
                <div><strong>Còn lại:</strong> {getRemainingAmount(selectedInvoice).toLocaleString('vi-VN')}đ</div>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ marginBottom: '12px' }}>Thanh toán qua QR mô phỏng</h3>
            <p style={{ marginTop: 0, color: '#4a5568' }}>
              Quét mã bằng điện thoại hoặc mở link thanh toán công khai.
            </p>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
              <div><strong>Hóa đơn:</strong> #{payingInvoice.id}</div>
              <div><strong>Số tiền còn lại:</strong> {getRemainingAmount(payingInvoice).toLocaleString('vi-VN')}đ</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(buildMockPaymentLink(payingInvoice))}`}
                alt="Mock payment QR"
                style={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', padding: '8px' }}
              />
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <button type="button" className="btn-primary" style={{ width: '100%', background: tenantColor }} onClick={() => window.open(buildMockPaymentLink(payingInvoice), '_blank')}>
                Mở cổng thanh toán
              </button>
              <button type="button" style={{ width: '100%', border: `1px solid ${tenantColor}`, color: tenantColor, background: 'white', borderRadius: '8px', padding: '10px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleCopyLink(payingInvoice)}>
                Sao chép link thanh toán
              </button>
              {copied ? <div style={{ color: '#2d6a4f', fontWeight: 600, fontSize: '0.9rem' }}>Đã sao chép link.</div> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
