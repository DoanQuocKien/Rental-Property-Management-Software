import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';
import NotificationBell from '../NotificationBell';

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

  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Lấy tên hiển thị và Role từ user thật
  const displayName = user?.fullName || user?.name || 'User';
  const userRole = user?.role === 'landlord' ? 'Chủ trọ' : 'Người thuê';

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

  // Đóng dropdown tìm kiếm khi click ra ngoài
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="navbar" style={{
      height: '70px',
      background: 'white',
      borderBottom: '1px solid #f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 99
    }}>
      {/* ── Search Bar (CHỈ HIỂN THỊ CHO CHỦ TRỌ) ── */}
      {user?.role === 'landlord' ? (
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
      ) : (
        /* Thẻ div rỗng để giữ layout cân bằng khi Khách thuê đăng nhập */
        <div style={{ flex: 1, maxWidth: 400 }}></div>
      )}

      <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Notification Bell */}
        <NotificationBell role={user?.role || 'tenant'} />

        {/* User profile */}
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

          <button onClick={handleLogout} style={{
            background: 'none',
            border: '1px solid #e2e8f0',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            color: '#718096',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.borderColor = '#feb2b2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}