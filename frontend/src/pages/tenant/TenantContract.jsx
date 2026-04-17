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

  // Màu Xanh lá đặc trưng của Người thuê
  const tenantColor = '#2d6a4f';

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      try {
        // Gọi API lấy hợp đồng cá nhân
        const res = await api.get('/contracts/my-contract');
        setContract(res.data.data);
      } catch (err) {
        console.error("Lỗi fetch hợp đồng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Đang tải thông tin hợp đồng...</div>;

  return (
    <div className="tenant-contract-container">
      {/* Tiêu đề trang */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Hợp đồng thuê phòng</h2>
        <p style={{ color: '#718096' }}>Thông tin pháp lý và quyền lợi khách thuê</p>
      </div>

      {!contract ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>
          <h3>Chưa tìm thấy hợp đồng</h3>
          <p style={{ color: '#888' }}>Vui lòng liên hệ chủ trọ để kích hoạt hợp đồng trên hệ thống.</p>
        </div>
      ) : (
        <>
          {/* Banner Thông tin phòng */}
          <div className="content-card" style={{
            marginBottom: '20px',
            background: `linear-gradient(135deg, ${tenantColor} 0%, #1b4332 100%)`,
            color: 'white',
            border: 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>🏠 {contract.room_name}</div>
                <div style={{ opacity: 0.9 }}>Mã hợp đồng: HD{contract.id?.toString().padStart(6, '0')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '15px', fontSize: '0.85rem' }}>
                   Bắt đầu: {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* CHI TIẾT PHÁP LÝ (Bổ sung CCCD) */}
            <div className="content-card">
              <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                📄 Chi tiết điều khoản
              </h3>
              {[
                { label: 'Số CCCD Chủ trọ (Bên A)', value: contract.landlord_id_card || 'Đã đối soát' },
                { label: 'Số CCCD của bạn (Bên B)', value: user?.citizen_id || 'Đã xác minh' },
                { label: 'Giá thuê phòng', value: `${Number(contract.rental_price).toLocaleString()}đ/tháng` },
                { label: 'Tiền đặt cọc', value: `${Number(contract.deposit).toLocaleString()}đ` },
                { label: 'Ngày kết thúc HĐ', value: new Date(contract.end_date).toLocaleDateString('vi-VN') },
                { label: 'Trạng thái', value: (CONTRACT_STATUS[contract.status] || CONTRACT_STATUS.active).label },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f7fafc', fontSize: '0.9rem' }}>
                  <span style={{ color: '#718096' }}>{item.label}</span>
                  <span style={{ fontWeight: '600', color: '#333' }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* THÔNG TIN CHỦ TRỌ */}
            <div className="content-card">
              <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                👤 Thông tin chủ trọ
              </h3>
              <div style={{ textAlign: 'center', padding: '10px' }}>
                 <div style={{ width: '60px', height: '60px', background: tenantColor, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.5rem', fontWeight: 'bold' }}>
                   {contract.landlord_name?.charAt(0)}
                 </div>
                 <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{contract.landlord_name}</div>
                 <div style={{ color: '#888', marginBottom: '15px' }}>Chủ sở hữu tòa nhà</div>

                 <a href={`tel:${contract.landlord_phone}`} style={{
                    display: 'block', background: tenantColor, color: 'white', textDecoration: 'none',
                    padding: '10px', borderRadius: '8px', fontWeight: 'bold'
                 }}>
                   📞 Liên hệ hỗ trợ: {contract.landlord_phone || 'N/A'}
                 </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}