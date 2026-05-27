import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const inputStyle = (disabled = false) => ({
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${disabled ? '#f0f2f5' : '#ddd'}`,
  borderRadius: '8px',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
  background: disabled ? '#f8fafc' : 'white',
  color: disabled ? '#888' : '#333',
  transition: 'border-color 0.2s',
});

// ── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab({ form, onChange }) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(false);
    setSuccess('Đã lưu thông tin tài khoản thành công!');
    setTimeout(() => setSuccess(''), 3000);
    setError('');
    setSuccess('');
    try {
      // Update user profile (works for both landlords and tenants)
      await api.put('/tenants/profile', {
        name: form.name,
        phone: form.phone,
        citizen_id: form.citizen_id,
        permanent_address: form.permanent_address,
      });
      // Save to localStorage for persistence when navigating to other tabs/sections
      localStorage.setItem('accountSettings', JSON.stringify({
        name: form.name,
        phone: form.phone,
        citizen_id: form.citizen_id,
        permanent_address: form.permanent_address,
      }));
      setSuccess('Đã lưu thông tin thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#333', marginBottom: '20px' }}>
        Thông tin tài khoản
      </h3>

      {success && (
        <div style={{ background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#276749', fontSize: '0.9rem' }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#742a2a', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
          <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.8rem', flexShrink: 0 }}>
            {form.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#333' }}>{form.name}</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>{form.email}</div>
            <div style={{ color: '#667eea', fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>Chủ trọ</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Họ và tên *', key: 'name', type: 'text', required: true },
            { label: 'Email', key: 'email', type: 'email', disabled: true },
            { label: 'Số điện thoại', key: 'phone', type: 'tel', placeholder: '0912 345 678' },
            { label: 'Số CCCD/CMND', key: 'citizen_id', type: 'text', placeholder: '012345678901' },
            { label: 'Địa chỉ thường trú', key: 'permanent_address', type: 'text', placeholder: '123 Đường ABC, Q.1, TP.HCM' },
          ].map((field) => (
            <div key={field.key} style={field.key === 'permanent_address' ? { gridColumn: 'span 2' } : {}}>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={form[field.key] || ''}
                onChange={(e) => onChange('account', field.key, e.target.value)}
                disabled={field.disabled}
                required={field.required}
                placeholder={field.placeholder || ''}
                style={inputStyle(field.disabled)}
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ marginTop: '20px', padding: '11px 28px', border: 'none', borderRadius: '8px', background: saving ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}

// ── Property Tab ──────────────────────────────────────────────────────────────
function PropertyTab({ form, onChange }) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Lưu vào localStorage vì backend chưa có endpoint cho property settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate required fields
    if (!form.property_name?.trim()) {
      setError('Tên khu trọ là bắt buộc');
      setSaving(false);
      return;
    }

    if (!form.address?.trim()) {
      setError('Địa chỉ là bắt buộc');
      setSaving(false);
      return;
    }

    try {
      localStorage.setItem('propertySettings', JSON.stringify(form));
      await new Promise((r) => setTimeout(r, 400));
      setSuccess('Đã lưu thông tin khu trọ thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: form[key] || '',
    onChange: (e) => onChange('property', key, e.target.value),
  });

  return (
    <div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#333', marginBottom: '20px' }}>
        Thông tin khu trọ
      </h3>

      {success && (
        <div style={{ background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#276749', fontSize: '0.9rem' }}>
          ✅ {success}
        </div>
      )}

      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#742a2a', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Thông tin cơ bản
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Tên khu trọ *</label>
              <input type="text" {...field('property_name')} placeholder="Ví dụ: Khu trọ Nguyễn Huệ" style={inputStyle()} required />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Địa chỉ *</label>
              <input type="text" {...field('address')} placeholder="123 Đường ABC, Quận 1, TP.HCM" style={inputStyle()} required />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Số tầng</label>
              <input type="number" {...field('total_floors')} placeholder="3" min="1" style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Tổng số phòng</label>
              <input type="number" {...field('total_rooms')} placeholder="20" min="1" style={inputStyle()} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tiện ích & dịch vụ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Thông tin WiFi</label>
              <input type="text" {...field('wifi_info')} placeholder="Tên mạng / Mật khẩu" style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Chỗ để xe</label>
              <select {...field('parking')} style={inputStyle()}>
                <option value="">Chọn loại...</option>
                <option value="free">Miễn phí</option>
                <option value="paid">Có tính phí</option>
                <option value="none">Không có</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quy định & hợp đồng mặc định
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Đặt cọc mặc định (số tháng)</label>
              <select {...field('deposit_months')} style={inputStyle()}>
                <option value="1">1 tháng</option>
                <option value="2">2 tháng</option>
                <option value="3">3 tháng</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Thời gian báo trước khi trả phòng</label>
              <select {...field('notice_days')} style={inputStyle()}>
                <option value="15">15 ngày</option>
                <option value="30">30 ngày</option>
                <option value="45">45 ngày</option>
                <option value="60">60 ngày</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Nội quy khu trọ</label>
            <textarea
              {...field('rules')}
              rows={5}
              placeholder={'Ví dụ:\n- Không tiếp khách quá 22:00\n- Không nuôi thú cưng\n- Không gây ồn ào sau 23:00\n- Giữ vệ sinh khu vực chung'}
              style={{ ...inputStyle(), resize: 'vertical' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: '11px 28px', border: 'none', borderRadius: '8px', background: saving ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Đang lưu...' : '💾 Lưu thông tin khu trọ'}
        </button>
      </form>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab({ form, onChange }) {
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    setPwLoading(true);
    try {
      // Gọi đúng endpoint đổi mật khẩu
      await api.put('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
        confirm_password: pwForm.confirm_password,
      });
      setPwSuccess('Đổi mật khẩu thành công! 🔒');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(''), 4000);
    } catch (err) {
      setPwError(err.response?.data?.error || err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  const Toggle = ({ value, onToggle }) => (
    <div
      onClick={onToggle}
      style={{ width: '44px', height: '24px', borderRadius: '12px', background: value ? '#667eea' : '#ddd', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
    >
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );

  return (
    <div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#333', marginBottom: '20px' }}>
        Bảo mật tài khoản
      </h3>

      {/* Change password */}
      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Đổi mật khẩu
        </div>
        {pwSuccess && (
          <div style={{ background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#276749', fontSize: '0.9rem' }}>
            ✅ {pwSuccess}
          </div>
        )}
        {pwError && (
          <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#742a2a', fontSize: '0.9rem' }}>
            ⚠️ {pwError}
          </div>
        )}
        <form onSubmit={handleChangePassword}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
            {[
              { label: 'Mật khẩu hiện tại', key: 'current_password', placeholder: '••••••••' },
              { label: 'Mật khẩu mới (tối thiểu 8 ký tự, gồm chữ và số)', key: 'new_password', placeholder: '••••••••' },
              { label: 'Xác nhận mật khẩu mới', key: 'confirm_password', placeholder: '••••••••' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>
                  {f.label}
                </label>
                <input
                  type="password"
                  value={pwForm[f.key]}
                  onChange={(e) => setPwForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  required
                  placeholder={f.placeholder}
                  style={inputStyle()}
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            style={{ marginTop: '16px', padding: '10px 24px', border: 'none', borderRadius: '8px', background: pwLoading ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', cursor: pwLoading ? 'not-allowed' : 'pointer' }}
          >
            {pwLoading ? 'Đang xử lý...' : '🔑 Đổi mật khẩu'}
          </button>
        </form>
      </div>

      {/* Security settings */}
      <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px' }}>
        <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Cài đặt bảo mật
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Xác thực hai yếu tố (2FA)</div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '3px' }}>Tăng cường bảo mật bằng OTP qua điện thoại</div>
          </div>
          <Toggle
            value={form.twoFactor}
            onToggle={() => onChange('security', 'twoFactor', !form.twoFactor)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Thông báo đăng nhập mới</div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '3px' }}>Nhận thông báo khi có đăng nhập từ thiết bị mới</div>
          </div>
          <Toggle
            value={form.loginNotif}
            onToggle={() => onChange('security', 'loginNotif', !form.loginNotif)}
          />
        </div>

        {form.twoFactor && (
          <div style={{ background: '#f0f4ff', borderRadius: '8px', padding: '12px 14px', marginTop: '10px', color: '#667eea', fontSize: '0.85rem' }}>
            📱 Xác thực hai yếu tố đã bật. Vui lòng liên kết ứng dụng xác thực (Google Authenticator) để hoàn tất thiết lập.
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ background: '#fff5f5', borderRadius: '10px', padding: '20px', marginTop: '20px' }}>
        <div style={{ fontWeight: '600', color: '#e53e3e', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Vùng nguy hiểm
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>Đăng xuất tất cả thiết bị</div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '3px' }}>Kết thúc tất cả phiên đăng nhập khác</div>
          </div>
          <button
            onClick={() => alert('Đã đăng xuất tất cả thiết bị khác!')}
            style={{ padding: '8px 16px', background: 'transparent', border: '1.5px solid #e53e3e', borderRadius: '8px', color: '#e53e3e', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Đăng xuất hết
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Service Tab (TAB MỚI CHO SPRINT 5) ────────────────────────────────────────
function ServiceTab({ form, onChange, onBulkUpdate }) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gọi API để lấy cấu hình giá hiện tại khi mở tab
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/landlord/settings');
        if (res.data?.data) {
          onBulkUpdate('service', res.data.data);
        }
      } catch (err) {
        console.error('Không tải được cấu hình dịch vụ:', err.response?.data?.message || err.message);
        setError('Không thể tải cấu hình. Sử dụng giá trị mặc định.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [onBulkUpdate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/landlord/settings', form);
      setSuccess('Đã lưu cấu hình dịch vụ thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Lỗi khi lưu cấu hình. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: form[key] || '',
    onChange: (e) => onChange('service', key, e.target.value),
  });

  if (loading) return <div style={{ padding: '20px', color: '#888' }}>Đang tải cấu hình dịch vụ...</div>;

  return (
    <div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#333', marginBottom: '20px' }}>
        Cấu hình Dịch vụ & Bảng giá
      </h3>

      {success && (
        <div style={{ background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#276749', fontSize: '0.9rem' }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#742a2a', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dịch vụ bắt buộc
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Giá Điện (VNĐ / kWh) *</label>
              <input type="number" required placeholder="VD: 3500" {...field('electricity_price')} style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Giá Nước (VNĐ / Khối) *</label>
              <input type="number" required placeholder="VD: 20000" {...field('water_price')} style={inputStyle()} />
            </div>
          </div>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', color: '#667eea', fontSize: '0.85rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dịch vụ phụ trợ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Wifi (VNĐ / Phòng)</label>
              <input type="number" placeholder="VD: 100000" {...field('wifi_price')} style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Rác (VNĐ / Phòng)</label>
              <input type="number" placeholder="VD: 30000" {...field('garbage_price')} style={inputStyle()} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>Phí Giữ Xe (VNĐ / Xe)</label>
              <input type="number" placeholder="VD: 120000" {...field('parking_price')} style={inputStyle()} />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: '11px 28px', border: 'none', borderRadius: '8px', background: saving ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Đang lưu...' : '💾 Lưu cấu hình dịch vụ'}
        </button>
      </form>
    </div>
  );
}

// ── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  // Load saved property settings từ localStorage
  const savedProperty = (() => {
    try { return JSON.parse(localStorage.getItem('propertySettings') || '{}'); } catch { return {}; }
  })();

  // Load saved account settings từ localStorage to persist after navigation
  const savedAccount = (() => {
    try { return JSON.parse(localStorage.getItem('accountSettings') || '{}'); } catch { return {}; }
  })();

  const [accountForm, setAccountForm] = useState({
    name: savedAccount.name || user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: savedAccount.phone || user?.phoneNumber || '',
    citizen_id: savedAccount.citizen_id || user?.citizenID || '',
    permanent_address: savedAccount.permanent_address || user?.permanentAddress || '',
  });

  const [propertyForm, setPropertyForm] = useState({
    property_name: savedProperty.property_name || '',
    address: savedProperty.address || '',
    total_floors: savedProperty.total_floors || '',
    total_rooms: savedProperty.total_rooms || '',
    rules: savedProperty.rules || '',
    wifi_info: savedProperty.wifi_info || '',
    parking: savedProperty.parking || '',
    deposit_months: savedProperty.deposit_months || '2',
    notice_days: savedProperty.notice_days || '30',
  });


  // State mới cho tab Cấu hình dịch vụ (Sprint 5)
  const [serviceForm, setServiceForm] = useState({
    electricity_price: '',
    water_price: '',
    wifi_price: '',
    garbage_price: '',
    parking_price: ''
  });

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    twoFactor: false,
    loginNotif: false,
  });

  // Generic updater: onChange('account' | 'property' | 'security' | 'service', key, value)
  const handleChange = (section, key, value) => {
    if (section === 'account') setAccountForm((f) => ({ ...f, [key]: value }));
    else if (section === 'property') setPropertyForm((f) => ({ ...f, [key]: value }));
    else if (section === 'security') setSecurityForm((f) => ({ ...f, [key]: value }));
    else if (section === 'service') setServiceForm((f) => ({ ...f, [key]: value }));
  };

  // Hàm update toàn bộ data (dùng khi load API lần đầu)
  // Use useCallback to prevent infinite loops in ServiceTab useEffect
  const handleBulkUpdate = useCallback((section, data) => {
    if (section === 'service') setServiceForm(data);
  }, []);

  const tabs = [
    { id: 'account', icon: '👤', label: 'Tài khoản' },
    { id: 'property', icon: '🏠', label: 'Thông tin khu trọ' },
    { id: 'service', icon: '⚡', label: 'Cấu hình Dịch vụ' }, // Tab mới được thêm vào đây
    { id: 'security', icon: '🔒', label: 'Bảo mật' },
  ];

  return (
    <div className="content-card" style={{ display: 'flex', padding: 0, minHeight: '500px' }}>
      {/* Sidebar tabs */}
      <div style={{ width: '220px', borderRight: '1px solid #f0f2f5', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 16px 16px', fontSize: '0.75rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Cài đặt
        </div>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '12px 16px', border: 'none',
              background: activeTab === tab.id ? '#f0f4ff' : 'transparent',
              color: activeTab === tab.id ? '#667eea' : '#555',
              fontWeight: activeTab === tab.id ? '700' : '500',
              fontSize: '0.9rem', cursor: 'pointer',
              borderLeft: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
              textAlign: 'left', transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '16px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
          <AccountTab form={accountForm} onChange={handleChange} />
        </div>
        <div style={{ display: activeTab === 'property' ? 'block' : 'none' }}>
          <PropertyTab form={propertyForm} onChange={handleChange} />
        </div>
        <div style={{ display: activeTab === 'service' ? 'block' : 'none' }}>
          <ServiceTab form={serviceForm} onChange={handleChange} onBulkUpdate={handleBulkUpdate} />
        </div>
        <div style={{ display: activeTab === 'security' ? 'block' : 'none' }}>
          <SecurityTab form={securityForm} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
}