export default function Settings() {
  return (
    <div className="content-card" style={{ display: 'flex', padding: 0, minHeight: '400px' }}>
      {/* Menu phụ bên trái của Settings */}
      <div style={{ width: '200px', borderRight: '1px solid #eee', padding: '20px' }}>
        <ul style={{ listStyle: 'none' }}>
          <li style={{ padding: '10px', background: '#f0f4ff', color: '#667eea', borderRadius: '6px', fontWeight: 'bold', marginBottom: '5px', cursor: 'pointer' }}>👤 Tài khoản</li>
          <li style={{ padding: '10px', color: '#555', cursor: 'pointer' }}>🏠 Thông tin khu trọ</li>
          <li style={{ padding: '10px', color: '#555', cursor: 'pointer' }}>🔒 Bảo mật</li>
        </ul>
      </div>

      {/* Nội dung bên phải */}
      <div style={{ flex: 1, padding: '30px' }}>
        <h3>Thông tin cá nhân</h3>
        <div className="auth-form" style={{ marginTop: '20px', maxWidth: '400px' }}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên chủ trọ</label>
            <input type="text" defaultValue="Nguyễn Văn A" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
          </div>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email liên hệ</label>
            <input type="email" defaultValue="admin@rental.com" style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
          </div>
          <button className="btn-primary-gradient" style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}