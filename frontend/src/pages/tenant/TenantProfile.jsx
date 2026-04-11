import { useState, useEffect } from 'react';
import api from '../api';
import TenantLayout from '../components/layout/TenantLayout';

export default function TenantProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tenants/profile');
        setProfile(res.data.user);
        setForm(res.data.user);
      } catch {
        setError('Không thể tải hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/tenants/profile', form);
      setProfile(form);
      setSuccess('Cập nhật thông tin thành công!');
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('Mật khẩu xác nhận không khớp'); return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự'); return;
    }
    setPwLoading(true);
    setPwError('');
    try {
      await api.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwSuccess('Đổi mật khẩu thành công!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  const inputStyle = (disabled) => ({
    width: '100%', padding: '10px 12px', border: `1px solid ${disabled ? '#f0f2f5' : '#ddd'}`,
    borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
    background: disabled ? '#f8fafc' : 'white', color: disabled ? '#888' : '#333',
    transition: 'border-color 0.2s'
  });

  return (
    <TenantLayout title="Hồ sơ cá nhân" subtitle="Quản lý thông tin cá nhân và tài khoản">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>Đang tải...</div>
      ) : (
        <>
          {success && (
            <div style={{ background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#276749' }}>
              ✅ {success}
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
            {/* Avatar card */}
            <div className="content-card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px', height: '80px', background: 'linear-gradient(135deg, #38b2ac, #319795)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '2rem', margin: '0 auto 16px'
              }}>
                {profile?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333' }}>{profile?.name}</div>
              <div style={{ color: '#38b2ac', fontSize: '0.85rem', fontWeight: '600', marginTop: '4px' }}>Người thuê trọ</div>
              <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '8px' }}>{profile?.email}</div>

              <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', color: '#888' }}>
                <div>Ngày tham gia</div>
                <div style={{ fontWeight: '600', color: '#555', marginTop: '4px' }}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : '—'}
                </div>
              </div>

              {!editMode ? (
                <button className="btn-primary" onClick={() => setEditMode(true)}
                  style={{ marginTop: '16px', padding: '10px 20px' }}>
                  ✏️ Chỉnh sửa
                </button>
              ) : (
                <button className="btn-secondary" onClick={() => { setEditMode(false); setForm(profile); }}
                  style={{ marginTop: '16px', width: '100%' }}>
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            {/* Profile form */}
            <div>
              <div className="content-card" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '0.95rem', fontWeight: '700' }}>
                  👤 Thông tin cá nhân
                </h3>
                <form onSubmit={handleSave}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { label: 'Họ và tên *', key: 'name', type: 'text', required: true },
                      { label: 'Số điện thoại', key: 'phone', type: 'tel' },
                      { label: 'Email', key: 'email', type: 'email', readOnly: true },
                      { label: 'Số CCCD/CMND', key: 'citizen_id', type: 'text' },
                      { label: 'Ngày sinh', key: 'date_of_birth', type: 'date' },
                      { label: 'Giới tính', key: 'gender', type: 'select', options: [['', 'Chọn giới tính'], ['male', 'Nam'], ['female', 'Nữ'], ['other', 'Khác']] },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>
                          {field.label}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            value={form[field.key] || ''}
                            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                            disabled={!editMode || field.readOnly}
                            style={inputStyle(!editMode || field.readOnly)}
                          >
                            {field.options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={form[field.key] || ''}
                            onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                            disabled={!editMode || field.readOnly}
                            required={field.required && editMode}
                            style={inputStyle(!editMode || field.readOnly)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Permanent address - full width */}
                  <div style={{ marginTop: '14px' }}>
                    <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>
                      Địa chỉ thường trú
                    </label>
                    <input
                      type="text"
                      value={form.permanent_address || ''}
                      onChange={e => setForm(f => ({ ...f, permanent_address: e.target.value }))}
                      disabled={!editMode}
                      placeholder="Nhập địa chỉ thường trú"
                      style={inputStyle(!editMode)}
                    />
                  </div>

                  {editMode && (
                    <button type="submit" className="btn-primary" disabled={saving}
                      style={{ marginTop: '20px', padding: '12px 30px', width: 'auto' }}>
                      {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                    </button>
                  )}
                </form>
              </div>

              {/* Change password */}
              <div className="content-card">
                <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '0.95rem', fontWeight: '700' }}>
                  🔒 Đổi mật khẩu
                </h3>
                {pwSuccess && (
                  <div style={{ background: '#e6fffa', border: '1px solid #81e6d9', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#276749', fontSize: '0.9rem' }}>
                    ✅ {pwSuccess}
                  </div>
                )}
                {pwError && <div className="error-message">{pwError}</div>}
                <form onSubmit={handleChangePassword}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Mật khẩu hiện tại', key: 'current_password' },
                      { label: 'Mật khẩu mới', key: 'new_password' },
                      { label: 'Xác nhận mật khẩu mới', key: 'confirm_password' },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ display: 'block', fontWeight: '600', color: '#555', marginBottom: '6px', fontSize: '0.85rem' }}>
                          {field.label}
                        </label>
                        <input
                          type="password"
                          value={pwForm[field.key]}
                          onChange={e => setPwForm(f => ({ ...f, [field.key]: e.target.value }))}
                          required
                          style={inputStyle(false)}
                          placeholder="••••••••"
                        />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="btn-secondary" disabled={pwLoading}
                    style={{ marginTop: '16px' }}>
                    {pwLoading ? 'Đang xử lý...' : '🔑 Đổi mật khẩu'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </TenantLayout>
  );
}
