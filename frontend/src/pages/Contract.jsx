import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const today = new Date().toISOString().slice(0, 10);
const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

const initialForm = {
  room_id: '',
  tenant_id: '',
  start_date: today,
  end_date: nextYear,
  deposit: '',
  rental_price: '',
};

function formatCurrency(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString('vi-VN') : '0';
}

function ContractPreview({ form, selectedRoom, selectedTenant, durationMonths }) {
  return (
    <div className="contract-print-area">
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', fontFamily: 'serif', lineHeight: '1.7', color: '#1f2937' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px', borderBottom: '2px solid #111827', paddingBottom: '18px' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style={{ fontSize: '0.95rem' }}>Độc lập - Tự do - Hạnh phúc</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '16px' }}>HỢP ĐỒNG THUÊ PHÒNG TRỌ</div>
        </div>

        <p style={{ marginBottom: '8px' }}>Phòng: <strong>{selectedRoom?.name || '___'}</strong></p>
        <p style={{ marginBottom: '8px' }}>Khách thuê: <strong>{selectedTenant?.full_name || selectedTenant?.name || '___'}</strong></p>
        <p style={{ marginBottom: '8px' }}>Thời hạn: <strong>{durationMonths} tháng</strong></p>
        <p style={{ marginBottom: '8px' }}>Từ ngày <strong>{form.start_date}</strong> đến ngày <strong>{form.end_date}</strong></p>
        <p style={{ marginBottom: '8px' }}>Giá thuê: <strong>{formatCurrency(form.rental_price)} đ/tháng</strong></p>
        <p style={{ marginBottom: '16px' }}>Tiền đặt cọc: <strong>{formatCurrency(form.deposit)} đ</strong></p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginTop: '40px', textAlign: 'center' }}>
          <div>
            <div style={{ fontWeight: 700 }}>BÊN A</div>
            <div style={{ marginTop: '55px', borderTop: '1px solid #9ca3af', paddingTop: '8px' }}>Chủ trọ</div>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>BÊN B</div>
            <div style={{ marginTop: '55px', borderTop: '1px solid #9ca3af', paddingTop: '8px' }}>Người thuê</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Contract() {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loadingData, setLoadingData] = useState(true);
  const [seedingRooms, setSeedingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdContractId, setCreatedContractId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [roomsRes, tenantsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/tenants'),
        ]);

        setRooms(roomsRes.data?.rooms || roomsRes.data?.data || []);
        setTenants(tenantsRes.data?.tenants || tenantsRes.data?.data || []);
      } catch (loadError) {
        console.error('Lỗi tải dữ liệu hợp đồng:', loadError);
        setError('Không thể tải danh sách phòng hoặc khách thuê.');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(form.room_id)) || null,
    [rooms, form.room_id]
  );

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => String(tenant.id) === String(form.tenant_id)) || null,
    [tenants, form.tenant_id]
  );

  useEffect(() => {
    if (selectedRoom?.price != null && String(selectedRoom.status || '').toLowerCase() === 'available') {
      setForm((current) => ({
        ...current,
        rental_price: String(selectedRoom.price),
      }));
    }
  }, [selectedRoom]);

  const durationMonths = useMemo(() => {
    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return 0;
    }
    return Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
  }, [form.start_date, form.end_date]);

  const availableRooms = useMemo(
    () => rooms
      .filter((room) => String(room.status || '').toLowerCase() === 'available')
      .sort((left, right) => String(left.name).localeCompare(String(right.name), 'en', { numeric: true })),
    [rooms]
  );

  const handleSeedDemoRooms = async () => {
    setError('');
    setSeedingRooms(true);

    try {
      await api.post('/rooms/seed-demo');
      const refreshedRooms = await api.get('/rooms');
      setRooms(refreshedRooms.data?.rooms || refreshedRooms.data?.data || []);
    } catch (seedError) {
      console.error('Không thể tạo phòng mẫu:', seedError);
      setError(seedError.response?.data?.error || 'Không thể tạo bộ phòng trống mẫu.');
    } finally {
      setSeedingRooms(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.room_id || !form.tenant_id) {
      setError('Vui lòng chọn phòng và khách thuê.');
      return;
    }

    if (selectedRoom && String(selectedRoom.status || '').toLowerCase() !== 'available') {
      setError('Phòng đã được thuê hoặc không còn khả dụng.');
      return;
    }

    if (!Number.isFinite(Number(form.rental_price)) || Number(form.rental_price) <= 0) {
      setError('Giá thuê phải là số lớn hơn 0.');
      return;
    }

    if (!Number.isFinite(new Date(form.start_date).getTime()) || !Number.isFinite(new Date(form.end_date).getTime())) {
      setError('Ngày bắt đầu và ngày kết thúc không hợp lệ.');
      return;
    }

    if (new Date(form.end_date) <= new Date(form.start_date)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/contracts', {
        roomID: Number(form.room_id),
        tenantID: Number(form.tenant_id),
        startDate: form.start_date,
        endDate: form.end_date,
        deposit: Number(form.deposit) || 0,
        rentalPrice: Number(form.rental_price),
      });

      setCreatedContractId(response.data?.data?.contractID || null);
      setSuccess(true);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Lỗi tạo hợp đồng.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#718096' }}>
        Đang tải dữ liệu hợp đồng...
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ maxWidth: '820px', margin: '0 auto', background: 'white', borderRadius: '18px', padding: '36px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
        <h2 style={{ marginBottom: '10px' }}>Tạo hợp đồng thành công</h2>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          Phòng đã được chuyển sang trạng thái occupied và hợp đồng đã được lưu.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {createdContractId && (
            <Link
              to={`/contracts/${createdContractId}`}
              style={{
                padding: '12px 18px',
                borderRadius: '10px',
                background: '#667eea',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Xem hợp đồng vừa tạo
            </Link>
          )}
          <Link
            to="/rooms"
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              background: '#f7fafc',
              color: '#2d3748',
              textDecoration: 'none',
              fontWeight: 700,
              border: '1px solid #e2e8f0',
            }}
          >
            Quay lại danh sách phòng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setPreview(false)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: preview ? '#edf2f7' : '#667eea',
            color: preview ? '#4a5568' : 'white',
            fontWeight: 700,
          }}
        >
          Nhập liệu
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: preview ? '#667eea' : '#edf2f7',
            color: preview ? 'white' : '#4a5568',
            fontWeight: 700,
          }}
        >
          Xem trước
        </button>
        <button
          type="button"
          onClick={handleSeedDemoRooms}
          disabled={seedingRooms}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid #cbd5e0',
            cursor: seedingRooms ? 'not-allowed' : 'pointer',
            background: '#f7fafc',
            color: '#2d3748',
            fontWeight: 700,
          }}
        >
          {seedingRooms ? 'Đang tạo 546 phòng...' : 'Tạo phòng mẫu A0-Z20'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' }}>
          {error}
        </div>
      )}

      {!preview ? (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <section style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '18px' }}>Thông tin hợp đồng</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <label>
                <div style={{ marginBottom: '6px', fontWeight: 600 }}>Khách thuê</div>
                <select
                  name="tenant_id"
                  value={form.tenant_id}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                >
                  <option value="">-- Chọn khách thuê --</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name || tenant.name || tenant.email || `Khách thuê #${tenant.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div style={{ marginBottom: '6px', fontWeight: 600 }}>Phòng thuê</div>
                <select
                  name="room_id"
                  value={form.room_id}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                >
                  <option value="">-- Chọn phòng trống --</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} - {formatCurrency(room.price)}đ
                    </option>
                  ))}
                </select>
                {selectedRoom && String(selectedRoom.status || '').toLowerCase() !== 'available' && (
                  <div style={{ marginTop: '6px', color: '#c53030', fontSize: '0.85rem' }}>
                    Phòng này không còn khả dụng.
                  </div>
                )}
              </label>

              <label>
                <div style={{ marginBottom: '6px', fontWeight: 600 }}>Ngày bắt đầu</div>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              </label>

              <label>
                <div style={{ marginBottom: '6px', fontWeight: 600 }}>Ngày kết thúc</div>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              </label>

              <label>
                <div style={{ marginBottom: '6px', fontWeight: 600 }}>Giá thuê</div>
                <input
                  type="number"
                  min="0"
                  name="rental_price"
                  value={form.rental_price}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              </label>

              <label>
                <div style={{ marginBottom: '6px', fontWeight: 600 }}>Tiền đặt cọc</div>
                <input
                  type="number"
                  min="0"
                  name="deposit"
                  value={form.deposit}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              </label>
            </div>
          </section>

          <section style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '18px' }}>Tóm tắt nhanh</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Phòng</div>
                <div style={{ fontWeight: 700 }}>{selectedRoom?.name || 'Chưa chọn'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Khách thuê</div>
                <div style={{ fontWeight: 700 }}>{selectedTenant?.full_name || selectedTenant?.name || 'Chưa chọn'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>Trạng thái phòng</div>
                <div style={{ fontWeight: 700, color: selectedRoom ? (String(selectedRoom.status || '').toLowerCase() === 'available' ? '#2f855a' : '#c53030') : '#718096' }}>
                  {selectedRoom ? (String(selectedRoom.status || '').toLowerCase() === 'available' ? 'Available' : selectedRoom.status || 'Unknown') : 'Chưa chọn'}
                </div>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              fontWeight: 800,
              letterSpacing: '0.02em',
            }}
          >
            {submitting ? 'Đang tạo hợp đồng...' : 'TẠO HỢP ĐỒNG'}
          </button>
        </form>
      ) : (
        <ContractPreview
          form={form}
          selectedRoom={selectedRoom}
          selectedTenant={selectedTenant}
          durationMonths={durationMonths}
        />
      )}
    </div>
  );
}