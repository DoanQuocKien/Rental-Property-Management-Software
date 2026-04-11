import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import các trang xác thực
import Login from './pages/Login';
import Register from './pages/Register';

// Import các trang chức năng cho Chủ trọ
import LandlordDashboard from './pages/LandlordDashboard'; // Trang Quản lý phòng
import Overview from './pages/Overview'; // Bạn tạo thêm file Overview.jsx nhé
import Tenants from './pages/Tenants';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings'; // Bạn tạo thêm file Settings.jsx nhé

// Import trang cho Người thuê
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantInvoices from './pages/tenant/TenantInvoices';
import TenantContract from './pages/tenant/TenantContract';
import TenantMaintenance from './pages/tenant/TenantMaintenance';
import TenantProfile from './pages/tenant/TenantProfile';

// Thành phần hỗ trợ
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* 1. XÁC THỰC */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'landlord' ? '/landlord' : '/tenant'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'landlord' ? '/landlord' : '/tenant'} replace /> : <Register />} />

      {/* 2. TUYẾN ĐƯỜNG CHỦ TRỌ (Tất cả dùng chung MainLayout) */}

      {/* Trang Tổng Quan - Hiện biểu đồ, doanh thu */}
      <Route path="/landlord" element={
        <ProtectedRoute role="landlord">
          <MainLayout title="Tổng quan hệ thống"><Overview /></MainLayout>
        </ProtectedRoute>
      } />

      {/* Trang Quản Lý Phòng - Nơi chứa logic Add/Edit/Delete của bạn */}
      <Route path="/rooms" element={
        <ProtectedRoute role="landlord">
          <MainLayout title="Quản lý phòng trọ"><LandlordDashboard /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/tenants" element={
        <ProtectedRoute role="landlord">
          <MainLayout title="Quản lý khách thuê"><Tenants /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/invoices" element={
        <ProtectedRoute role="landlord">
          <MainLayout title="Quản lý hóa đơn"><Invoices /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute role="landlord">
          <MainLayout title="Cài đặt hệ thống"><Settings /></MainLayout>
        </ProtectedRoute>
      } />

      {/* 3. TUYẾN ĐƯỜNG NGƯỜI THUÊ */}
      <Route path="/tenant" element={
        <ProtectedRoute role="tenant">
          <TenantDashboard />
        </ProtectedRoute>
      } />
      <Route path="/tenant/invoices" element={
        <ProtectedRoute role="tenant">
          <TenantInvoices />
        </ProtectedRoute>
      } />
      <Route path="/tenant/contract" element={
        <ProtectedRoute role="tenant">
          <TenantContract />
        </ProtectedRoute>
      } />
      <Route path="/tenant/maintenance" element={
        <ProtectedRoute role="tenant">
          <TenantMaintenance />
        </ProtectedRoute>
      } />
      <Route path="/tenant/profile" element={
        <ProtectedRoute role="tenant">
          <TenantProfile />
        </ProtectedRoute>
      } />

      {/* 4. ĐIỀU HƯỚNG MẶC ĐỊNH */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;