import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TenantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏠 Hệ thống quản lý nhà trọ</h1>
          <div className="header-user">
            <span>Xin chào, <strong>{user?.name}</strong> (Người thuê)</span>
            <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Chào mừng bạn đến với hệ thống quản lý nhà trọ</h2>
          <p>Bạn đã đăng nhập thành công với vai trò <strong>Người thuê trọ</strong>.</p>
          <p>Email: <strong>{user?.email}</strong></p>
          <div className="info-box">
            <p>Hệ thống đang trong quá trình phát triển. Các tính năng cho người thuê sẽ sớm được cập nhật.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
