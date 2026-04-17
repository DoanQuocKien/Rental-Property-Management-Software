import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import RoomForm from '../components/RoomForm';
import { useSearch } from '../context/SearchContext';

export default function LandlordDashboard() {
  const { query } = useSearch();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      // Luôn fetch all để search hoạt động đúng
      const res = await api.get('/rooms');
      setRooms(res.data.rooms || []);
    } catch {
      setError('Lỗi kết nối đến Server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleFormSubmit = async (data) => {
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.roomID || editingRoom.id}`, data);
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

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch {
      alert('Không thể xóa phòng.');
    }
  };

  // Filter theo tab và search query
  const filteredRooms = rooms.filter(room => {
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'available' && room.status === 'available') ||
      (activeTab === 'occupied' && room.status === 'occupied');

    const q = query.trim().toLowerCase();
    const matchSearch = !q || [
      room.name,
      room.description,
      room.category,
      String(room.price),
      room.status,
    ].some(v => v?.toLowerCase().includes(q));

    return matchTab && matchSearch;
  });

  const availableCount = rooms.filter(r => r.status === 'available').length;
  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;

  return (
    <>
      {/* Thống kê */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="tab-group">
              <button
                className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Tất cả ({rooms.length})
              </button>
              <button
                className={`tab-item ${activeTab === 'available' ? 'active' : ''}`}
                onClick={() => setActiveTab('available')}
              >
                Phòng trống ({availableCount})
              </button>
              <button
                className={`tab-item ${activeTab === 'occupied' ? 'active' : ''}`}
                onClick={() => setActiveTab('occupied')}
              >
                Đã thuê ({occupiedCount})
              </button>
            </div>

            {/* Search indicator */}
            {query && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#f0f4ff', border: '1px solid #c3dafe',
                borderRadius: 20, padding: '4px 12px',
                fontSize: '0.8rem', color: '#667eea', fontWeight: 600,
              }}>
                🔍 &quot;{query}&quot;
                <span style={{ color: '#a0aec0', fontWeight: 400 }}>
                  — {filteredRooms.length} kết quả
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setEditingRoom(null); setShowForm(true); }}
            className="btn-primary-gradient"
          >
            + Thêm phòng mới
          </button>
        </div>

        {error && <div className="error-alert" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

        {loading ? (
          <div className="loading-spinner" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải dữ liệu...</div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a0aec0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏠</div>
            <p style={{ fontWeight: 600 }}>
              {query ? `Không tìm thấy phòng nào khớp với "${query}"` : 'Chưa có phòng nào'}
            </p>
            {query && (
              <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Thử tìm với từ khóa khác hoặc xóa bộ lọc</p>
            )}
          </div>
        ) : (
          <div className="rooms-table-container">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th>Tên phòng</th>
                  <th>Trạng thái</th>
                  <th>Diện tích</th>
                  <th>Sức chứa</th>
                  <th>Giá thuê</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.roomID || room.id}>
                    <td className="font-bold">
                      {/* Highlight tên phòng nếu có search */}
                      {query ? (
                        <HighlightText text={room.name} query={query} />
                      ) : room.name}
                    </td>
                    <td>
                      <span className={`badge ${room.status}`}>
                        {room.status === 'available' ? 'Trống' : 'Đã thuê'}
                      </span>
                    </td>
                    <td>{room.area} m²</td>
                    <td>{room.maxOccupants || room.capacity || 1} người</td>
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
                          onClick={() => handleDeleteRoom(room.roomID || room.id)}
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

        {/* Footer đếm */}
        {!loading && filteredRooms.length > 0 && query && (
          <div style={{ padding: '12px 0 0', borderTop: '1px solid #f0f2f5', color: '#a0aec0', fontSize: '0.82rem', marginTop: 8 }}>
            Hiển thị {filteredRooms.length} / {rooms.length} phòng
          </div>
        )}
      </div>

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

// Component highlight từ khóa tìm kiếm
function HighlightText({ text, query }) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fef08a', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
