import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPendingApproval(false);
    try {
      const res = await api.post('/auth/login', {
        ...form,
        email: form.email.trim(),
      });
      login(res.data.user, res.data.token, res.data.refreshToken);
      navigate(res.data.user.role === 'landlord' ? '/landlord' : '/tenant');
    } catch (err) {
      const message = err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.';
      const isPendingApproval = err.response?.status === 403 && /chờ.*phê duyệt|pending/i.test(message);

      setPendingApproval(isPendingApproval);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Rental Property Management</h1>
        <h2 className="auth-subtitle">Đăng nhập</h2>
        {error && <div className="error-message">{error}</div>}
        {pendingApproval && (
          <div style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#fffbeb',
            border: '1px solid #f6e05e',
            color: '#744210',
            fontSize: '0.9rem',
            lineHeight: 1.6,
          }}>
            Tài khoản của bạn đang chờ Chủ trọ phê duyệt. Hãy liên hệ chủ trọ để họ vào mục quản lý khách thuê và bấm <strong>Phê duyệt</strong>.
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Nhập email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-link">
          Chưa có tài khoản?{' '}
          <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}
