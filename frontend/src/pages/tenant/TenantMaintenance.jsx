import { useState, useEffect } from 'react';
import api from '../../api';
import TenantLayout from '../../components/layout/TenantLayout';

const CATEGORIES = [
  { id: 'electrical', icon: '⚡', label: 'Điện' },
  { id: 'plumbing', icon: '💧', label: 'Nước / Ống nước' },
  { id: 'air_conditioning', icon: '❄️', label: 'Điều hòa' },
  { id: 'door_window', icon: '🚪', label: 'Cửa / Cửa sổ' },
  { id: 'furniture', icon: '🛋️', label: 'Nội thất' },
  { id: 'pest', icon: '🐛', label: 'Côn trùng / Mối mọt' },
  { id: 'internet', icon: '📶', label: 'Internet / Wifi' },
  { id: 'general', icon: '🔧', label: 'Khác' },
];

const STATUS_CONFIG = {
  pending: { label: 'Chờ xử lý', bg: '#fffbeb', color: '#d69e2e', icon: '⏳' },
  in_progress: { label: 'Đang sửa', bg: '#ebf4ff', color: '#3182ce', icon: '🔨' },
  completed: { label: 'Hoàn thành', bg: '#e6fffa', color: '#38b2ac', icon: '✅' },
  cancelled: { label: 'Đã hủy', bg: '#f7fafc', color: '#718096', icon: '❌' },
};

const PRIORITY_CONFIG = {
  high: { label: 'Ưu tiên cao', bg: '#fff5f5', color: '#e53e3e' },
  normal: { label: 'Bình thường', bg: '#f7fafc', color: '#718096' },
};

export default function TenantMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', category: 'general' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants/maintenance');
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setSubmitError('Vui lòng mô tả vấn đề cần sửa chữa'); return; }
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const res = await api.post('/tenants/maintenance', form);
      setSubmitSuccess(
        res.data.priority === 'high'
          ? '🚨 Yêu cầu ưu tiên cao đã được gửi! Kỹ thuật viên sẽ xử lý ngay.'
          : '✅ Yêu cầu đã được gửi thành công!'
      );
      fetchRequests();
      setForm({ description: '', category: 'general' });
      setTimeout(() => { setShowForm(false); setSubmitSuccess(''); }, 3000);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <TenantLayout title="Báo sự cố" subtitle="Gửi và theo dõi các yêu cầu sửa chữa, bảo trì">

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
        {[
          { icon: '📋', count: requests.length, label: 'Tổng yêu cầu', color: '#667eea' },
          { icon: '⏳', count: pendingCount, label: 'Chờ xử lý', color: '#d69e2e' },
          { icon: '🔨', count: inProgressCount, label: 'Đang sửa', color: '#3182ce' },
          { icon: '✅', count: completedCount, label: 'Hoàn thành', color: '#38b2ac' },
        ].map(item => (
          <div key={item.label} className="stat-card-new" style={{ borderLeft: `4px solid ${item.color}` }}>
            <div className="stat-icon">{item.icon}</div>
            <div className="stat-info">
              <span className="stat-value" style={{ color: item.color }}>{item.count}</span>
              <span className="stat-label">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Safety warning */}
      <div style={{
        background: '#fff5f5', border: '1px solid #feb2b2', borderLeft: '4px solid #e53e3e',
        borderRadius: '8px', padding: '12px 18px', marginBottom: '20px', fontSize: '0.85rem', color: '#742a2a'
      }}>
        🚨 <strong>Khẩn cấp:</strong> Nếu phát hiện rò rỉ ga, điện giật, cháy nổ — hãy mô tả chi tiết, yêu cầu sẽ được <strong>ưu tiên xử lý ngay lập tức</strong>.
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="tab-group">
            {[['all', 'Tất cả'], ['pending', 'Chờ xử lý'], ['in_progress', 'Đang sửa'], ['completed', 'Hoàn thành']].map(([key, label]) => (
              <button key={key} className={`tab-item ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>
          <button className="btn-primary-gradient" onClick={() => { setShowForm(true); setSubmitError(''); setSubmitSuccess(''); }}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            + Gửi yêu cầu mới
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#aaa' }}>
            <div style={{ fontSize: '2.5rem' }}>🔧</div>
            <p style={{ marginTop: '12px' }}>Chưa có yêu cầu nào</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(req => {
              const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const pc = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.normal;
              const cat = CATEGORIES.find(c => c.id === req.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <div key={req.id} style={{
                  border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px',
                  background: 'white', transition: 'box-shadow 0.2s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                        <span style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>{cat.label}</span>
                        {req.priority === 'high' && (
                          <span style={{ background: pc.bg, color: pc.color, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                            🚨 Ưu tiên cao
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 10px' }}>
                        {req.description}
                      </p>
                      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        📅 Gửi lúc: {new Date(req.created_at).toLocaleString('vi-VN')}
                      </div>
                      {req.resolution_note && (
                        <div style={{ marginTop: '8px', background: '#e6fffa', borderRadius: '6px', padding: '8px 12px', fontSize: '0.85rem', color: '#2d6a4f' }}>
                          💬 <strong>Ghi chú kỹ thuật viên:</strong> {req.resolution_note}
                        </div>
                      )}
                    </div>
                    <span style={{
                      background: sc.bg, color: sc.color, padding: '5px 12px',
                      borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap'
                    }}>
                      {sc.icon} {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !submitLoading && setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>🔧 Gửi yêu cầu sửa chữa</h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>×</button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>
                  {submitSuccess.includes('🚨') ? '🚨' : '✅'}
                </div>
                <p style={{ fontWeight: '600', color: '#38b2ac', fontSize: '0.95rem' }}>{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Category selector */}
                <p style={{ fontWeight: '600', color: '#555', marginBottom: '10px', fontSize: '0.9rem' }}>
                  Loại sự cố: *
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                      style={{
                        padding: '10px 6px', border: form.category === cat.id ? '2px solid #667eea' : '2px solid #e2e8f0',
                        borderRadius: '8px', background: form.category === cat.id ? '#f0f4ff' : 'white',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem', color: form.category === cat.id ? '#667eea' : '#555',
                        fontWeight: form.category === cat.id ? '700' : '500', transition: 'all 0.2s'
                      }}>
                      <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '8px', fontSize: '0.9rem' }}>
                    Mô tả vấn đề: *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Mô tả chi tiết sự cố (ví dụ: Đèn phòng ngủ bị chớp, quạt không quay...)"
                    rows={4}
                    required
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px',
                      fontSize: '0.9rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                      lineHeight: '1.5'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>
                    💡 Mô tả rõ sẽ giúp kỹ thuật viên xử lý nhanh hơn
                  </div>
                </div>

                {/* High priority hint */}
                <div style={{
                  background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px',
                  padding: '10px 12px', marginBottom: '16px', fontSize: '0.8rem', color: '#742a2a'
                }}>
                  🚨 Các từ khóa sau sẽ được tự động đặt <strong>ưu tiên cao</strong>: rò rỉ, điện giật, cháy, nổ, nguy hiểm, khẩn cấp
                </div>

                {submitError && <div className="error-message">{submitError}</div>}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}
                    disabled={submitLoading} style={{ flex: 1 }}>Hủy</button>
                  <button type="submit" className="btn-primary" disabled={submitLoading}
                    style={{ flex: 2, marginTop: 0 }}>
                    {submitLoading ? 'Đang gửi...' : '📤 Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </TenantLayout>
  );
}
