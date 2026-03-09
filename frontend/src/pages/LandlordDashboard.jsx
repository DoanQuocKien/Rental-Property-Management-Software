import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import RoomForm from '../components/RoomForm';

export default function LandlordDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'available' ? '/rooms/available' : '/rooms';
      const res = await api.get(endpoint);
      setRooms(res.data.rooms);
    } catch {
      setError('Không thể tải danh sách phòng.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setShowForm(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch {
      setError('Không thể xóa phòng.');
    }
  };

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
      throw new Error(err.response?.data?.error || 'Thao tác thất bại');
    }
  };

  const availableCount = rooms.filter(r => r.status === 'available').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏠 Quản lý phòng trọ</h1>
          <div className="header-user">
            <span>Xin chào, <strong>{user?.name}</strong> (Chủ trọ)</span>
            <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="stats-row">
          <div className="stat-card stat-total">
            <span className="stat-number">{rooms.length}</span>
            <span className="stat-label">Tổng số phòng</span>
          </div>
          <div className="stat-card stat-available">
            <span className="stat-number">{activeTab === 'all' ? availableCount : rooms.length}</span>
            <span className="stat-label">Phòng trống</span>
          </div>
          <div className="stat-card stat-occupied">
            <span className="stat-number">{activeTab === 'all' ? occupiedCount : 0}</span>
            <span className="stat-label">Phòng đã thuê</span>
          </div>
        </div>

        <div className="section-header">
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả phòng
            </button>
            <button
              className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Phòng trống
            </button>
          </div>
          <button onClick={handleAddRoom} className="btn-primary">
            + Thêm phòng mới
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showForm && (
          <RoomForm
            room={editingRoom}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingRoom(null); }}
          />
        )}

        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <p>
              {activeTab === 'available'
                ? 'Không có phòng trống nào.'
                : 'Chưa có phòng nào. Hãy thêm phòng mới!'}
            </p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className={`room-card ${room.status}`}>
                <div className="room-header">
                  <h3>{room.name}</h3>
                  <span className={`status-badge ${room.status}`}>
                    {room.status === 'available' ? 'Phòng trống' : 'Đã thuê'}
                  </span>
                </div>
                <div className="room-details">
                  {room.description && <p className="room-description">{room.description}</p>}
                  <div className="room-info">
                    <span>💰 {Number(room.price).toLocaleString('vi-VN')} VNĐ/tháng</span>
                    {room.area && <span>📐 {room.area} m²</span>}
                  </div>
                </div>
                <div className="room-actions">
                  <button onClick={() => handleEditRoom(room)} className="btn-edit">
                    Chỉnh sửa
                  </button>
                  <button onClick={() => handleDeleteRoom(room.id)} className="btn-delete">
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
