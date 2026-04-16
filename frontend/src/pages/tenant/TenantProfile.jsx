import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function TenantProfile() {
  const { user } = useAuth();
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

  // Theme màu Xanh lá cho Tenant
  const tenantColor = '#2d6a4f';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tenants/profile');
        setProfile(res.data.user);
        setForm(res.data.user);
      } catch {
        setError('Không thể tải hồ sơ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/tenants/profile', form);
      setProfile(form);
      setSuccess('Cập nhật thông tin thành công! ✨');
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
    setPwLoading(true);
    setPwError('');
    try {
      await api.put('/auth/change-password', pwForm);
      setPwSuccess('Đổi mật khẩu thành công! 🔒');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  const inputStyle = (disabled) => ({
    width: '100%', padding: '10px 12px', border: `1px solid ${disabled ? '#f0f2f5' : '#e2e8f0'}`,
    borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: disabled ? '#f8fafc' : 'white',
    color: disabled ? '#888' : '#333'
  });

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Đang tải hồ sơ...</div>;

  return (
    <div className="profile-container">
      {/* 1. Tiêu đề */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748' }}>Hồ sơ cá nhân</h2>
        <p style={{ color: '#718096' }}>Quản lý thông tin và bảo mật tài khoản</p>
      </div>

      {(success || pwSuccess) && (
        <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', color: '#2d6a4f', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          {success || pwSuccess}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px', alignItems: 'start' }}>

        {/* CỘT TRÁI: THÔNG TIN TÓM TẮT */}
        <div className="content-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: '100px', height: '100px', background: tenantColor, color: 'white',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 'bold', margin: '0 auto 15px'
          }}>
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ margin: '0' }}>{profile?.name}</h3>
          <p style={{ color: tenantColor, fontWeight: '600', fontSize: '0.85rem' }}>NGƯỜI THUÊ TRỌ</p>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>{profile?.email}</p>

          <button
            onClick={() => { setEditMode(!editMode); setForm(profile); }}
            style={{
              marginTop: '20px', width: '100%', padding: '10px', borderRadius: '8px',
              border: `1px solid ${tenantColor}`, background: editMode ? 'white' : tenantColor,
              color: editMode ? tenantColor : 'white', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            {editMode ? 'Hủy chỉnh sửa' : '✏️ Chỉnh sửa hồ sơ'}
          </button>
        </div>

        {/* CỘT PHẢI: FORM CHI TIẾT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Form thông tin */}
          <div className="content-card">
            <h4 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>👤 Thông tin cơ bản</h4>
            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666' }}>Họ và tên</label>
                <input style={inputStyle(!editMode)} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} disabled={!editMode} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666' }}>Số điện thoại</label>
                <input style={inputStyle(!editMode)} value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} disabled={!editMode} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666' }}>Địa chỉ thường trú</label>
                <input style={inputStyle(!editMode)} value={form.permanent_address || ''} onChange={e => setForm({...form, permanent_address: e.target.value})} disabled={!editMode} />
              </div>

              {editMode && (
                <button type="submit" disabled={saving} style={{ gridColumn: 'span 2', background: tenantColor, color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </form>
          </div>

          {/* Form mật khẩu */}
          <div className="content-card">
            <h4 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🔒 Bảo mật tài khoản</h4>
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="password" placeholder="Mật khẩu hiện tại" style={inputStyle(false)} value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} required />
                <input type="password" placeholder="Mật khẩu mới" style={inputStyle(false)} value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} required />
                <input type="password" placeholder="Xác nhận mật khẩu mới" style={inputStyle(false)} value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})} required />
                {pwError && <p style={{ color: 'red', fontSize: '0.8rem' }}>{pwError}</p>}
                <button type="submit" disabled={pwLoading} style={{ background: '#4a5568', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                  {pwLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}