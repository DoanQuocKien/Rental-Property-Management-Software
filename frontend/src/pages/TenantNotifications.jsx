import { useState, useEffect } from 'react';
import api from '../api';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap');

  .tenant-notif-root {
    font-family: 'Be Vietnam Pro', sans-serif;
    color: #1a1f2e;
    background: #f4f6fb;
    padding: 28px;
    min-height: 100vh;
  }

  .tenant-notif-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .tenant-notif-header {
    margin-bottom: 28px;
  }

  .tenant-notif-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 8px;
    color: #1a1f2e;
  }

  .tenant-notif-header p {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0;
  }

  .notif-card {
    background: white;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e8eaf2;
    margin-bottom: 16px;
    transition: all 0.2s;
  }

  .notif-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .notif-card.unread {
    background: linear-gradient(135deg, #eff6ff, #f0f4ff);
    border-color: #bfdbfe;
  }

  .notif-card-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 10px;
  }

  .notif-card-title {
    font-weight: 700;
    font-size: 1.05rem;
    color: #1a1f2e;
    flex: 1;
  }

  .notif-card-date {
    font-size: 0.8rem;
    color: #94a3b8;
    font-weight: 600;
    white-space: nowrap;
    margin-left: 12px;
  }

  .notif-card-message {
    color: #555;
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .notif-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .notif-actions {
    display: flex;
    gap: 8px;
  }

  .notif-btn {
    background: transparent;
    border: none;
    color: #4f46e5;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .notif-btn:hover {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
  }

  .notif-btn-delete {
    color: #dc2626;
  }

  .notif-btn-delete:hover {
    background: rgba(220, 38, 38, 0.1);
  }

  .empty-state {
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .empty-title {
    font-weight: 700;
    font-size: 1.1rem;
    color: #1a1f2e;
    margin-bottom: 8px;
  }

  .empty-text {
    color: #64748b;
    font-size: 0.95rem;
  }

  .loading {
    padding: 40px 20px;
    text-align: center;
    color: #94a3b8;
  }

  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(79,70,229,0.3);
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .toast {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.88rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .toast-success {
    background: #ecfdf5;
    border: 1px solid #6ee7b7;
    color: #065f46;
  }

  .toast-error {
    background: #fff1f2;
    border: 1px solid #fda4af;
    color: #9f1239;
  }

  .notif-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-box {
    background: linear-gradient(135deg, #f0f4ff, #f8f0ff);
    border: 1px solid #d5d9f5;
    border-radius: 10px;
    padding: 16px;
    text-align: center;
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #4f46e5;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  @media (max-width: 768px) {
    .tenant-notif-root {
      padding: 16px;
    }

    .tenant-notif-header h1 {
      font-size: 1.5rem;
    }

    .notif-card-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .notif-card-date {
      margin-left: 0;
      margin-top: 8px;
    }
  }
`;

function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
      <span>{type === 'success' ? '✅' : '❌'}</span>
      {message}
    </div>
  );
}

export default function TenantNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      const data = res.data.data || [];
      setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error('Error fetching notifications:', err);
      showToast('Lỗi khi tải thông báo', 'error');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      setNotifications(notifs =>
        notifs.map(n => (n.id === notifId ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDeleteNotification = async (notifId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    try {
      await api.delete(`/notifications/${notifId}`);
      showToast('✅ Xóa thông báo thành công!', 'success');
      setNotifications(notifs => notifs.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Error deleting notification:', err);
      showToast('❌ Xóa thông báo thất bại', 'error');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalCount = notifications.length;

  return (
    <div className="tenant-notif-root">
      <style>{STYLES}</style>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: '' })}
      />

      <div className="tenant-notif-container">
        <div className="tenant-notif-header">
          <h1>🔔 Thông báo của tôi</h1>
          <p>Xem và quản lý tất cả thông báo từ chủ nhà</p>
        </div>

        {/* Stats */}
        <div className="notif-stats">
          <div className="stat-box">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Tổng thông báo</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{unreadCount}</div>
            <div className="stat-label">Chưa đọc</div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="loading">
            <span className="spinner"></span>
            <div style={{ marginTop: '8px' }}>Đang tải thông báo...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">Chưa có thông báo nào</div>
            <div className="empty-text">Bạn sẽ nhận được thông báo từ chủ nhà ở đây</div>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-card ${!notif.is_read ? 'unread' : ''}`}
                onClick={() => {
                  if (!notif.is_read) handleMarkAsRead(notif.id);
                }}
              >
                <div className="notif-card-header">
                  <div className="notif-card-title">{notif.title}</div>
                  <div className="notif-card-date">{formatDate(notif.created_at)}</div>
                </div>

                <div className="notif-card-message">{notif.message}</div>

                <div className="notif-card-footer">
                  <span>
                    {!notif.is_read ? '● Chưa đọc' : '✓ Đã đọc'}
                  </span>
                  <div className="notif-actions">
                    {!notif.is_read && (
                      <button
                        className="notif-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        title="Đánh dấu là đã đọc"
                      >
                        ✓ Đánh dấu đã đọc
                      </button>
                    )}
                    <button
                      className="notif-btn notif-btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notif.id);
                      }}
                      title="Xóa thông báo"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
