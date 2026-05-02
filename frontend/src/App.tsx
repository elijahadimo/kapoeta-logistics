import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import FinancialDashboard from './pages/admin/FinancialDashboard';
import AuditLog from './pages/admin/AuditLog';
import VehicleTracking from './pages/admin/VehicleTracking';
import AgentDashboard from './pages/agent/AgentDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import AssistantDriverDashboard from './pages/driver/AssistantDriverDashboard';
import AdvancedDriverFeatures from './pages/driver/AdvancedDriverFeatures';

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) => {
  const token = localStorage.getItem('access_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/financial" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FinancialDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/audit" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLog />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/tracking" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VehicleTracking />
          </ProtectedRoute>
        } />
        
        <Route path="/agent/dashboard" element={
          <ProtectedRoute allowedRoles={['agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/driver/dashboard" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/driver/advanced" element={
          <ProtectedRoute allowedRoles={['driver']}>
            <AdvancedDriverFeatures />
          </ProtectedRoute>
        } />
        
        <Route path="/assistant/dashboard" element={
          <ProtectedRoute allowedRoles={['asst_driver']}>
            <AssistantDriverDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
