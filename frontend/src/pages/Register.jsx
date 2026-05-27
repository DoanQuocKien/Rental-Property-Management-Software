import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'tenant' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/register', {
        ...form,
        name: form.fullName,
        email: form.email.trim(),
      });
      if (res.data.token && res.data.refreshToken) {
        login(res.data.user, res.data.token, res.data.refreshToken);
        navigate(res.data.user.role === 'landlord' ? '/landlord' : '/tenant');
        return;
      }

      setSuccess(res.data.message || 'Đăng ký thành công. Vui lòng chờ phê duyệt trước khi đăng nhập.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const serverMessage = err.response?.data?.error || err.response?.data?.message;
      const networkMessage = 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra VITE_API_URL/CORS trên môi trường deploy.';
      setError(serverMessage || networkMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Rental Property Management</h1>
        <h2 className="auth-subtitle">Đăng ký tài khoản</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
              required
            />
          </div>
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
              placeholder="Mật khẩu 8-72 ký tự, gồm chữ và số"
              required
              minLength={8}
              maxLength={72}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Loại tài khoản</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="tenant">Người thuê trọ</option>
              <option value="landlord">Chủ trọ</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-link">
          Đã có tài khoản?{' '}
          <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
