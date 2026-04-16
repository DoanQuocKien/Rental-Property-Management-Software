import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'warning', icon: '⚠️', title: 'Hợp đồng sắp hết hạn', message: 'Phòng 105 — hết hạn trong 12 ngày', time: '5 phút trước', read: false },
  { id: 2, type: 'error', icon: '🔧', title: 'Yêu cầu sửa chữa mới', message: 'Phòng 301 báo hỏng điều hòa', time: '30 phút trước', read: false },
  { id: 3, type: 'success', icon: '💰', title: 'Thanh toán thành công', message: 'Phòng 202 đã thanh toán tiền tháng 4/2026', time: '2 giờ trước', read: false },
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
  // Lấy tên hiển thị và Role từ user thật
  const displayName = user?.fullName || user?.name || 'User';
  const userRole = user?.role === 'landlord' ? 'Chủ trọ' : 'Người thuê';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        <input type="text" placeholder="Tìm kiếm..." />
      </div>

      <div className="navbar-actions">
        {/* Notification Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            className="notif-btn"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '20px'
            }}
          >
            🔔
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notif-dropdown" style={{
              position: 'absolute', top: '100%', right: 0, width: '320px', background: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 100
            }}>
              <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Thông báo</div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '10px', borderBottom: '1px solid #f9f9f9', fontSize: '0.85rem' }}>
                    <strong>{n.title}</strong>
                    <div style={{ color: '#666' }}>{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile - Đã sửa lỗi Role và hiển thị */}
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-info" style={{ textAlign: 'right' }}>
            <span className="user-name" style={{ display: 'block', fontWeight: '600' }}>{displayName}</span>
            <span className={`user-role-badge ${user?.role}`} style={{
              fontSize: '0.75rem',
              color: user?.role === 'landlord' ? '#667eea' : '#2d6a4f',
              fontWeight: '700'
            }}>
              {userRole}
            </span>
          </div>

          <div className="user-avatar" style={{
            background: user?.role === 'landlord' ? '#667eea' : '#2d6a4f',
            color: 'white', width: '35px', height: '35px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>

          <button onClick={handleLogout} className="btn-logout-mini">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}