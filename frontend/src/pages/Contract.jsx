import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Contract() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]); // Thêm state lưu khách thuê
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    room_id: '',
    tenant_id: '',
    start_date: today,
    end_date: nextYear,
    deposit: '',
    rental_price: '',
    payment_day: '5',
    notes: '',
    landlord_name: '',
    landlord_id_card: '',
    landlord_phone: '',
    landlord_address: '',
    property_address: '',
    electricity_price: '4000',
    water_price: '15000',
  });

  // Lấy danh sách phòng và khách thuê từ Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, tenantsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/tenants') // Gọi API lấy khách thuê của Khang
        ]);
        setRooms(roomsRes.data.rooms || []);
        setTenants(tenantsRes.data.tenants || []);
      } catch (err) {
        console.error("Lỗi fetch dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  // Tự động cập nhật giá thuê khi chọn phòng
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
    if (!form.room_id) { setError('Vui lòng chọn phòng'); return; }
    if (!form.tenant_id) { setError('Vui lòng chọn khách thuê'); return; }
    if (!form.rental_price) { setError('Vui lòng nhập giá thuê'); return; }

    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu'); return;
    }

    setLoading(true);
    setError('');

    try {
      // ĐÃ SỬA: Chuyển sang camelCase để khớp với Backend (contracts.js)
      await api.post('/contracts', {
        roomID: Number(form.room_id),
        tenantID: Number(form.tenant_id),
        startDate: form.start_date,
        endDate: form.end_date,
        deposit: Number(form.deposit) || 0,
        rentalPrice: Number(form.rental_price),
      });

      setSuccess(true);
      setTimeout(() => navigate('/rooms'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo hợp đồng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Logic hỗ trợ hiển thị
  const selectedRoom = rooms.find(r => r.id === Number(form.room_id));
  const selectedTenant = tenants.find(t => t.id === Number(form.tenant_id));
  const durationMonths = form.start_date && form.end_date
    ? Math.round((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  // --- Styles ---
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: 'white' };
  const labelStyle = { display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' };
  const sectionStyle = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px' };
  const sectionTitleStyle = { fontSize: '1rem', fontWeight: '700', color: '#333', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #f0f2f5' };

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', background: 'white', borderRadius: '16px', padding: '60px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#38b2ac', marginBottom: '8px' }}>Tạo hợp đồng thành công!</h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Đang chuyển hướng về trang quản lý phòng...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => setPreview(false)} style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: !preview ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f2f5', color: !preview ? 'white' : '#555', fontWeight: '600' }}>✏️ Nhập liệu</button>
          <button type="button" onClick={() => setPreview(true)} style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: preview ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f2f5', color: preview ? 'white' : '#555', fontWeight: '600' }}>👁️ Xem trước</button>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: '#555' }}>← Quay lại</button>
      </div>

      {error && <div style={{ background: '#fff5f5', borderLeft: '4px solid #e53e3e', padding: '12px', marginBottom: '20px', color: '#742a2a' }}>⚠️ {error}</div>}

      {!preview ? (
        <form onSubmit={handleSubmit}>
          {/* Thông tin phòng & khách thuê */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🏠 Thông tin phòng & khách thuê</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Phòng cho thuê *</label>
                <select name="room_id" value={form.room_id} onChange={handleChange} required style={inputStyle}>
                  <option value="">-- Chọn phòng trống --</option>
                  {rooms.filter(r => r.status === 'available').map(r => (
                    <option key={r.id} value={r.id}>{r.name} — {Number(r.price).toLocaleString()}đ</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Khách thuê (Bên B) *</label>
                <select name="tenant_id" value={form.tenant_id} onChange={handleChange} required style={inputStyle}>
                  <option value="">-- Chọn khách đã duyệt --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.phone || 'Chưa có SĐT'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Điều khoản tài chính */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>💰 Điều khoản tài chính</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Giá thuê (đ/tháng) *</label>
                <input type="number" name="rental_price" value={form.rental_price} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tiền đặt cọc (VNĐ)</label>
                <input type="number" name="deposit" value={form.deposit} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ngày thanh toán</label>
                <select name="payment_day" value={form.payment_day} onChange={handleChange} style={inputStyle}>
                  {[1,5,10,15].map(d => <option key={d} value={d}>Ngày {d} hàng tháng</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Thời hạn */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>📅 Thời hạn hợp đồng</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Ngày bắt đầu *</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ngày kết thúc *</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required style={inputStyle} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} style={{ padding: '12px 32px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Đang xử lý...' : '📝 Tạo hợp đồng'}
            </button>
          </div>
        </form>
      ) : (
        /* --- PREVIEW RÚT GỌN --- */
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'serif' }}>
          <h2 style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px' }}>HỢP ĐỒNG THUÊ PHÒNG</h2>
          <p>Bên A (Chủ trọ): <strong>{form.landlord_name || '................................'}</strong></p>
          <p>Bên B (Khách thuê): <strong>{selectedTenant?.name || '................................'}</strong></p>
          <hr />
          <p>Thuê phòng: <strong>{selectedRoom?.name || '...'}</strong></p>
          <p>Giá thuê: <strong>{Number(form.rental_price).toLocaleString()} đ/tháng</strong></p>
          <p>Thời hạn: từ {form.start_date} đến {form.end_date}</p>
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>Bên A<br /><br /><br />(Ký tên)</div>
            <div style={{ textAlign: 'center' }}>Bên B<br /><br /><br />(Ký tên)</div>
          </div>
          <button onClick={() => setPreview(false)} style={{ marginTop: '20px', padding: '8px 16px' }}>← Quay lại chỉnh sửa</button>
        </div>
      )}
    </div>
  );
}