import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const MockPayment = lazy(() => import('./pages/MockPayment'));

const Overview = lazy(() => import('./pages/Overview'));
const LandlordDashboard = lazy(() => import('./pages/LandlordDashboard'));
const Tenants = lazy(() => import('./pages/Tenants'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Settings = lazy(() => import('./pages/Settings'));
const Contract = lazy(() => import('./pages/Contract'));
const ContractDetail = lazy(() => import('./pages/ContractDetail'));
const ManagerMeterReading = lazy(() => import('./pages/ManagerMeterReading'));
const ManagerMaintenance = lazy(() => import('./pages/ManagerMaintenance'));
const TenantApproval = lazy(() => import('./pages/TenantApproval'));
const FinancialDashboard = lazy(() => import('./pages/FinancialDashboard'));
const NotificationSystem = lazy(() => import('./pages/NotificationSystem'));

const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard'));
const TenantInvoices = lazy(() => import('./pages/tenant/TenantInvoices'));
const TenantContract = lazy(() => import('./pages/tenant/TenantContract'));
const TenantMaintenance = lazy(() => import('./pages/tenant/TenantMaintenance'));
const TenantProfile = lazy(() => import('./pages/tenant/TenantProfile'));

function RouteFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#64748b' }}>
      Loading...
    </div>
  );
}

function LandlordPage({ title, children }) {
  return (
    <ProtectedRoute role="landlord">
      <MainLayout title={title}>{children}</MainLayout>
    </ProtectedRoute>
  );
}

function TenantPage({ title, children }) {
  return (
    <ProtectedRoute role="tenant">
      <MainLayout title={title}>{children}</MainLayout>
    </ProtectedRoute>
  );
}

function App() {
  const { user } = useAuth();
  const homePath = user?.role === 'landlord' ? '/landlord' : '/tenant';

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={homePath} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={homePath} replace /> : <Register />} />
        <Route path="/mock-payment" element={<MockPayment />} />

        <Route path="/landlord" element={<LandlordPage title="Tổng quan hệ thống"><Overview /></LandlordPage>} />
        <Route path="/rooms" element={<LandlordPage title="Quản lý phòng trọ"><LandlordDashboard /></LandlordPage>} />
        <Route path="/tenants" element={<LandlordPage title="Quản lý khách thuê"><Tenants /></LandlordPage>} />
        <Route path="/invoices" element={<LandlordPage title="Quản lý hóa đơn"><Invoices /></LandlordPage>} />
        <Route path="/settings" element={<LandlordPage title="Cài đặt hệ thống"><Settings /></LandlordPage>} />
        <Route path="/contract" element={<LandlordPage title="Hợp đồng điện tử"><Contract /></LandlordPage>} />
        <Route path="/meter-reading" element={<LandlordPage title="Ghi chỉ số điện nước"><ManagerMeterReading /></LandlordPage>} />
        <Route path="/maintenance" element={<LandlordPage title="Quản lý bảo trì"><ManagerMaintenance /></LandlordPage>} />
        <Route path="/tenant-approval" element={<LandlordPage title="Phê duyệt tài khoản"><TenantApproval /></LandlordPage>} />
        <Route path="/financial-dashboard" element={<LandlordPage title="Bảng điều khiển tài chính"><FinancialDashboard /></LandlordPage>} />
        <Route path="/notifications" element={<LandlordPage title="Hệ thống thông báo"><NotificationSystem /></LandlordPage>} />

        <Route
          path="/contracts/:id"
          element={
            <ProtectedRoute>
              <MainLayout title="Chi tiết hợp đồng"><ContractDetail /></MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/tenant" element={<TenantPage title="Cổng thông tin khách thuê"><TenantDashboard /></TenantPage>} />
        <Route path="/tenant/invoices" element={<TenantPage title="Lịch sử hóa đơn"><TenantInvoices /></TenantPage>} />
        <Route path="/tenant/contract" element={<TenantPage title="Hợp đồng của tôi"><TenantContract /></TenantPage>} />
        <Route path="/tenant/maintenance" element={<TenantPage title="Báo cáo sự cố"><TenantMaintenance /></TenantPage>} />
        <Route path="/tenant/profile" element={<TenantPage title="Hồ sơ cá nhân"><TenantProfile /></TenantPage>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
