import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

const STATUS_CFG = {
  pending:  { label: 'Chờ duyệt',    bg: '#fffbeb', color: '#d69e2e', border: '#f6e05e', icon: '⏳', dot: '#d69e2e' },
  active:   { label: 'Đã kích hoạt', bg: '#e6fffa', color: '#38b2ac', border: '#81e6d9', icon: '✅', dot: '#38b2ac' },
  inactive: { label: 'Đã khóa',      bg: '#fff5f5', color: '#e53e3e', border: '#feb2b2', icon: '🔒', dot: '#e53e3e' },
};

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: active ? color + '18' : 'white',
      borderRadius: 14, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: active ? `0 0 0 2px ${color}` : '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
    }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a202c', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────
function ConfirmModal({ tenant, action, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  if (!tenant || !action) return null;

  const cfg = {
    approve: {
      title: 'Phê duyệt tài khoản',
      desc: `Xác nhận kích hoạt tài khoản cho <strong>${tenant.fullName || tenant.name}</strong>?
             <br/>Họ sẽ có thể đăng nhập và xem thông tin hợp đồng ngay sau đó.`,
      btnLabel: '✅ Xác nhận phê duyệt',
      btnBg: 'linear-gradient(135deg, #38b2ac, #2c7a7b)',
      iconBg: '#e6fffa', iconColor: '#38b2ac', icon: '✅',
    },
    lock: {
      title: 'Khóa tài khoản',
      desc: `Xác nhận <strong>khóa</strong> tài khoản của <strong>${tenant.fullName || tenant.name}</strong>?
             <br/>Họ sẽ không thể đăng nhập cho đến khi được mở khóa.`,
      btnLabel: '🔒 Xác nhận khóa',
      btnBg: 'linear-gradient(135deg, #e53e3e, #c53030)',
      iconBg: '#fff5f5', iconColor: '#e53e3e', icon: '🔒',
    },
    unlock: {
      title: 'Mở khóa tài khoản',
      desc: `Xác nhận <strong>mở khóa</strong> tài khoản của <strong>${tenant.fullName || tenant.name}</strong>?`,
      btnLabel: '🔓 Xác nhận mở khóa',
      btnBg: 'linear-gradient(135deg, #667eea, #764ba2)',
      iconBg: '#f0f4ff', iconColor: '#667eea', icon: '🔓',
    },
    reject: {
      title: 'Từ chối tài khoản',
      desc: `Từ chối và <strong>khóa vĩnh viễn</strong> tài khoản của <strong>${tenant.fullName || tenant.name}</strong>?`,
      btnLabel: '🚫 Xác nhận từ chối',
      btnBg: 'linear-gradient(135deg, #718096, #4a5568)',
      iconBg: '#f7fafc', iconColor: '#718096', icon: '🚫',
    },
  };

  const c = cfg[action];

  const handle = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden',
        animation: 'popIn 0.2s ease',
      }}>
        <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }`}</style>

        <div style={{ padding: '28px 28px 0', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: c.iconBg, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>{c.icon}</div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a202c', marginBottom: 10 }}>{c.title}</h3>
          <p style={{ color: '#718096', fontSize: '0.9rem', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: c.desc }} />
        </div>

        <div style={{ padding: 24, display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', border: '1.5px solid #e2e8f0',
            background: 'white', borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.88rem', color: '#718096',
          }}>Hủy</button>
          <button onClick={handle} disabled={loading} style={{
            flex: 2, padding: '11px', border: 'none', borderRadius: 10,
            background: c.btnBg, color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: '0.88rem',
            opacity: loading ? 0.75 : 1, transition: 'opacity 0.2s',
          }}>
            {loading ? 'Đang xử lý...' : c.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tenant Row ────────────────────────────────────────────────
function TenantRow({ tenant, onAction }) {
  const name   = tenant.fullName || tenant.name || '';
  const st     = STATUS_CFG[tenant.status] || STATUS_CFG.pending;
  const isPending  = tenant.status === 'pending';
  const isActive   = tenant.status === 'active';
  const isInactive = tenant.status === 'inactive';

  return (
    <tr style={{ transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}>

      {/* Avatar + tên */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: isPending
              ? 'linear-gradient(135deg, #f6ad55, #ed8936)'
              : isActive
                ? 'linear-gradient(135deg, #68d391, #38a169)'
                : 'linear-gradient(135deg, #cbd5e0, #a0aec0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1rem',
            boxShadow: isPending ? '0 0 0 3px #fefcbf' : 'none',
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.92rem' }}>{name}</div>
            <div style={{ color: '#a0aec0', fontSize: '0.76rem', marginTop: 1 }}>{tenant.email}</div>
          </div>
        </div>
      </td>

      {/* CCCD */}
      <td style={{ padding: '14px 16px', color: '#4a5568', fontSize: '0.88rem' }}>
        {tenant.citizenID || tenant.citizen_id
          ? <span style={{ fontFamily: 'monospace', background: '#f7fafc', padding: '3px 8px', borderRadius: 6, fontSize: '0.82rem' }}>
              {tenant.citizenID || tenant.citizen_id}
            </span>
          : <span style={{ color: '#cbd5e0' }}>Chưa cập nhật</span>}
      </td>

      {/* SĐT */}
      <td style={{ padding: '14px 16px', color: '#4a5568', fontSize: '0.88rem' }}>
        {tenant.phoneNumber || tenant.phone_number || <span style={{ color: '#cbd5e0' }}>—</span>}
      </td>

      {/* Ngày đăng ký */}
      <td style={{ padding: '14px 16px', color: '#718096', fontSize: '0.82rem' }}>
        {fmtDate(tenant.createdAt || tenant.created_at)}
      </td>

      {/* Trạng thái */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          background: st.bg, color: st.color,
          border: `1px solid ${st.border}`,
          padding: '5px 12px', borderRadius: 20,
          fontSize: '0.78rem', fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: st.dot,
            ...(isPending ? { animation: 'pulse 1.5s infinite' } : {}),
          }} />
          {st.icon} {st.label}
        </span>
      </td>

      {/* Hành động */}
      <td style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isPending && (
            <>
              <button onClick={() => onAction(tenant, 'approve')} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #38b2ac, #2c7a7b)',
                color: 'white', cursor: 'pointer', fontWeight: 700,
                fontSize: '0.8rem', transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                ✅ Phê duyệt
              </button>
              <button onClick={() => onAction(tenant, 'reject')} style={{
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                background: 'white', color: '#718096', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem',
              }}>
                🚫 Từ chối
              </button>
            </>
          )}
          {isActive && (
            <button onClick={() => onAction(tenant, 'lock')} style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1.5px solid #feb2b2',
              background: 'white', color: '#e53e3e', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
              🔒 Khóa
            </button>
          )}
          {isInactive && (
            <button onClick={() => onAction(tenant, 'unlock')} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
            }}>
              🔓 Mở khóa
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function TenantApproval() {
  const [tenants,  setTenants]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [confirm,  setConfirm]  = useState(null); // { tenant, action }
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants');
      // API trả về tất cả tenant (pending + active + inactive)
      setTenants(res.data.tenants || []);
    } catch {
      showToast('Lỗi tải danh sách tài khoản', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  // Map action → status gửi lên API
  const ACTION_STATUS = {
    approve: 'active',
    reject:  'inactive',
    lock:    'inactive',
    unlock:  'active',
  };

  const handleConfirm = async () => {
    const { tenant, action } = confirm;
    const newStatus = ACTION_STATUS[action];
    try {
      await api.put(`/tenants/${tenant.id}/status`, { status: newStatus });
      const msgs = {
        approve: `✅ Đã phê duyệt tài khoản ${tenant.fullName || tenant.name}`,
        reject:  `🚫 Đã từ chối tài khoản ${tenant.fullName || tenant.name}`,
        lock:    `🔒 Đã khóa tài khoản ${tenant.fullName || tenant.name}`,
        unlock:  `🔓 Đã mở khóa tài khoản ${tenant.fullName || tenant.name}`,
      };
      showToast(msgs[action], true);
      setConfirm(null);
      fetchTenants();
    } catch (err) {
      showToast(err.response?.data?.error || 'Thao tác thất bại', false);
    }
  };

  // Đếm theo trạng thái
  const counts = {
    all:      tenants.length,
    pending:  tenants.filter(t => t.status === 'pending').length,
    active:   tenants.filter(t => t.status === 'active').length,
    inactive: tenants.filter(t => t.status === 'inactive').length,
  };

  // Filter + search
  const filtered = tenants.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const q = search.trim().toLowerCase();
    const name = t.full_name || t.name || '';
    const matchSearch = !q || [name, t.email, t.citizen_id, t.phone_number]
      .some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const TABS = [
    { key: 'all',      label: `Tất cả`,       count: counts.all,      color: '#667eea' },
    { key: 'pending',  label: `Chờ duyệt`,     count: counts.pending,  color: '#d69e2e' },
    { key: 'active',   label: `Đã kích hoạt`,  count: counts.active,   color: '#38b2ac' },
    { key: 'inactive', label: `Đã khóa`,       count: counts.inactive, color: '#e53e3e' },
  ];

  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#e6fffa' : '#fff5f5',
          border: `1px solid ${toast.ok ? '#81e6d9' : '#feb2b2'}`,
          color: toast.ok ? '#276749' : '#742a2a',
          padding: '13px 22px', borderRadius: 12,
          fontWeight: 700, fontSize: '0.9rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          animation: 'slideIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748', marginBottom: 4 }}>
          👥 Quản lý tài khoản khách thuê
        </h2>
        <p style={{ color: '#718096' }}>
          Phê duyệt tài khoản đăng ký mới, kích hoạt hoặc khóa người thuê
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Tổng tài khoản"  value={counts.all}      color="#667eea" active={filter==='all'}      onClick={() => setFilter('all')} />
        <StatCard icon="⏳" label="Chờ phê duyệt"   value={counts.pending}  color="#d69e2e" active={filter==='pending'}  onClick={() => setFilter('pending')} />
        <StatCard icon="✅" label="Đã kích hoạt"    value={counts.active}   color="#38b2ac" active={filter==='active'}   onClick={() => setFilter('active')} />
        <StatCard icon="🔒" label="Đã khóa"         value={counts.inactive} color="#e53e3e" active={filter==='inactive'} onClick={() => setFilter('inactive')} />
      </div>

      {/* Banner cảnh báo nếu có pending */}
      {counts.pending > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #f6e05e',
          borderRadius: 12, padding: '13px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: '0.9rem', color: '#744210',
        }}>
          <span style={{ fontSize: '1.4rem', animation: 'pulse 1.5s infinite' }}>⚠️</span>
          <span>
            Có <strong>{counts.pending} tài khoản</strong> đang chờ phê duyệt.
            Người thuê chưa thể đăng nhập cho đến khi được kích hoạt.
          </span>
          <button onClick={() => setFilter('pending')} style={{
            marginLeft: 'auto', padding: '6px 14px',
            background: '#d69e2e', color: 'white', border: 'none',
            borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
          }}>
            Xem ngay →
          </button>
        </div>
      )}

      {/* Table card */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f0f2f5',
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f7fafc', padding: 4, borderRadius: 10, gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: '7px 14px', border: 'none', borderRadius: 8,
                background: filter === tab.key ? 'white' : 'transparent',
                color: filter === tab.key ? tab.color : '#718096',
                fontWeight: filter === tab.key ? 700 : 500,
                fontSize: '0.82rem', cursor: 'pointer',
                boxShadow: filter === tab.key ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.18s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    background: filter === tab.key ? tab.color : '#e2e8f0',
                    color: filter === tab.key ? 'white' : '#718096',
                    borderRadius: 20, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700,
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, CCCD, SĐT..."
              style={{
                width: '100%', padding: '9px 10px 9px 32px',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                fontSize: '0.87rem', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#667eea'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Refresh */}
          <button onClick={fetchTenants} style={{
            padding: '9px 14px', background: '#f0f4ff', color: '#667eea',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.82rem',
          }}>
            🔄 Tải lại
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⏳</div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>
              {filter === 'pending' ? '🎉' : '👥'}
            </div>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>
              {filter === 'pending'
                ? 'Không có tài khoản nào đang chờ duyệt!'
                : search
                  ? `Không tìm thấy kết quả cho "${search}"`
                  : 'Chưa có tài khoản nào'}
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
              {filter === 'pending' && 'Mọi yêu cầu đăng ký đã được xử lý 👍'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f0f2f5' }}>
                  {['Tài khoản', 'CCCD / CMND', 'Số điện thoại', 'Ngày đăng ký', 'Trạng thái', 'Hành động'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: 700,
                      color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <TenantRow
                    key={t.id}
                    tenant={{
                      ...t,
                      fullName: t.full_name || t.name,
                      citizenID: t.citizen_id,
                      phoneNumber: t.phone_number,
                      createdAt: t.created_at,
                    }}
                    onAction={(tenant, action) => setConfirm({ tenant, action })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid #f0f2f5',
            color: '#a0aec0', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Hiển thị {filtered.length} / {tenants.length} tài khoản</span>
            {counts.pending > 0 && (
              <span style={{ color: '#d69e2e', fontWeight: 600 }}>
                ⚠️ {counts.pending} chờ duyệt
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          tenant={confirm.tenant}
          action={confirm.action}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
