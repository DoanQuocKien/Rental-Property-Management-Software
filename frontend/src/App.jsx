import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- 1. IMPORT CÁC TRANG XÁC THỰC ---
import Login from './pages/Login';
import Register from './pages/Register';

// --- 2. IMPORT TRANG CHỦ TRỌ (LANDLORD) ---
import Overview from './pages/Overview';
import LandlordDashboard from './pages/LandlordDashboard';
import Tenants from './pages/Tenants';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Contract from './pages/Contract';
import ContractDetail from './pages/ContractDetail';

// --- 3. IMPORT TRANG NGƯỜI THUÊ (TENANT) ---
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantInvoices from './pages/tenant/TenantInvoices';
import TenantContract from './pages/tenant/TenantContract';
import TenantMaintenance from './pages/tenant/TenantMaintenance';
import TenantProfile from './pages/tenant/TenantProfile';

// --- 4. THÀNH PHẦN HỖ TRỢ ---
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* KHÔNG DÙNG LAYOUT: TRANG LOGIN/REGISTER */}
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'landlord' ? '/landlord' : '/tenant'} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={user.role === 'landlord' ? '/landlord' : '/tenant'} replace /> : <Register />}
      />

      {/* NHÓM 1: CÁC TUYẾN ĐƯỜNG CHO CHỦ TRỌ (LANDLORD) */}
      <Route path="/landlord" element={<ProtectedRoute role="landlord"><MainLayout title="Tổng quan hệ thống"><Overview /></MainLayout></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute role="landlord"><MainLayout title="Quản lý phòng trọ"><LandlordDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/tenants" element={<ProtectedRoute role="landlord"><MainLayout title="Quản lý khách thuê"><Tenants /></MainLayout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute role="landlord"><MainLayout title="Quản lý hóa đơn"><Invoices /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute role="landlord"><MainLayout title="Cài đặt hệ thống"><Settings /></MainLayout></ProtectedRoute>} />
      <Route path="/contract" element={<ProtectedRoute role="landlord"><MainLayout title="Hợp đồng điện tử"><Contract /></MainLayout></ProtectedRoute>} />
      <Route path="/contracts/:id" element={<ProtectedRoute><MainLayout title="Chi tiết hợp đồng"><ContractDetail /></MainLayout></ProtectedRoute>} />

      {/* NHÓM 2: CÁC TUYẾN ĐƯỜNG CHO NGƯỜI THUÊ (TENANT) */}
      {/* Lưu ý: Đã bọc MainLayout để người thuê cũng có Sidebar/Navbar chuyên nghiệp */}
      <Route path="/tenant" element={<ProtectedRoute role="tenant"><MainLayout title="Cổng thông tin khách thuê"><TenantDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/tenant/invoices" element={<ProtectedRoute role="tenant"><MainLayout title="Lịch sử hóa đơn"><TenantInvoices /></MainLayout></ProtectedRoute>} />
      <Route path="/tenant/contract" element={<ProtectedRoute role="tenant"><MainLayout title="Hợp đồng của tôi"><TenantContract /></MainLayout></ProtectedRoute>} />
      <Route path="/tenant/maintenance" element={<ProtectedRoute role="tenant"><MainLayout title="Báo cáo sự cố"><TenantMaintenance /></MainLayout></ProtectedRoute>} />
      <Route path="/tenant/profile" element={<ProtectedRoute role="tenant"><MainLayout title="Hồ sơ cá nhân"><TenantProfile /></MainLayout></ProtectedRoute>} />

      {/* ĐIỀU HƯỚNG MẶC ĐỊNH & CATCH-ALL */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;