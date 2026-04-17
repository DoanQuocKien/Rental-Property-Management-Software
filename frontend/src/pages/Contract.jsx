import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

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

function Section({ icon, title, children, columns = 2 }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: '24px 28px',
      marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        paddingBottom: 14, borderBottom: '2px solid #f0f2f5',
      }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        <span style={{ fontWeight: 800, color: '#2d3748', fontSize: '1rem' }}>{title}</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Tenant Info Card ──────────────────────────────────────────────────────────
function TenantInfoCard({ tenant }) {
  if (!tenant) return null;

  const fields = [
    { icon: '🪪', label: 'CCCD/CMND', value: tenant.citizenID || 'Chưa cập nhật' },
    { icon: '📞', label: 'Điện thoại', value: tenant.phoneNumber || 'Chưa cập nhật' },
    { icon: '📍', label: 'Địa chỉ', value: tenant.permanentAddress || 'Chưa cập nhật' },
    { icon: '📧', label: 'Email', value: tenant.email },
    {
      icon: '📋', label: 'Trạng thái',
      value: tenant.hasActiveContract
        ? '⚠️ Đang có hợp đồng'
        : '✅ Sẵn sàng ký HĐ',
      color: tenant.hasActiveContract ? '#d69e2e' : '#38b2ac',
    },
  ];

  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e6fffa 100%)',
      borderRadius: 12, padding: '16px 20px',
      border: '1.5px solid #bee3f8',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #38b2ac, #319795)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '1.3rem', flexShrink: 0,
        }}>
          {(tenant.fullName || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, color: '#1a202c', fontSize: '1.05rem' }}>
            {tenant.fullName}
          </div>
          <div style={{ color: '#718096', fontSize: '0.82rem', marginTop: 2 }}>
            ID: #{tenant.id} &nbsp;·&nbsp; Người thuê trọ
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            background: tenant.hasActiveContract ? '#fffbeb' : '#e6fffa',
            color: tenant.hasActiveContract ? '#d69e2e' : '#38b2ac',
            border: `1px solid ${tenant.hasActiveContract ? '#f6e05e' : '#81e6d9'}`,
            padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
          }}>
            {tenant.hasActiveContract ? '⚠️ Đang có HĐ' : '✅ Khả dụng'}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px 20px',
      }}>
        {fields.slice(0, -1).map(f => (
          <div key={f.label} style={{
            background: 'white', borderRadius: 8,
            padding: '10px 14px', border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#a0aec0', fontWeight: 600, marginBottom: 3 }}>
              {f.icon} {f.label}
            </div>
            <div style={{
              fontSize: '0.88rem', fontWeight: 600,
              color: f.color || '#2d3748',
              wordBreak: 'break-word',
            }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {tenant.hasActiveContract && (
        <div style={{
          marginTop: 12, background: '#fffbeb',
          border: '1px solid #f6e05e', borderRadius: 8,
          padding: '10px 14px', fontSize: '0.82rem', color: '#744210',
        }}>
          ⚠️ <strong>Lưu ý:</strong> Khách thuê này đang có hợp đồng active. Hệ thống sẽ từ chối tạo hợp đồng mới cho đến khi hợp đồng hiện tại kết thúc.
        </div>
      )}
    </div>
  );
}

// ── Room Info Card ────────────────────────────────────────────────────────────
function RoomInfoCard({ room }) {
  if (!room) return null;
  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
      borderRadius: 12, padding: '14px 20px',
      border: '1.5px solid #c3dafe',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: '1.3rem', flexShrink: 0,
      }}>🏠</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, color: '#2d3748', fontSize: '1rem' }}>{room.name}</div>
        <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: 2 }}>
          {room.area ? `${room.area} m²` : ''} {room.category ? `· ${room.category}` : ''} · {room.maxOccupants || 1} người tối đa
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#667eea' }}>
          {Number(room.price).toLocaleString('vi-VN')}đ
        </div>
        <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>/tháng</div>
      </div>
      <span style={{
        background: '#e6fffa', color: '#38b2ac',
        border: '1px solid #81e6d9',
        padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
      }}>✅ Đang trống</span>
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
  const tenantName = selectedTenant?.fullName || '___';
  const tenantCitizenId = selectedTenant?.citizenID || '___';
  const tenantPhone = selectedTenant?.phoneNumber || '___';
  const tenantAddress = selectedTenant?.permanentAddress || '___';

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
            <tr><td style={{ padding: '3px 0', color: '#666', width: 180 }}>Họ và tên:</td><td><strong>{selectedTenant?.fullName || '___'}</strong></td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>{selectedTenant?.citizenID || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>{selectedTenant?.phoneNumber || '___'}</td></tr>
            <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ thường trú:</td><td>{selectedTenant?.permanentAddress || '___'}</td></tr>
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

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
          <ul style={{ paddingLeft: 20, lineHeight: 1.5 }}>
            <li>Giá thuê phòng: <strong>{form.rentalPrice ? Number(form.rentalPrice).toLocaleString('vi-VN') : '___'} đồng/tháng</strong></li>
            <li>Tiền đặt cọc: <strong>{form.deposit ? Number(form.deposit).toLocaleString('vi-VN') : '0'} đồng</strong></li>
            {form.electricity_price && <li>Giá điện: <strong>{Number(form.electricity_price).toLocaleString('vi-VN')} đồng/kWh</strong></li>}
            {form.water_price && <li>Giá nước: <strong>{Number(form.water_price).toLocaleString('vi-VN')} đồng/m³</strong></li>}
            <li>Thanh toán trước ngày <strong>{form.payment_day || 5}</strong> hàng tháng</li>
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
  const [tab, setTab] = useState('form');
  const [rooms, setRooms] = useState([]);
  const [allTenants, setAllTenants] = useState([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState('');
  const tenantDropdownRef = useState(null);

  // GIỮ NGUYÊN FORM CŨ + THÊM landlord_id_card
  const [form, setForm] = useState({
    room_id: '',
    tenant_id: '',
    start_date: today,
    end_date: nextYear,
    deposit: '',
    rental_price: '',
    payment_day: '5',
    notes: '',
    landlord_name: 'NGUYỄN VĂN A', // Bạn có thể sửa tên mặc định ở đây
    landlord_id_card: '', // TRƯỜNG MỚI
    landlord_phone: '',
    landlord_address: '',
    property_address: '',
    electricity_price: '4000',
    water_price: '15000',
  });

  // FIX LỖI DATA API: Dùng đúng cấu trúc data.rooms và data.tenants của bạn
  useEffect(() => {
    const load = async () => {
      try {
        const [roomsRes, tenantsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/tenants')
        ]);
        setRooms(roomsRes.data.rooms || []);
        setTenants(tenantsRes.data.tenants || []);
      } catch (err) {
        console.error("Lỗi fetch dữ liệu:", err);
      }
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.room_id || !form.tenant_id) { setError('Vui lòng chọn phòng và khách thuê'); return; }

    setLoading(true);
    try {
      await api.post('/contracts', {
        roomID: Number(form.room_id),
        tenantID: Number(form.tenant_id),
        landlordIdCard: form.landlord_id_card, // GỬI CCCD LÊN BACKEND
        startDate: form.start_date,
        endDate: form.end_date,
        deposit: Number(form.deposit) || 0,
        rentalPrice: Number(form.rental_price),
      });

      setSuccess(true);
      setTimeout(() => navigate('/rooms'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rooms.find(r => r.id === Number(form.room_id));
  const selectedTenant = tenants.find(t => t.id === Number(form.tenant_id));

  // --- GIỮ LẠI CÁC BIẾN STYLE CỦA BẠN ĐỂ KHÔNG LỖI ---
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: 'white' };
  const labelStyle = { display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' };
  const sectionStyle = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px' };
  const sectionTitleStyle = { fontSize: '1rem', fontWeight: '700', color: '#333', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #f0f2f5' };

  if (success) return <div style={{ textAlign: 'center', padding: '100px' }}><h2>✅ Thành công!</h2></div>;

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
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Tab chuyển đổi */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button onClick={() => setPreview(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: !preview ? '#667eea' : '#f0f2f5', color: !preview ? 'white' : '#555' }}>✏️ Nhập liệu</button>
        <button onClick={() => setPreview(true)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: preview ? '#667eea' : '#f0f2f5', color: preview ? 'white' : '#555' }}>👁️ Xem trước</button>
      </div>

      {!preview ? (
        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🏠 Thông tin pháp lý & Phòng</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Số CCCD Chủ trọ (Bên A) *</label>
                <input type="text" name="landlord_id_card" value={form.landlord_id_card} onChange={handleChange} required style={inputStyle} placeholder="Nhập số CCCD của bạn" />
              </div>
              <div>
                <label style={labelStyle}>Khách thuê (Bên B) *</label>
                <select name="tenant_id" value={form.tenant_id} onChange={handleChange} required style={inputStyle}>
                  <option value="">-- Chọn khách thuê --</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Phòng thuê *</label>
                <select name="room_id" value={form.room_id} onChange={handleChange} required style={inputStyle}>
                  <option value="">-- Chọn phòng --</option>
                  {rooms.filter(r => r.status === 'available').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Giá thuê (VNĐ) *</label>
                <input type="number" name="rental_price" value={form.rental_price} onChange={handleChange} required style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📅 Thời hạn & Tiền cọc</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <input type="date" name="start_date" value={form.start_date} onChange={handleChange} style={inputStyle} />
              <input type="date" name="end_date" value={form.end_date} onChange={handleChange} style={inputStyle} />
              <input type="number" name="deposit" placeholder="Tiền đặt cọc" value={form.deposit} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Đang xử lý...' : 'XÁC NHẬN TẠO HỢP ĐỒNG'}
          </button>
        </form>
      ) : (
        /* --- BẢN PREVIEW XỊN --- */
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'serif', lineHeight: '1.6' }}>
          <h2 style={{ textAlign: 'center' }}>HỢP ĐỒNG THUÊ PHÒNG</h2>
          <p><strong>BÊN A (Chủ trọ):</strong> {form.landlord_name}</p>
          <p>Số CCCD: <strong>{form.landlord_id_card || '..............................'}</strong></p>
          <p style={{ marginTop: '10px' }}><strong>BÊN B (Khách thuê):</strong> {selectedTenant?.name || '..............................'}</p>
          <p>Số CCCD: <strong>{selectedTenant?.citizen_id || '..............................'}</strong></p>
          <hr />
          <p>Đồng ý thuê phòng <strong>{selectedRoom?.name || '...'}</strong> với giá <strong>{Number(form.rental_price).toLocaleString()}đ/tháng</strong>.</p>
          <p>Thời hạn từ {form.start_date} đến {form.end_date}.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', textAlign: 'center' }}>
            <div>ĐẠI DIỆN BÊN A<br /><br /><br />(Ký tên)</div>
            <div>ĐẠI DIỆN BÊN B<br /><br /><br />(Ký tên)</div>
          </div>
        </div>
      )}
    </div>
  );
}