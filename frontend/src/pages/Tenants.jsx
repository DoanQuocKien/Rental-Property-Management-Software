import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useSearch } from '../context/SearchContext';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const fmtMoney = (n) => (n != null ? Number(n).toLocaleString('vi-VN') + 'đ' : '—');
const daysLeft = (end) => Math.ceil((new Date(end) - new Date()) / 86400000);

const STATUS_BADGE = {
  active:     { bg: '#e6fffa', color: '#38b2ac', label: '✅ Đang thuê' },
  expired:    { bg: '#fff5f5', color: '#e53e3e', label: '❌ Hết hạn'  },
  terminated: { bg: '#f7fafc', color: '#718096', label: '🚫 Đã chấm dứt' },
};

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

// ── sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, accent }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: '22px 24px',
      display: 'flex', alignItems: 'center', gap: 18,
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${accent}`,
    }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a202c', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.82rem', color: '#718096', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function TenantRow({ tenant, onViewDetail, searchQuery }) {
  const name = tenant.fullName || tenant.name || '';
  const days = tenant.endDate ? daysLeft(tenant.endDate) : null;
  const badge = STATUS_BADGE[tenant.contractStatus] || STATUS_BADGE.active;
  const expiring = days !== null && days > 0 && days <= 30;

  return (
    <tr style={{ transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '1rem',
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.92rem' }}>
              <HighlightText text={name} query={searchQuery} />
            </div>
            <div style={{ color: '#a0aec0', fontSize: '0.78rem' }}>
              <HighlightText text={tenant.email} query={searchQuery} />
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px', color: '#4a5568', fontSize: '0.88rem' }}>
        {tenant.citizenID
          ? <HighlightText text={tenant.citizenID} query={searchQuery} />
          : <span style={{ color: '#cbd5e0' }}>Chưa cập nhật</span>}
      </td>
      <td style={{ padding: '14px 16px', color: '#4a5568', fontSize: '0.88rem' }}>
        {tenant.phoneNumber
          ? <HighlightText text={tenant.phoneNumber} query={searchQuery} />
          : <span style={{ color: '#cbd5e0' }}>—</span>}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          background: '#edf2ff', color: '#667eea',
          padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
        }}>
          🏠 <HighlightText text={tenant.roomName} query={searchQuery} />
        </span>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
          {badge.label}
        </span>
      </td>
      <td style={{ padding: '14px 16px', fontSize: '0.88rem' }}>
        {tenant.endDate ? (
          <span style={{ color: expiring ? '#e53e3e' : '#4a5568', fontWeight: expiring ? 700 : 400 }}>
            {fmtDate(tenant.endDate)}
            {expiring && (
              <span style={{ marginLeft: 6, background: '#fff5f5', color: '#e53e3e', padding: '2px 6px', borderRadius: 10, fontSize: '0.72rem' }}>
                {days} ngày
              </span>
            )}
          </span>
        ) : '—'}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.88rem' }}>{fmtMoney(tenant.rentalPrice)}</div>
        <div style={{ color: '#a0aec0', fontSize: '0.75rem' }}>/ tháng</div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <button onClick={() => onViewDetail(tenant)}
          style={{ background: 'none', border: '1.5px solid #667eea', color: '#667eea', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.target.style.background = '#667eea'; e.target.style.color = 'white'; }}
          onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#667eea'; }}>
          Chi tiết
        </button>
      </td>
    </tr>
  );
}

function DetailModal({ tenant, onClose, onTerminate }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  if (!tenant) return null;

  const name = tenant.fullName || tenant.name || '';

  const handleTerminate = async () => {
    setLoading(true);
    await onTerminate(tenant.contractID);
    setLoading(false);
    setConfirming(false);
  };

  const rows = [
    ['👤 Họ tên', name],
    ['📧 Email', tenant.email],
    ['📞 Điện thoại', tenant.phoneNumber || '—'],
    ['🪪 CCCD/CMND', tenant.citizenID || '—'],
    ['🏠 Phòng', tenant.roomName],
    ['💰 Giá thuê', fmtMoney(tenant.rentalPrice)],
    ['🔒 Tiền cọc', fmtMoney(tenant.deposit)],
    ['📅 Bắt đầu', fmtDate(tenant.startDate)],
    ['📅 Kết thúc', fmtDate(tenant.endDate)],
  ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '24px 28px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.4rem',
              }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{name}</div>
                <div style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: 2 }}>Khách thuê</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer',
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 0',
              borderBottom: '1px solid #f0f2f5', fontSize: '0.9rem',
            }}>
              <span style={{ color: '#718096' }}>{label}</span>
              <span style={{ fontWeight: 600, color: '#2d3748', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
            </div>
          ))}

          {tenant.contractStatus === 'active' && (
            <div style={{ marginTop: 20 }}>
              {!confirming ? (
                <button onClick={() => setConfirming(true)} style={{
                  width: '100%', padding: '11px', border: '1.5px solid #e53e3e',
                  background: 'transparent', color: '#e53e3e', borderRadius: 10,
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}
                  onMouseEnter={e => { e.target.style.background = '#fff5f5'; }}
                  onMouseLeave={e => { e.target.style.background = 'transparent'; }}>
                  🚫 Chấm dứt hợp đồng
                </button>
              ) : (
                <div style={{ background: '#fff5f5', borderRadius: 10, padding: 16, border: '1px solid #feb2b2' }}>
                  <p style={{ color: '#742a2a', fontSize: '0.88rem', marginBottom: 12, fontWeight: 600 }}>
                    ⚠️ Xác nhận chấm dứt hợp đồng? Phòng sẽ được chuyển về trạng thái trống.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setConfirming(false)} style={{
                      flex: 1, padding: '9px', border: '1px solid #ddd', background: 'white',
                      borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                    }}>Hủy</button>
                    <button onClick={handleTerminate} disabled={loading} style={{
                      flex: 1, padding: '9px', border: 'none', background: '#e53e3e',
                      color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                      opacity: loading ? 0.7 : 1,
                    }}>{loading ? 'Đang xử lý...' : 'Xác nhận'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function Tenants() {
  const { query } = useSearch();

  const [tenants, setTenants] = useState([]);
  const [allTenantAccounts, setAllTenantAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [activeRes, allRes] = await Promise.all([
        api.get('/landlord/tenants'),
        api.get('/landlord/tenants/all'),
      ]);

      setTenants(activeRes.data.data || []);
      setAllTenantAccounts(allRes.data.data || []);
    } catch {
      setError('Không thể tải danh sách khách thuê. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const pendingTenantAccounts = allTenantAccounts.filter((tenant) => String(tenant.status || '').toLowerCase() === 'pending');

  const handleApproveTenant = async (tenantId) => {
    setApprovingId(tenantId);
    try {
      await api.put(`/tenants/${tenantId}/status`, { status: 'active' });
      showToast('✅ Đã phê duyệt khách thuê thành công!');
      fetchTenants();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || err.response?.data?.message || 'Không thể phê duyệt')); 
    } finally {
      setApprovingId(null);
    }
  };

  const handleTerminate = async (contractId) => {
    try {
      await api.put(`/contracts/${contractId}/terminate`);
      showToast('✅ Đã chấm dứt hợp đồng thành công!');
      setSelected(null);
      fetchTenants();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.message || 'Thao tác thất bại'));
    }
  };

  // Filter theo search query từ Navbar
  const filtered = tenants.filter(t => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const name = t.fullName || t.name || '';
    return [name, t.email, t.citizenID, t.phoneNumber, t.roomName]
      .some(v => v?.toLowerCase().includes(q));
  });

  const expiringSoon = tenants.filter(t => {
    const d = t.endDate ? daysLeft(t.endDate) : null;
    return d !== null && d > 0 && d <= 30;
  }).length;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.startsWith('✅') ? '#e6fffa' : '#fff5f5',
          border: `1px solid ${toast.startsWith('✅') ? '#81e6d9' : '#feb2b2'}`,
          color: toast.startsWith('✅') ? '#276749' : '#742a2a',
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          {toast}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" value={tenants.length} label="Tổng khách thuê" accent="#667eea" />
        <StatCard icon="✅" value={tenants.filter(t => t.contractStatus === 'active').length} label="Hợp đồng active" accent="#38b2ac" />
        <StatCard icon="⚠️" value={expiringSoon} label="Sắp hết hạn (≤30 ngày)" accent="#d69e2e" />
      </div>

      {pendingTenantAccounts.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2d3748' }}>⏳ Khách thuê chờ phê duyệt</div>
            <div style={{ fontSize: '0.82rem', color: '#a0aec0' }}>{pendingTenantAccounts.length} tài khoản</div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Họ tên', 'Email', 'CCCD/CMND', 'Điện thoại', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem',
                      fontWeight: 700, color: '#718096', textTransform: 'uppercase',
                      letterSpacing: '0.5px', borderBottom: '2px solid #f0f2f5',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingTenantAccounts.map((tenant) => (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2d3748' }}>{tenant.fullName || tenant.name || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', color: '#4a5568' }}>{tenant.email}</td>
                    <td style={{ padding: '14px 16px', color: '#4a5568' }}>{tenant.citizenID || 'Chưa cập nhật'}</td>
                    <td style={{ padding: '14px 16px', color: '#4a5568' }}>{tenant.phoneNumber || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#fffbeb', color: '#d69e2e', padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                        Chờ duyệt
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        type="button"
                        onClick={() => handleApproveTenant(tenant.id)}
                        disabled={approvingId === tenant.id}
                        style={{
                          background: approvingId === tenant.id ? '#a0aec0' : '#38b2ac',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 14px',
                          cursor: approvingId === tenant.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                        }}
                      >
                        {approvingId === tenant.id ? 'Đang duyệt...' : 'Phê duyệt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bảng khách thuê */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2d3748' }}>👥 Danh sách khách thuê</div>

          {/* Search indicator từ Navbar */}
          {query ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#f0f4ff', border: '1px solid #c3dafe',
              borderRadius: 20, padding: '6px 14px',
              fontSize: '0.82rem', color: '#667eea', fontWeight: 600,
            }}>
              🔍 &quot;{query}&quot;
              <span style={{ color: '#a0aec0', fontWeight: 400 }}>— {filtered.length} kết quả</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#a0aec0' }}>
              Dùng thanh tìm kiếm trên để lọc theo tên, email, CCCD, SĐT, phòng
            </div>
          )}
        </div>

        {error && (
          <div style={{ margin: 20, padding: '12px 16px', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 10, color: '#742a2a', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>👥</div>
            <p style={{ fontWeight: 600 }}>
              {query ? `Không tìm thấy khách thuê khớp với "${query}"` : 'Chưa có khách thuê nào'}
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: 6 }}>
              {!query && 'Tạo hợp đồng để thêm khách thuê vào hệ thống'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Khách thuê', 'CCCD/CMND', 'Điện thoại', 'Phòng', 'Trạng thái', 'Hết hạn HĐ', 'Giá thuê', 'Thao tác'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: '0.78rem',
                      fontWeight: 700, color: '#718096', textTransform: 'uppercase',
                      letterSpacing: '0.5px', borderBottom: '2px solid #f0f2f5',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <TenantRow
                    key={t.contractID || t.id}
                    tenant={t}
                    onViewDetail={setSelected}
                    searchQuery={query}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f2f5', color: '#a0aec0', fontSize: '0.82rem' }}>
            Hiển thị {filtered.length} / {tenants.length} khách thuê
          </div>
        )}
      </div>

      <DetailModal tenant={selected} onClose={() => setSelected(null)} onTerminate={handleTerminate} />
    </div>
  );
}
