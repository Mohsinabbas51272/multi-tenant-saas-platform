import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TenantAdminDashboard from './pages/TenantAdminDashboard';
import TenantUserDashboard from './pages/TenantUserDashboard';
import PublicStore from './pages/PublicStore';
import Marketplace from './pages/Marketplace';
import OrderTracking from './pages/OrderTracking';
import { getCurrentUser } from './services/authService';

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route 
          path="/super-admin" 
          element={
            <PrivateRoute allowedRoles={['superadmin']}>
              <SuperAdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/tenant-admin" 
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <TenantAdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/tenant-user" 
          element={
            <PrivateRoute allowedRoles={['user']}>
              <TenantUserDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders/:id/track" 
          element={
            <PrivateRoute allowedRoles={['user', 'admin']}>
              <OrderTracking />
            </PrivateRoute>
          }
        />
        <Route path="/store/:slug" element={<PublicStore />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
