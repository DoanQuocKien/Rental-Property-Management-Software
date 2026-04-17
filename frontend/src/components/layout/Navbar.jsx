import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'warning', icon: '⚠️', title: 'Hợp đồng sắp hết hạn', message: 'Phòng 105 — hết hạn trong 12 ngày', time: '5 phút trước', read: false },
  { id: 2, type: 'error', icon: '🔧', title: 'Yêu cầu sửa chữa mới', message: 'Phòng 301 báo hỏng điều hòa (Ưu tiên cao)', time: '30 phút trước', read: false },
  { id: 3, type: 'success', icon: '💰', title: 'Thanh toán thành công', message: 'Phòng 202 đã thanh toán tiền tháng 4/2026', time: '2 giờ trước', read: false },
  { id: 4, type: 'info', icon: '📋', title: 'Hợp đồng mới được tạo', message: 'Hợp đồng phòng 108 đã được ký kết', time: '1 ngày trước', read: true },
  { id: 5, type: 'warning', icon: '💸', title: 'Hóa đơn chưa thanh toán', message: 'Phòng 204 quá hạn thanh toán 3 ngày', time: '2 ngày trước', read: true },
];

const typeColors = {
  warning: { bg: '#fffbeb', border: '#f6e05e', dot: '#d69e2e' },
  error:   { bg: '#fff5f5', border: '#feb2b2', dot: '#e53e3e' },
  success: { bg: '#e6fffa', border: '#81e6d9', dot: '#38b2ac' },
  info:    { bg: '#f0f4ff', border: '#c3dafe', dot: '#667eea' },
};

// Các trang có thể tìm kiếm và placeholder tương ứng
const SEARCH_PAGES = {
  '/rooms':   { label: 'phòng', placeholder: 'Tìm kiếm phòng trọ...' },
  '/tenants': { label: 'khách thuê', placeholder: 'Tìm kiếm khách thuê...' },
};

