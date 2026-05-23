import { useState, useEffect } from 'react';
import api from '../api';

const STYLES = `
  .audit-root { font-family: 'Be Vietnam Pro', sans-serif; color: #1a1f2e; }

  :root {
    --c-bg: #f4f6fb; --c-card: #ffffff; --c-border: #e8eaf2;
    --c-accent: #4f46e5; --c-accent2: #7c3aed;
    --c-green: #059669; --c-red: #dc2626; --c-amber: #d97706;
    --c-text: #1a1f2e; --c-muted: #64748b; --c-subtle: #94a3b8;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.08);
    --shadow-md: 0 4px 16px rgba(0,0,0,.1);
    --shadow-lg: 0 12px 40px rgba(0,0,0,.14);
    --r: 14px;
  }

  .audit-header { margin-bottom: 28px; }
  .audit-header h2 { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 4px; }
  .audit-header p  { font-size: .88rem; color: var(--c-muted); margin: 0; }

  .audit-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 24px; }
  .audit-stat  {
    background: var(--c-card); border-radius: var(--r); padding: 18px 20px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--c-border);
    display: flex; align-items: center; gap: 14px; transition: box-shadow .2s;
  }
  .audit-stat:hover { box-shadow: var(--shadow-md); }
  .audit-stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
  .audit-stat-val  { font-size: 1.55rem; font-weight: 800; line-height: 1; color: var(--c-text); }
  .audit-stat-lbl  { font-size: .76rem; color: var(--c-muted); margin-top: 3px; font-weight: 500; }

  .audit-panel { background: var(--c-card); border-radius: var(--r); box-shadow: var(--shadow-sm); border: 1px solid var(--c-border); overflow: hidden; }
  .audit-panel-head { padding: 16px 20px; border-bottom: 1px solid var(--c-border); font-weight: 700; font-size: .92rem; display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#f8f9ff,#f4f6fb); }
  .audit-panel-body { padding: 20px; }

  .audit-filter-group { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .audit-field { display: flex; flex-direction: column; gap: 6px; }
  .audit-label { font-size: .78rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: .5px; }
  .audit-input, .audit-select { padding: 9px 12px; border-radius: 9px; outline: none; font-size: .9rem; border: 1.5px solid var(--c-border); background: #fafbff; color: var(--c-text); font-family: inherit; box-sizing: border-box; transition: border-color .2s, box-shadow .2s; }
  .audit-input:focus, .audit-select:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(79,70,229,.12); background: #fff; }

  .audit-btn-group { display: flex; gap: 10px; }
  .audit-btn { padding: 9px 16px; border-radius: 9px; border: none; cursor: pointer; font-size: .88rem; font-weight: 600; font-family: inherit; transition: all .2s; display: flex; align-items: center; gap: 6px; }
  .audit-btn-primary { background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white; box-shadow: 0 4px 12px rgba(79,70,229,.35); }
  .audit-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,.4); }
  .audit-btn-secondary { background: white; border: 1.5px solid var(--c-border); color: var(--c-muted); }
  .audit-btn-secondary:hover { border-color: var(--c-accent); color: var(--c-accent); background: #f8f9ff; }
  .audit-btn:disabled { opacity: .55; cursor: not-allowed; }

  .audit-table { width: 100%; border-collapse: collapse; }
  .audit-th { padding: 11px 14px; text-align: left; font-size: .74rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: .5px; background: #fafbff; border-bottom: 2px solid var(--c-border); }
  .audit-td { padding: 13px 14px; font-size: .87rem; border-bottom: 1px solid var(--c-border); }
  .audit-tr { transition: background .15s; }
  .audit-tr:hover { background: #f8f9ff; }

  .audit-badge { padding: 4px 10px; border-radius: 20px; font-size: .74rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
  .badge-success { background: #d1fae5; color: #065f46; }
  .badge-failed  { background: #fee2e2; color: #991b1b; }
  .badge-create  { background: #dbeafe; color: #0c4a6e; }
  .badge-update  { background: #fef3c7; color: #92400e; }
  .badge-delete  { background: #fecaca; color: #7f1d1d; }
  .badge-pay     { background: #c7d2fe; color: #312e81; }

  .audit-empty { padding: 60px 20px; text-align: center; color: var(--c-subtle); }
  .audit-empty-icon { font-size: 3rem; margin-bottom: 12px; }

  .audit-modal-bg { position: fixed; inset: 0; background: rgba(15,20,40,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); animation: fadeIn .18s; }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .audit-modal { background: white; border-radius: 18px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: popUp .22s cubic-bezier(.34,1.56,.64,1); }
  @keyframes popUp { from { opacity:0; transform:scale(.94) translateY(12px); } to { opacity:1; transform:none; } }
  .audit-modal-head { padding: 22px 24px; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: white; border-radius: 18px 18px 0 0; display: flex; justify-content: space-between; align-items: flex-start; }
  .audit-modal-close { background: rgba(255,255,255,.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .audit-modal-body { padding: 22px 24px; }
  .audit-detail-row { display: flex; justify-content: space-between; padding: 9px 0; font-size: .9rem; border-bottom: 1px solid var(--c-border); }
  .audit-detail-lbl { color: var(--c-muted); font-weight: 600; }
  .audit-detail-val { font-family: 'JetBrains Mono', monospace; font-size: .87rem; word-break: break-word; }
  .audit-code-block { background: #f8f9ff; border-radius: 10px; padding: 12px; margin-top: 8px; font-family: 'JetBrains Mono', monospace; font-size: .8rem; overflow-x: auto; border: 1px solid var(--c-border); }

  .audit-toast { position: fixed; top: 24px; right: 24px; z-index: 9999; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: .88rem; box-shadow: var(--shadow-lg); animation: slideLeft .22s ease; display: flex; align-items: center; gap: 10px; font-family: 'Be Vietnam Pro', sans-serif; }
  @keyframes slideLeft { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:none; } }
  .toast-ok  { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
  .toast-err { background: #fff1f2; border: 1px solid #fda4af; color: #9f1239; }

  .audit-spin { display: inline-block; width: 16px; height: 16px; border: 2.5px solid rgba(79,70,229,.2); border-top-color: #4f46e5; border-radius: 50%; animation: spin .6s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .audit-loading { padding: 50px; text-align: center; color: var(--c-subtle); }

  .audit-pagination { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
  .audit-pag-btn { padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--c-border); background: white; cursor: pointer; font-size: .85rem; font-weight: 600; transition: all .2s; }
  .audit-pag-btn:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); background: #f8f9ff; }
  .audit-pag-btn:disabled { opacity: .55; cursor: not-allowed; }
  .audit-pag-info { text-align: center; font-size: .85rem; color: var(--c-muted); }

  @media (max-width: 768px) {
    .audit-filter-group { grid-template-columns: repeat(2, 1fr); }
    .audit-stats { grid-template-columns: repeat(2, 1fr); }
  }
`;

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`audit-toast ${toast.ok ? 'toast-ok' : 'toast-err'}`}>
      <span>{toast.ok ? '✅' : '❌'}</span> {toast.msg}
    </div>
  );
}

