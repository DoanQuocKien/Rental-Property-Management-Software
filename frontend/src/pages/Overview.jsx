export default function Overview() {
  return (
    <div className="overview-container">
      {/* Thẻ thống kê nhanh */}
      <div className="stats-grid">
        <div className="stat-card-new total">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">45.0M</span>
            <span className="stat-label">Doanh thu dự kiến</span>
          </div>
        </div>
        <div className="stat-card-new available">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">12</span>
            <span className="stat-label">Hợp đồng mới</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Biểu đồ giả lập bằng CSS */}
        <div className="content-card">
          <h3>📊 Hiệu suất cho thuê</h3>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px 0' }}>
            {[30, 50, 80, 60, 90, 100, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, #667eea, #764ba2)', height: `${h}%`, borderRadius: '4px' }}></div>
            ))}
          </div>
          <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>Dữ liệu 7 tháng gần nhất</p>
        </div>

        {/* Thông báo hoạt động */}
        <div className="content-card">
          <h3>🔔 Hoạt động</h3>
          <ul style={{ listStyle: 'none', fontSize: '0.9rem' }}>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>📍 Phòng 301 báo hỏng điều hòa</li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>📅 Hợp đồng phòng 105 sắp hết hạn</li>
            <li style={{ padding: '10px 0' }}>✅ Đã nhận tiền phòng 202</li>
          </ul>
        </div>
      </div>
    </div>
  );
}