const DEFAULT_PLACEHOLDER = 'Tìm kiếm phòng, khách thuê...';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { query, setQuery, clearSearch } = useSearch();

  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayName = user?.fullName || user?.name || '';

  // Placeholder động theo trang hiện tại
  const currentPage = SEARCH_PAGES[location.pathname];
  const placeholder = currentPage ? currentPage.placeholder : DEFAULT_PLACEHOLDER;

  // Sync inputValue với query từ context khi chuyển trang
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Xóa search khi rời khỏi trang tìm kiếm
  useEffect(() => {
    if (!SEARCH_PAGES[location.pathname]) {
      clearSearch();
      setInputValue('');
    }
  }, [location.pathname, clearSearch]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    // Nếu đang ở trang có hỗ trợ search → filter trực tiếp
    if (SEARCH_PAGES[location.pathname]) {
      setQuery(val);
      setShowDropdown(false);
      return;
    }

    // Nếu đang ở trang khác → hiện dropdown gợi ý
    setShowDropdown(val.trim().length > 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      // Ưu tiên tìm phòng khi nhấn Enter từ trang khác
      navigateTo('/rooms');
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setInputValue('');
      clearSearch();
      inputRef.current?.blur();
    }
  };

  const navigateTo = (path) => {
    setQuery(inputValue.trim());
    setShowDropdown(false);
    navigate(path);
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const dismissNotification = (id) => setNotifications(ns => ns.filter(n => n.id !== id));

  return (
    <nav className="navbar">
      {/* ── Search Bar ── */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* Search icon */}
          <span style={{
            position: 'absolute', left: 12, color: '#a0aec0', fontSize: '0.9rem',
            pointerEvents: 'none', zIndex: 1,
          }}>🔍</span>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.trim() && !SEARCH_PAGES[location.pathname]) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '10px 36px 10px 36px',
              border: '1.5px solid',
              borderColor: inputValue ? '#667eea' : '#e2e8f0',
              borderRadius: 12,
              fontSize: '0.88rem',
              outline: 'none',
              background: inputValue ? 'white' : '#f7fafc',
              color: '#2d3748',
              transition: 'all 0.2s',
              boxShadow: inputValue ? '0 0 0 3px rgba(102,126,234,0.1)' : 'none',
            }}
          />

          {/* Clear button */}
          {inputValue && (
            <button
              onClick={handleClear}
              style={{
                position: 'absolute', right: 10,
                background: '#e2e8f0', border: 'none', borderRadius: '50%',
                width: 18, height: 18, cursor: 'pointer', fontSize: '0.7rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#718096', lineHeight: 1,
              }}
            >×</button>
          )}
        </div>

        {/* Hint text khi đang filter trang hiện tại */}
        {currentPage && inputValue && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0,
            fontSize: '0.75rem', color: '#667eea', fontWeight: 600,
            padding: '4px 8px',
          }}>
            Đang lọc {currentPage.label} theo &quot;{inputValue}&quot;
          </div>
        )}

        {/* Dropdown gợi ý khi ở trang khác */}
        {showDropdown && !currentPage && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'white', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #e2e8f0', zIndex: 1000, overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 0' }}>
              {/* Tìm phòng */}
              <button
                onClick={() => navigateTo('/rooms')}
                style={{
                  width: '100%', padding: '10px 16px', border: 'none',
                  background: 'none', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: '0.88rem', color: '#2d3748',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{
                  width: 32, height: 32, background: '#f0f4ff', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>🏠</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Tìm phòng &quot;{inputValue}&quot;</div>
                  <div style={{ fontSize: '0.76rem', color: '#a0aec0', marginTop: 1 }}>Tìm kiếm trong danh sách phòng trọ</div>
                </div>
              </button>

              {/* Tìm khách thuê */}
              <button
                onClick={() => navigateTo('/tenants')}
                style={{
                  width: '100%', padding: '10px 16px', border: 'none',
                  background: 'none', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: '0.88rem', color: '#2d3748',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{
                  width: 32, height: 32, background: '#f0fff4', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>👥</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Tìm khách thuê &quot;{inputValue}&quot;</div>
                  <div style={{ fontSize: '0.76rem', color: '#a0aec0', marginTop: 1 }}>Tìm theo tên, email, CCCD, SĐT</div>
                </div>
              </button>

              <div style={{ height: 1, background: '#f0f2f5', margin: '4px 0' }} />

              <div style={{ padding: '6px 16px', fontSize: '0.72rem', color: '#a0aec0' }}>
                Nhấn <kbd style={{ background: '#f0f2f5', padding: '1px 5px', borderRadius: 4, fontSize: '0.72rem' }}>Enter</kbd> để tìm phòng &nbsp;·&nbsp;
                <kbd style={{ background: '#f0f2f5', padding: '1px 5px', borderRadius: 4, fontSize: '0.72rem' }}>Esc</kbd> để đóng
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="navbar-actions">
        {/* Notification Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(v => !v)}
            style={{
              background: showNotifications ? '#f0f4ff' : 'transparent',
              border: showNotifications ? '1px solid #c3dafe' : '1px solid transparent',
              borderRadius: '10px', padding: '8px 10px', cursor: 'pointer',
              position: 'relative', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.2s', fontSize: '18px',
            }}
            title="Thông báo"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                background: '#e53e3e', color: 'white', borderRadius: '50%',
                width: '18px', height: '18px', fontSize: '10px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: '380px', background: 'white', borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
              zIndex: 1000, overflow: 'hidden',
            }}>
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
                          padding: '12px 16px', borderBottom: '1px solid #f7f7f7',
                          background: notif.read ? 'white' : colors.bg,
                          cursor: 'pointer', transition: 'background 0.15s',
                          position: 'relative', display: 'flex', gap: '12px', alignItems: 'flex-start',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'white' : colors.bg}
                      >
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
                        >×</button>
                      </div>
                    );
                  })
                )}
              </div>

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
            <span className="user-name">{displayName}</span>
            <span className="user-role">Chủ trọ</span>
          </div>
          <div className="user-avatar">
            {displayName?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn-logout-mini">
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
