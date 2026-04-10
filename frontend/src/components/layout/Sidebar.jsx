import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/landlord', icon: '📊', label: 'Tổng quan' },
    { path: '/rooms', icon: '🏠', label: 'Quản lý phòng' },
    { path: '/tenants', icon: '👥', label: 'Khách thuê' },
    { path: '/invoices', icon: '💰', label: 'Hóa đơn' },
    { path: '/settings', icon: '⚙️', label: 'Cài đặt' },
  ];

  return (
    <aside className="sidebar">
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
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
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
  );
}