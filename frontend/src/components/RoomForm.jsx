import { useState } from 'react';

export default function RoomForm({ room, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: room?.name || '',
    description: room?.description || '',
    price: room?.price || '',
    area: room?.area || '',
    maxOccupants: room?.maxOccupants || room?.capacity || '',
    status: room?.status || 'available',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        ...form,
        price: Number(form.price),
        area: Number(form.area),
        maxOccupants: Number(form.maxOccupants),
        capacity: Number(form.maxOccupants),
      });
    } catch (err) {
      setError(err.message || 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{room ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-group">
            <label htmlFor="room-name">Tên phòng *</label>
            <input
              id="room-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ví dụ: Phòng 101"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="room-description">Mô tả</label>
            <textarea
              id="room-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về phòng"
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="room-price">Giá thuê (VNĐ/tháng) *</label>
              <input
                id="room-price"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Ví dụ: 3000000"
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="room-area">Diện tích (m²) *</label>
              <input
                id="room-area"
                type="number"
                name="area"
                value={form.area}
                onChange={handleChange}
                placeholder="Ví dụ: 25"
                min="1"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="room-capacity">Sức chứa (người) *</label>
              <input
                id="room-capacity"
                type="number"
                name="maxOccupants"
                value={form.maxOccupants}
                onChange={handleChange}
                placeholder="Ví dụ: 2"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="room-status">Trạng thái</label>
              <select id="room-status" name="status" value={form.status} onChange={handleChange}>
                <option value="available">Phòng trống</option>
                <option value="occupied">Đã thuê</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : room ? 'Cập nhật' : 'Thêm phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
