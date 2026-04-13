import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import RoomForm from '../components/RoomForm';

export default function LandlordDashboard() {
  // --- GIỮ NGUYÊN TẤT CẢ CÁC STATE CỦA BẠN ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // --- GIỮ NGUYÊN LOGIC FETCH DỮ LIỆU ---
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'available' ? '/rooms/available' : '/rooms';
      const res = await api.get(endpoint);
      setRooms(res.data.rooms || []);
    } catch {
      setError('Lỗi kết nối đến Server.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // --- GIỮ NGUYÊN LOGIC THÊM/SỬA ---
  const handleFormSubmit = async (data) => {
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, data);
      } else {
        await api.post('/rooms', data);
      }
      setShowForm(false);
      setEditingRoom(null);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.error || 'Thao tác thất bại');
    }
  };

  // --- GIỮ NGUYÊN LOGIC XÓA ---
  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch {
      alert('Không thể xóa phòng.');
    }
  };

  const availableCount = rooms.filter(r => r.status === 'available').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;

  return (
    <>
      {/* 1. Phần Thống kê (Vẫn giữ số liệu thời gian thực của bạn) */}
      <div className="stats-grid">
        <div className="stat-card-new total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-value">{rooms.length}</span>
            <span className="stat-label">Tổng phòng</span>
          </div>
        </div>
        <div className="stat-card-new available">
          <div className="stat-icon">✨</div>
          <div className="stat-info">
            <span className="stat-value">{availableCount}</span>
            <span className="stat-label">Phòng trống</span>
          </div>
        </div>
        <div className="stat-card-new occupied">
          <div className="stat-icon">🏠</div>
          <div className="stat-info">
            <span className="stat-value">{occupiedCount}</span>
            <span className="stat-label">Đã thuê</span>
          </div>
        </div>
      </div>

      <div className="content-card">
        {/* 2. Thanh công cụ (Bộ lọc & Nút thêm) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
          <div className="tab-group">
            <button
              className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả phòng
            </button>
            <button
              className={`tab-item ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Phòng trống
            </button>
          </div>
          <button
            onClick={() => { setEditingRoom(null); setShowForm(true); }}
            className="btn-primary-gradient"
          >
            + Thêm phòng mới
          </button>
        </div>

        {error && <div className="error-alert" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

        {/* 3. Bảng dữ liệu (Hiển thị dạng bảng chuyên nghiệp) */}
        {loading ? (
          <div className="loading-spinner">Đang tải dữ liệu...</div>
        ) : (
          <div className="rooms-table-container">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Tên phòng</th>
                  <th>Trạng thái</th>
                  <th>Diện tích</th>
                  <th>Giá thuê</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="font-bold">{room.name}</td>
                    <td>
                      <span className={`badge ${room.status}`}>
                        {room.status === 'available' ? 'Trống' : 'Đã thuê'}
                      </span>
                    </td>
                    <td>{room.area} m²</td>
                    <td>{Number(room.price).toLocaleString('vi-VN')} đ</td>
                    <td>
                      <div className="action-btns">
                        <button
                          onClick={() => { setEditingRoom(room); setShowForm(true); }}
                          className="edit-link"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="delete-link"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Form (Giữ nguyên logic của bạn) */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <RoomForm
              room={editingRoom}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditingRoom(null); }}
            />
          </div>
        </div>
      )}
    </>
  );
}