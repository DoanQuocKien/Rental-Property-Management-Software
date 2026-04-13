import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.name || '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-search">
        <input type="text" placeholder="Tìm kiếm phòng, khách thuê..." />
      </div>
      <div className="navbar-actions">
        <div className="notification-bell">🔔</div>
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