import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './components/pages/Landing';
import { Signup } from './components/pages/Signup';
import { Login } from './components/pages/Login';
import { EmailVerification } from './components/pages/EmailVerification';
import { Dashboard } from './components/pages/Dashboard';
import { Profile } from './components/pages/Profile';
import { ForgotPassword } from './components/pages/ForgotPassword';
import { ForgotPasswordVerification } from './components/pages/ForgotPasswordVerification';
import { ResetPassword } from './components/pages/ResetPassword';
import { NotFound } from './components/pages/NotFound';
import { isAuthenticated } from './utils/api';

// Protected Route Component
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
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

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;