/**
 * NotificationBell.jsx
 * 
 * Dùng chung cho cả Landlord và Tenant.
 * Truyền prop role="landlord" hoặc role="tenant".
 * 
 * Usage:
 *   import NotificationBell from '../components/NotificationBell';
 *   <NotificationBell role="landlord" />
 *   <NotificationBell role="tenant" />
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// ── Type styling ──────────────────────────────────────────────────────────────
const TYPE_STYLE = {
  urgent:  { bg: '#fff5f5', border: '#feb2b2', dot: '#e53e3e', accent: '#e53e3e', label: '#742a2a' },
  warning: { bg: '#fffbeb', border: '#f6e05e', dot: '#d69e2e', accent: '#d69e2e', label: '#744210' },
  success: { bg: '#e6fffa', border: '#81e6d9', dot: '#38b2ac', accent: '#38b2ac', label: '#276749' },
  info:    { bg: '#ebf8ff', border: '#bee3f8', dot: '#3182ce', accent: '#3182ce', label: '#2a4365' },
};

// ── Build landlord notifications ──────────────────────────────────────────────
async function fetchLandlordNotifications() {
  const notifs = [];

  try {
    const [mainRes, contractRes] = await Promise.allSettled([
      api.get('/landlord/maintenance'),
      api.get('/contracts'),
    ]);

    // Maintenance: pending / high priority
    if (mainRes.status === 'fulfilled') {
      const reqs = mainRes.value.data.data || [];

      const highPending = reqs.filter(r => r.priority === 'high' && r.status === 'pending');
      if (highPending.length > 0) {
        notifs.push({
          id: 'maint-urgent',
          type: 'urgent',
          icon: '🚨',
          title: `${highPending.length} yêu cầu khẩn cấp chưa xử lý`,
          message: highPending.slice(0, 2).map(r => `Phòng ${r.roomName}: ${r.description.slice(0, 40)}`).join(' | '),
          time: 'Hôm nay',
          read: false,
          link: '/maintenance',
          badge: highPending.length,
        });
      }

      const normalPending = reqs.filter(r => r.priority !== 'high' && r.status === 'pending');
      if (normalPending.length > 0) {
        notifs.push({
          id: 'maint-pending',
          type: 'warning',
          icon: '🔧',
          title: `${normalPending.length} yêu cầu bảo trì chờ xử lý`,
          message: `Bao gồm ${normalPending.filter(r => r.category === 'electrical').length} điện, ${normalPending.filter(r => r.category === 'plumbing').length} nước và các loại khác`,
          time: 'Hôm nay',
          read: false,
          link: '/maintenance',
          badge: normalPending.length,
        });
      }

      const recentCompleted = reqs.filter(r => r.status === 'completed').slice(0, 2);
      recentCompleted.forEach(r => {
        notifs.push({
          id: `maint-done-${r.id}`,
          type: 'success',
          icon: '✅',
          title: 'Yêu cầu bảo trì hoàn thành',
          message: `Phòng ${r.roomName}: ${r.description.slice(0, 50)}`,
          time: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('vi-VN') : 'Gần đây',
          read: true,
          link: '/maintenance',
        });
      });
    }

    // Contracts expiring soon
    if (contractRes.status === 'fulfilled') {
      const contracts = contractRes.value.data.data || [];
      const expiring = contracts.filter(c => {
        if (c.status !== 'active') return false;
        const d = Math.ceil((new Date(c.endDate) - new Date()) / 86400000);
        return d > 0 && d <= 30;
      });

      if (expiring.length > 0) {
        notifs.push({
          id: 'contracts-expiring',
          type: 'warning',
          icon: '📋',
          title: `${expiring.length} hợp đồng sắp hết hạn`,
          message: expiring.slice(0, 2).map(c => `${c.roomName} — còn ${Math.ceil((new Date(c.endDate) - new Date()) / 86400000)} ngày`).join(' | '),
          time: 'Hôm nay',
          read: false,
          link: '/contract',
          badge: expiring.length,
        });
      }
    }
  } catch (_) { /* silent */ }

  if (notifs.length === 0) {
    notifs.push({
      id: 'all-good',
      type: 'success',
      icon: '🎉',
      title: 'Mọi thứ đang ổn định!',
      message: 'Không có cảnh báo hay yêu cầu nào đang chờ xử lý.',
      time: 'Hôm nay',
      read: true,
      link: null,
    });
  }

  return notifs;
}