function DetailModal({ log, onClose }) {
  if (!log) return null;

  const getActionLabel = (action) => {
    const labels = {
      'CREATE_INVOICE': 'Tạo hóa đơn',
      'PAY_INVOICE': 'Thanh toán hóa đơn',
      'DELETE_INVOICE': 'Xóa hóa đơn',
      'CREATE_ROOM': 'Tạo phòng',
      'UPDATE_ROOM': 'Cập nhật phòng',
      'DELETE_ROOM': 'Xóa phòng',
      'CREATE_CONTRACT': 'Tạo hợp đồng',
      'UPDATE_CONTRACT': 'Cập nhật hợp đồng',
      'DELETE_CONTRACT': 'Xóa hợp đồng',
      'CREATE_METER_READING': 'Tạo chỉ số đồng hồ',
      'UPDATE_METER_READING': 'Cập nhật chỉ số đồng hồ'
    };
    return labels[action] || action;
  };

  const getEntityIcon = (type) => {
    const icons = {
      'invoice': '🧾',
      'room': '🏠',
      'contract': '📋',
      'meter_reading': '📊',
      'payment': '💳'
    };
    return icons[type] || '📌';
  };

  return (
    <div className="audit-modal-bg" onClick={onClose}>
      <div className="audit-modal" onClick={e => e.stopPropagation()}>
        <div className="audit-modal-head">
          <div>
            <div style={{ fontSize: '.78rem', opacity: .75, marginBottom: 4 }}>NHẬT KÝ #{log.id}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {getEntityIcon(log.entity_type)} {getActionLabel(log.action)}
            </div>
          </div>
          <button className="audit-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="audit-modal-body">
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">👤 Người dùng</span>
            <span className="audit-detail-val">{log.user_name || log.user_id}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">📧 Email</span>
            <span className="audit-detail-val">{log.user_email || '—'}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">🎯 Loại thực thể</span>
            <span className="audit-detail-val">{log.entity_type}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">🔑 ID thực thể</span>
            <span className="audit-detail-val">{log.entity_id || '—'}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">📝 Mô tả</span>
            <span className="audit-detail-val">{log.description || '—'}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">✅ Trạng thái</span>
            <span style={{ 
              display: 'inline-block', 
              padding: '4px 10px', 
              borderRadius: '20px',
              fontSize: '.74rem',
              fontWeight: 700,
              background: log.status === 'success' ? '#d1fae5' : '#fee2e2',
              color: log.status === 'success' ? '#065f46' : '#991b1b'
            }}>
              {log.status === 'success' ? '✓ Thành công' : '✗ Thất bại'}
            </span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">🕐 Thời gian</span>
            <span className="audit-detail-val">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
          </div>
          
          {log.old_values && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>GIÁ TRỊ CŨ</div>
              <div className="audit-code-block">{JSON.stringify(log.old_values, null, 2)}</div>
            </div>
          )}

          {log.new_values && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>GIÁ TRỊ MỚI</div>
              <div className="audit-code-block">{JSON.stringify(log.new_values, null, 2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
    total: 0
  });

  const [actionOptions, setActionOptions] = useState([]);
  const [entityTypeOptions, setEntityTypeOptions] = useState([]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFilterOptions = async () => {
    try {
      const [actionsRes, entityRes] = await Promise.all([
        api.get('/audit-logs/filters/actions'),
        api.get('/audit-logs/filters/entity-types')
      ]);
      setActionOptions(actionsRes.data?.data || []);
      setEntityTypeOptions(entityRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', pagination.limit);
      params.append('offset', pagination.offset);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data?.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0
      }));
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      showToast('Không thể tải nhật ký. Vui lòng thử lại.', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, offset: 0 }));
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.offset, pagination.limit]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({ action: '', entityType: '', startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const getActionBadge = (action) => {
    let badgeClass = 'badge-create';
    if (action.includes('DELETE')) badgeClass = 'badge-delete';
    else if (action.includes('UPDATE')) badgeClass = 'badge-update';
    else if (action.includes('PAY')) badgeClass = 'badge-pay';
    return badgeClass;
  };

  const getActionLabel = (action) => {
    const labels = {
      'CREATE_INVOICE': '💾 Tạo hóa đơn',
      'PAY_INVOICE': '💳 Thanh toán hóa đơn',
      'DELETE_INVOICE': '🗑️ Xóa hóa đơn',
      'CREATE_ROOM': '🏗️ Tạo phòng',
      'UPDATE_ROOM': '✏️ Cập nhật phòng',
      'DELETE_ROOM': '🗑️ Xóa phòng',
      'CREATE_CONTRACT': '📝 Tạo hợp đồng',
      'UPDATE_CONTRACT': '✏️ Cập nhật hợp đồng',
      'DELETE_CONTRACT': '🗑️ Xóa hợp đồng',
      'CREATE_METER_READING': '📊 Tạo chỉ số',
      'UPDATE_METER_READING': '✏️ Cập nhật chỉ số'
    };
    return labels[action] || action;
  };

  return (
    <div className="audit-root" style={{ padding: '28px', background: 'var(--c-bg)', minHeight: '100vh' }}>
      <style>{STYLES}</style>
      
      <div className="audit-header">
        <h2>📊 Nhật ký kiểm tra hệ thống</h2>
        <p>Theo dõi lịch sử hoạt động và thay đổi dữ liệu trong hệ thống</p>
      </div>

      <div className="audit-stats">
        <div className="audit-stat">
          <div className="audit-stat-icon" style={{ background: '#c7d2fe', color: '#4f46e5' }}>📋</div>
          <div>
            <div className="audit-stat-val">{pagination.total}</div>
            <div className="audit-stat-lbl">Tổng cộng</div>
          </div>
        </div>
        <div className="audit-stat">
          <div className="audit-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>✓</div>
          <div>
            <div className="audit-stat-val">{logs.filter(l => l.status === 'success').length}</div>
            <div className="audit-stat-lbl">Thành công</div>
          </div>
        </div>
        <div className="audit-stat">
          <div className="audit-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>✗</div>
          <div>
            <div className="audit-stat-val">{logs.filter(l => l.status === 'failed').length}</div>
            <div className="audit-stat-lbl">Thất bại</div>
          </div>
        </div>
        <div className="audit-stat">
          <div className="audit-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>👤</div>
          <div>
            <div className="audit-stat-val">{new Set(logs.map(l => l.user_id)).size}</div>
            <div className="audit-stat-lbl">Người dùng</div>
          </div>
        </div>
      </div>

      <div className="audit-panel">
        <div className="audit-panel-head">
          🔍 Bộ lọc và tìm kiếm
        </div>
        <div className="audit-panel-body">
          <div className="audit-filter-group">
            <div className="audit-field">
              <label className="audit-label">Loại hành động</label>
              <select
                className="audit-select"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">Tất cả hành động</option>
                {actionOptions.map(action => (
                  <option key={action} value={action}>{getActionLabel(action)}</option>
                ))}
              </select>
            </div>

            <div className="audit-field">
              <label className="audit-label">Loại thực thể</label>
              <select
                className="audit-select"
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
              >
                <option value="">Tất cả loại</option>
                {entityTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="audit-field">
              <label className="audit-label">Từ ngày</label>
              <input
                type="date"
                className="audit-input"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="audit-field">
              <label className="audit-label">Đến ngày</label>
              <input
                type="date"
                className="audit-input"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="audit-btn-group">
            <button className="audit-btn audit-btn-primary" onClick={fetchLogs} disabled={loading}>
              {loading ? <><span className="audit-spin" />Đang tải...</> : <>🔍 Tìm kiếm</>}
            </button>
            <button className="audit-btn audit-btn-secondary" onClick={handleReset}>↻ Đặt lại</button>
          </div>
        </div>
      </div>

      <div className="audit-panel" style={{ marginTop: 24 }}>
        <div className="audit-panel-head">
          📊 Lịch sử hoạt động
        </div>
        <div className="audit-panel-body">
          {loading ? (
            <div className="audit-loading">
              <span className="audit-spin" style={{ display: 'inline-block', marginRight: 8 }} />
              Đang tải nhật ký...
            </div>
          ) : logs.length === 0 ? (
            <div className="audit-empty">
              <div className="audit-empty-icon">📭</div>
              <p>Không tìm thấy nhật ký nào</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th className="audit-th">Hành động</th>
                      <th className="audit-th">Thực thể</th>
                      <th className="audit-th">Người dùng</th>
                      <th className="audit-th">Mô tả</th>
                      <th className="audit-th">Trạng thái</th>
                      <th className="audit-th">Thời gian</th>
                      <th className="audit-th">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="audit-tr">
                        <td className="audit-td">
                          <span className={`audit-badge ${getActionBadge(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="audit-td">{log.entity_type}</td>
                        <td className="audit-td">{log.user_name || `#${log.user_id}`}</td>
                        <td className="audit-td" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.description || '—'}
                        </td>
                        <td className="audit-td">
                          <span className={`audit-badge ${log.status === 'success' ? 'badge-success' : 'badge-failed'}`}>
                            {log.status === 'success' ? '✓ Thành công' : '✗ Thất bại'}
                          </span>
                        </td>
                        <td className="audit-td" style={{ fontSize: '.8rem' }}>
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="audit-td">
                          <button 
                            className="audit-btn audit-btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '.75rem' }}
                            onClick={() => setSelectedLog(log)}
                          >
                            👁️ Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="audit-pag-info" style={{ marginTop: 14 }}>
                Hiển thị {logs.length} trên {pagination.total} bản ghi
                (Trang {Math.floor(pagination.offset / pagination.limit) + 1})
              </div>

              <div className="audit-pagination">
                <button
                  className="audit-pag-btn"
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0}
                >
                  ← Trước
                </button>
                <button
                  className="audit-pag-btn"
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                >
                  Sau →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      <Toast toast={toast} />
    </div>
  );
}
