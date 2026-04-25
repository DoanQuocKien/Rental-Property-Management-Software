import { useState, useEffect } from 'react';
import api from '../api';

// Injected CSS
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap');

  .notification-root {
    font-family: 'Be Vietnam Pro', sans-serif;
    color: #1a1f2e;
    background: #f4f6fb;
    padding: 28px;
    min-height: 100vh;
  }

  .notification-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .notification-header {
    margin-bottom: 32px;
  }

  .notification-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 8px;
    color: #1a1f2e;
  }

  .notification-header p {
    font-size: 0.9rem;
    color: #64748b;
    margin: 0;
  }

  .form-card {
    background: white;
    border-radius: 14px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e8eaf2;
    margin-bottom: 28px;
  }

  .form-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1a1f2e;
    margin: 0 0 24px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: #555;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 11px 13px;
    border: 1.5px solid #ddd;
    border-radius: 9px;
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    background: white;
    color: #333;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
    background: #fafbff;
  }

  .form-group textarea {
    resize: vertical;
    min-height: 140px;
    font-family: 'Be Vietnam Pro', sans-serif;
  }

  .char-count {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 4px;
  }

  .char-count.warning {
    color: #d97706;
    font-weight: 600;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 28px;
  }

  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 9px;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }

  .btn-primary {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
    box-shadow: 0 4px 12px rgba(79,70,229,0.35);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(79,70,229,0.4);
  }

  .btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: white;
    border: 1.5px solid #ddd;
    color: #555;
  }

  .btn-secondary:hover {
    border-color: #4f46e5;
    color: #4f46e5;
    background: #f8f9ff;
  }

  .alert {
    padding: 12px 16px;
    border-radius: 9px;
    margin-bottom: 16px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .alert-success {
    background: #e6fffa;
    border: 1px solid #81e6d9;
    color: #276749;
  }

  .alert-error {
    background: #fff5f5;
    border: 1px solid #feb2b2;
    color: #742a2a;
  }

  .alert-info {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
  }

  .history-card {
    background: white;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e8eaf2;
  }

  .history-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a1f2e;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .notification-item {
    padding: 16px;
    border: 1px solid #e8eaf2;
    border-radius: 9px;
    margin-bottom: 12px;
    background: #f8f9ff;
    transition: all 0.2s;
  }

  .notification-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .notification-item-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 8px;
  }

  .notification-item-title {
    font-weight: 700;
    color: #1a1f2e;
    font-size: 0.95rem;
  }

  .notification-item-date {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .notification-item-message {
    color: #555;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .notification-item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .empty-history {
    padding: 40px 20px;
    text-align: center;
    color: #94a3b8;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2.5px solid rgba(79,70,229,0.3);
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .recipient-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #f0f4ff, #f8f0ff);
    border-radius: 9px;
    border: 1px solid #d5d9f5;
  }

  .recipient-stat {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .recipient-stat-icon {
    font-size: 1.3rem;
  }

  .recipient-stat-content h4 {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0;
    font-weight: 600;
    text-transform: uppercase;
  }

  .recipient-stat-content p {
    font-size: 1.2rem;
    font-weight: 800;
    color: #4f46e5;
    margin: 2px 0 0;
  }

  @media (max-width: 768px) {
    .notification-root {
      padding: 16px;
    }

    .form-card {
      padding: 20px;
    }

    .notification-header h1 {
      font-size: 1.5rem;
    }

    .form-actions {
      flex-direction: column;
    }

    .btn {
      width: 100%;
    }
  }
`;

// Toast Notification Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999,
      animation: 'slideDown 0.3s ease',
    }}>
      <div className={`alert alert-${type}`}>
        <span>
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
        </span>
        {message}
      </div>
    </div>
  );
}

// Main Notification System Component
export default function NotificationSystem() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [tenants, setTenants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ totalTenants: 0, activeTenants: 0, inactiveTenants: 0 });

  useEffect(() => {
    fetchTenantsAndNotifications();
  }, []);

  const fetchTenantsAndNotifications = async () => {
    setLoading(true);
    try {
      // Fetch tenants
      const tenantsRes = await api.get('/tenants');
      const allTenants = tenantsRes.data.data || tenantsRes.data.tenants || [];

      // Fetch contracts to count active/inactive
      const contractsRes = await api.get('/contracts');
      const contracts = contractsRes.data.data || [];
      const activeContractRooms = contracts
        .filter((c) => c.status === 'active')
        .map((c) => c.roomID);

      const activeTenants = allTenants.filter((t) => activeContractRooms.includes(t.roomID));

      setTenants(allTenants);
      setStats({
        totalTenants: allTenants.length,
        activeTenants: activeTenants.length,
        inactiveTenants: allTenants.length - activeTenants.length,
      });

      // Load notifications from localStorage (in production, fetch from API)
      try {
        const savedNotifications = JSON.parse(localStorage.getItem('landlordNotifications') || '[]');
        setNotifications(savedNotifications);
      } catch {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const validateForm = () => {
    if (!title.trim()) {
      showToast('Vui lòng nhập tiêu đề thông báo', 'error');
      return false;
    }
    if (!message.trim()) {
      showToast('Vui lòng nhập nội dung thông báo', 'error');
      return false;
    }
    if (title.length > 200) {
      showToast('Tiêu đề không được vượt quá 200 ký tự', 'error');
      return false;
    }
    if (message.length > 2000) {
      showToast('Nội dung không được vượt quá 2000 ký tự', 'error');
      return false;
    }
    return true;
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSending(true);
    try {
      // In production, this would send to backend
      // For now, save to localStorage
      const newNotification = {
        id: Date.now(),
        title,
        message,
        sentAt: new Date().toISOString(),
        recipientCount: stats.activeTenants,
        status: 'sent',
      };

      const updatedNotifications = [newNotification, ...notifications];
      localStorage.setItem('landlordNotifications', JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      showToast('✅ Gửi thông báo thành công!', 'success');

      // Reset form
      setTitle('');
      setMessage('');

      // Focus on title field
      document.getElementById('titleInput')?.focus();
    } catch (err) {
      console.error('Error sending notification:', err);
      showToast('❌ Gửi thông báo thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleClearForm = () => {
    setTitle('');
    setMessage('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="notification-root">
      <style>{STYLES}</style>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      <div className="notification-container">
        <div className="notification-header">
          <h1>📢 Hệ thống thông báo</h1>
          <p>Gửi thông báo và quản lý tin tức cho tất cả khách hàng</p>
        </div>

        {/* Send Announcement Form */}
        <div className="form-card">
          <div className="form-title">📝 Gửi thông báo chung</div>

          {/* Recipient Stats */}
          <div className="recipient-stats">
            <div className="recipient-stat">
              <div className="recipient-stat-icon">👥</div>
              <div className="recipient-stat-content">
                <h4>Tổng khách hàng</h4>
                <p>{stats.totalTenants}</p>
              </div>
            </div>
            <div className="recipient-stat">
              <div className="recipient-stat-icon">✅</div>
              <div className="recipient-stat-content">
                <h4>Đang thuê</h4>
                <p>{stats.activeTenants}</p>
              </div>
            </div>
            <div className="recipient-stat">
              <div className="recipient-stat-icon">⏸️</div>
              <div className="recipient-stat-content">
                <h4>Ngừng thuê</h4>
                <p>{stats.inactiveTenants}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendAnnouncement}>
            <div className="form-group">
              <label htmlFor="titleInput">Tiêu đề *</label>
              <input
                id="titleInput"
                type="text"
                placeholder="Ví dụ: Sửa chữa đường nước chung..."
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                maxLength={200}
              />
              <div className="char-count">
                {title.length}/200 ký tự
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="messageInput">Nội dung thông báo *</label>
              <textarea
                id="messageInput"
                placeholder="Nhập nội dung chi tiết cho khách hàng..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                maxLength={2000}
              />
              <div className={`char-count ${message.length > 1500 ? 'warning' : ''}`}>
                {message.length}/2000 ký tự
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={sending || !title.trim() || !message.trim()}
                className="btn btn-primary"
              >
                {sending ? (
                  <>
                    <span className="spinner" style={{ marginRight: '6px' }}></span>
                    Đang gửi...
                  </>
                ) : (
                  '✉️ Gửi thông báo'
                )}
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                disabled={sending}
                className="btn btn-secondary"
              >
                🗑️ Xóa
              </button>
            </div>
          </form>
        </div>

        {/* Notification History */}
        <div className="history-card">
          <div className="history-title">📋 Lịch sử thông báo</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <span className="spinner"></span>
              <div style={{ marginTop: '8px' }}>Đang tải...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-history">
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Chưa có thông báo nào</div>
              <div style={{ fontSize: '0.85rem' }}>Hãy gửi thông báo đầu tiên cho khách hàng</div>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div key={notif.id} className="notification-item">
                  <div className="notification-item-header">
                    <div className="notification-item-title">{notif.title}</div>
                    <div className="notification-item-date">{formatDate(notif.sentAt)}</div>
                  </div>
                  <div className="notification-item-message">{notif.message}</div>
                  <div className="notification-item-footer">
                    <span>👥 Gửi cho {notif.recipientCount} khách hàng đang thuê</span>
                    <span>
                      {notif.status === 'sent' && '✅ Đã gửi'}
                      {notif.status === 'pending' && '⏳ Đang gửi'}
                      {notif.status === 'failed' && '❌ Gửi thất bại'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
