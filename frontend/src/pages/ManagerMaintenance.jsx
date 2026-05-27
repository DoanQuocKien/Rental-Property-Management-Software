import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ── Config ────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:     { label: 'Chờ xử lý',   bg: '#fffbeb', color: '#d69e2e', icon: '⏳', border: '#f6e05e' },
  in_progress: { label: 'Đang sửa',    bg: '#ebf4ff', color: '#3182ce', icon: '🔨', border: '#bee3f8' },
  completed:   { label: 'Hoàn thành',  bg: '#e6fffa', color: '#38b2ac', icon: '✅', border: '#81e6d9' },
  cancelled:   { label: 'Đã hủy',      bg: '#f7fafc', color: '#718096', icon: '❌', border: '#e2e8f0' },
};

const PRIORITY_CFG = {
  high:   { label: 'Khẩn cấp', bg: '#fff5f5', color: '#e53e3e', icon: '🔴' },
  normal: { label: 'Bình thường', bg: '#f7fafc', color: '#718096', icon: '⚪' },
};

const CATEGORY_ICONS = {
  electrical: '⚡', plumbing: '💧', air_conditioning: '❄️',
  furniture: '🛋️', internet: '📶', general: '🔧',
};

// Mock technicians - in real app fetch from API
const TECHNICIANS = [
  { id: 1, name: 'Nguyễn Văn Thợ', specialty: 'Điện - Nước' },
  { id: 2, name: 'Trần Thị Kỹ',    specialty: 'Điện lạnh' },
  { id: 3, name: 'Lê Đức Sửa',     specialty: 'Nội thất - Tổng hợp' },
];

