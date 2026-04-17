import { useState, useEffect } from 'react';
import api from '../../api';

const CATEGORIES = [
  { id: 'electrical', icon: '⚡', label: 'Điện' },
  { id: 'plumbing', icon: '💧', label: 'Nước' },
  { id: 'air_conditioning', icon: '❄️', label: 'Máy lạnh' },
  { id: 'furniture', icon: '🛋️', label: 'Nội thất' },
  { id: 'internet', icon: '📶', label: 'Wifi' },
  { id: 'general', icon: '🔧', label: 'Khác' },
];

const STATUS_CONFIG = {
  pending: { label: 'Chờ xử lý', bg: '#fffbeb', color: '#d69e2e', icon: '⏳' },
  in_progress: { label: 'Đang sửa', bg: '#ebf4ff', color: '#3182ce', icon: '🔨' },
  completed: { label: 'Hoàn thành', bg: '#e6fffa', color: '#38b2ac', icon: '✅' },
  cancelled: { label: 'Đã hủy', bg: '#f7fafc', color: '#718096', icon: '❌' },
};

export default function TenantMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', category: 'general' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Màu chủ đạo của Người thuê
  const tenantColor = '#2d6a4f';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/maintenance');
      setRequests(res.data.requests || []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/tenants/maintenance', form);
      alert('Đã gửi yêu cầu thành công! Kỹ thuật viên sẽ sớm liên hệ.');
      setShowForm(false);
      setForm({ description: '', category: 'general' });
      fetchRequests();
    } catch { alert('Gửi yêu cầu thất bại'); }
    finally { setSubmitLoading(false); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="maintenance-container">
      {/* 1. Header & Nút gửi yêu cầu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Báo cáo sự cố</h2>
          <p style={{ color: '#718096' }}>Gửi yêu cầu sửa chữa trang thiết bị trong phòng</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: tenantColor, color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Gửi yêu cầu mới
        </button>
      </div>

      {/* 2. Bộ lọc (Tabs) */}
      <div className="tab-group" style={{ marginBottom: '20px' }}>
        {[['all', 'Tất cả'], ['pending', 'Chờ xử lý'], ['in_progress', 'Đang sửa'], ['completed', 'Xong']].map(([key, label]) => (
          <button
            key={key}
            className={`tab-item ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
            style={{ borderColor: filter === key ? tenantColor : 'transparent', color: filter === key ? tenantColor : '#666' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3. Danh sách yêu cầu */}
      {loading ? <p>Đang tải dữ liệu...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filtered.length === 0 ? (
            <div className="content-card" style={{ textAlign: 'center', padding: '40px' }}>Bạn chưa có yêu cầu nào trong mục này.</div>
          ) : (
            filtered.map(req => {
              const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const cat = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[5];
              return (
                <div key={req.id} className="content-card" style={{ borderLeft: `5px solid ${sc.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.8rem' }}>{cat.icon}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333' }}>{cat.label}</div>
                        <div style={{ fontSize: '0.9rem', color: '#555' }}>{req.description}</div>
                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '5px' }}>📅 {new Date(req.created_at).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                    <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Modal Gửi yêu cầu (Chỉ hiện khi nhấn nút) */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '20px' }}>🛠️ Gửi yêu cầu sửa chữa</h3>

            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Chọn loại sự cố:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '15px 0' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setForm({...form, category: cat.id})}
                  style={{
                    padding: '10px', borderRadius: '8px',
                    border: form.category === cat.id ? `2px solid ${tenantColor}` : '1px solid #ddd',
                    background: form.category === cat.id ? '#f0fff4' : 'white'
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Mô tả chi tiết:</label>
            <textarea
              style={{ width: '100%', padding: '10px', marginTop: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
              placeholder="Ví dụ: Vòi nước bị rò rỉ, cần sửa gấp..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>Hủy</button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                style={{ flex: 2, background: tenantColor, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}
              >
                {submitLoading ? 'Đang gửi...' : '📤 Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}