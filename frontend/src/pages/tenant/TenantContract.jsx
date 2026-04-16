import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const CONTRACT_STATUS = {
  active: { label: '✅ Đang hoạt động', bg: '#e6fffa', color: '#38b2ac' },
  expired: { label: '❌ Đã hết hạn', bg: '#fff5f5', color: '#e53e3e' },
  terminated: { label: '🚫 Đã chấm dứt', bg: '#f7fafc', color: '#718096' },
};

export default function TenantContract() {
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Màu chủ đạo cho Người thuê
  const tenantColor = '#2d6a4f';

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      try {
        // ĐÃ SỬA: Gọi đúng API mà chúng ta đã thống nhất ở Backend
        const res = await api.get('/contracts/my-contract');
        setContract(res.data.data);
      } catch (err) {
        setError('Không thể tải thông tin hợp đồng. Có thể bạn chưa có hợp đồng chính thức.');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, []);

  const daysLeft = contract
    ? Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const progressPercent = contract
    ? Math.min(100, Math.max(0, Math.round(
        (new Date() - new Date(contract.start_date)) /
        (new Date(contract.end_date) - new Date(contract.start_date)) * 100
      )))
    : 0;

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải thông tin hợp đồng...</div>;

  return (
    <div className="tenant-contract-container">
      {/* 1. Tiêu đề (Bỏ TenantLayout) */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Hợp đồng thuê phòng</h2>
        <p style={{ color: '#718096' }}>Chi tiết các điều khoản và thời hạn thuê</p>
      </div>

      {!contract ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>
          <h3 style={{ color: '#555' }}>Chưa có hợp đồng nào</h3>
          <p style={{ color: '#888' }}>Liên hệ chủ trọ để cập nhật hợp đồng lên hệ thống.</p>
        </div>
      ) : (
        <>
          {/* Header card - Đổi sang màu Xanh Tenant */}
          <div className="content-card" style={{
            marginBottom: '20px',
            background: `linear-gradient(135deg, ${tenantColor} 0%, #1b4332 100%)`,
            color: 'white',
            border: 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>🏠 {contract.room_name}</div>
                <div style={{ marginTop: '6px', opacity: 0.85, fontSize: '0.9rem' }}>
                  Mã hợp đồng: HD{contract.id?.toString().padStart(6, '0')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem' }}>
                  {daysLeft !== null && daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', height: '8px' }}>
                <div style={{ background: 'white', height: '8px', borderRadius: '10px', width: `${progressPercent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '8px', opacity: 0.85 }}>
                <span>Bắt đầu: {new Date(contract.start_date).toLocaleDateString('vi-VN')}</span>
                <span>{progressPercent}% thời gian</span>
                <span>Kết thúc: {new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="content-card">
              <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>📄 Chi tiết hợp đồng</h3>
              {[
                { label: 'Giá thuê', value: `${Number(contract.rental_price).toLocaleString()}đ/tháng` },
                { label: 'Tiền cọc', value: `${Number(contract.deposit).toLocaleString()}đ` },
                { label: 'Trạng thái', value: (CONTRACT_STATUS[contract.status] || CONTRACT_STATUS.active).label },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f7fafc' }}>
                  <span style={{ color: '#718096' }}>{item.label}</span>
                  <span style={{ fontWeight: '600' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="content-card">
              <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>👤 Thông tin chủ trọ</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{contract.landlord_name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>Chủ nhà / Quản lý</div>
                </div>
              </div>
              <a href={`tel:${contract.landlord_phone}`} style={{
                display: 'block', textAlign: 'center', padding: '10px',
                background: tenantColor, color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold'
              }}>
                📞 Gọi cho chủ trọ
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}