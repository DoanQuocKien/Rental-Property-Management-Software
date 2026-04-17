import { useState, useEffect } from 'react';
import api from '../api';

export default function ContractDetail() {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        // Gọi API lấy hợp đồng của chính khách thuê đang đăng nhập
        const res = await api.get('/contracts/my-contract');
        setContract(res.data.data);
      } catch (err) {
        console.error("Không tìm thấy hợp đồng hoặc lỗi kết nối");
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, []);

  if (loading) return <div className="loading">Đang tải thông tin hợp đồng...</div>;
  if (!contract) return <div className="content-card"><h3>Bạn chưa có hợp đồng chính thức nào.</h3></div>;

  return (
    <div className="contract-container">
      <div className="content-card">
        <div className="card-header" style={{borderBottom: '2px solid #667eea', marginBottom: '20px'}}>
          <h2>📄 CHI TIẾT HỢP ĐỒNG THUÊ NHÀ</h2>
          <span className="badge active">Đang hiệu lực</span>
        </div>

        <div className="contract-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
          <section>
            <h4>🏠 Thông tin phòng</h4>
            <p><strong>Số phòng:</strong> {contract.room_name}</p>
            <p><strong>Diện tích:</strong> {contract.area} m²</p>
            <p><strong>Giá thuê:</strong> <span style={{color: '#e53e3e', fontWeight: 'bold'}}>{Number(contract.rental_price).toLocaleString()} đ/tháng</span></p>
          </section>

          <section>
            <h4>📅 Thời hạn & Tiền cọc</h4>
            <p><strong>Ngày bắt đầu:</strong> {new Date(contract.start_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Ngày kết thúc:</strong> {new Date(contract.end_date).toLocaleDateString('vi-VN')}</p>
            <p><strong>Tiền đặt cọc:</strong> {Number(contract.deposit).toLocaleString()} đ</p>
          </section>
        </div>

        <div className="contract-footer" style={{marginTop: '30px', padding: '15px', background: '#f8fafc', borderRadius: '8px'}}>
          <p style={{fontSize: '0.85rem', color: '#666'}}>* Mọi thắc mắc về hợp đồng vui lòng liên hệ trực tiếp chủ trọ để được giải quyết.</p>
        </div>
      </div>
    </div>
  );
}