import { useState, useEffect } from 'react';
import api from '../api';
import TenantLayout from '../components/layout/TenantLayout';

const CONTRACT_STATUS = {
  active: { label: '✅ Đang hoạt động', bg: '#e6fffa', color: '#38b2ac' },
  expired: { label: '❌ Đã hết hạn', bg: '#fff5f5', color: '#e53e3e' },
  terminated: { label: '🚫 Đã chấm dứt', bg: '#f7fafc', color: '#718096' },
};

export default function TenantContract() {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tenants/contract');
        setContract(res.data.contract);
      } catch {
        setError('Không thể tải thông tin hợp đồng');
      } finally {
        setLoading(false);
      }
    };
    fetch();
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

  return (
    <TenantLayout title="Hợp đồng thuê phòng" subtitle="Xem thông tin hợp đồng hiện tại">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Đang tải...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !contract ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>
          <h3 style={{ color: '#555', marginBottom: '8px' }}>Chưa có hợp đồng nào</h3>
          <p style={{ color: '#888' }}>Bạn hiện chưa có hợp đồng thuê phòng đang hoạt động. Vui lòng liên hệ chủ trọ.</p>
        </div>
      ) : (
        <>
          {/* Header card */}
          <div className="content-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>🏠 {contract.room_name}</div>
                <div style={{ marginTop: '6px', opacity: 0.85, fontSize: '0.9rem' }}>
                  Mã hợp đồng: HD{contract.id?.toString().padStart(6, '0')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600'
                }}>
                  {daysLeft !== null && daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', opacity: 0.85 }}>
                <span>Bắt đầu: {new Date(contract.start_date).toLocaleDateString('vi-VN')}</span>
                <span>Kết thúc: {new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', height: '8px' }}>
                <div style={{
                  background: 'white', height: '8px', borderRadius: '10px',
                  width: `${progressPercent}%`, transition: 'width 1s ease'
                }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '6px', opacity: 0.85 }}>
                {progressPercent}% thời gian đã qua
              </div>
            </div>
          </div>

          {/* Warning if expiring soon */}
          {daysLeft !== null && daysLeft > 0 && daysLeft < 30 && (
            <div style={{
              background: '#fffbeb', border: '1px solid #f6e05e', borderLeft: '4px solid #d69e2e',
              borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', color: '#744210'
            }}>
              ⚠️ <strong>Hợp đồng sắp hết hạn!</strong> Còn {daysLeft} ngày. Vui lòng liên hệ chủ trọ để gia hạn hoặc làm thủ tục trả phòng.
            </div>
          )}

          {/* Contract details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="content-card">
              <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '0.95rem', fontWeight: '700' }}>
                📄 Thông tin hợp đồng
              </h3>
              {[
                { icon: '🏠', label: 'Tên phòng', value: contract.room_name },
                { icon: '📐', label: 'Diện tích', value: contract.room_area ? `${contract.room_area} m²` : 'N/A' },
                { icon: '💰', label: 'Giá thuê', value: `${Number(contract.rental_price).toLocaleString('vi-VN')}đ/tháng` },
                { icon: '🔒', label: 'Tiền đặt cọc', value: `${Number(contract.deposit).toLocaleString('vi-VN')}đ` },
                { icon: '📅', label: 'Ngày bắt đầu', value: new Date(contract.start_date).toLocaleDateString('vi-VN') },
                { icon: '📅', label: 'Ngày kết thúc', value: new Date(contract.end_date).toLocaleDateString('vi-VN') },
                {
                  icon: '🟢', label: 'Trạng thái',
                  value: <span style={{
                    background: (CONTRACT_STATUS[contract.status] || CONTRACT_STATUS.active).bg,
                    color: (CONTRACT_STATUS[contract.status] || CONTRACT_STATUS.active).color,
                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600'
                  }}>
                    {(CONTRACT_STATUS[contract.status] || CONTRACT_STATUS.active).label}
                  </span>
                },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f2f5', fontSize: '0.9rem' }}>
                  <span style={{ color: '#888' }}>{item.icon} {item.label}</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="content-card">
              <h3 style={{ marginBottom: '16px', color: '#333', fontSize: '0.95rem', fontWeight: '700' }}>
                👤 Thông tin liên hệ
              </h3>
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '1.4rem', margin: '0 auto 12px'
                }}>
                  {contract.landlord_name?.charAt(0)}
                </div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#333' }}>{contract.landlord_name}</div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>Chủ trọ</div>
                {contract.landlord_phone && (
                  <a href={`tel:${contract.landlord_phone}`} style={{
                    display: 'inline-block', marginTop: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white', padding: '8px 20px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600'
                  }}>
                    📞 {contract.landlord_phone}
                  </a>
                )}
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: '#f0f4ff', borderRadius: '10px', borderLeft: '4px solid #667eea' }}>
                <div style={{ fontWeight: '600', color: '#667eea', marginBottom: '8px', fontSize: '0.9rem' }}>📌 Lưu ý quan trọng</div>
                <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: '#555', lineHeight: '1.8' }}>
                  <li>• Thanh toán tiền thuê trước ngày 5 hàng tháng</li>
                  <li>• Thông báo trước 30 ngày khi muốn chấm dứt HĐ</li>
                  <li>• Giữ gìn vệ sinh và trật tự khu trọ</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </TenantLayout>
  );
}
