import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const today = new Date().toISOString().split('T')[0];
const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

// ── Print helper ──────────────────────────────────────────────────────────────
function printContract(contractHTML) {
  const old = document.getElementById('print-frame');
  if (old) old.remove();
  const iframe = document.createElement('iframe');
  iframe.id = 'print-frame';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.write(`
    <!DOCTYPE html><html lang="vi">
    <head><meta charset="UTF-8"><title>Hợp đồng thuê phòng</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Times New Roman',Times,serif;color:#222;line-height:1.8;font-size:13pt;background:white}
        button{display:none!important}
        table{width:100%;border-collapse:collapse}
        ul{padding-left:24px}
        @page{size:A4 portrait;margin:15mm 20mm}
      </style>
    </head>
    <body>${contractHTML}</body></html>`);
  iframe.contentDocument.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
}

// ── Preview component ─────────────────────────────────────────────────────────
function ContractPreview({ form, selectedRoom, selectedTenant }) {
  const start = form.start_date ? new Date(form.start_date) : null;
  const end   = form.end_date   ? new Date(form.end_date)   : null;
  const durationMonths = (start && end)
    ? Math.round((end - start) / (1000 * 60 * 60 * 24 * 30))
    : '___';

  const contractNo = `HD${String(Math.floor(Math.random() * 9000) + 1000).padStart(6, '0')}/${new Date().getFullYear()}`;
  const fmt = (n) => n ? Number(n).toLocaleString('vi-VN') : '___';

  return (
    <div className="contract-print-area">
      <div style={{ background: 'white', padding: '48px', fontFamily: 'serif', color: '#222', lineHeight: '1.5', fontSize: '13pt' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #333', paddingBottom: 20 }}>
          <div style={{ fontSize: '1rem', color: '#555', fontWeight: 700 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style={{ fontSize: '1rem', color: '#555', marginBottom: 4 }}>Độc lập - Tự do - Hạnh phúc</div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 20 }}>---o0o---</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: 1 }}>HỢP ĐỒNG THUÊ PHÒNG TRỌ</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>Số: {contractNo}</div>
        </div>

        <p style={{ marginBottom: 8 }}>
          Hôm nay, ngày <strong>{new Date().getDate()}</strong> tháng <strong>{new Date().getMonth() + 1}</strong> năm <strong>{new Date().getFullYear()}</strong>
        </p>
        <p style={{ marginBottom: 16 }}>Chúng tôi gồm có:</p>

        {/* Bên A */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>BÊN CHO THUÊ (Bên A):</div>
          <table><tbody>
            <tr><td style={{ padding: '3px 0', color: '#666', width: 200 }}>Họ và tên:</td><td><strong>{form.landlord_name || '___'}</strong></td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>{form.landlord_id_card || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>{form.landlord_phone || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ thường trú:</td><td>{form.landlord_address || '___'}</td></tr>
          </tbody></table>
        </div>

        {/* Bên B */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>BÊN THUÊ (Bên B):</div>
          <table><tbody>
            <tr><td style={{ padding: '3px 0', color: '#666', width: 200 }}>Họ và tên:</td><td><strong>{selectedTenant?.fullName || selectedTenant?.name || '___'}</strong></td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>{selectedTenant?.citizenID || selectedTenant?.citizen_id || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>{selectedTenant?.phoneNumber || selectedTenant?.phone || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ thường trú:</td><td>{selectedTenant?.permanentAddress || selectedTenant?.permanent_address || '___'}</td></tr>
          </tbody></table>
        </div>

        <p style={{ marginBottom: 16 }}>Hai bên thỏa thuận ký kết hợp đồng với các điều khoản sau:</p>

        {/* Điều 1 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</div>
          <p>Bên A đồng ý cho Bên B thuê phòng: <strong>{selectedRoom?.name || '___'}</strong>
            {selectedRoom?.area ? `, diện tích ${selectedRoom.area} m²` : ''}.
          </p>
        </div>

        {/* Điều 2 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 2: THỜI HẠN THUÊ</div>
          <p>Thời hạn thuê là <strong>{durationMonths} tháng</strong>, từ ngày{' '}
            <strong>{start ? start.toLocaleDateString('vi-VN') : '___'}</strong> đến ngày{' '}
            <strong>{end ? end.toLocaleDateString('vi-VN') : '___'}</strong>.
          </p>
        </div>

        {/* Điều 3 — GIÁ THUÊ, ĐIỆN, NƯỚC */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 3: GIÁ THUÊ VÀ THANH TOÁN</div>
          <ul style={{ paddingLeft: 20, lineHeight: 1.5 }}>
            <li>Giá thuê phòng: <strong>{fmt(form.rental_price)} đồng/tháng</strong></li>
            <li>Tiền đặt cọc: <strong>{fmt(form.deposit || 0)} đồng</strong> (hoàn trả khi hết hợp đồng nếu không vi phạm)</li>
            <li>Giá điện: <strong>{fmt(form.electricity_price)} đồng/kWh</strong> — thanh toán theo chỉ số công tơ thực tế</li>
            <li>Giá nước: <strong>{fmt(form.water_price)} đồng/m³</strong> — thanh toán theo đồng hồ nước thực tế</li>
            <li>Thanh toán tiền phòng trước ngày <strong>{form.payment_day || 5}</strong> hàng tháng</li>
          </ul>
        </div>

        {/* Điều 4 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 4: NGHĨA VỤ CÁC BÊN</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Bên A có nghĩa vụ:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.5, marginBottom: 10 }}>
            <li>Giao phòng đúng ngày và đảm bảo phòng trong tình trạng tốt</li>
            <li>Cung cấp điện, nước đầy đủ theo giá đã thỏa thuận</li>
            <li>Sửa chữa các hư hỏng không do Bên B gây ra</li>
          </ul>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Bên B có nghĩa vụ:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.5 }}>
            <li>Thanh toán tiền thuê và chi phí điện, nước đúng hạn</li>
            <li>Giữ gìn phòng, không làm hư hỏng tài sản</li>
            <li>Thông báo trước <strong>30 ngày</strong> khi muốn chấm dứt hợp đồng trước hạn</li>
            <li>Giữ gìn trật tự, vệ sinh khu trọ</li>
          </ul>
        </div>

        {/* Điều 5 */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 5: ĐIỀU KHOẢN CHUNG</div>
          <p>Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản. Mọi tranh chấp giải quyết trên tinh thần thương lượng.</p>
        </div>

        {/* Ký tên */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, textAlign: 'center', marginTop: 40, borderTop: '1px solid #ddd', paddingTop: 24 }}>
          <div>
            <div style={{ fontWeight: 700 }}>BÊN A (Chủ trọ)</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 60 }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ borderTop: '1px solid #555', paddingTop: 8, fontWeight: 600 }}>{form.landlord_name || '___'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>BÊN B (Người thuê)</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 60 }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ borderTop: '1px solid #555', paddingTop: 8, fontWeight: 600 }}>{selectedTenant?.fullName || selectedTenant?.name || '___'}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Label helpers ─────────────────────────────────────────────────────────────
function Lbl({ children }) {
  return (
    <label style={{ display: 'block', fontWeight: 700, color: '#4a5568', marginBottom: 6, fontSize: '0.85rem' }}>
      {children} <span style={{ color: '#e53e3e' }}>*</span>
    </label>
  );
}
function LblOpt({ children }) {
  return (
    <label style={{ display: 'block', fontWeight: 700, color: '#4a5568', marginBottom: 6, fontSize: '0.85rem' }}>
      {children}
    </label>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Contract() {
  const navigate = useNavigate();

  const [preview, setPreview] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    landlord_name: '',
    landlord_id_card: '',
    landlord_phone: '',
    landlord_address: '',
    room_id: '',
    tenant_id: '',
    rental_price: '',
    deposit: '',
    electricity_price: '',
    water_price: '',
    start_date: today,
    end_date: nextYear,
    payment_day: '5',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [roomsRes, tenantsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/tenants'),
        ]);
        setRooms(roomsRes.data.rooms || []);
        setTenants(tenantsRes.data.tenants || []);
      } catch (err) {
        console.error('Lỗi fetch dữ liệu:', err);
      }
    };
    load();
  }, []);

  // Auto-fill giá thuê khi chọn phòng
  useEffect(() => {
    if (form.room_id) {
      const room = rooms.find(r => String(r.id) === String(form.room_id));
      if (room) setForm(f => ({ ...f, rental_price: String(room.price) }));
    }
  }, [form.room_id, rooms]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      { key: 'landlord_name',     label: 'Họ tên chủ trọ' },
      { key: 'landlord_id_card',  label: 'Số CCCD/CMND chủ trọ' },
      { key: 'landlord_phone',    label: 'Số điện thoại chủ trọ' },
      { key: 'landlord_address',  label: 'Địa chỉ thường trú chủ trọ' },
      { key: 'room_id',           label: 'Phòng thuê' },
      { key: 'tenant_id',         label: 'Khách thuê' },
      { key: 'rental_price',      label: 'Giá thuê phòng' },
      { key: 'electricity_price', label: 'Giá điện' },
      { key: 'water_price',       label: 'Giá nước' },
      { key: 'start_date',        label: 'Ngày bắt đầu' },
      { key: 'end_date',          label: 'Ngày kết thúc' },
    ];

    for (const f of requiredFields) {
      if (!form[f.key] || String(form[f.key]).trim() === '') {
        setError(`Vui lòng nhập: ${f.label}`);
        return;
      }
    }
    if (Number(form.rental_price) <= 0)      { setError('Giá thuê phải lớn hơn 0'); return; }
    if (Number(form.electricity_price) <= 0)  { setError('Giá điện phải lớn hơn 0'); return; }
    if (Number(form.water_price) <= 0)        { setError('Giá nước phải lớn hơn 0'); return; }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/contracts', {
        roomID: Number(form.room_id),
        tenantID: Number(form.tenant_id),
        startDate: form.start_date,
        endDate: form.end_date,
        deposit: Number(form.deposit) || 0,
        rentalPrice: Number(form.rental_price),
      });
      setSuccess(true);
      setTimeout(() => navigate('/tenants'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tạo hợp đồng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom   = rooms.find(r => String(r.id) === String(form.room_id));
  const selectedTenant = tenants.find(t => String(t.id) === String(form.tenant_id));

  const inp = (hasVal) => ({
    width: '100%', padding: '10px 12px',
    border: `1.5px solid ${hasVal ? '#e2e8f0' : '#fed7d7'}`,
    borderRadius: 8, fontSize: '0.9rem', outline: 'none',
    background: hasVal ? 'white' : '#fff5f5',
    fontFamily: 'inherit', color: '#2d3748',
    transition: 'all 0.2s',
  });

  const inpUnit = (hasVal) => ({
    ...inp(hasVal),
    paddingRight: 56,
  });

  const sectionBox = {
    background: 'white', borderRadius: 12,
    padding: '24px 28px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    marginBottom: 20, border: '1px solid #f0f2f5',
  };

  const SectionHead = ({ icon, title, badge }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #f0f2f5',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontWeight: 800, color: '#2d3748', fontSize: '0.95rem' }}>{title}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: '0.72rem', color: '#e53e3e',
          background: '#fff5f5', border: '1px solid #feb2b2',
          padding: '2px 8px', borderRadius: 10, fontWeight: 600,
        }}>
          Tất cả bắt buộc *
        </span>
      )}
    </div>
  );

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#38b2ac', marginBottom: 8 }}>Tạo hợp đồng thành công!</h2>
        <p style={{ color: '#718096' }}>Đang chuyển hướng...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24,
        background: '#f0f2f5', padding: 4, borderRadius: 10, width: 'fit-content',
      }}>
        {[
          { val: false, icon: '✏️', label: 'Nhập liệu' },
          { val: true,  icon: '👁️', label: 'Xem trước hợp đồng' },
        ].map(t => (
          <button key={String(t.val)} onClick={() => setPreview(t.val)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.88rem',
            background: preview === t.val ? 'white' : 'transparent',
            color: preview === t.val ? '#667eea' : '#718096',
            boxShadow: preview === t.val ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {!preview ? (
        /* ═══════════════ FORM ═══════════════ */
        <form onSubmit={handleSubmit} noValidate>

          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #feb2b2',
              borderRadius: 10, padding: '13px 18px', color: '#c53030',
              marginBottom: 20, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span> {error}
            </div>
          )}

          {/* ── Section 1: Chủ trọ ── */}
          <div style={sectionBox}>
            <SectionHead icon="👤" title="Thông tin Bên A — Chủ trọ" badge />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Lbl>Họ và tên đầy đủ</Lbl>
                <input type="text" name="landlord_name" value={form.landlord_name}
                  onChange={handleChange} required style={inp(form.landlord_name)}
                  placeholder="VD: Nguyễn Văn An" />
              </div>
              <div>
                <Lbl>Số CCCD / CMND</Lbl>
                <input type="text" name="landlord_id_card" value={form.landlord_id_card}
                  onChange={handleChange} required style={inp(form.landlord_id_card)}
                  placeholder="VD: 079123456789" maxLength={12} />
              </div>
              <div>
                <Lbl>Số điện thoại</Lbl>
                <input type="tel" name="landlord_phone" value={form.landlord_phone}
                  onChange={handleChange} required style={inp(form.landlord_phone)}
                  placeholder="VD: 0912 345 678" />
              </div>
              <div>
                <Lbl>Địa chỉ thường trú</Lbl>
                <input type="text" name="landlord_address" value={form.landlord_address}
                  onChange={handleChange} required style={inp(form.landlord_address)}
                  placeholder="VD: 123 Lê Lợi, Q.1, TP.HCM" />
              </div>
            </div>
          </div>

          {/* ── Section 2: Phòng & khách thuê ── */}
          <div style={sectionBox}>
            <SectionHead icon="🏠" title="Thông tin phòng & Bên B — Khách thuê" badge />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Lbl>Phòng thuê</Lbl>
                <select name="room_id" value={form.room_id} onChange={handleChange}
                  required style={inp(form.room_id)}>
                  <option value="">-- Chọn phòng trống --</option>
                  {rooms.filter(r => r.status === 'available').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {Number(r.price).toLocaleString('vi-VN')}đ/tháng
                    </option>
                  ))}
                </select>
                {rooms.filter(r => r.status === 'available').length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: '#e53e3e', marginTop: 4 }}>⚠️ Hiện không có phòng trống</p>
                )}
              </div>
              <div>
                <Lbl>Khách thuê</Lbl>
                <select name="tenant_id" value={form.tenant_id} onChange={handleChange}
                  required style={inp(form.tenant_id)}>
                  <option value="">-- Chọn khách thuê --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.full_name || t.name} — {t.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Lbl>Giá thuê phòng (VNĐ/tháng)</Lbl>
                <input type="number" name="rental_price" value={form.rental_price}
                  onChange={handleChange} required min="1"
                  style={inp(form.rental_price)}
                  placeholder="Tự động điền khi chọn phòng" />
              </div>
              <div>
                <LblOpt>Tiền đặt cọc (VNĐ)</LblOpt>
                <input type="number" name="deposit" value={form.deposit}
                  onChange={handleChange} min="0" style={inp(true)}
                  placeholder="0" />
              </div>
            </div>
          </div>

          {/* ── Section 3: Giá điện & nước ── */}
          <div style={sectionBox}>
            <SectionHead icon="⚡" title="Giá điện & Giá nước" badge />

            <div style={{
              background: '#fffbeb', border: '1px solid #f6e05e',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: '0.82rem', color: '#744210', display: 'flex', gap: 8,
            }}>
              <span>💡</span>
              <span>Giá điện thông thường: <strong>3.000 – 4.000đ/kWh</strong> &nbsp;·&nbsp; Giá nước thông thường: <strong>10.000 – 20.000đ/m³</strong></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Lbl>Giá điện (VNĐ/kWh)</Lbl>
                <div style={{ position: 'relative' }}>
                  <input type="number" name="electricity_price" value={form.electricity_price}
                    onChange={handleChange} required min="1"
                    style={inpUnit(form.electricity_price)}
                    placeholder="VD: 3500" />
                  <span style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.75rem', color: '#a0aec0', fontWeight: 600, pointerEvents: 'none',
                  }}>đ/kWh</span>
                </div>
              </div>
              <div>
                <Lbl>Giá nước (VNĐ/m³)</Lbl>
                <div style={{ position: 'relative' }}>
                  <input type="number" name="water_price" value={form.water_price}
                    onChange={handleChange} required min="1"
                    style={inpUnit(form.water_price)}
                    placeholder="VD: 15000" />
                  <span style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.75rem', color: '#a0aec0', fontWeight: 600, pointerEvents: 'none',
                  }}>đ/m³</span>
                </div>
              </div>
            </div>

            {/* Live preview tính thử */}
            {(form.electricity_price || form.water_price) && (
              <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {form.electricity_price && Number(form.electricity_price) > 0 && (
                  <div style={{
                    background: '#fffbeb', border: '1px solid #fbd38d',
                    borderRadius: 8, padding: '8px 14px',
                    fontSize: '0.82rem', color: '#744210',
                  }}>
                    ⚡ Ví dụ 100 kWh = <strong>{(Number(form.electricity_price) * 100).toLocaleString('vi-VN')}đ</strong>
                  </div>
                )}
                {form.water_price && Number(form.water_price) > 0 && (
                  <div style={{
                    background: '#ebf8ff', border: '1px solid #90cdf4',
                    borderRadius: 8, padding: '8px 14px',
                    fontSize: '0.82rem', color: '#2a4365',
                  }}>
                    💧 Ví dụ 10 m³ = <strong>{(Number(form.water_price) * 10).toLocaleString('vi-VN')}đ</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Section 4: Thời hạn ── */}
          <div style={sectionBox}>
            <SectionHead icon="📅" title="Thời hạn hợp đồng" badge />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <Lbl>Ngày bắt đầu</Lbl>
                <input type="date" name="start_date" value={form.start_date}
                  onChange={handleChange} required style={inp(form.start_date)} />
              </div>
              <div>
                <Lbl>Ngày kết thúc</Lbl>
                <input type="date" name="end_date" value={form.end_date}
                  onChange={handleChange} required style={inp(form.end_date)}
                  min={form.start_date} />
              </div>
              <div>
                <LblOpt>Ngày đóng tiền hàng tháng</LblOpt>
                <select name="payment_day" value={form.payment_day}
                  onChange={handleChange} style={inp(true)}>
                  {[1, 3, 5, 10, 15, 20, 25].map(d => (
                    <option key={d} value={d}>Ngày {d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: 15,
            background: loading ? '#a0aec0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', border: 'none', borderRadius: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit',
            letterSpacing: '0.3px',
            boxShadow: loading ? 'none' : '0 4px 15px rgba(102,126,234,0.4)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Đang xử lý...' : 'XÁC NHẬN TẠO HỢP ĐỒNG'}
          </button>
        </form>

      ) : (
        /* ═══════════════ PREVIEW ═══════════════ */
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setPreview(false)} style={{
              padding: '9px 20px', background: 'white', color: '#667eea',
              border: '1.5px solid #667eea', borderRadius: 8,
              cursor: 'pointer', fontWeight: 600,
            }}>
              ← Quay lại chỉnh sửa
            </button>
            <button onClick={() => {
              const area = document.querySelector('.contract-print-area');
              if (area) printContract(area.innerHTML);
            }} style={{
              padding: '9px 20px', background: '#667eea', color: 'white',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
            }}>
              🖨️ In hợp đồng
            </button>
          </div>
          <ContractPreview form={form} selectedRoom={selectedRoom} selectedTenant={selectedTenant} />
        </div>
      )}
    </div>
  );
}
