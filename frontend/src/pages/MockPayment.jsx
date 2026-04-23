import { useEffect, useMemo, useState } from 'react';
import api from '../api';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 20% 20%, #1b5e20, #0f3d2e 55%, #0a2e24 100%)',
    padding: '28px 16px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: '#f7fff9',
    borderRadius: '18px',
    boxShadow: '0 22px 50px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.35)',
  },
  head: {
    background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
    color: '#fff',
    padding: '18px 22px',
  },
  body: {
    padding: '22px',
    display: 'grid',
    gap: '14px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    paddingBottom: '8px',
    borderBottom: '1px dashed #c3dec9',
  },
  input: {
    width: '100%',
    border: '1.5px solid #8bc39a',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '16px',
    outline: 'none',
    background: '#fff',
    boxSizing: 'border-box',
  },
  button: {
    border: 'none',
    borderRadius: '10px',
    padding: '12px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    background: '#2e7d32',
    color: '#fff',
  },
};

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;
}

function parseAmount(value) {
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function withQuery(url, params) {
  const parsed = new URL(url, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    parsed.searchParams.set(key, value);
  });
  return parsed.toString();
}

export default function MockPayment() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);

  const invoiceId = Number(query.get('invoiceId') || 0);
  const queryAmount = Number(query.get('amount') || 0);
  const returnUrl = query.get('returnUrl') || '/tenant/invoices';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState(Number.isFinite(queryAmount) && queryAmount > 0 ? String(queryAmount) : '');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
        setError('URL không hợp lệ: thiếu invoiceId.');
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/invoices/mock-payment/${invoiceId}`);
        const data = res.data?.data;
        setInvoice(data || null);

        if (!transferAmount && data?.remaining_amount > 0) {
          setTransferAmount(String(data.remaining_amount));
        }
      } catch {
        setError('Không tải được thông tin hóa đơn.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, transferAmount]);

  const confirmTransfer = async () => {
    const amount = parseAmount(transferAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      return;
    }

    setError('');
    setMsg('');
    setSubmitting(true);

    try {
      const res = await api.post('/invoices/mock-payment/confirm', { invoiceId, amount });
      const payload = res.data?.data;
      const statusText = payload?.invoiceStatus === 'paid'
        ? 'Thanh toán đủ thành công. Đang quay lại RPMS...'
        : 'Đã ghi nhận thanh toán một phần. Đang quay lại RPMS...';

      setMsg(statusText);

      const redirectUrl = withQuery(returnUrl, {
        paymentSuccess: '1',
        invoiceId: String(invoiceId),
        status: payload?.invoiceStatus || 'partial',
      });

      setTimeout(() => {
        window.location.assign(redirectUrl);
      }, 1600);
    } catch (err) {
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
      setError(apiMessage || 'Xác nhận thanh toán thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, padding: '24px', textAlign: 'center' }}>Đang tải cổng thanh toán...</div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, padding: '24px', textAlign: 'center', color: '#b91c1c' }}>{error}</div>
      </div>
    );
  }

  const amountDue = invoice?.remaining_amount ?? queryAmount;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.head}>
          <div style={{ fontSize: '0.82rem', opacity: 0.88, letterSpacing: '0.04em' }}>MOCK PAYMENT GATEWAY</div>
          <h2 style={{ margin: '8px 0 4px', fontSize: '1.45rem' }}>Cổng Chuyển Khoản Mô Phỏng</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>RPMS Demo - quét QR và thanh toán như ví điện tử</p>
        </div>

        <div style={styles.body}>
          <div style={styles.row}>
            <strong>Mã hóa đơn</strong>
            <span>#{invoice?.id || invoiceId}</span>
          </div>
          <div style={styles.row}>
            <strong>Số tiền cần thanh toán</strong>
            <span style={{ color: '#0f5132', fontWeight: 700 }}>{formatVnd(amountDue)}</span>
          </div>

          <label htmlFor="transferAmount" style={{ fontWeight: 700 }}>Số tiền chuyển khoản</label>
          <input
            id="transferAmount"
            type="text"
            inputMode="numeric"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            placeholder="Ví dụ: 2500000"
            style={styles.input}
          />
          <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>
            Bạn có thể nhập số tiền nhỏ hơn để demo thanh toán một phần.
          </div>

          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          {msg ? <div style={{ color: '#166534', fontWeight: 700 }}>{msg}</div> : null}

          <button type="button" disabled={submitting} onClick={confirmTransfer} style={{ ...styles.button, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận chuyển tiền'}
          </button>
        </div>
      </div>
    </div>
  );
}
