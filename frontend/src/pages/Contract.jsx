import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MainLayout from '../components/layout/MainLayout';

// ── helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

const inputStyle = (focus = false) => ({
  width: '100%', padding: '10px 13px',
  border: `1.5px solid ${focus ? '#667eea' : '#e2e8f0'}`,
  borderRadius: 9, fontSize: '0.9rem', outline: 'none',
  fontFamily: 'inherit', color: '#2d3748', background: 'white',
  boxShadow: focus ? '0 0 0 3px rgba(102,126,234,0.12)' : 'none',
  transition: 'all 0.2s',
});

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 700, color: '#4a5568', marginBottom: 6, fontSize: '0.85rem' }}>
        {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #f0f2f5' }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ fontWeight: 800, color: '#2d3748', fontSize: '1rem' }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>
    </div>
  );
}

// ── Print helpers (giữ nguyên từ code cũ) ────────────────────────────────────
function printContract(contractHTML) {
  const old = document.getElementById('print-frame');
  if (old) old.remove();
  const iframe = document.createElement('iframe');
  iframe.id = 'print-frame';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.write(`
    <!DOCTYPE html><html lang="vi">
    <head><meta charset="UTF-8">
      <title>Hợp đồng thuê phòng</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0
          }

          body {
            font-family:'Times New Roman', Times, serif;
            color: #222;
            line-height: 1.8; 
            font-size: 13pt;
            background: white
          }

          button {
            display: none !important
          }

          table {
            width: 100%;
            border-collapse: collapse
          }

          ul {
            padding-left: 24px
          }

          strong {
            font-weight: bold
          }

          div {
            border-radius: 0!important;
            box-shadow: none!important
          }

          .contract-print-area>div {
            padding: 0 !important;
            background: white!important
          }

          @page {
            size: A4 portrait;
            margin: 15mm 20mm
          }
        </style>
      </head>
    <body>${contractHTML}</body>
    </html>`);
  iframe.contentDocument.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
}

