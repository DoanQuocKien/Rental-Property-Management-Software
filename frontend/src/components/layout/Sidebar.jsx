import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  // Kiểm tra vai trò
  const isLandlord = user?.role === 'landlord';

  // 1. Menu cho Chủ trọ
  const landlordItems = [
    { path: '/landlord', icon: '📊', label: 'Tổng quan' },
    { path: '/rooms', icon: '🏠', label: 'Quản lý phòng' },
    { path: '/tenants', icon: '👥', label: 'Khách thuê' },
    { path: '/invoices', icon: '💰', label: 'Hóa đơn' },
    { path: '/financial-dashboard', icon: '📈', label: 'Bảng tài chính' },
    { path: '/notifications', icon: '📢', label: 'Thông báo' },
    { path: '/contract', icon: '📝', label: 'Tạo hợp đồng' },
    { path: '/settings', icon: '⚙️', label: 'Cài đặt' },
    { path: '/meter-reading', icon: '⚡', label: 'Ghi điện nước' },
    { path: '/maintenance', icon: '🔧', label: 'Bảo trì' },
    { path: '/tenant-approval', icon: '🛂', label: 'Duyệt tài khoản' },
  ];

  // 2. Menu cho Người thuê (Tenant)
  const tenantItems = [
    { path: '/tenant', icon: '📋', label: 'Cổng thông tin' },
    { path: '/tenant/contract', icon: '📄', label: 'Hợp đồng của tôi' },
    { path: '/tenant/invoices', icon: '💸', label: 'Hóa đơn & Thanh toán' },
    { path: '/tenant/profile', icon: '👤', label: 'Hồ sơ cá nhân' },
    { path: '/tenant/maintenance', icon: '🛠️', label: 'Báo cáo sự cố' },
  ];

  const menuItems = isLandlord ? landlordItems : tenantItems;

  // 3. Định nghĩa màu sắc động
  // Landlord: Tím (Purple) | Tenant: Xanh lá (Green)
  const sidebarTheme = {
    background: isLandlord
      ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' // Tím chủ trọ
      : 'linear-gradient(180deg, #2d6a4f 0%, #1b4332 100%)', // Xanh người thuê
    activeItem: isLandlord ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.15)'
  };

  return (
    <aside className="sidebar" style={{
      background: sidebarTheme.background,
      width: '260px',
      minHeight: '100vh',
      color: 'white',
      transition: 'all 0.3s ease'
    }}>
      <div className="sidebar-logo" style={{ padding: '25px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>🏠</span>
        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>RENTAL APP</span>
      </div>

      <nav className="sidebar-nav" style={{ marginTop: '20px' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    background: isActive ? sidebarTheme.activeItem : 'transparent',
                    borderLeft: isActive ? '4px solid white' : '4px solid transparent',
                    transition: '0.2s'
                  }}
                >
                  <span style={{ marginRight: '12px', fontSize: '1.1rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: isActive ? '700' : '400' }}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer" style={{ position: 'absolute', bottom: '20px', width: '100%', padding: '0 20px', fontSize: '0.8rem', opacity: 0.7 }}>
        <p>Đang đăng nhập:</p>
        <p style={{ fontWeight: 'bold' }}>{user?.name}</p>
        <p style={{ fontSize: '0.7rem' }}>VAI TRÒ: {isLandlord ? 'CHỦ TRỌ' : 'NGƯỜI THUÊ'}</p>
      </div>
    </aside>
  );
}