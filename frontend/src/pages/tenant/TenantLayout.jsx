import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import NotificationBell from '../../components/NotificationBell';

// ── Notification Bell (real data) ─────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Build notifications from real API data
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [contractRes, invoiceRes, maintenanceRes] = await Promise.allSettled([
        api.get('/tenants/contract'),
        api.get('/tenants/invoices'),
        api.get('/tenants/maintenance'),
      ]);

      const notifs = [];

      // Contract expiry warnings
      if (contractRes.status === 'fulfilled' && contractRes.value.data.contract) {
        const contract = contractRes.value.data.contract;
        const daysLeft = Math.ceil(
          (new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft > 0 && daysLeft <= 30) {
          notifs.push({
            id: 'contract-expiry',
            type: 'warning',
            icon: '📋',
            title: 'Hợp đồng sắp hết hạn',
            message: `Hợp đồng phòng ${contract.room_name} còn ${daysLeft} ngày`,
            time: 'Hôm nay',
            read: false,
            link: '/tenants/contract',
          });
        }
        if (daysLeft <= 0) {
          notifs.push({
            id: 'contract-expired',
            type: 'error',
            icon: '❌',
            title: 'Hợp đồng đã hết hạn',
            message: `Hợp đồng phòng ${contract.room_name} đã hết hạn. Vui lòng liên hệ chủ trọ.`,
            time: 'Hôm nay',
            read: false,
            link: '/tenants/contract',
          });
        }
      }

      // Unpaid invoices
      if (invoiceRes.status === 'fulfilled') {
        const invoices = invoiceRes.value.data.invoices || [];
        const unpaid = invoices.filter(i => i.status === 'unpaid');
        if (unpaid.length > 0) {
          const total = unpaid.reduce((s, i) => s + (i.total_amount || 0), 0);
          notifs.push({
            id: 'unpaid-invoices',
            type: 'error',
            icon: '💳',
            title: `${unpaid.length} hóa đơn chưa thanh toán`,
            message: `Tổng cộng: ${Number(total).toLocaleString('vi-VN')}đ cần thanh toán`,
            time: 'Hôm nay',
            read: false,
            link: '/tenant/invoices',
          });
        }

        // Overdue invoices
        const overdue = unpaid.filter(
          i => i.due_date && new Date(i.due_date) < new Date()
        );
        if (overdue.length > 0) {
          notifs.push({
            id: 'overdue-invoices',
            type: 'error',
            icon: '⏰',
            title: 'Hóa đơn quá hạn thanh toán',
            message: `${overdue.length} hóa đơn đã quá hạn. Vui lòng thanh toán ngay!`,
            time: 'Hôm nay',
            read: false,
            link: '/tenant/invoices',
          });
        }
      }

      // Maintenance updates
      if (maintenanceRes.status === 'fulfilled') {
        const requests = maintenanceRes.value.data.requests || [];
        const completed = requests.filter(r => r.status === 'completed').slice(0, 2);
        completed.forEach(req => {
          notifs.push({
            id: `maint-${req.id}`,
            type: 'success',
            icon: '✅',
            title: 'Yêu cầu sửa chữa hoàn thành',
            message: req.description.length > 60
              ? req.description.slice(0, 60) + '...'
              : req.description,
            time: new Date(req.updated_at).toLocaleDateString('vi-VN'),
            read: true,
            link: '/tenant/maintenance',
          });
        });

        const inProgress = requests.filter(r => r.status === 'in_progress').slice(0, 1);
        inProgress.forEach(req => {
          notifs.push({
            id: `maint-prog-${req.id}`,
            type: 'info',
            icon: '🔨',
            title: 'Đang xử lý yêu cầu sửa chữa',
            message: req.description.length > 60
              ? req.description.slice(0, 60) + '...'
              : req.description,
            time: new Date(req.updated_at).toLocaleDateString('vi-VN'),
            read: false,
            link: '/tenant/maintenance',
          });
        });
      }

      // If nothing, show welcome
      if (notifs.length === 0) {
        notifs.push({
          id: 'welcome',
          type: 'info',
          icon: '👋',
          title: 'Chào mừng bạn!',
          message: 'Không có thông báo mới. Mọi thứ đang ổn định.',
          time: 'Hôm nay',
          read: true,
          link: null,
        });
      }

      setNotifications(notifs);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const TYPE_STYLE = {
    warning: { bg: '#fffbeb', border: '#f6e05e', dot: '#d69e2e', label: '#744210' },
    error:   { bg: '#fff5f5', border: '#feb2b2', dot: '#e53e3e', label: '#742a2a' },
    success: { bg: '#e6fffa', border: '#81e6d9', dot: '#38b2ac', label: '#276749' },
    info:    { bg: '#ebf8ff', border: '#bee3f8', dot: '#3182ce', label: '#2a4365' },
  };

  const markRead = (id) =>
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchNotifications(); }}
        style={{
          background: open ? '#f0f4ff' : 'transparent',
          border: open ? '1px solid #c3dafe' : '1px solid transparent',
          borderRadius: '10px',
          padding: '8px 10px',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.2s',
        }}
        title="Thông báo"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#e53e3e', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '10px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          width: '370px',
          background: 'white',
          borderRadius: '14px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeSlideDown 0.18s ease',
        }}>
          <style>{`
            @keyframes fadeSlideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid #f0f2f5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f0f9ff, #e6fffa)',
          }}>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1a202c', display: 'flex', alignItems: 'center', gap: 8 }}>
              🔔 Thông báo
              {unread > 0 && (
                <span style={{
                  background: '#e53e3e', color: 'white',
                  borderRadius: '10px', padding: '2px 8px',
                  fontSize: '0.72rem', fontWeight: '700',
                }}>
                  {unread} mới
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  background: 'none', border: 'none',
                  color: '#38b2ac', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer',
                }}>
                  Đọc hết
                </button>
              )}
              <button onClick={fetchNotifications} style={{
                background: 'none', border: 'none',
                color: '#a0aec0', fontSize: '0.78rem', cursor: 'pointer',
              }} title="Làm mới">
                {loading ? '⏳' : '🔄'}
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem' }}>
                ⏳ Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔕</div>
                <p style={{ fontSize: '0.88rem' }}>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(notif => {
                const st = TYPE_STYLE[notif.type] || TYPE_STYLE.info;
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markRead(notif.id);
                      if (notif.link) {
                        setOpen(false);
                        window.location.href = notif.link;
                      }
                    }}
                    style={{
                      padding: '13px 18px',
                      borderBottom: '1px solid #f7f7f7',
                      background: notif.read ? 'white' : st.bg,
                      cursor: notif.link ? 'pointer' : 'default',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      position: 'relative',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'white' : st.bg}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div style={{
                        position: 'absolute', top: 16, right: 14,
                        width: 8, height: 8, borderRadius: '50%',
                        background: st.dot,
                        boxShadow: `0 0 0 2px white`,
                      }} />
                    )}

                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: st.bg, border: `1px solid ${st.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem', flexShrink: 0,
                    }}>
                      {notif.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: notif.read ? '500' : '700',
                        fontSize: '0.86rem', color: '#1a202c', marginBottom: 3,
                      }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: '0.8rem', color: '#718096',
                        lineHeight: '1.45', marginBottom: 5,
                      }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#a0aec0' }}>
                        🕐 {notif.time}
                        {notif.link && (
                          <span style={{ marginLeft: 8, color: '#38b2ac', fontWeight: 600 }}>
                            Xem →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid #f0f2f5',
            textAlign: 'center',
            background: '#fafafa',
          }}>
            <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
              Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function TenantLayout({ children, title, subtitle }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/tenant', icon: '📊', label: 'Tổng quan', exact: true },
    { path: '/tenant/invoices', icon: '💰', label: 'Hóa đơn' },
    { path: '/tenant/contract', icon: '📋', label: 'Hợp đồng' },
    { path: '/tenant/maintenance', icon: '🔧', label: 'Báo sự cố' },
    { path: '/tenant/profile', icon: '👤', label: 'Hồ sơ cá nhân' },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar tenant-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🏠</span>
          <span className="logo-text">Rental App</span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-item ${isActive(item) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <p>© 2026 Rental Management</p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-search">
            <input type="text" placeholder="Tìm kiếm hóa đơn, hợp đồng..." />
          </div>
          <div className="navbar-actions">
            {/* Real notification bell */}
            <NotificationBell role="tenant" />

            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role" style={{ color: '#38b2ac' }}>Người thuê</span>
              </div>
              <div
                className="user-avatar"
                style={{ background: 'linear-gradient(135deg, #38b2ac, #319795)' }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} className="btn-logout-mini">
                Đăng xuất
              </button>
            </div>
          </div>
        </nav>

        {/* Body */}
        <main className="dashboard-body">
          <header className="page-header">
            <div className="welcome-text">
              <h2>{title}</h2>
              <p>{subtitle || 'Hệ thống quản lý thời gian thực'}</p>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