// ── Preview component ─────────────────────────────────────────────────────────
function ContractPreview({ form, selectedRoom, selectedTenant, durationMonths }) {
  const contractNo = `HD${String(Math.floor(Math.random() * 9000) + 1000).padStart(6, '0')}/${new Date().getFullYear()}`;
  return (
    <div className="contract-print-area">
      <div style={{ background: 'white', padding: '48px', fontFamily: 'serif', color: '#222', lineHeight: '1.8', fontSize: '13pt' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32, borderBottom: '2px solid #333', paddingBottom: 20 }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: 0, marginBottom: 2, color: '#555' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style={{ fontSize: '1rem', color: '#555', marginBottom: 4 }}>Độc lập - Tự do - Hạnh phúc</div>
          <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 20 }}>---o0o---</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: 1 }}>HỢP ĐỒNG THUÊ PHÒNG TRỌ</div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>Số: {contractNo}</div>
        </div>

        <p style={{ marginBottom: 8 }}>
          Hôm nay, ngày <strong>{new Date().getDate()}</strong> tháng <strong>{new Date().getMonth() + 1}</strong> năm <strong>{new Date().getFullYear()}</strong>
        </p>
        <p style={{ marginBottom: 8 }}>Chúng tôi gồm có:</p>

        {/* Bên A */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#333', marginBottom: 4 }}>BÊN CHO THUÊ (Bên A):</div>
          <table style={{ width: '100%', fontSize: '0.9rem' }}><tbody>
            <tr><td style={{ padding: '3px 0', color: '#666', width: 180 }}>Họ và tên:</td><td><strong>{form.landlord_name || '___'}</strong></td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>{form.landlord_id_card || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>{form.landlord_phone || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ:</td><td>{form.landlord_address || '___'}</td></tr>
          </tbody></table>
        </div>

        {/* Bên B */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#333', marginBottom: 4 }}>BÊN THUÊ (Bên B):</div>
          <table style={{ width: '100%', fontSize: '0.9rem' }}><tbody>
            <tr><td style={{ padding: '3px 0', color: '#666', width: 180 }}>Họ và tên:</td><td><strong>{selectedTenant?.name || '___'}</strong></td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>{selectedTenant?.citizen_id || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>{selectedTenant?.phone || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ thường trú:</td><td>{selectedTenant?.permanent_address || '___'}</td></tr>
          </tbody></table>
        </div>

        <p style={{ marginBottom: 16 }}>Hai bên thỏa thuận ký kết hợp đồng thuê phòng với các điều khoản sau:</p>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</div>
          <p>Bên A đồng ý cho Bên B thuê phòng: <strong>{selectedRoom?.name || '___'}</strong>{selectedRoom?.area ? `, diện tích ${selectedRoom.area} m²` : ''}.</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 2: THỜI HẠN THUÊ</div>
          <p>Thời hạn thuê phòng là <strong>{durationMonths} tháng</strong>, bắt đầu từ ngày <strong>{form.start_date ? new Date(form.start_date).toLocaleDateString('vi-VN') : '___'}</strong> đến ngày <strong>{form.end_date ? new Date(form.end_date).toLocaleDateString('vi-VN') : '___'}</strong>.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: '700' , marginBottom: '8px' }}>ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.5' }}>
            <li>Giá thuê phòng: <strong>{form.rental_price ? Number(form.rental_price).toLocaleString('vi-VN') : '___'} đồng/tháng</strong></li>
            <li>Tiền đặt cọc: <strong>{form.deposit ? Number(form.deposit).toLocaleString('vi-VN') : '0'} đồng</strong></li>
            <li>Giá điện: <strong>{Number(form.electricity_price).toLocaleString('vi-VN')} đồng/kWh</strong></li>
            <li>Giá nước: <strong>{Number(form.water_price).toLocaleString('vi-VN')} đồng/m³</strong></li>
            <li>Thanh toán trước ngày <strong>{form.payment_day}</strong> hàng tháng</li>
          </ul>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 4: NGHĨA VỤ CÁC BÊN</div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Bên A có nghĩa vụ:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.5, marginBottom: 12 }}>
            <li>Giao phòng đúng ngày và đảm bảo phòng trong tình trạng tốt</li>
            <li>Đảm bảo cung cấp điện, nước đầy đủ</li>
            <li>Sửa chữa các hư hỏng không do Bên B gây ra</li>
          </ul>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Bên B có nghĩa vụ:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.5 }}>
            <li>Thanh toán tiền thuê đúng hạn</li>
            <li>Giữ gìn phòng, không làm hư hỏng tài sản</li>
            <li>Không tự ý sửa chữa, cải tạo phòng khi chưa có sự đồng ý của Bên A</li>
            <li>Thông báo trước <strong>30 ngày</strong> khi muốn chấm dứt hợp đồng trước hạn</li>
            <li>Giữ gìn trật tự, vệ sinh khu trọ</li>
          </ul>
        </div>

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
            <div style={{ borderTop: '1px solid #555', paddingTop: 8, fontWeight: 600 }}>{selectedTenant?.name || '___'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function Contract() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('form'); // 'form' | 'preview'
  const [rooms, setRooms] = useState([]);
  const [allTenants, setAllTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState('');

  const [form, setForm] = useState({
    roomID: '', tenantID: '',
    startDate: today, endDate: nextYear,
    deposit: '', rentalPrice: '',
    electricity_price: '',
    water_price: '',
    payment_day: '',   
    // thông tin chủ trọ cho hợp đồng
    landlord_name: '', landlord_id_card: '',
    landlord_phone: '', landlord_address: '',
  });

  // Fetch rooms & tenants
  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, tRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/landlord/tenants/all'),
        ]);
        setRooms(rRes.data.rooms || []);
        setAllTenants(tRes.data.data || []);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  // Auto-fill rental price when room selected
  useEffect(() => {
    if (form.roomID) {
      const room = rooms.find(r => String(r.id) === String(form.roomID));
      if (room) setForm(f => ({ ...f, rentalPrice: String(room.price) }));
    }
  }, [form.roomID, rooms]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const selectedRoom = rooms.find(r => String(r.id) === String(form.roomID));
  const selectedTenant = allTenants.find(t => String(t.id) === String(form.tenantID));
  const durationMonths = form.startDate && form.endDate
    ? Math.round((new Date(form.endDate) - new Date(form.startDate)) / (86400000 * 30))
    : 0;

  const validate = () => {
    if (!form.roomID) return 'Vui lòng chọn phòng';
    if (!form.tenantID) return 'Vui lòng chọn khách thuê';
    if (!form.startDate || !form.endDate) return 'Vui lòng nhập ngày bắt đầu và kết thúc';
    if (new Date(form.endDate) <= new Date(form.startDate)) return 'Ngày kết thúc phải sau ngày bắt đầu';
    if (!form.rentalPrice || Number(form.rentalPrice) <= 0) return 'Vui lòng nhập giá thuê hợp lệ';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      await api.post('/contracts', {
        roomID: Number(form.roomID),
        tenantID: Number(form.tenantID),
        startDate: form.startDate,
        endDate: form.endDate,
        deposit: Number(form.deposit) || 0,
        rentalPrice: Number(form.rentalPrice),
      });
      setSuccess(true);
      setTimeout(() => navigate('/tenants'), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Tạo hợp đồng thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── success screen ──
  if (success) {
    return (
      <MainLayout title="Tạo hợp đồng">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center', background: 'white', borderRadius: 16, padding: '60px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#38b2ac', marginBottom: 8 }}>Tạo hợp đồng thành công!</h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Phòng đã được cập nhật sang trạng thái "Đã thuê". Đang chuyển hướng...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ── tab buttons ──
  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '8px 20px', border: 'none', borderRadius: 9, cursor: 'pointer',
      fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
      background: tab === id ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f2f5',
      color: tab === id ? 'white' : '#718096',
    }}>{label}</button>
  );

  return (
    <MainLayout title="Tạo hợp đồng thuê phòng">
      <div style={{ maxWidth: 860 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <TabBtn id="form" label="✏️ Nhập liệu" />
            <TabBtn id="preview" label="👁️ Xem trước hợp đồng" />
          </div>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: '1px solid #ddd', borderRadius: 9,
            padding: '8px 16px', cursor: 'pointer', color: '#718096', fontSize: '0.85rem',
          }}>← Quay lại</button>
        </div>

        {error && (
          <div style={{
            background: '#fff5f5', border: '1px solid #feb2b2', borderLeft: '4px solid #e53e3e',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#742a2a', fontSize: '0.9rem',
          }}>⚠️ {error}</div>
        )}

        {/* ── FORM TAB ── */}
        {tab === 'form' && (
          <>
            {/* Section 1: Phòng & Khách thuê */}
            <Section icon="🏠" title="Thông tin phòng & khách thuê">
              <Field label="Phòng cho thuê" required hint="Chỉ hiển thị phòng đang trống">
                <select name="roomID" value={form.roomID} onChange={handleChange}
                  onFocus={() => setFocusField('roomID')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'roomID')}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.filter(r => r.status === 'available').map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {Number(r.price).toLocaleString('vi-VN')}đ/tháng{r.area ? ` — ${r.area}m²` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Khách thuê (ID)" required hint="Chọn tài khoản đã đăng ký với role tenant">
                <select name="tenantID" value={form.tenantID} onChange={handleChange}
                  onFocus={() => setFocusField('tenantID')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'tenantID')}>
                  <option value="">-- Chọn khách thuê --</option>
                  {allTenants.map(t => (
                    <option key={t.id} value={t.id} disabled={!!t.has_active_contract}>
                      [{t.id}] {t.name} — {t.email}
                      {t.has_active_contract ? ' (Đang có HĐ)' : ''}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Tenant info preview */}
              {selectedTenant && (
                <div style={{ gridColumn: '1 / -1', background: '#f0f4ff', borderRadius: 10, padding: '14px 16px', border: '1px solid #c3dafe' }}>
                  <div style={{ fontWeight: 700, color: '#667eea', marginBottom: 8, fontSize: '0.85rem' }}>ℹ️ Thông tin khách thuê đã chọn:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: '0.85rem', color: '#4a5568' }}>
                    <div><span style={{ color: '#a0aec0' }}>CCCD:</span> {selectedTenant.citizen_id || 'Chưa cập nhật'}</div>
                    <div><span style={{ color: '#a0aec0' }}>SĐT:</span> {selectedTenant.phone || 'Chưa cập nhật'}</div>
                    <div><span style={{ color: '#a0aec0' }}>Địa chỉ:</span> {selectedTenant.permanent_address || 'Chưa cập nhật'}</div>
                  </div>
                </div>
              )}
            </Section>

            {/* Section 2: Thời hạn */}
            <Section icon="📅" title="Thời hạn hợp đồng">
              <Field label="Ngày bắt đầu" required>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
                  onFocus={() => setFocusField('startDate')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'startDate')} />
              </Field>
              <Field label="Ngày kết thúc" required>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                  onFocus={() => setFocusField('endDate')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'endDate')} />
              </Field>
              {durationMonths > 0 && (
                <div style={{ gridColumn: '1 / -1', background: '#f0f4ff', borderRadius: 10, padding: '10px 14px', color: '#667eea', fontSize: '0.85rem', fontWeight: 700 }}>
                  📌 Thời hạn hợp đồng: khoảng <strong>{durationMonths} tháng</strong>
                </div>
              )}
            </Section>

            {/* Section 3: Tài chính */}
            <Section icon="💰" title="Điều khoản tài chính">
              <Field label="Giá thuê (VNĐ/tháng)" required hint="Tự động điền từ giá phòng, có thể chỉnh sửa">
                <input type="number" name="rentalPrice" value={form.rentalPrice} onChange={handleChange}
                  placeholder="3000000" min="0"
                  onFocus={() => setFocusField('rentalPrice')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'rentalPrice')} />
              </Field>
              <Field label="Tiền đặt cọc (VNĐ)" hint="Để trống nếu không có cọc">
                <input type="number" name="deposit" value={form.deposit} onChange={handleChange}
                  placeholder="6000000" min="0"
                  onFocus={() => setFocusField('deposit')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'deposit')} />
              </Field>
              <Field label="Giá điện (VNĐ/kWh)">
                <input type="number" name="electricity_price" value={form.electricity_price} onChange={handleChange}
                  placeholder="4000" min="0"
                  onFocus={() => setFocusField('electricity_price')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'electricity_price')} />
              </Field>
              <Field label="Giá nước (VNĐ/m³)">
                <input type="number" name="water_price" value={form.water_price} onChange={handleChange}
                  placeholder="15000" min="0"
                  onFocus={() => setFocusField('water_price')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'water_price')} />
              </Field>
              <Field label="Ngày thanh toán hàng tháng" hint="Tiền thuê sẽ được thu vào ngày này mỗi tháng">
                <select name="payment_day" value={form.payment_day} onChange={handleChange}
                  onFocus={() => setFocusField('payment_day')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'payment_day')}>
                  {[1, 3, 5, 7, 10, 15, 20].map(d => (
                    <option key={d} value={d}>Ngày {d} hàng tháng</option>
                  ))}
                </select>
              </Field>
            </Section>

            {/* Section 4: Thông tin chủ trọ (cho hợp đồng) */}
            <Section icon="👤" title="Thông tin bên cho thuê (hiển thị trên hợp đồng)">
              <Field label="Họ tên chủ trọ">
                <input type="text" name="landlord_name" value={form.landlord_name} onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  onFocus={() => setFocusField('landlord_name')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'landlord_name')} />
              </Field>
              <Field label="Số CCCD/CMND">
                <input type="text" name="landlord_id_card" value={form.landlord_id_card} onChange={handleChange}
                  placeholder="012345678901"
                  onFocus={() => setFocusField('landlord_id_card')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'landlord_id_card')} />
              </Field>
              <Field label="Số điện thoại">
                <input type="tel" name="landlord_phone" value={form.landlord_phone} onChange={handleChange}
                  placeholder="0912 345 678"
                  onFocus={() => setFocusField('landlord_phone')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'landlord_phone')} />
              </Field>
              <Field label="Địa chỉ thường trú">
                <input type="text" name="landlord_address" value={form.landlord_address} onChange={handleChange}
                  placeholder="123 Đường ABC, TP.HCM"
                  onFocus={() => setFocusField('landlord_address')} onBlur={() => setFocusField('')}
                  style={inputStyle(focusField === 'landlord_address')} />
              </Field>
            </Section>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingBottom: 40 }}>
              <button onClick={() => setTab('preview')} style={{
                padding: '12px 24px', border: '1.5px solid #667eea', borderRadius: 10,
                background: 'white', color: '#667eea', fontWeight: 700, cursor: 'pointer',
              }}>👁️ Xem trước</button>
              <button onClick={handleSubmit} disabled={loading} style={{
                padding: '12px 32px', border: 'none', borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>{loading ? '⏳ Đang tạo...' : '📝 Tạo hợp đồng'}</button>
            </div>
          </>
        )}

        {/* ── PREVIEW TAB ── */}
        {tab === 'preview' && (
          <div>
            <ContractPreview
              form={form}
              selectedRoom={selectedRoom}
              selectedTenant={selectedTenant}
              durationMonths={durationMonths}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20, paddingBottom: 40 }}>
              <button onClick={() => setTab('form')} style={{
                padding: '12px 24px', border: '1px solid #ddd', borderRadius: 10,
                background: 'white', color: '#718096', fontWeight: 700, cursor: 'pointer',
              }}>← Chỉnh sửa</button>
              <button onClick={() => {
                const html = document.querySelector('.contract-print-area');
                if (html) printContract(html.innerHTML);
              }} style={{
                padding: '12px 24px', border: '1.5px solid #667eea', borderRadius: 10,
                background: 'white', color: '#667eea', fontWeight: 700, cursor: 'pointer',
              }}>🖨️ In hợp đồng</button>
              <button onClick={handleSubmit} disabled={loading} style={{
                padding: '12px 32px', border: 'none', borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white', fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>{loading ? '⏳ Đang tạo...' : '✅ Xác nhận & Lưu hợp đồng'}</button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
