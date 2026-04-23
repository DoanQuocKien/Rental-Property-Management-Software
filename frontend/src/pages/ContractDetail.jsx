import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

const STATUS_LABELS = {
  active: { label: 'Đang hoạt động', color: '#2f855a', background: '#f0fff4' },
  terminated: { label: 'Đã chấm dứt', color: '#718096', background: '#f7fafc' },
  expired: { label: 'Đã hết hạn', color: '#c53030', background: '#fff5f5' },
};

function formatCurrency(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString('vi-VN') : '0';
}

export default function ContractDetail() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContract = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/contracts/${id}`);
        setContract(response.data?.data || null);
      } catch (fetchError) {
        console.error('Không thể tải chi tiết hợp đồng:', fetchError);
        setError(fetchError.response?.data?.message || 'Không tìm thấy hợp đồng hoặc bạn không có quyền xem.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContract();
    } else {
      setLoading(false);
      setError('Thiếu mã hợp đồng.');
    }
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>Đang tải thông tin hợp đồng...</div>;
  }

  if (error) {
    return (
      <div className="content-card" style={{ color: '#c53030', background: '#fff5f5' }}>
        {error}
      </div>
    );
  }

  if (!contract) {
    return <div className="content-card"><h3>Không tìm thấy hợp đồng.</h3></div>;
  }

  const statusMeta = STATUS_LABELS[contract.status] || STATUS_LABELS.active;

  return (
    <div className="contract-container">
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #667eea' }}>
          <div>
            <h2 style={{ marginBottom: '6px' }}>Chi tiết hợp đồng</h2>
            <p style={{ color: '#718096' }}>Mã hợp đồng #{contract.contractID || id}</p>
          </div>
          <span style={{ background: statusMeta.background, color: statusMeta.color, padding: '6px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700 }}>
            {statusMeta.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
          <section>
            <h4 style={{ marginBottom: '12px' }}>Thông tin phòng</h4>
            <p><strong>Phòng:</strong> {contract.roomName || contract.room_name}</p>
            <p><strong>Diện tích:</strong> {contract.roomArea || contract.room_area || 'N/A'} m²</p>
            <p><strong>Giá thuê:</strong> {formatCurrency(contract.rentalPrice || contract.rental_price)} đ/tháng</p>
            <p><strong>Trạng thái phòng:</strong> {contract.roomStatus || contract.room_status || 'N/A'}</p>
          </section>

          <section>
            <h4 style={{ marginBottom: '12px' }}>Thời hạn & tiền cọc</h4>
            <p><strong>Ngày bắt đầu:</strong> {contract.startDate ? new Date(contract.startDate).toLocaleDateString('vi-VN') : new Date(contract.start_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Ngày kết thúc:</strong> {contract.endDate ? new Date(contract.endDate).toLocaleDateString('vi-VN') : new Date(contract.end_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Tiền đặt cọc:</strong> {formatCurrency(contract.deposit)} đ</p>
            <p><strong>Ngày tạo:</strong> {contract.createdAt ? new Date(contract.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
          </section>

          <section>
            <h4 style={{ marginBottom: '12px' }}>Khách thuê</h4>
            <p><strong>Họ tên:</strong> {contract.tenantName || contract.tenant_name || 'N/A'}</p>
            <p><strong>Email:</strong> {contract.tenantEmail || contract.tenant_email || 'N/A'}</p>
            <p><strong>Điện thoại:</strong> {contract.tenantPhone || contract.tenant_phone || 'N/A'}</p>
            <p><strong>CCCD:</strong> {contract.tenantCitizenID || contract.tenant_citizen_id || 'N/A'}</p>
          </section>

          <section>
            <h4 style={{ marginBottom: '12px' }}>Chủ trọ</h4>
            <p><strong>Họ tên:</strong> {contract.landlordName || contract.landlord_name || 'N/A'}</p>
            <p><strong>Email:</strong> {contract.landlordEmail || contract.landlord_email || 'N/A'}</p>
            <p><strong>Điện thoại:</strong> {contract.landlordPhone || contract.landlord_phone || 'N/A'}</p>
            <p><strong>Địa chỉ bên thuê:</strong> {contract.tenantAddress || contract.tenant_address || 'N/A'}</p>
          </section>
        </div>
      </div>
    </div>
  );
}