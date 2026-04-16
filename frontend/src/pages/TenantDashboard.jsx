import { useAuth } from '../../context/AuthContext';

export default function TenantDashboard() {
  const { user } = useAuth();

  // Lấy tên hiển thị từ user thật trong hệ thống
  const displayName = user?.fullName || user?.name || 'Khách thuê';

  return (
    <div className="tenant-dashboard-container">
      {/* 1. Phần Chào mừng - Dùng dữ liệu THẬT từ useAuth */}
      <div className="welcome-card" style={welcomeCardStyle}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.8rem', color: '#2d3748', marginBottom: '10px' }}>
            Xin chào, {displayName} 👋
          </h2>
          <p style={{ color: '#4a5568', fontSize: '1rem', lineHeight: '1.6' }}>
            Chào mừng bạn đến với <strong>Cổng thông tin người thuê trọ</strong>.
            Tại đây bạn có thể theo dõi hợp đồng, hóa đơn và gửi yêu cầu sửa chữa.
          </p>
          <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
            <span style={infoBadgeStyle}>📧 {user?.email}</span>
            <span style={infoBadgeStyle}>🆔 Role: {user?.role === 'tenant' ? 'Người thuê' : user?.role}</span>
          </div>
        </div>
        <div style={{ fontSize: '5rem', opacity: 0.2 }}>🏠</div>
      </div>

      {/* 2. Các thẻ chức năng nhanh (Quick Stats) */}
      <div style={statsGridStyle}>
        <div className="content-card" style={statCardStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📄</div>
          <h4>Hợp đồng</h4>
          <p style={{ fontSize: '0.85rem', color: '#718096' }}>Xem chi tiết và thời hạn hợp đồng đang hiệu lực.</p>
        </div>

        <div className="content-card" style={statCardStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
          <h4>Hóa đơn</h4>
          <p style={{ fontSize: '0.85rem', color: '#718096' }}>Kiểm tra các hóa đơn điện, nước và tiền phòng tháng này.</p>
        </div>

        <div className="content-card" style={statCardStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🛠️</div>
          <h4>Sự cố</h4>
          <p style={{ fontSize: '0.85rem', color: '#718096' }}>Gửi yêu cầu sửa chữa trang thiết bị trong phòng.</p>
        </div>
      </div>

      {/* 3. Thông báo từ chủ trọ */}
      <div className="content-card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>🔔 Thông báo từ hệ thống</h3>
        <div style={{ padding: '15px', background: '#fffaf0', borderLeft: '4px solid #ed8936', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#7b341e' }}>
            Hệ thống đang được cập nhật các tính năng thanh toán trực tuyến. Vui lòng theo dõi trong thời gian tới!
          </p>
        </div>
      </div>
    </div>
  );
}

// Styles bổ trợ để Dashboard trông chuyên nghiệp hơn
const welcomeCardStyle = {
  background: 'white',
  borderRadius: '16px',
  padding: '30px',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  marginBottom: '24px',
  border: '1px solid #edf2f7'
};

const infoBadgeStyle = {
  background: '#f7fafc',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '0.85rem',
  color: '#4a5568',
  border: '1px solid #e2e8f0'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const statCardStyle = {
  textAlign: 'center',
  padding: '24px',
  transition: 'transform 0.2s',
  cursor: 'pointer'
};