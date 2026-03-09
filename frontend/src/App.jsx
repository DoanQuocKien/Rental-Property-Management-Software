import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import LandlordDashboard from './pages/LandlordDashboard'
import TenantDashboard from './pages/TenantDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'landlord' ? '/landlord' : '/tenant'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'landlord' ? '/landlord' : '/tenant'} replace /> : <Register />} />
      <Route
        path="/landlord"
        element={
          <ProtectedRoute role="landlord">
            <LandlordDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenant"
        element={
          <ProtectedRoute role="tenant">
            <TenantDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