// ── Build tenant notifications ────────────────────────────────────────────────
async function fetchTenantNotifications() {
  const notifs = [];

  try {
    const [cRes, iRes, mRes] = await Promise.allSettled([
      api.get('/tenants/contract'),
      api.get('/tenants/invoices'),
      api.get('/tenants/maintenance'),
    ]);

    // Contract expiry
    if (cRes.status === 'fulfilled' && cRes.value.data.contract) {
      const c = cRes.value.data.contract;
      const days = Math.ceil((new Date(c.end_date) - new Date()) / 86400000);
      if (days <= 0) {
        notifs.push({
          id: 'contract-expired',
          type: 'urgent',
          icon: '❌',
          title: 'Hợp đồng đã hết hạn!',
          message: `Hợp đồng phòng ${c.room_name} đã hết hạn. Vui lòng liên hệ chủ trọ ngay.`,
          time: 'Hôm nay',
          read: false,
          link: '/tenant/contract',
        });
      } else if (days <= 30) {
        notifs.push({
          id: 'contract-expiring',
          type: 'warning',
          icon: '📋',
          title: 'Hợp đồng sắp hết hạn',
          message: `Hợp đồng phòng ${c.room_name} còn ${days} ngày. Liên hệ chủ trọ để gia hạn.`,
          time: 'Hôm nay',
          read: false,
          link: '/tenant/contract',
        });
      }
    }

    // Invoices
    if (iRes.status === 'fulfilled') {
      const invoices = iRes.value.data.invoices || [];
      const unpaid = invoices.filter(i => i.status === 'unpaid');
      const overdue = unpaid.filter(i => i.due_date && new Date(i.due_date) < new Date());

      if (overdue.length > 0) {
        const total = overdue.reduce((s, i) => s + (i.total_amount || 0), 0);
        notifs.push({
          id: 'invoices-overdue',
          type: 'urgent',
          icon: '⏰',
          title: `${overdue.length} hóa đơn quá hạn thanh toán!`,
          message: `Tổng nợ: ${Number(total).toLocaleString('vi-VN')}đ. Thanh toán ngay để tránh phí phạt.`,
          time: 'Hôm nay',
          read: false,
          link: '/tenant/invoices',
          badge: overdue.length,
        });
      } else if (unpaid.length > 0) {
        const total = unpaid.reduce((s, i) => s + (i.total_amount || 0), 0);
        notifs.push({
          id: 'invoices-unpaid',
          type: 'warning',
          icon: '💳',
          title: `${unpaid.length} hóa đơn chưa thanh toán`,
          message: `Tổng cần thanh toán: ${Number(total).toLocaleString('vi-VN')}đ`,
          time: 'Hôm nay',
          read: false,
          link: '/tenant/invoices',
          badge: unpaid.length,
        });
      }
    }

    // Maintenance updates
    if (mRes.status === 'fulfilled') {
      const reqs = mRes.value.data.requests || [];
      const completed = reqs.filter(r => r.status === 'completed').slice(0, 2);
      const inProgress = reqs.filter(r => r.status === 'in_progress').slice(0, 1);

      inProgress.forEach(r => {
        notifs.push({
          id: `maint-prog-${r.id}`,
          type: 'info',
          icon: '🔨',
          title: 'Yêu cầu bảo trì đang được xử lý',
          message: r.description.slice(0, 60) + (r.description.length > 60 ? '...' : ''),
          time: new Date(r.updated_at || r.created_at).toLocaleDateString('vi-VN'),
          read: false,
          link: '/tenant/maintenance',
        });
      });

      completed.forEach(r => {
        notifs.push({
          id: `maint-done-${r.id}`,
          type: 'success',
          icon: '✅',
          title: 'Yêu cầu sửa chữa đã hoàn thành',
          message: r.description.slice(0, 60) + (r.description.length > 60 ? '...' : ''),
          time: new Date(r.updated_at || r.created_at).toLocaleDateString('vi-VN'),
          read: true,
          link: '/tenant/maintenance',
        });
      });
    }
  } catch (_) { /* silent */ }

  if (notifs.length === 0) {
    notifs.push({
      id: 'welcome',
      type: 'info',
      icon: '👋',
      title: 'Chào mừng bạn!',
      message: 'Không có thông báo mới. Tất cả đang ổn định.',
      time: 'Hôm nay',
      read: true,
      link: null,
    });
  }

  return notifs;
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotifItem({ notif, onRead, onNavigate }) {
  const st = TYPE_STYLE[notif.type] || TYPE_STYLE.info;

  return (
    <div
      onClick={() => { onRead(notif.id); if (notif.link) onNavigate(notif.link); }}
      style={{
        padding: '13px 18px',
        borderBottom: '1px solid #f7f7f7',
        background: notif.read ? 'white' : st.bg,
        cursor: notif.link ? 'pointer' : 'default',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        position: 'relative', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'white' : st.bg}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          width: 8, height: 8, borderRadius: '50%', background: st.dot,
          boxShadow: `0 0 0 2px white`,
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: st.bg, border: `1.5px solid ${st.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
        position: 'relative',
      }}>
        {notif.icon}
        {notif.badge && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: st.dot, color: 'white',
            width: 18, height: 18, borderRadius: '50%',
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{notif.badge}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: notif.read ? 500 : 700, fontSize: '0.86rem',
          color: '#1a202c', marginBottom: 3, lineHeight: 1.4,
        }}>
          {notif.title}
        </div>
        <div style={{ fontSize: '0.79rem', color: '#718096', lineHeight: 1.45, marginBottom: 5 }}>
          {notif.message}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#a0aec0', display: 'flex', justifyContent: 'space-between' }}>
          <span>🕐 {notif.time}</span>
          {notif.link && (
            <span style={{ color: st.accent, fontWeight: 700 }}>Xem chi tiết →</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationBell({ role = 'landlord' }) {
  const navigate = useNavigate();
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const ref = useRef(null);

  const accentColor = role === 'landlord' ? '#667eea' : '#2d6a4f';

  const loadNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = role === 'landlord'
        ? await fetchLandlordNotifications()
        : await fetchTenantNotifications();
      setNotifs(data);
      setLastFetch(new Date());
    } catch (_) { /* silent */ }
    finally { setLoading(false); }
  }, [role]);

  // Load on mount + every 60s
  useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 60000);
    return () => clearInterval(interval);
  }, [loadNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const markRead  = (id) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const markAll   = ()   => setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  const handleNav = (link) => { setOpen(false); navigate(link); };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadNotifs(); // refresh on open
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        aria-label={`Thông báo${unread > 0 ? ` (${unread} chưa đọc)` : ''}`}
        style={{
          background: open ? (role === 'landlord' ? '#f0f4ff' : '#f0fff4') : 'transparent',
          border: open ? `1px solid ${accentColor}40` : '1px solid transparent',
          borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = role === 'landlord' ? '#f0f4ff' : '#f0fff4'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Animated bell when unread */}
        <span style={{
          display: 'inline-block',
          animation: unread > 0 && !open ? 'bellRing 2s ease-in-out infinite' : 'none',
        }}>🔔</span>

        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#e53e3e', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: '0.65rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
            animation: 'pulseDot 1.5s ease-in-out infinite',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0); }
          10%, 30%  { transform: rotate(-15deg); }
          20%, 40%  { transform: rotate(15deg); }
          50%       { transform: rotate(0); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.2); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 390, background: 'white', borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.16)',
          border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden',
          animation: 'slideDown 0.18s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f0f2f5',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔔 Thông báo
              {unread > 0 && (
                <span style={{
                  background: '#e53e3e', color: 'white',
                  borderRadius: 10, padding: '2px 8px',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {unread} mới
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={markAll} style={{
                  background: 'none', border: 'none',
                  color: accentColor, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  padding: '4px 8px', borderRadius: 6,
                }}>
                  Đọc hết
                </button>
              )}
              <button onClick={loadNotifs} title="Làm mới" style={{
                background: 'none', border: 'none', color: '#a0aec0',
                fontSize: '0.82rem', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = accentColor}
                onMouseLeave={e => e.currentTarget.style.color = '#a0aec0'}
              >
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {loading && notifs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
                Đang tải thông báo...
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔕</div>
                <p style={{ fontSize: '0.88rem' }}>Không có thông báo nào</p>
              </div>
            ) : (
              notifs.map(n => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onNavigate={handleNav}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 18px', borderTop: '1px solid #f0f2f5',
            background: '#fafafa', textAlign: 'center',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#a0aec0' }}>
              {lastFetch ? `Cập nhật: ${lastFetch.toLocaleTimeString('vi-VN')}` : 'Chưa đồng bộ'}
              {' '}·{' '}
            </span>
            <button onClick={loadNotifs} style={{
              background: 'none', border: 'none', fontSize: '0.72rem',
              color: accentColor, cursor: 'pointer', fontWeight: 600, padding: 0,
            }}>
              Làm mới ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
