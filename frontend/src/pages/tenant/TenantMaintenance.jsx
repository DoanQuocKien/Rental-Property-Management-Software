import { useState, useEffect } from 'react';
import api from '../../api';

// --- HỆ THỐNG SVG ICONS ---
const Icons = {
  electrical: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  plumbing: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  air_con: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  furniture: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/><path d="M2 14h20"/><path d="M6 12V6"/><path d="M18 12V6"/></svg>,
  wifi: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  general: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  camera: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  send: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
};

const CATEGORIES = [
  { id: 'electrical', icon: <Icons.electrical />, label: 'Điện' },
  { id: 'plumbing', icon: <Icons.plumbing />, label: 'Nước' },
  { id: 'air_conditioning', icon: <Icons.air_con />, label: 'Máy lạnh' },
  { id: 'furniture', icon: <Icons.furniture />, label: 'Nội thất' },
  { id: 'internet', icon: <Icons.wifi />, label: 'Wifi' },
  { id: 'general', icon: <Icons.general />, label: 'Khác' },
];

export default function TenantMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', category: 'general' });
  const [imageFile, setImageFile] = useState(null); // Lưu file thực tế
  const [imagePreview, setImagePreview] = useState(null); // Lưu link để hiện ảnh
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  const tenantColor = '#2d6a4f';

  const fetchRequests = async () => {
    try {
      const res = await api.get('/tenants/maintenance');
      setRequests(res.data.requests || []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Xử lý khi chọn file ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert('Vui lòng nhập mô tả sự cố!');
      return;
    }

    setSubmitting(true);

    // Dùng FormData để gửi được cả file ảnh
    const formData = new FormData();
    formData.append('description', form.description);
    formData.append('category', form.category);
    if (imageFile) {
      formData.append('image', imageFile); // 'image' phải khớp với tên biến ở Backend
    }

    try {
      await api.post('/tenants/maintenance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Gửi yêu cầu thành công! ✨');
      setForm({ description: '', category: 'general' });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Gửi thất bại. Kiểm tra lại kết nối server.');
    }
    finally { setSubmitting(false); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="maintenance-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icons.general /> Báo cáo sự cố
          </h2>
          <p style={{ color: '#718096' }}>Gửi yêu cầu sửa chữa trang thiết bị</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: tenantColor, color: 'white', padding: '12px 24px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Tạo yêu cầu mới
        </button>
      </div>

      {/* 2. Bộ lọc Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee' }}>
        {[['all', 'Tất cả'], ['pending', 'Chờ xử lý'], ['completed', 'Đã xong']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              color: filter === key ? tenantColor : '#718096',
              borderBottom: filter === key ? `3px solid ${tenantColor}` : '3px solid transparent',
              fontWeight: filter === key ? 'bold' : 'normal', transition: '0.3s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3. Danh sách yêu cầu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading ? <p>Đang tải...</p> : (
          filtered.length > 0 ? filtered.map(req => {
            const cat = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[5];
            return (
              <div key={req.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ color: tenantColor, background: '#f0fff4', padding: '10px', borderRadius: '10px' }}>
                    {cat.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{cat.label}</div>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>{req.description}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icons.clock /> {new Date(req.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          }) : <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>Chưa có dữ liệu bảo trì.</p>
        )}
      </div>

      {/* 4. Modal Form có Upload Ảnh */}
      {showForm && (
        <div className="modal-overlay" style={overlayStyle} onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={modalStyle}>
            <h3 style={{ marginBottom: '15px' }}>🛠️ Gửi yêu cầu sửa chữa</h3>

            <label style={labelStyle}>Loại sự cố:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '10px 0' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm({...form, category: cat.id})}
                  style={{
                    padding: '8px', borderRadius: '10px', border: '1px solid',
                    borderColor: form.category === cat.id ? tenantColor : '#ddd',
                    background: form.category === cat.id ? '#f0fff4' : 'white',
                    color: form.category === cat.id ? tenantColor : '#4a5568',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer'
                  }}
                >
                  {cat.icon} <span style={{ fontSize: '0.7rem' }}>{cat.label}</span>
                </button>
              ))}
            </div>

            <label style={labelStyle}>Mô tả sự cố: *</label>
            <textarea
              style={textareaStyle}
              placeholder="Vòi nước bị rò rỉ, bóng đèn không sáng..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />

            {/* --- PHẦN UPLOAD ẢNH --- */}
            <label style={{ ...labelStyle, marginTop: '15px' }}>Hình ảnh minh chứng:</label>
            <div style={{ marginTop: '10px' }}>
              {!imagePreview ? (
                <label style={uploadPlaceholderStyle}>
                  <Icons.camera />
                  <span>Nhấn để chọn ảnh</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    style={removeImgBtnStyle}
                  >✕</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button onClick={() => setShowForm(false)} style={btnCancelStyle}>Hủy</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ ...btnSubmitStyle, background: tenantColor }}
              >
                {submitting ? 'Đang gửi...' : <><Icons.send /> Gửi yêu cầu</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES TỔNG HỢP ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' };
const labelStyle = { fontWeight: 'bold', fontSize: '0.85rem', color: '#4a5568', display: 'block' };
const textareaStyle = { width: '100%', padding: '12px', marginTop: '8px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '80px', outline: 'none', fontSize: '0.9rem' };
const uploadPlaceholderStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', border: '2px dashed #ddd', borderRadius: '10px', cursor: 'pointer', color: '#718096', fontSize: '0.8rem' };
const removeImgBtnStyle = { position: 'absolute', top: '-5px', right: '-5px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' };
const btnCancelStyle = { flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '10px', cursor: 'pointer', background: 'white' };
const btnSubmitStyle = { flex: 2, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };