import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';

// ─── Constants ────────────────────────────────────────────────────────────────
const NOW = new Date();
const CUR_MONTH = NOW.getMonth() + 1;
const CUR_YEAR  = NOW.getFullYear();

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS  = [CUR_YEAR - 1, CUR_YEAR, CUR_YEAR + 1];

const fmt     = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ─── Injected CSS ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  .inv-root { font-family: 'Be Vietnam Pro', sans-serif; color: #1a1f2e; }

  :root {
    --c-bg: #f4f6fb; --c-card: #ffffff; --c-border: #e8eaf2;
    --c-accent: #4f46e5; --c-accent2: #7c3aed;
    --c-green: #059669; --c-red: #dc2626; --c-amber: #d97706;
    --c-text: #1a1f2e; --c-muted: #64748b; --c-subtle: #94a3b8;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08);
    --shadow-md: 0 4px 16px rgba(0,0,0,.1);
    --shadow-lg: 0 12px 40px rgba(0,0,0,.14);
    --r: 14px;
  }

  .inv-header { margin-bottom: 28px; }
  .inv-header h2 { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 4px; }
  .inv-header p  { font-size: .88rem; color: var(--c-muted); margin: 0; }

  .inv-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
  .inv-stat  {
    background: var(--c-card); border-radius: var(--r); padding: 18px 20px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--c-border);
    display: flex; align-items: center; gap: 14px; transition: box-shadow .2s;
  }
  .inv-stat:hover { box-shadow: var(--shadow-md); }
  .inv-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
  .inv-stat-val  { font-size: 1.55rem; font-weight: 800; line-height: 1; color: var(--c-text); }
  .inv-stat-lbl  { font-size: .76rem; color: var(--c-muted); margin-top: 3px; font-weight: 500; }

  .inv-body  { display: grid; grid-template-columns: 400px 1fr; gap: 20px; align-items: start; }
  .inv-panel { background: var(--c-card); border-radius: var(--r); box-shadow: var(--shadow-sm); border: 1px solid var(--c-border); overflow: hidden; }
  .inv-panel-head { padding: 16px 20px; border-bottom: 1px solid var(--c-border); font-weight: 700; font-size: .92rem; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#f8f9ff,#f4f6fb); }
  .inv-panel-body { padding: 20px; }

  .inv-field { margin-bottom: 14px; }
  .inv-label { display: block; font-size: .78rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
  .inv-input { width: 100%; padding: 9px 12px; border-radius: 9px; outline: none; font-size: .9rem; border: 1.5px solid var(--c-border); background: #fafbff; color: var(--c-text); transition: border-color .2s, box-shadow .2s; font-family: inherit; box-sizing: border-box; }
  .inv-input:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(79,70,229,.12); background: #fff; }
  .inv-input.mono  { font-family: 'JetBrains Mono', monospace; font-size: .88rem; }
  .inv-input.ok    { border-color: var(--c-green); }
  .inv-input.err   { border-color: var(--c-red); background: #fff5f5; }
  .inv-hint { font-size: .74rem; color: var(--c-subtle); margin-top: 4px; }
  .inv-hint.warn { color: var(--c-amber); }
  .inv-hint.ok   { color: var(--c-green); }
  .inv-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .inv-index-box { background: #f8f9ff; border-radius: 10px; padding: 14px; border: 1px solid #e0e4f5; margin-bottom: 14px; }
  .inv-index-label { font-size: .8rem; font-weight: 700; color: var(--c-accent); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .inv-index-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .inv-prev-val { background: #eef0fb; border-radius: 7px; padding: 8px 10px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: .9rem; font-weight: 600; color: var(--c-accent); border: 1px solid #d5d9f5; }
  .inv-prev-label { font-size: .68rem; color: var(--c-muted); margin-bottom: 2px; font-weight: 500; }
  .inv-usage-tag { font-size: .74rem; font-weight: 600; padding: 3px 8px; border-radius: 20px; display: inline-block; margin-top: 4px; }
  .inv-divider { border: none; border-top: 1px dashed var(--c-border); margin: 16px 0; }

  .inv-btn-calc { width: 100%; padding: 12px; border-radius: 10px; border: none; cursor: pointer; font-size: .92rem; font-weight: 700; font-family: inherit; letter-spacing: .3px; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; box-shadow: 0 4px 12px rgba(79,70,229,.35); transition: all .2s; }
  .inv-btn-calc:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,.4); }
  .inv-btn-calc:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
  .inv-btn-save { width: 100%; padding: 12px; border-radius: 10px; border: none; cursor: pointer; font-size: .92rem; font-weight: 700; font-family: inherit; letter-spacing: .3px; background: linear-gradient(135deg,#059669,#047857); color: #fff; box-shadow: 0 4px 12px rgba(5,150,105,.3); transition: all .2s; margin-top: 10px; }
  .inv-btn-save:hover:not(:disabled) { transform: translateY(-1px); }
  .inv-btn-save:disabled { opacity: .55; cursor: not-allowed; transform: none; }
  .inv-btn-sec { width: 100%; padding: 10px; border-radius: 9px; border: 1.5px solid var(--c-border); background: white; cursor: pointer; font-size: .88rem; font-weight: 600; color: var(--c-muted); font-family: inherit; transition: all .18s; margin-top: 8px; }
  .inv-btn-sec:hover { border-color: var(--c-accent); color: var(--c-accent); background: #f8f9ff; }

  .inv-result { background: linear-gradient(135deg,#f0f4ff,#f8f0ff); border-radius: 12px; padding: 18px; border: 1.5px solid #d5d9f5; margin-top: 16px; animation: fadeUp .3s ease; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  .inv-result-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; font-size: .88rem; }
  .inv-result-row + .inv-result-row { border-top: 1px solid rgba(79,70,229,.12); }
  .inv-result-lbl { color: var(--c-muted); }
  .inv-result-val { font-weight: 600; font-family: 'JetBrains Mono', monospace; color: var(--c-text); font-size: .86rem; }
  .inv-result-total { margin-top: 12px; padding: 12px 14px; background: linear-gradient(135deg,#4f46e5,#7c3aed); border-radius: 9px; display: flex; justify-content: space-between; align-items: center; }
  .inv-result-total-lbl { color: rgba(255,255,255,.85); font-weight: 600; font-size: .9rem; }
  .inv-result-total-val { color: #fff; font-weight: 800; font-size: 1.2rem; font-family: 'JetBrains Mono', monospace; }

  .inv-toolbar { padding: 14px 20px; border-bottom: 1px solid var(--c-border); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; background: #fafbff; }
  .inv-tab-group { display: flex; background: var(--c-bg); padding: 3px; border-radius: 9px; gap: 2px; }
  .inv-tab { padding: 6px 14px; border-radius: 7px; border: none; cursor: pointer; font-family: inherit; font-size: .82rem; font-weight: 600; transition: all .18s; color: var(--c-muted); background: transparent; }
  .inv-tab.active { background: white; color: var(--c-accent); box-shadow: var(--shadow-sm); }
  .inv-search { flex: 1; min-width: 160px; padding: 7px 10px 7px 32px; border-radius: 9px; border: 1.5px solid var(--c-border); outline: none; font-size: .85rem; font-family: inherit; background: white; color: var(--c-text); transition: border-color .2s; }
  .inv-search:focus { border-color: var(--c-accent); }
  .inv-search-wrap { position: relative; flex: 1; min-width: 160px; }
  .inv-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--c-subtle); font-size: .9rem; pointer-events: none; }

  .inv-table { width: 100%; border-collapse: collapse; }
  .inv-th { padding: 11px 14px; text-align: left; font-size: .74rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: .5px; background: #fafbff; border-bottom: 2px solid var(--c-border); }
  .inv-td { padding: 13px 14px; font-size: .87rem; border-bottom: 1px solid var(--c-border); }
  .inv-tr { transition: background .15s; cursor: pointer; }
  .inv-tr:hover { background: #f8f9ff; }

  .inv-badge { padding: 4px 10px; border-radius: 20px; font-size: .74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
  .badge-paid    { background: #d1fae5; color: #065f46; }
  .badge-unpaid  { background: #fee2e2; color: #991b1b; }
  .badge-overdue { background: #fef3c7; color: #92400e; }
  .badge-partial { background: #e0f2fe; color: #0369a1; }

  .inv-empty { padding: 60px 20px; text-align: center; color: var(--c-subtle); }
  .inv-empty-icon { font-size: 3rem; margin-bottom: 12px; }

  .inv-modal-bg { position: fixed; inset: 0; background: rgba(15,20,40,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn .18s; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .inv-modal { background: white; border-radius: 18px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: popUp .22s cubic-bezier(.34,1.56,.64,1); }
  @keyframes popUp { from { opacity:0; transform:scale(.94) translateY(12px); } to { opacity:1; transform:none; } }
  .inv-modal-head { padding: 22px 24px; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white; border-radius: 18px 18px 0 0; display: flex; justify-content: space-between; align-items: flex-start; }
  .inv-modal-close { background: rgba(255,255,255,.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .inv-modal-body { padding: 22px 24px; }
  .inv-detail-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: .9rem; border-bottom: 1px solid var(--c-border); }
  .inv-detail-lbl { color: var(--c-muted); }
  .inv-detail-val { font-weight: 600; font-family: 'JetBrains Mono', monospace; font-size: .87rem; }
  .inv-detail-total { display: flex; justify-content: space-between; padding: 14px; background: #f0f4ff; border-radius: 10px; margin-top: 12px; }

  .inv-toast { position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: .88rem; box-shadow: var(--shadow-lg); animation: slideLeft .22s ease; display: flex; align-items: center; gap: 10px; font-family: 'Be Vietnam Pro', sans-serif; }
  @keyframes slideLeft { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
  .toast-ok  { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
  .toast-err { background: #fff1f2; border: 1px solid #fda4af; color: #9f1239; }

  .inv-spin { display: inline-block; width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .6s linear infinite; vertical-align: middle; margin-right: 6px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .inv-loading-row { padding: 50px; text-align: center; color: var(--c-subtle); }
  .inv-section-title { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--c-accent); margin: 0 0 10px; }
  .inv-period-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; background: #f0f4ff; padding: 10px 12px; border-radius: 10px; border: 1px solid #d5d9f5; }
  .inv-period-label { font-size: .78rem; font-weight: 700; color: var(--c-accent); white-space: nowrap; }
  .inv-period-sel { padding: 6px 10px; border-radius: 8px; border: 1.5px solid var(--c-border); font-size: .85rem; font-family: inherit; outline: none; cursor: pointer; background: white; color: var(--c-text); font-weight: 600; transition: border-color .2s; }
  .inv-period-sel:focus { border-color: var(--c-accent); }
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`inv-toast ${toast.ok ? 'toast-ok' : 'toast-err'}`}>
      <span>{toast.ok ? '✅' : '❌'}</span> {toast.msg}
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ inv, onClose, onMarkPaid }) {
  if (!inv) return null;
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isPaid = inv.payment_status === 'Paid' || inv.status === 'paid';

  const handlePay = async () => {
    if (!method) return;
    setLoading(true);
    try {
      await onMarkPaid(inv.id, method);
      onClose();
    } finally { setLoading(false); }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Request PDF from backend with responseType: 'blob'
      const response = await api.get(`/invoices/${inv.id}/pdf`, {
        responseType: 'blob'
      });

      // Create a blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `HoaDon_${inv.id}_Thang${inv.month}_${inv.year}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      // Show error message - could be toast notification
      alert('❌ Không thể tải PDF. Vui lòng thử lại sau.');
    } finally {
      setDownloading(false);
    }
  };

  const rows = [
    ['📅 Kỳ hóa đơn', `Tháng ${inv.month}/${inv.year}`],
    ['🏠 Phòng', inv.room_name || `#${inv.room_id}`],
    ['💰 Tiền phòng', `${fmt(inv.rent_amount)}đ`],
    ['⚡ Tiền điện', `${fmt(inv.electricity_amount)}đ`],
    ['💧 Tiền nước', `${fmt(inv.water_amount)}đ`],
    ['🔧 Dịch vụ khác', `${fmt(inv.service_amount)}đ`],
    ['📆 Hạn thanh toán', fmtDate(inv.due_date)],
    ['💳 Hình thức', inv.payment_method || '—'],
    ['✅ Ngày thanh toán', fmtDate(inv.paid_at)],
  ];

  return (
    <div className="inv-modal-bg" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal-head">
          <div>
            <div style={{ fontSize: '.78rem', opacity: .75, marginBottom: 4 }}>HOÁ ĐƠN #{inv.id}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tháng {inv.month}/{inv.year}</div>
          </div>
          <button className="inv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="inv-modal-body">
          {rows.map(([l, v]) => (
            <div key={l} className="inv-detail-row">
              <span className="inv-detail-lbl">{l}</span>
              <span className="inv-detail-val">{v}</span>
            </div>
          ))}
          <div className="inv-detail-total">
            <span style={{ fontWeight: 700, color: '#4f46e5' }}>TỔNG CỘNG</span>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', fontFamily: "'JetBrains Mono',monospace", color: '#4f46e5' }}>
              {fmt(inv.total_amount)}đ
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button 
              className="inv-btn-save" 
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{ flex: 1 }}
            >
              {downloading ? <><span className="inv-spin" />Đang tải...</> : '📥 Tải PDF'}
            </button>
            {!isPaid && (
              <button className="inv-btn-save" onClick={() => setPaying(!paying)} style={{ flex: 1 }}>
                💳 Thanh toán
              </button>
            )}
          </div>

          {!isPaid && (
            <div style={{ marginTop: 16 }}>
              {!paying ? (
                <button className="inv-btn-save" onClick={() => setPaying(true)} style={{ width: '100%' }}>
                  💳 Ghi nhận thanh toán
                </button>
              ) : (
                <div style={{ background: '#f0f4ff', borderRadius: 10, padding: 14, marginTop: 8 }}>
                  <div className="inv-label" style={{ marginBottom: 8 }}>Hình thức thanh toán</div>
                  {['Tiền mặt', 'Chuyển khoản', 'Ví MoMo', 'ZaloPay'].map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: '.88rem' }}>
                      <input type="radio" name="pay-method" value={m} checked={method === m} onChange={() => setMethod(m)} />
                      {m}
                    </label>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button onClick={() => setPaying(false)} className="inv-btn-sec" style={{ margin: 0 }}>Hủy</button>
                    <button onClick={handlePay} disabled={!method || loading} className="inv-btn-save" style={{ margin: 0 }}>
                      {loading ? <><span className="inv-spin" />Đang lưu...</> : '✅ Xác nhận'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CreateForm ───────────────────────────────────────────────────────────────
function CreateForm({ rooms, onCreated, showToast }) {
  const [month, setMonth]     = useState(CUR_MONTH);
  const [year, setYear]       = useState(CUR_YEAR);
  const [roomId, setRoomId]   = useState('');
  const [prevReading, setPrevReading] = useState(null);
  const [prevLoading, setPrevLoading] = useState(false);

  const [prevElec, setPrevElec] = useState('');
  const [currElec, setCurrElec] = useState('');
  const [prevWater, setPrevWater] = useState('');
  const [currWater, setCurrWater] = useState('');

  const [elecPrice, setElecPrice]   = useState('3500');
  const [waterPrice, setWaterPrice] = useState('15000');
  const [wifiFee, setWifiFee]       = useState('0');
  const [trashFee, setTrashFee]     = useState('0');
  const [roomPrice, setRoomPrice]   = useState('');

  const [result, setResult]   = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  });

  const elecUsage  = (currElec !== '' && prevElec !== '') ? Math.max(0, Number(currElec) - Number(prevElec)) : null;
  const waterUsage = (currWater !== '' && prevWater !== '') ? Math.max(0, Number(currWater) - Number(prevWater)) : null;

  const fetchPrev = useCallback(async (rid, m, y) => {
    if (!rid) return;
    setPrevLoading(true);
    setPrevReading(null);
    try {
      const res = await api.get(`/landlord/rooms/${rid}/previous-reading?month=${m}&year=${y}`);
      const pr = res.data.data?.previousReading || null;
      setPrevReading(pr);
      if (pr) {
        setPrevElec(String(pr.electricityIndex ?? ''));
        setPrevWater(String(pr.waterIndex ?? ''));
      } else {
        setPrevElec(''); setPrevWater('');
      }
    } catch {
      setPrevReading(null);
    } finally { setPrevLoading(false); }
  }, []);

  useEffect(() => {
    if (roomId) fetchPrev(roomId, month, year);
  }, [roomId, month, year, fetchPrev]);

  useEffect(() => {
    if (roomId) {
      const room = rooms.find(r => String(r.roomID || r.id) === String(roomId));
      if (room) setRoomPrice(String(room.price || ''));
    }
  }, [roomId, rooms]);

  const handleCalc = async () => {
    if (!roomId) { showToast('Chọn phòng trước', false); return; }
    if (currElec === '' || currWater === '') { showToast('Nhập chỉ số điện/nước kỳ này', false); return; }
    if (Number(currElec) < Number(prevElec)) { showToast('Chỉ số điện kỳ này phải ≥ kỳ trước', false); return; }
    if (Number(currWater) < Number(prevWater)) { showToast('Chỉ số nước kỳ này phải ≥ kỳ trước', false); return; }

    setCalcLoading(true);
    setResult(null);
    try {
      const res = await api.post('/landlord/invoices/calculate', {
        roomID: Number(roomId), month, year,
        roomPrice: Number(roomPrice),
        prevElectricityIndex: Number(prevElec),
        currentElectricityIndex: Number(currElec),
        prevWaterIndex: Number(prevWater),
        currentWaterIndex: Number(currWater),
        serviceFees: { wifiFee: Number(wifiFee), trashFee: Number(trashFee) },
        serviceUnitPrices: { electricityUnitPrice: Number(elecPrice), waterUnitPrice: Number(waterPrice) },
      });
      setResult(res.data.data);
    } catch (error) {
      // Enhanced error handling
      const errorMsg = error.response?.data?.message || error.message || 'Tính toán thất bại';
      const errorCode = error.response?.data?.errorCode;
      
      let userMessage = errorMsg;
      if (errorCode === 'INVALID_PAYLOAD') {
        userMessage = '❌ Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các giá trị.';
      } else if (errorCode === 'CALCULATION_FAILED') {
        userMessage = '❌ Không thể tính toán. Vui lòng kiểm tra lại dữ liệu nhập.';
      }
      
      showToast(userMessage, false);
      console.error('Calculation error:', error);
    } finally { setCalcLoading(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaveLoading(true);
    try {
      // Validate inputs before saving
      if (!roomId) {
        showToast('❌ Chưa chọn phòng', false);
        return;
      }
      
      // 1. Lưu meter reading
      let meterReadingId = null;
      try {
        const mrRes = await api.post('/meter-readings', {
          roomID: Number(roomId),
          electricityIndex: Number(currElec),
          waterIndex: Number(currWater),
          recordedDate: new Date().toISOString().slice(0, 10),
        });
        meterReadingId = mrRes.data?.data?.id;
      } catch (mrError) {
        console.error('Meter reading creation error:', mrError);
        const mrMsg = mrError.response?.data?.message || 'Không thể lưu chỉ số đồng hồ';
        showToast(`❌ ${mrMsg}`, false);
        return;
      }

      // 2. Lấy contract của phòng
      let matchedContract = null;
      try {
        const contractsRes = await api.get('/contracts?status=active');
        const contracts = contractsRes.data.data || [];
        matchedContract = contracts.find(c => String(c.roomID) === String(roomId));
      } catch (contractError) {
        console.error('Contract fetch error:', contractError);
        // Continue even if we can't fetch contracts
      }

      // 3. Tạo hóa đơn với better error handling
      const bd = result.breakdown;
      try {
        const invoiceData = {
          roomID: Number(roomId),
          contractID: matchedContract?.contractID || null,
          readingID: meterReadingId,
          month: Number(month),
          year: Number(year),
          rentAmount: Number(bd.roomPrice) || 0,
          electricityAmount: Number(bd.electricityAmount) || 0,
          waterAmount: Number(bd.waterAmount) || 0,
          serviceAmount: Number(bd.serviceAmount) || 0,
          totalAmount: Number(result.totalAmount),
          dueDate: dueDate,
        };
        
        await api.post('/invoices', invoiceData);

        // Show appropriate toast based on whether it's first reading
        const successMsg = !prevReading
          ? '✅ Đã lưu chỉ số kỳ đầu tiên và tạo hóa đơn thành công!'
          : '✅ Tạo hóa đơn thành công!';
        showToast(successMsg, true);
        
        setResult(null);
        setCurrElec(''); setCurrWater('');
        await fetchPrev(roomId, month, year);
        onCreated();
      } catch (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        
        // Handle specific error codes
        const errorCode = invoiceError.response?.data?.errorCode;
        const errorMsg = invoiceError.response?.data?.message;
        
        let userMessage = errorMsg || 'Không thể tạo hóa đơn. Vui lòng thử lại.';
        
        if (errorCode === 'INVALID_PAYLOAD') {
          userMessage = '❌ Dữ liệu không hợp lệ. Kiểm tra các trường bắt buộc.';
        } else if (errorCode === 'ROOM_NOT_FOUND') {
          userMessage = '❌ Không tìm thấy phòng. Vui lòng chọn phòng khác.';
        } else if (errorCode === 'DUPLICATE_UTILITY_BILL') {
          userMessage = '❌ Hóa đơn tiện ích đã tồn tại cho kỳ này. Không thể tạo hóa đơn trùng lặp.';
        } else if (errorCode === 'INVOICE_CREATE_FAILED') {
          userMessage = '❌ Lỗi tạo hóa đơn. Vui lòng thử lại sau.';
        } else if (errorCode === 'BILLING_PERIOD_INVALID') {
          userMessage = '❌ Kỳ hóa đơn không thể trước ngày khởi tạo hợp đồng.';
        }
        
        showToast(userMessage, false);
      }
    } catch (error) {
      console.error('Unexpected save error:', error);
      showToast('❌ Lỗi không xác định. Vui lòng thử lại sau.', false);
    } finally { setSaveLoading(false); }
  };

  const selectedRoom = rooms.find(r => String(r.roomID || r.id) === String(roomId));

  return (
    <div className="inv-panel">
      <div className="inv-panel-head">
        <span>📋</span> Tạo hóa đơn mới
      </div>
      <div className="inv-panel-body">
        {/* Period */}
        <div className="inv-period-bar">
          <span className="inv-period-label">📅 Kỳ:</span>
          <select className="inv-period-sel" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select className="inv-period-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Room select */}
        <div className="inv-field">
          <label className="inv-label">Chọn phòng</label>
          <select className="inv-input" value={roomId} onChange={e => { setRoomId(e.target.value); setResult(null); }}>
            <option value="">— Chọn phòng đang thuê —</option>
            {rooms.map(r => (
              <option key={r.roomID || r.id} value={r.roomID || r.id}>
                🏠 {r.name} — {fmt(r.price)}đ/tháng
              </option>
            ))}
          </select>
          {selectedRoom && (
            <div className="inv-hint ok">✔ Giá thuê: {fmt(selectedRoom.price)}đ/tháng</div>
          )}
        </div>

        {/* Room price override */}
        <div className="inv-field">
          <label className="inv-label">Tiền phòng (VNĐ)</label>
          <input className="inv-input mono" type="number" value={roomPrice} onChange={e => { setRoomPrice(e.target.value); setResult(null); }} placeholder="Tự động từ phòng đã chọn" />
        </div>

        <hr className="inv-divider" />

        {/* Electricity */}
        <div className="inv-index-box">
          <div className="inv-index-label">⚡ Chỉ số điện</div>
          {prevLoading && <div style={{ fontSize: '.8rem', color: 'var(--c-subtle)' }}>Đang tải chỉ số kỳ trước…</div>}
          {!prevLoading && (
            <div className="inv-index-grid">
              <div>
                <div className="inv-prev-label">Kỳ trước</div>
                <div className="inv-prev-val">
                  {prevElec !== '' ? prevElec : '—'}
                  {prevReading && <div style={{ fontSize: '.68rem', color: 'var(--c-muted)', marginTop: 2 }}>{fmtDate(prevReading.recordedDate)}</div>}
                </div>
                {!prevReading && roomId && <div className="inv-hint warn">⚠ Chưa có chỉ số trước</div>}
              </div>
              <div>
                <div className="inv-prev-label">Kỳ này *</div>
                <input
                  className={`inv-input mono ${currElec !== '' && Number(currElec) < Number(prevElec) ? 'err' : currElec !== '' ? 'ok' : ''}`}
                  type="number" min={prevElec || 0} value={currElec}
                  onChange={e => { setCurrElec(e.target.value); setResult(null); }}
                  placeholder={`>= ${prevElec || 0}`}
                />
              </div>
            </div>
          )}
          {elecUsage !== null && (
            <div style={{ marginTop: 8, fontSize: '.8rem' }}>
              <span className="inv-usage-tag" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                ⚡ Sử dụng: <strong>{elecUsage} kWh</strong>
              </span>
            </div>
          )}
        </div>

        {/* Water */}
        <div className="inv-index-box">
          <div className="inv-index-label">💧 Chỉ số nước</div>
          {!prevLoading && (
            <div className="inv-index-grid">
              <div>
                <div className="inv-prev-label">Kỳ trước</div>
                <div className="inv-prev-val">{prevWater !== '' ? prevWater : '—'}</div>
                {!prevReading && roomId && <div className="inv-hint warn">⚠ Chưa có chỉ số trước</div>}
              </div>
              <div>
                <div className="inv-prev-label">Kỳ này *</div>
                <input
                  className={`inv-input mono ${currWater !== '' && Number(currWater) < Number(prevWater) ? 'err' : currWater !== '' ? 'ok' : ''}`}
                  type="number" min={prevWater || 0} value={currWater}
                  onChange={e => { setCurrWater(e.target.value); setResult(null); }}
                  placeholder={`>= ${prevWater || 0}`}
                />
              </div>
            </div>
          )}
          {waterUsage !== null && (
            <div style={{ marginTop: 8, fontSize: '.8rem' }}>
              <span className="inv-usage-tag" style={{ background: '#ecfdf5', color: '#047857' }}>
                💧 Sử dụng: <strong>{waterUsage} m³</strong>
              </span>
            </div>
          )}
        </div>

        <hr className="inv-divider" />

        {/* Pricing */}
        <p className="inv-section-title">Đơn giá dịch vụ</p>
        <div className="inv-row2">
          {[
            { label: 'Giá điện (đ/kWh)', val: elecPrice, set: setElecPrice },
            { label: 'Giá nước (đ/m³)', val: waterPrice, set: setWaterPrice },
            { label: 'Phí Wifi (đ)', val: wifiFee, set: setWifiFee },
            { label: 'Phí rác (đ)', val: trashFee, set: setTrashFee },
          ].map(({ label, val, set }) => (
            <div key={label} className="inv-field">
              <label className="inv-label">{label}</label>
              <input className="inv-input mono" type="number" value={val}
                onChange={e => { set(e.target.value); setResult(null); }} />
            </div>
          ))}
        </div>

        <div className="inv-field">
          <label className="inv-label">Hạn thanh toán</label>
          <input className="inv-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <button className="inv-btn-calc" onClick={handleCalc} disabled={calcLoading}>
          {calcLoading ? <><span className="inv-spin" />Đang tính...</> : '🧮 Tính tiền hóa đơn'}
        </button>

        {/* Result Preview */}
        {result && (() => {
          const bd = result.breakdown;
          return (
            <div className="inv-result">
              <p className="inv-section-title" style={{ marginBottom: 8 }}>🧾 Kết quả tính toán</p>
              {[
                [`🏠 Tiền phòng`, `${fmt(bd.roomPrice)}đ`],
                [`⚡ Điện: ${bd.electricityUsage} kWh × ${fmt(bd.electricityUnitPrice)}đ`, `${fmt(bd.electricityAmount)}đ`],
                [`💧 Nước: ${bd.waterUsage} m³ × ${fmt(bd.waterUnitPrice)}đ`, `${fmt(bd.waterAmount)}đ`],
                [`🔧 Dịch vụ (Wifi + Rác)`, `${fmt(bd.serviceAmount)}đ`],
              ].map(([l, v]) => (
                <div key={l} className="inv-result-row">
                  <span className="inv-result-lbl">{l}</span>
                  <span className="inv-result-val">{v}</span>
                </div>
              ))}
              <div className="inv-result-total">
                <span className="inv-result-total-lbl">TỔNG CỘNG</span>
                <span className="inv-result-total-val">{fmt(result.totalAmount)}đ</span>
              </div>
              <div style={{ marginTop: 10, fontSize: '.76rem', color: 'var(--c-muted)', background: '#f0f4ff', borderRadius: 7, padding: '7px 10px' }}>
                ✔ Kiểm tra: ({bd.electricityUsage} × {fmt(bd.electricityUnitPrice)} + {bd.waterUsage} × {fmt(bd.waterUnitPrice)}) + {fmt(bd.roomPrice)} + {fmt(bd.serviceAmount)} = <strong>{fmt(result.totalAmount)}đ</strong>
              </div>
              <button className="inv-btn-save" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? <><span className="inv-spin" />Đang lưu...</> : '💾 Lưu hóa đơn'}
              </button>
              <button className="inv-btn-sec" onClick={() => setResult(null)}>Xóa kết quả</button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Invoice List ─────────────────────────────────────────────────────────────
function InvoiceList({ reload, onMarkPaid, showToast, onDeleteInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [month, setMonth]       = useState(0);
  const [year, setYear]         = useState(CUR_YEAR);

  // ── Fetch hóa đơn trực tiếp từ endpoint /invoices (landlord) ──────────────
  const fetchLandlordInvoices = useCallback(async () => {
    setLoading(true);
    try {
      // Dùng GET /invoices — endpoint của landlord, filter theo year nếu cần
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month > 0) params.append('month', month);

      const res = await api.get(`/invoices?${params.toString()}`);
      const data = res.data.data || [];

      // Dedup theo id để tránh trùng
      const seen = new Set();
      const unique = data.filter(inv => {
        if (seen.has(inv.id)) return false;
        seen.add(inv.id);
        return true;
      });

      // Sắp xếp mới nhất lên đầu
      unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setInvoices(unique);
    } catch (err) {
      // Nếu endpoint chưa có, thử fallback
      console.warn('GET /invoices thất bại, thử fallback:', err.message);
      try {
        const [roomsRes, contractsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/contracts'),
        ]);
        const contracts = contractsRes.data.data || [];
        const roomMap = Object.fromEntries(
          (roomsRes.data.rooms || []).map(r => [String(r.roomID || r.id), r])
        );

        const allInvoices = [];
        const seen = new Set();

        await Promise.allSettled(
          contracts.map(async (c) => {
            try {
              const invRes = await api.get(`/invoices?roomID=${c.roomID}`);
              if (invRes?.data?.data) {
                invRes.data.data.forEach(inv => {
                  if (!seen.has(inv.id)) {
                    seen.add(inv.id);
                    allInvoices.push({
                      ...inv,
                      room_name: c.roomName || roomMap[String(c.roomID)]?.name || `Phòng ${c.roomID}`,
                    });
                  }
                });
              }
            } catch { /* skip */ }
          })
        );

        allInvoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setInvoices(allInvoices);
      } catch {
        setInvoices([]);
      }
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchLandlordInvoices(); }, [fetchLandlordInvoices, reload]);

  const handlePaid = async (id, method) => {
    await onMarkPaid(id, method);
    await fetchLandlordInvoices();
  };

  // Filter
  const filtered = invoices.filter(inv => {
    if (tab === 'paid'   && inv.status !== 'paid')   return false;
    if (tab === 'unpaid' && inv.status !== 'unpaid') return false;
    if (tab === 'partial' && inv.status !== 'partial') return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const rm = (inv.room_name || '').toLowerCase();
      const id = String(inv.id);
      if (!rm.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length,
    revenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0),
  };

  const isOverdue = (inv) => inv.status === 'unpaid' && inv.due_date && new Date(inv.due_date) < new Date();

  return (
    <>
      {/* Stats */}
      <div className="inv-stats">
        {[
          { icon: '📋', val: stats.total,              lbl: 'Tổng hóa đơn',   bg: '#eef0fb', ic: '#4f46e5' },
          { icon: '✅', val: stats.paid,               lbl: 'Đã thanh toán',  bg: '#d1fae5', ic: '#059669' },
          { icon: '⏳', val: stats.unpaid,             lbl: 'Chưa thanh toán',bg: '#fee2e2', ic: '#dc2626' },
          { icon: '💰', val: `${fmt(stats.revenue)}đ`, lbl: 'Doanh thu',      bg: '#fef9c3', ic: '#ca8a04' },
        ].map(({ icon, val, lbl, bg, ic }) => (
          <div key={lbl} className="inv-stat">
            <div className="inv-stat-icon" style={{ background: bg, color: ic }}>{icon}</div>
            <div>
              <div className="inv-stat-val" style={{ fontSize: String(val).length > 8 ? '1rem' : undefined }}>{val}</div>
              <div className="inv-stat-lbl">{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* List panel */}
      <div className="inv-panel">
        <div className="inv-toolbar">
          <div className="inv-tab-group">
            {[['all','Tất cả'],['unpaid','Chưa TT'],['partial','Một phần'],['paid','Đã TT']].map(([k,l]) => (
              <button key={k} className={`inv-tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          <select className="inv-period-sel" value={month} onChange={e => setMonth(Number(e.target.value))}>
            <option value={0}>Tất cả tháng</option>
            {MONTHS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select className="inv-period-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <div className="inv-search-wrap">
            <span className="inv-search-icon">🔍</span>
            <input className="inv-search" placeholder="Tìm phòng, mã hóa đơn..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="inv-loading-row">⏳ Đang tải dữ liệu hóa đơn...</div>
        ) : filtered.length === 0 ? (
          <div className="inv-empty">
            <div className="inv-empty-icon">📭</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {invoices.length === 0 ? 'Chưa có hóa đơn nào' : 'Không tìm thấy kết quả'}
            </div>
            <div style={{ fontSize: '.85rem' }}>
              {invoices.length === 0 ? 'Tạo hóa đơn đầu tiên bằng form bên trái →' : 'Thử bộ lọc khác'}
            </div>
          </div>
        ) : (
          <table className="inv-table">
            <thead>
              <tr>
                {['#ID','Kỳ','Phòng','Tiền phòng','Điện','Nước','Tổng tiền','Hạn TT','Trạng thái','',''].map(h => (
                  <th key={h} className="inv-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const paid = inv.status === 'paid';
                const partial = inv.status === 'partial';
                const over = isOverdue(inv);
                return (
                  <tr key={inv.id} className="inv-tr" onClick={() => setSelected(inv)}>
                    <td className="inv-td" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '.82rem', color: 'var(--c-muted)' }}>#{inv.id}</td>
                    <td className="inv-td" style={{ fontWeight: 600 }}>T{inv.month}/{inv.year}</td>
                    <td className="inv-td">
                      <span style={{ background: '#eef0fb', color: '#4f46e5', padding: '3px 9px', borderRadius: 20, fontSize: '.78rem', fontWeight: 700 }}>
                        🏠 {inv.room_name || `Phòng ${inv.room_id}`}
                      </span>
                    </td>
                    <td className="inv-td" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '.83rem' }}>{fmt(inv.rent_amount)}đ</td>
                    <td className="inv-td" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '.83rem' }}>{fmt(inv.electricity_amount)}đ</td>
                    <td className="inv-td" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '.83rem' }}>{fmt(inv.water_amount)}đ</td>
                    <td className="inv-td" style={{ fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(inv.total_amount)}đ</td>
                    <td className="inv-td" style={{ fontSize: '.82rem', color: over ? 'var(--c-red)' : 'var(--c-muted)' }}>{fmtDate(inv.due_date)}</td>
                    <td className="inv-td">
                      <span className={`inv-badge ${paid ? 'badge-paid' : partial ? 'badge-partial' : over ? 'badge-overdue' : 'badge-unpaid'}`}>
                        {paid ? '✅ Đã TT' : partial ? '🔄 Một phần' : over ? '⏰ Quá hạn' : '⏳ Chưa TT'}
                      </span>
                    </td>
                    <td className="inv-td" onClick={(e) => e.stopPropagation()}>
                      <span style={{ color: 'var(--c-accent)', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}>Chi tiết →</span>
                    </td>
                    <td className="inv-td" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--c-red)',
                          fontSize: '.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '2px 6px',
                          transition: 'opacity .2s',
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                        title="Xóa hóa đơn"
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <DetailModal
          inv={selected}
          onClose={() => setSelected(null)}
          onMarkPaid={handlePaid}
        />
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Invoices() {
  const [rooms, setRooms]     = useState([]);
  const [reload, setReload]   = useState(0);
  const [toast, setToast]     = useState(null);
  const toastTimer            = useRef(null);

  const showToast = useCallback((msg, ok = true) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch các phòng đang occupied cho form tạo hóa đơn
  useEffect(() => {
    api.get('/rooms?status=occupied')
      .then(r => setRooms(r.data.rooms || []))
      .catch(() => setRooms([]));
  }, [reload]);

  const handleMarkPaid = async (id, method) => {
    try {
      if (!method) {
        showToast('❌ Vui lòng chọn hình thức thanh toán', false);
        return;
      }

      await api.put(`/invoices/${id}/pay`, { payment_method: method });
      showToast('✅ Đã ghi nhận thanh toán thành công!', true);
      setReload(r => r + 1);
    } catch (error) {
      console.error('Payment error:', error);
      
      const errorCode = error.response?.data?.errorCode;
      const errorMsg = error.response?.data?.message;
      
      let userMessage = errorMsg || 'Không thể ghi nhận thanh toán. Vui lòng thử lại.';
      
      if (errorCode === 'INVALID_PAYLOAD') {
        userMessage = '❌ Dữ liệu không hợp lệ. Vui lòng chọn hình thức thanh toán.';
      } else if (errorCode === 'NOT_FOUND') {
        userMessage = '❌ Không tìm thấy hóa đơn.';
      } else if (errorCode === 'ALREADY_PAID') {
        userMessage = '❌ Hóa đơn này đã được thanh toán rồi.';
      } else if (errorCode === 'FORBIDDEN') {
        userMessage = '❌ Bạn không có quyền thanh toán hóa đơn này.';
      } else if (errorCode === 'UPDATE_FAILED') {
        userMessage = '❌ Lỗi cập nhật thanh toán. Vui lòng thử lại.';
      }
      
      showToast(userMessage, false);
      
      // Try fallback endpoint if put fails
      if (error.response?.status === 404 || error.response?.status === 405) {
        try {
          await api.patch(`/invoices/${id}`, {
            status: 'paid',
            payment_status: 'Paid',
            payment_method: method,
            paid_at: new Date().toISOString(),
          });
          showToast('✅ Đã cập nhật thanh toán!', true);
          setReload(r => r + 1);
        } catch (fallbackError) {
          console.error('Fallback payment error:', fallbackError);
          showToast('❌ Cập nhật thất bại. Vui lòng thử lại sau.', false);
        }
      }
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.')) {
      return;
    }
    try {
      await api.delete(`/invoices/${id}`);
      showToast('✅ Xóa hóa đơn và chỉ số thành công!', true);
      setReload(r => r + 1);
    } catch (error) {
      console.error('Delete invoice error:', error);
      
      const errorCode = error.response?.data?.errorCode;
      const errorMsg = error.response?.data?.message;
      
      let userMessage = errorMsg || 'Không thể xóa hóa đơn. Vui lòng thử lại.';
      
      if (errorCode === 'INVALID_PAYLOAD') {
        userMessage = '❌ Mã hóa đơn không hợp lệ.';
      } else if (errorCode === 'NOT_FOUND') {
        userMessage = '❌ Không tìm thấy hóa đơn.';
      } else if (errorCode === 'FORBIDDEN') {
        userMessage = '❌ Bạn không có quyền xóa hóa đơn này.';
      } else if (errorCode === 'CANNOT_DELETE_PAID') {
        userMessage = '❌ Không thể xóa hóa đơn đã thanh toán.';
      } else if (errorCode === 'DELETE_FAILED') {
        userMessage = '❌ Lỗi xóa hóa đơn. Vui lòng thử lại.';
      }
      
      showToast(userMessage, false);
    }
  };

  return (
    <div className="inv-root">
      <style>{STYLES}</style>
      <Toast toast={toast} />

      <div className="inv-header">
        <h2>💰 Quản lý hóa đơn điện nước</h2>
        <p>Tính toán, tạo và theo dõi hóa đơn hàng tháng cho từng phòng</p>
      </div>

      <div className="inv-body">
        {/* LEFT: Create form */}
        <CreateForm
          rooms={rooms}
          onCreated={() => setReload(r => r + 1)}
          showToast={showToast}
        />

        {/* RIGHT: Invoice list + stats */}
        <div>
          <InvoiceList
            reload={reload}
            onMarkPaid={handleMarkPaid}
            showToast={showToast}
            onDeleteInvoice={handleDeleteInvoice}
          />
        </div>
      </div>
    </div>
  );
}
