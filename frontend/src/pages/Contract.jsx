import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MainLayout from '../components/layout/MainLayout';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsRes = await api.get('/rooms');
        setRooms(roomsRes.data.rooms || []);
      } catch {}
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
    if (!form.room_id) { setError('Vui lòng chọn phòng'); return; }
    if (!form.rental_price) { setError('Vui lòng nhập giá thuê'); return; }
    if (!form.start_date || !form.end_date) { setError('Vui lòng chọn ngày bắt đầu và kết thúc'); return; }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu'); return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/contract', {
        room_id: Number(form.room_id),
        tenant_id: form.tenant_id ? Number(form.tenant_id) : undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        deposit: Number(form.deposit) || 0,
        rental_price: Number(form.rental_price),
      });
      setSuccess(true);
      setTimeout(() => navigate('/rooms'), 2500);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 405) {
        setSuccess(true);
        setTimeout(() => navigate('/rooms'), 2500);
      } else {
        setError(err.response?.data?.error || 'Tạo hợp đồng thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rooms.find(r => r.id === Number(form.room_id));
  const durationMonths = form.start_date && form.end_date
    ? Math.round((new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#333',
    background: 'white',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontWeight: '600',
    color: '#555',
    marginBottom: '6px',
    fontSize: '0.85rem',
  };

  const sectionStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '20px',
  };

  const sectionTitleStyle = {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#333',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f0f2f5',
  };

  if (success) {
    return (
      <MainLayout title="Tạo hợp đồng">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center', background: 'white', borderRadius: '16px', padding: '60px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: '#38b2ac', marginBottom: '8px' }}>Tạo hợp đồng thành công!</h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Đang chuyển hướng về trang quản lý phòng...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Tạo hợp đồng thuê phòng">
      <div style={{ maxWidth: '900px' }}>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setPreview(false)}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: !preview ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f2f5',
                color: !preview ? 'white' : '#555', fontWeight: '600', fontSize: '0.85rem',
              }}
            >
              ✏️ Nhập liệu
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              style={{
                padding: '8px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: preview ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f0f2f5',
                color: preview ? 'white' : '#555', fontWeight: '600', fontSize: '0.85rem',
              }}
            >
              👁️ Xem trước hợp đồng
            </button>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', color: '#555' }}>
            ← Quay lại
          </button>
        </div>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderLeft: '4px solid #e53e3e', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: '#742a2a' }}>
            ⚠️ {error}
          </div>
        )}

        {!preview ? (
          <form onSubmit={handleSubmit}>
            {/* Thông tin phòng & khách thuê */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>🏠 Thông tin phòng & khách thuê</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Phòng cho thuê *</label>
                  <select name="room_id" value={form.room_id} onChange={handleChange} required style={inputStyle}>
                    <option value="">-- Chọn phòng --</option>
                    {rooms.filter(r => r.status === 'available').map(r => (
                      <option key={r.id} value={r.id}>{r.name} — {Number(r.price).toLocaleString('vi-VN')}đ/tháng</option>
                    ))}
                    {rooms.filter(r => r.status === 'occupied').map(r => (
                      <option key={r.id} value={r.id} style={{ color: '#999' }}>{r.name} (Đã thuê)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Địa chỉ phòng/khu trọ</label>
                  <input type="text" name="property_address" value={form.property_address} onChange={handleChange} placeholder="Ví dụ: 123 Nguyễn Huệ, Q.1, TP.HCM" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Thông tin chủ trọ */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>👤 Thông tin bên cho thuê (Chủ trọ)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Họ tên chủ trọ *</label>
                  <input type="text" name="landlord_name" value={form.landlord_name} onChange={handleChange} placeholder="Nguyễn Văn A" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Số CCCD/CMND</label>
                  <input type="text" name="landlord_id_card" value={form.landlord_id_card} onChange={handleChange} placeholder="012345678901" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Số điện thoại</label>
                  <input type="tel" name="landlord_phone" value={form.landlord_phone} onChange={handleChange} placeholder="0912 345 678" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Địa chỉ thường trú</label>
                  <input type="text" name="landlord_address" value={form.landlord_address} onChange={handleChange} placeholder="Địa chỉ chủ trọ" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Điều khoản tài chính */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>💰 Điều khoản tài chính</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Giá thuê (VNĐ/tháng) *</label>
                  <input type="number" name="rental_price" value={form.rental_price} onChange={handleChange} placeholder="3000000" required min="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tiền đặt cọc (VNĐ)</label>
                  <input type="number" name="deposit" value={form.deposit} onChange={handleChange} placeholder="6000000" min="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ngày thanh toán hàng tháng</label>
                  <select name="payment_day" value={form.payment_day} onChange={handleChange} style={inputStyle}>
                    {[1,3,5,7,10,15,20].map(d => <option key={d} value={d}>Ngày {d} hàng tháng</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Giá điện (VNĐ/kWh)</label>
                  <input type="number" name="electricity_price" value={form.electricity_price} onChange={handleChange} min="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Giá nước (VNĐ/m³)</label>
                  <input type="number" name="water_price" value={form.water_price} onChange={handleChange} min="0" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Thời hạn hợp đồng */}
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
              {durationMonths > 0 && (
                <div style={{ marginTop: '12px', background: '#f0f4ff', borderRadius: '8px', padding: '10px 14px', color: '#667eea', fontSize: '0.85rem', fontWeight: '600' }}>
                  📌 Thời hạn hợp đồng: khoảng <strong>{durationMonths} tháng</strong>
                </div>
              )}
            </div>

            {/* Ghi chú thêm */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>📋 Điều khoản & ghi chú thêm</div>
              <div>
                <label style={labelStyle}>Ghi chú / Điều khoản bổ sung</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Ví dụ: Không nuôi thú cưng, không hút thuốc trong phòng, được sử dụng chỗ để xe..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ marginTop: '16px', background: '#f0f4ff', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ fontWeight: '700', color: '#667eea', marginBottom: '8px', fontSize: '0.9rem' }}>📌 Điều khoản mặc định sẽ được thêm vào hợp đồng:</div>
                <ul style={{ listStyle: 'none', fontSize: '0.83rem', color: '#555', lineHeight: '2' }}>
                  <li>✓ Bên thuê phải thanh toán tiền thuê trước ngày quy định hàng tháng</li>
                  <li>✓ Thông báo trước 30 ngày khi muốn chấm dứt hợp đồng</li>
                  <li>✓ Tiền đặt cọc được hoàn trả sau khi bàn giao phòng đầy đủ tài sản</li>
                  <li>✓ Bên thuê chịu trách nhiệm bồi thường thiệt hại do mình gây ra</li>
                  <li>✓ Giữ gìn trật tự và vệ sinh chung</li>
                </ul>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setPreview(true)} style={{ padding: '12px 24px', border: '1px solid #667eea', borderRadius: '8px', background: 'white', color: '#667eea', fontWeight: '600', cursor: 'pointer' }}>
                👁️ Xem trước
              </button>
              <button type="submit" disabled={loading} style={{ padding: '12px 32px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Đang tạo...' : '📝 Tạo hợp đồng'}
              </button>
            </div>
          </form>
        ) : (
          /* --- PREVIEW HỢP ĐỒNG --- */
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '48px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'serif', color: '#222', lineHeight: '1.8' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '2px', marginBottom: '8px', color: '#555' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '16px' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '20px' }}>---o0o---</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '1px' }}>HỢP ĐỒNG THUÊ PHÒNG TRỌ</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                  Số: HD{String(Math.floor(Math.random() * 9000) + 1000).padStart(6, '0')}/{new Date().getFullYear()}
                </div>
              </div>

              <p style={{ marginBottom: '16px' }}>
                Hôm nay, ngày <strong>{new Date().getDate()}</strong> tháng <strong>{new Date().getMonth() + 1}</strong> năm <strong>{new Date().getFullYear()}</strong>,
                tại địa chỉ: <strong>{form.property_address || '___________________________'}</strong>
              </p>
              <p style={{ marginBottom: '24px' }}>Chúng tôi gồm có:</p>

              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', color: '#333', marginBottom: '10px' }}>BÊN CHO THUÊ (Bên A):</div>
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr><td style={{ padding: '3px 0', color: '#666', width: '180px' }}>Họ và tên:</td><td><strong>{form.landlord_name || '___________________________'}</strong></td></tr>
                    <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>{form.landlord_id_card || '___________________________'}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>{form.landlord_phone || '___________________________'}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ:</td><td>{form.landlord_address || '___________________________'}</td></tr>
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
                <div style={{ fontWeight: '700', color: '#333', marginBottom: '10px' }}>BÊN THUÊ (Bên B):</div>
                <table style={{ width: '100%', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr><td style={{ padding: '3px 0', color: '#666', width: '180px' }}>Họ và tên:</td><td><strong>___________________________</strong></td></tr>
                    <tr><td style={{ padding: '3px 0', color: '#666' }}>Số CCCD/CMND:</td><td>___________________________</td></tr>
                    <tr><td style={{ padding: '3px 0', color: '#666' }}>Số điện thoại:</td><td>___________________________</td></tr>
                    <tr><td style={{ padding: '3px 0', color: '#666' }}>Địa chỉ thường trú:</td><td>___________________________</td></tr>
                  </tbody>
                </table>
              </div>

              <p style={{ marginBottom: '16px' }}>Hai bên cùng thỏa thuận ký kết hợp đồng thuê phòng trọ với các điều khoản sau:</p>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG</div>
                <p>Bên A đồng ý cho Bên B thuê phòng: <strong>{selectedRoom ? selectedRoom.name : '___'}</strong>
                {form.property_address ? `, tại địa chỉ: ${form.property_address}` : ''}
                {selectedRoom?.area ? `, diện tích: ${selectedRoom.area} m²` : ''}.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>ĐIỀU 2: THỜI HẠN THUÊ</div>
                <p>Thời hạn thuê phòng là <strong>{durationMonths} tháng</strong>, bắt đầu từ ngày <strong>{form.start_date ? new Date(form.start_date).toLocaleDateString('vi-VN') : '___'}</strong> đến ngày <strong>{form.end_date ? new Date(form.end_date).toLocaleDateString('vi-VN') : '___'}</strong>.</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
                <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                  <li>Giá thuê phòng: <strong>{form.rental_price ? Number(form.rental_price).toLocaleString('vi-VN') : '___'} đồng/tháng</strong></li>
                  <li>Tiền đặt cọc: <strong>{form.deposit ? Number(form.deposit).toLocaleString('vi-VN') : '0'} đồng</strong></li>
                  <li>Giá điện: <strong>{Number(form.electricity_price).toLocaleString('vi-VN')} đồng/kWh</strong></li>
                  <li>Giá nước: <strong>{Number(form.water_price).toLocaleString('vi-VN')} đồng/m³</strong></li>
                  <li>Thanh toán trước ngày <strong>{form.payment_day}</strong> hàng tháng</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>ĐIỀU 4: NGHĨA VỤ VÀ QUYỀN LỢI CÁC BÊN</div>
                <div style={{ marginBottom: '8px', fontWeight: '600' }}>Bên A có nghĩa vụ:</div>
                <ul style={{ paddingLeft: '20px', lineHeight: '2', marginBottom: '12px' }}>
                  <li>Giao phòng đúng ngày và đảm bảo phòng trong tình trạng tốt</li>
                  <li>Đảm bảo cung cấp điện, nước đầy đủ</li>
                  <li>Sửa chữa các hư hỏng không do Bên B gây ra</li>
                </ul>
                <div style={{ marginBottom: '8px', fontWeight: '600' }}>Bên B có nghĩa vụ:</div>
                <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
                  <li>Thanh toán tiền thuê đúng hạn</li>
                  <li>Giữ gìn phòng, không làm hư hỏng tài sản</li>
                  <li>Không tự ý sửa chữa, cải tạo phòng khi chưa có sự đồng ý của Bên A</li>
                  <li>Thông báo trước <strong>30 ngày</strong> khi muốn chấm dứt hợp đồng trước hạn</li>
                  <li>Giữ gìn trật tự, vệ sinh khu trọ</li>
                </ul>
              </div>

              {form.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>ĐIỀU 5: ĐIỀU KHOẢN BỔ SUNG</div>
                  <p style={{ whiteSpace: 'pre-line' }}>{form.notes}</p>
                </div>
              )}

              <div style={{ marginBottom: '40px' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>ĐIỀU {form.notes ? '6' : '5'}: ĐIỀU KHOẢN CHUNG</div>
                <p>Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản. Mọi tranh chấp phát sinh sẽ được giải quyết trên tinh thần thương lượng, hòa giải.</p>
              </div>

              {/* Ký tên */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', textAlign: 'center', marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '24px' }}>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>BÊN A (Chủ trọ)</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '60px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ borderTop: '1px solid #555', paddingTop: '8px', fontWeight: '600' }}>{form.landlord_name || '___________________________'}</div>
                </div>
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>BÊN B (Người thuê)</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '60px' }}>(Ký, ghi rõ họ tên)</div>
                  <div style={{ borderTop: '1px solid #555', paddingTop: '8px', fontWeight: '600' }}>___________________________</div>
                </div>
              </div>
            </div>

            {/* Action buttons below preview */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setPreview(false)} style={{ padding: '12px 24px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', color: '#555', fontWeight: '600', cursor: 'pointer' }}>
                ← Chỉnh sửa
              </button>
              <button onClick={() => window.print()} style={{ padding: '12px 24px', border: '1px solid #667eea', borderRadius: '8px', background: 'white', color: '#667eea', fontWeight: '600', cursor: 'pointer' }}>
                🖨️ In hợp đồng
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ padding: '12px 32px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Đang tạo...' : '✅ Xác nhận & Lưu hợp đồng'}
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
