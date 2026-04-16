import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Contract() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    const fetchData = async () => {
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
    fetchData();
  }, []);

  useEffect(() => {
    if (form.room_id) {
      const room = rooms.find(r => r.id === Number(form.room_id));
      if (room) {
        setForm(f => ({ ...f, rental_price: String(room.price) }));
      }
    }
  }, [form.room_id, rooms]);

  const handleChange = e => {
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