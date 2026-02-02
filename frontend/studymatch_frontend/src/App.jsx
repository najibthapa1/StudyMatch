import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingPage } from './components/pages/LoadingPage';
import { Landing } from './components/pages/Landing';
import { Signup } from './components/pages/Signup';
import { Login } from './components/pages/Login';
import { EmailVerification } from './components/pages/EmailVerification';
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const Profile = lazy(() => import('./components/pages/Profile'));
import { ForgotPassword } from './components/pages/ForgotPassword';
import { ForgotPasswordVerification } from './components/pages/ForgotPasswordVerification';
import { ResetPassword } from './components/pages/ResetPassword';
import { NotFound } from './components/pages/NotFound';
import { isAuthenticated } from './utils/api';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { isAdmin } from './utils/api';

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false  }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !isAdmin()) {
          return <Navigate to="/dashboard" replace />;
      }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password-verify" element={<ForgotPasswordVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Dashboard /></Suspense></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Profile /></Suspense></ProtectedRoute>} />
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;