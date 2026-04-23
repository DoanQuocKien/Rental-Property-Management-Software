import { useEffect, useMemo, useState } from 'react';
import api from '../api';

export default function Invoices() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({
    roomID: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    roomPrice: '',
    prevElectricityIndex: '',
    currentElectricityIndex: '',
    prevWaterIndex: '',
    currentWaterIndex: '',
    wifiFee: 0,
    trashFee: 0,
    electricityUnitPrice: 0,
    waterUnitPrice: 0,
  });
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [previousReading, setPreviousReading] = useState(null);

  useEffect(() => {
    const loadRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await api.get('/rooms');
        setRooms(res.data?.rooms || []);
      } catch {
        setRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };

    loadRooms();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(form.roomID)) || null,
    [rooms, form.roomID]
  );

  useEffect(() => {
    if (selectedRoom) {
      setForm((current) => ({
        ...current,
        roomPrice: String(selectedRoom.price || ''),
      }));
    }
  }, [selectedRoom]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleLoadPreviousReading = async () => {
    if (!form.roomID || !form.month || !form.year) return;
    try {
      const res = await api.get(`/landlord/rooms/${form.roomID}/previous-reading`, {
        params: { month: form.month, year: form.year },
      });
      const reading = res.data?.data?.previousReading || null;
      setPreviousReading(reading);
      setForm((current) => ({
        ...current,
        prevElectricityIndex: reading?.electricityIndex ?? current.prevElectricityIndex,
        prevWaterIndex: reading?.waterIndex ?? current.prevWaterIndex,
      }));
    } catch {
      setPreviousReading(null);
    }
  };

  const handleCalculate = async (event) => {
    event.preventDefault();
    setError('');
    setCalculating(true);

    try {
      const payload = {
        roomID: Number(form.roomID),
        month: Number(form.month),
        year: Number(form.year),
        roomPrice: Number(form.roomPrice),
        prevElectricityIndex: form.prevElectricityIndex === '' ? undefined : Number(form.prevElectricityIndex),
        currentElectricityIndex: Number(form.currentElectricityIndex),
        prevWaterIndex: form.prevWaterIndex === '' ? undefined : Number(form.prevWaterIndex),
        currentWaterIndex: Number(form.currentWaterIndex),
        serviceFees: {
          wifiFee: Number(form.wifiFee) || 0,
          trashFee: Number(form.trashFee) || 0,
        },
        serviceUnitPrices: {
          electricityUnitPrice: Number(form.electricityUnitPrice),
          waterUnitPrice: Number(form.waterUnitPrice),
        },
      };

      const res = await api.post('/landlord/invoices/calculate', payload);
      setResult(res.data?.data || null);
    } catch (calcError) {
      setError(calcError.response?.data?.message || 'Không thể tính hóa đơn.');
      setResult(null);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="content-card">
      <h3>💰 Quản lý hóa đơn</h3>
      <p>Tính preview hóa đơn theo phòng, chỉ số điện nước và phí dịch vụ hiện có.</p>

      <form onSubmit={handleCalculate} style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Phòng</div>
            <select name="roomID" value={form.roomID} onChange={handleChange} required style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <option value="">-- Chọn phòng --</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.name} - {Number(room.price || 0).toLocaleString('vi-VN')}đ</option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Kỳ hóa đơn</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="number" name="month" min="1" max="12" value={form.month} onChange={handleChange} style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              <input type="number" name="year" min="2000" max="9999" value={form.year} onChange={handleChange} style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            </div>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Chỉ số điện cũ</div>
            <input type="number" name="prevElectricityIndex" value={form.prevElectricityIndex} onChange={handleChange} style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Chỉ số điện mới</div>
            <input type="number" name="currentElectricityIndex" value={form.currentElectricityIndex} onChange={handleChange} required style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Chỉ số nước cũ</div>
            <input type="number" name="prevWaterIndex" value={form.prevWaterIndex} onChange={handleChange} style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Chỉ số nước mới</div>
            <input type="number" name="currentWaterIndex" value={form.currentWaterIndex} onChange={handleChange} required style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Giá điện/kWh</div>
            <input type="number" name="electricityUnitPrice" value={form.electricityUnitPrice} onChange={handleChange} required style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Giá nước/m³</div>
            <input type="number" name="waterUnitPrice" value={form.waterUnitPrice} onChange={handleChange} required style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Phí WiFi</div>
            <input type="number" name="wifiFee" value={form.wifiFee} onChange={handleChange} style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
          <label>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>Phí rác</div>
            <input type="number" name="trashFee" value={form.trashFee} onChange={handleChange} style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleLoadPreviousReading} disabled={!form.roomID || !form.month || !form.year} className="btn-primary" style={{ background: '#2d6a4f' }}>
            Lấy chỉ số kỳ trước
          </button>
          <button type="submit" disabled={calculating || loadingRooms} className="btn-primary">
            {calculating ? 'Đang tính...' : 'Tính hóa đơn'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: '10px', background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7' }}>
          {error}
        </div>
      )}

      {previousReading && (
        <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <strong>Chỉ số kỳ trước:</strong> Điện {Number(previousReading.electricityIndex || 0).toLocaleString('vi-VN')}, nước {Number(previousReading.waterIndex || 0).toLocaleString('vi-VN')}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', background: '#f7fafc', border: '1px solid #e2e8f0' }}>
          <h4 style={{ marginTop: 0 }}>Kết quả tính hóa đơn</h4>
          <div style={{ display: 'grid', gap: '8px', fontSize: '0.95rem' }}>
            <div><strong>Tiền phòng:</strong> {Number(result.roomPrice || 0).toLocaleString('vi-VN')}đ</div>
            <div><strong>Điện:</strong> {Number(result.breakdown?.electricityAmount || 0).toLocaleString('vi-VN')}đ</div>
            <div><strong>Nước:</strong> {Number(result.breakdown?.waterAmount || 0).toLocaleString('vi-VN')}đ</div>
            <div><strong>Phí dịch vụ:</strong> {Number(result.breakdown?.serviceAmount || 0).toLocaleString('vi-VN')}đ</div>
            <div><strong>Tổng tiền:</strong> {Number(result.totalAmount || 0).toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
      )}
    </div>
  );
}