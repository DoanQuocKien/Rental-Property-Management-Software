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

  .tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    border-bottom: 2px solid #e8eaf2;
  }

  .tab-button {
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
    font-family: inherit;
  }

  .tab-button.active {
    color: #4f46e5;
    border-bottom-color: #4f46e5;
  }

  .tab-button:hover:not(.active) {
    color: #1a1f2e;
  }

  .tenant-list {
    border: 1.5px solid #ddd;
    border-radius: 9px;
    background: white;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .tenant-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;
  }

  .tenant-item:last-child {
    border-bottom: none;
  }

  .tenant-item:hover {
    background: #f8f9ff;
  }

  .tenant-item input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    margin-right: 12px;
    accent-color: #4f46e5;
  }

  .tenant-item label {
    flex: 1;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  .tenant-name {
    font-weight: 600;
    color: #1a1f2e;
    font-size: 0.9rem;
  }

  .tenant-room {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  .select-all-btn {
    padding: 8px 12px;
    background: #f0f4ff;
    border: 1px solid #d5d9f5;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #4f46e5;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 12px;
    font-family: inherit;
  }

  .select-all-btn:hover {
    background: #e8ecff;
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

    .tabs {
      gap: 4px;
    }

    .tab-button {
      padding: 10px 16px;
      font-size: 0.85rem;
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
  const [accountList, setAccountList] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('broadcast');
  const [stats, setStats] = useState({ totalTenants: 0, activeTenants: 0 });

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch account list for targeted sending
      const accountRes = await api.get('/tenants/account-list');
      const accounts = accountRes.data.data || [];
      setAccountList(accounts);

      // Calculate stats
      setStats({
        totalTenants: accounts.length,
        activeTenants: accounts.length,
      });

      // Fetch notifications from backend
      try {
        const notifRes = await api.get('/notifications');
        const data = notifRes.data.data || [];
        setNotifications(data);
      } catch (notifErr) {
        console.warn('Error fetching notifications:', notifErr);
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
    if (activeTab === 'targeted' && selectedTenants.length === 0) {
      showToast('Vui lòng chọn ít nhất một người thuê để gửi', 'error');
      return false;
    }
    return true;
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSending(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        recipientType: activeTab === 'targeted' ? 'selected_tenants' : 'all_tenants',
      };

      if (activeTab === 'targeted') {
        payload.selectedTenantIds = selectedTenants;
      }

      const res = await api.post('/notifications', payload);

      showToast(res.data.message || '✅ Gửi thông báo thành công!', 'success');

      // Reset form
      setTitle('');
      setMessage('');
      setSelectedTenants([]);
      setActiveTab('broadcast');

      // Refresh notifications list
      await fetchData();

      // Focus on title field
      document.getElementById('titleInput')?.focus();
    } catch (err) {
      console.error('Error sending notification:', err);
      const errorMsg = err.response?.data?.message || '❌ Gửi thông báo thất bại. Vui lòng thử lại.';
      showToast(errorMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleTenantToggle = (tenantId) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTenants.length === accountList.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(accountList.map((tenant) => tenant.id));
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

  const handleDeleteNotification = async (notifId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa thông báo này?')) {
      return;
    }

    try {
      await api.delete(`/notifications/${notifId}`);
      showToast('✅ Xóa thông báo thành công!', 'success');
      
      // Refresh notifications list
      await fetchData();
    } catch (err) {
      console.error('Error deleting notification:', err);
      const errorMsg = err.response?.data?.message || '❌ Xóa thông báo thất bại. Vui lòng thử lại.';
      showToast(errorMsg, 'error');
    }
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
          <div className="form-title">📝 Gửi thông báo</div>

          {/* Tabs for broadcast vs targeted */}
          <div className="tabs">
            <button
              type="button"
              className={`tab-button ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('broadcast');
                setSelectedTenants([]);
              }}
            >
              📣 Gửi cho tất cả
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'targeted' ? 'active' : ''}`}
              onClick={() => setActiveTab('targeted')}
            >
              🎯 Chọn người thuê
            </button>
          </div>

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
                <h4>Đang thuê hoạt động</h4>
                <p>{activeTab === 'targeted' ? selectedTenants.length : stats.activeTenants}</p>
              </div>
            </div>
          </div>

          {/* Tenant Selection List (for targeted mode) */}
          {activeTab === 'targeted' && (
            <>
              <button
                type="button"
                className="select-all-btn"
                onClick={handleSelectAll}
              >
                {selectedTenants.length === accountList.length
                  ? '❌ Bỏ chọn tất cả'
                  : '✅ Chọn tất cả'}
              </button>
              <div className="tenant-list">
                {accountList.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                    Không có người thuê nào với hợp đồng hoạt động
                  </div>
                ) : (
                  accountList.map((tenant) => (
                    <div key={tenant.id} className="tenant-item">
                      <input
                        type="checkbox"
                        id={`tenant-${tenant.id}`}
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={() => handleTenantToggle(tenant.id)}
                      />
                      <label htmlFor={`tenant-${tenant.id}`}>
                        <div className="tenant-name">{tenant.name}</div>
                        <div className="tenant-room">
                          🏠 {tenant.room_names} • {tenant.active_contracts} hợp đồng
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

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
                    <div className="notification-item-date">{formatDate(notif.created_at)}</div>
                  </div>
                  <div className="notification-item-message">{notif.message}</div>
                  <div className="notification-item-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {notif.recipient_type === 'all_tenants' && '👥 Gửi cho tất cả khách hàng'}
                      {notif.recipient_type === 'selected_tenants' && '🎯 Gửi cho những tài khoản được chọn'}
                      {notif.recipient_type === 'room' && '🏠 Gửi cho khách hàng trong phòng'}
                      {notif.recipient_type === 'tenant' && '👤 Gửi cá nhân'}
                    </span>
                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 6px',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                      title="Xóa thông báo"
                    >
                      🗑️ Xóa
                    </button>
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