function fmtDate(d) {
  return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

// ── Stats Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, onClick, active }) {
  return (
    <div onClick={onClick}
      style={{
        background: active ? color + '15' : 'white',
        borderRadius: 14, padding: '18px 22px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: active ? `0 0 0 2px ${color}` : '0 2px 12px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a202c', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Detail / Edit Modal ───────────────────────────────────────────────────────
function RequestModal({ req, onClose, onUpdate }) {
  const [status, setStatus]   = useState(req.status);
  const [note, setNote]       = useState(req.resolutionNote || '');
  const [techId, setTechId]   = useState(req.assigned_to || '');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const pc = PRIORITY_CFG[req.priority] || PRIORITY_CFG.normal;
  const catIcon = CATEGORY_ICONS[req.category] || '🔧';

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      await onUpdate(req.id, status, note);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Cập nhật thất bại');
    } finally { setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 18, width: '100%', maxWidth: 540,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '22px 28px', color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>{catIcon}</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Yêu cầu #{req.id}</span>
              </div>
              <div style={{ opacity: 0.85, fontSize: '0.85rem' }}>
                🏠 {req.roomName} &nbsp;·&nbsp; 👤 {req.tenantName}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                background: pc.bg, color: pc.color,
                padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
              }}>
                {pc.icon} {pc.label}
              </span>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer',
              }}>×</button>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Description */}
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20,
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: '0.78rem', color: '#a0aec0', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Mô tả sự cố</div>
            <div style={{ color: '#2d3748', fontSize: '0.92rem', lineHeight: 1.6 }}>{req.description}</div>
            <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#a0aec0' }}>
              📅 Gửi lúc: {fmtDate(req.createdAt)}
            </div>
          </div>

          {/* Status selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#4a5568', marginBottom: 10, fontSize: '0.88rem' }}>
              Cập nhật trạng thái
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                <button key={key} onClick={() => setStatus(key)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: status === key ? `2px solid ${cfg.color}` : '1.5px solid #e2e8f0',
                    background: status === key ? cfg.bg : 'white',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontWeight: status === key ? 700 : 400,
                    fontSize: '0.85rem', color: status === key ? cfg.color : '#4a5568',
                    transition: 'all 0.18s',
                  }}>
                  <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assign technician */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#4a5568', marginBottom: 10, fontSize: '0.88rem' }}>
              🔧 Gán kỹ thuật viên
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                onClick={() => setTechId('')}
                style={{
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  border: !techId ? '2px solid #667eea' : '1.5px solid #e2e8f0',
                  background: !techId ? '#f0f4ff' : 'white',
                  fontSize: '0.85rem', color: !techId ? '#667eea' : '#718096', fontWeight: !techId ? 700 : 400,
                  transition: 'all 0.18s',
                }}>
                Chưa gán / Xử lý sau
              </div>
              {TECHNICIANS.map(t => (
                <div key={t.id} onClick={() => setTechId(t.id)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    border: techId === t.id ? '2px solid #667eea' : '1.5px solid #e2e8f0',
                    background: techId === t.id ? '#f0f4ff' : 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.18s',
                  }}>
                  <div>
                    <div style={{ fontWeight: techId === t.id ? 700 : 400, fontSize: '0.88rem', color: techId === t.id ? '#667eea' : '#2d3748' }}>
                      👷 {t.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{t.specialty}</div>
                  </div>
                  {techId === t.id && <span style={{ color: '#667eea', fontSize: '1.1rem' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Resolution note */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#4a5568', marginBottom: 8, fontSize: '0.88rem' }}>
              📝 Ghi chú / Giải pháp
            </div>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              rows={3} placeholder="Mô tả giải pháp đã xử lý hoặc kế hoạch sửa chữa..."
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontSize: '0.88rem', resize: 'vertical',
                outline: 'none', fontFamily: 'inherit', color: '#2d3748',
              }}
            />
          </div>

          {err && (
            <div style={{ color: '#e53e3e', fontSize: '0.85rem', marginBottom: 12, padding: '10px', background: '#fff5f5', borderRadius: 8 }}>
              ⚠️ {err}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '11px', border: '1.5px solid #e2e8f0', background: 'white', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: '#718096' }}>
              Hủy
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{
                flex: 2, padding: '11px', border: 'none', borderRadius: 10, cursor: 'pointer',
                fontWeight: 700, fontSize: '0.88rem', color: 'white',
                background: saving ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
              }}>
              {saving ? 'Đang cập nhật...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({ req, onClick }) {
  const sc = STATUS_CFG[req.status] || STATUS_CFG.pending;
  const pc = PRIORITY_CFG[req.priority] || PRIORITY_CFG.normal;
  const catIcon = CATEGORY_ICONS[req.category] || '🔧';

  return (
    <div onClick={onClick}
      style={{
        background: 'white', borderRadius: 14, padding: '16px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        borderLeft: `4px solid ${sc.color}`,
        cursor: 'pointer', transition: 'all 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '1.4rem' }}>{catIcon}</span>
          <div>
            <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.92rem' }}>
              🏠 {req.roomName}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#a0aec0', marginTop: 2 }}>👤 {req.tenantName} · {req.tenantPhone}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{
            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
            padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
          }}>
            {sc.icon} {sc.label}
          </span>
          <span style={{
            background: pc.bg, color: pc.color,
            padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
          }}>
            {pc.icon} {pc.label}
          </span>
        </div>
      </div>

      <div style={{ color: '#4a5568', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {req.description}
      </div>

      {req.resolutionNote && (
        <div style={{ fontSize: '0.78rem', color: '#667eea', background: '#f0f4ff', padding: '6px 10px', borderRadius: 8, marginBottom: 8 }}>
          📝 {req.resolutionNote}
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: '#a0aec0', display: 'flex', justifyContent: 'space-between' }}>
        <span>📅 {fmtDate(req.createdAt)}</span>
        <span style={{ color: '#667eea', fontWeight: 600 }}>Nhấn để cập nhật →</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagerMaintenance() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState('');

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(''), 3000);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/landlord/maintenance${params}`);
      setRequests(res.data.data || []);
    } catch {
      showToast('Lỗi tải dữ liệu', false);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleUpdate = async (id, status, resolutionNote) => {
    await api.put(`/landlord/maintenance/${id}`, { status, resolutionNote });
    showToast('✅ Cập nhật trạng thái thành công!');
    fetchRequests();
  };

  const counts = {
    all:         requests.length,
    pending:     requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed:   requests.filter(r => r.status === 'completed').length,
    cancelled:   requests.filter(r => r.status === 'cancelled').length,
  };

  const highPriority = requests.filter(r => r.priority === 'high' && r.status !== 'completed').length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#e6fffa' : '#fff5f5',
          border: `1px solid ${toast.ok ? '#81e6d9' : '#feb2b2'}`,
          color: toast.ok ? '#276749' : '#742a2a',
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748', marginBottom: 4 }}>🔧 Quản lý bảo trì</h2>
        <p style={{ color: '#718096' }}>Xem, phân công và cập nhật trạng thái yêu cầu sửa chữa từ khách thuê</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="📋" label="Tổng yêu cầu"   value={counts.all}         color="#667eea" onClick={() => setFilter('all')}         active={filter === 'all'} />
        <StatCard icon="⏳" label="Chờ xử lý"       value={counts.pending}     color="#d69e2e" onClick={() => setFilter('pending')}     active={filter === 'pending'} />
        <StatCard icon="🔨" label="Đang sửa"         value={counts.in_progress} color="#3182ce" onClick={() => setFilter('in_progress')} active={filter === 'in_progress'} />
        <StatCard icon="✅" label="Hoàn thành"       value={counts.completed}   color="#38b2ac" onClick={() => setFilter('completed')}   active={filter === 'completed'} />
      </div>

      {/* High priority alert */}
      {highPriority > 0 && (
        <div style={{
          background: '#fff5f5', border: '1px solid #feb2b2',
          borderRadius: 10, padding: '12px 18px', marginBottom: 20,
          color: '#742a2a', fontSize: '0.88rem', display: 'flex', gap: 10, alignItems: 'center',
        }}>
          🚨 <strong>Có {highPriority} yêu cầu khẩn cấp</strong> chưa được xử lý. Vui lòng ưu tiên xử lý ngay!
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="tab-group">
          {[
            ['all', `Tất cả (${counts.all})`],
            ['pending', `Chờ xử lý (${counts.pending})`],
            ['in_progress', `Đang sửa (${counts.in_progress})`],
            ['completed', `Hoàn thành (${counts.completed})`],
            ['cancelled', `Đã hủy (${counts.cancelled})`],
          ].map(([key, label]) => (
            <button key={key} className={`tab-item ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', background: 'white', borderRadius: 14 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⏳</div>
          <p>Đang tải yêu cầu bảo trì...</p>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', background: 'white', borderRadius: 14 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔧</div>
          <p style={{ fontWeight: 600 }}>Không có yêu cầu nào</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Mọi thứ đang ổn định!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {requests.map(r => (
            <RequestCard key={r.id} req={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      {selected && (
        <RequestModal
          req={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
