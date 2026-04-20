import { useState, useEffect } from 'react';
import api from '../../api';

// --- HỆ THỐNG SVG ICONS (KHÔNG DÙNG ẢNH NGOÀI) ---
const Icons = {
  electrical: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  ),
  plumbing: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
  ),
  air_con: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
  ),
  furniture: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/><path d="M2 14h20"/><path d="M6 12V6"/><path d="M18 12V6"/></svg>
  ),
  wifi: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
  ),
  general: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
  ),
  clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
  )
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert('Vui lòng nhập mô tả sự cố!');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/tenants/maintenance', form);
      alert('Gửi yêu cầu thành công! ✨');
      setForm({ description: '', category: 'general' });
      setShowForm(false);
      fetchRequests();
    } catch { alert('Gửi yêu cầu thất bại.'); }
    finally { setSubmitting(false); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="maintenance-container">
      {/* 1. Header & Nút tạo mới */}
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
      <div className="tab-group" style={{ marginBottom: '20px', borderBottom: '1px solid #eee' }}>
        {[['all', 'Tất cả'], ['pending', 'Chờ xử lý'], ['completed', 'Đã xong']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              color: filter === key ? tenantColor : '#718096',
              borderBottom: filter === key ? `3px solid ${tenantColor}` : '3px solid transparent',
              fontWeight: filter === key ? 'bold' : 'normal'
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
              <div key={req.id} className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          }) : <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>Chưa có dữ liệu.</p>
        )}
      </div>

      {/* 4. Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '20px' }}>🛠️ Gửi yêu cầu mới</h3>

            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Loại sự cố:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '15px 0' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm({...form, category: cat.id})}
                  style={{
                    padding: '10px', borderRadius: '10px', border: '1px solid',
                    borderColor: form.category === cat.id ? tenantColor : '#ddd',
                    background: form.category === cat.id ? '#f0fff4' : 'white',
                    color: form.category === cat.id ? tenantColor : '#4a5568',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer'
                  }}
                >
                  {cat.icon} <span style={{ fontSize: '0.75rem' }}>{cat.label}</span>
                </button>
              ))}
            </div>

            <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Mô tả chi tiết: *</label>
            <textarea
              style={{ width: '100%', padding: '12px', marginTop: '10px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '100px', outline: 'none' }}
              placeholder="Mô tả vấn đề bạn đang gặp phải..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>Hủy</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ flex: 2, background: tenantColor, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting ? 'Đang gửi...' : <><Icons.send /> Gửi báo cáo</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}