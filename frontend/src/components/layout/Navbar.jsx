import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'warning', icon: '⚠️', title: 'Hợp đồng sắp hết hạn', message: 'Phòng 105 — hết hạn trong 12 ngày', time: '5 phút trước', read: false },
  { id: 2, type: 'error', icon: '🔧', title: 'Yêu cầu sửa chữa mới', message: 'Phòng 301 báo hỏng điều hòa (Ưu tiên cao)', time: '30 phút trước', read: false },
  { id: 3, type: 'success', icon: '💰', title: 'Thanh toán thành công', message: 'Phòng 202 đã thanh toán tiền tháng 4/2026', time: '2 giờ trước', read: false },
  { id: 4, type: 'info', icon: '📋', title: 'Hợp đồng mới được tạo', message: 'Hợp đồng phòng 108 đã được ký kết', time: '1 ngày trước', read: true },
  { id: 5, type: 'warning', icon: '💸', title: 'Hóa đơn chưa thanh toán', message: 'Phòng 204 quá hạn thanh toán 3 ngày', time: '2 ngày trước', read: true },
];

const typeColors = {
  warning: { bg: '#fffbeb', border: '#f6e05e', dot: '#d69e2e' },
  error: { bg: '#fff5f5', border: '#feb2b2', dot: '#e53e3e' },
  success: { bg: '#e6fffa', border: '#81e6d9', dot: '#38b2ac' },
  info: { bg: '#f0f4ff', border: '#c3dafe', dot: '#667eea' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismissNotification = (id) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-search">
        <input type="text" placeholder="Tìm kiếm phòng, khách thuê..." />
      </div>
      <div className="navbar-actions">

        {/* Notification Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            style={{
              background: showNotifications ? '#f0f4ff' : 'transparent',
              border: showNotifications ? '1px solid #c3dafe' : '1px solid transparent',
              borderRadius: '10px',
              padding: '8px 10px',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              fontSize: '18px',
            }}
            title="Thông báo"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#e53e3e',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '380px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#333' }}>
                  🔔 Thông báo
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: '8px', background: '#e53e3e', color: 'white', borderRadius: '10px', padding: '2px 7px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#667eea', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#aaa' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔕</div>
                    <p style={{ fontSize: '0.9rem' }}>Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const colors = typeColors[notif.type] || typeColors.info;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f7f7f7',
                          background: notif.read ? 'white' : colors.bg,
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          position: 'relative',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'white' : colors.bg}
                      >
                        {/* Unread dot */}
                        {!notif.read && (
                          <div style={{ position: 'absolute', top: '16px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: colors.dot }} />
                        )}

                        <div style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1.2 }}>{notif.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: notif.read ? '500' : '700', fontSize: '0.88rem', color: '#333', marginBottom: '3px' }}>
                            {notif.title}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#666', lineHeight: '1.4', marginBottom: '6px' }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#aaa' }}>{notif.time}</div>
                        </div>

                        <button
                          onClick={e => { e.stopPropagation(); dismissNotification(notif.id); }}
                          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', padding: '0 4px', flexShrink: 0, lineHeight: 1 }}
                          title="Xóa"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f2f5', textAlign: 'center' }}>
                  <button
                    onClick={() => setNotifications([])}
                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Xóa tất cả thông báo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">Chủ trọ</span>
          </div>
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn-logout-mini">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
