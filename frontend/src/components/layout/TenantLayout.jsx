import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
            <div className="notification-bell">🔔</div>
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role" style={{ color: '#38b2ac' }}>Người thuê</span>
              </div>
              <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #38b2ac, #319795)' }}>
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
