import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingPage } from './components/pages/LoadingPage';
import { Landing } from './components/pages/Landing';
import { Signup } from './components/pages/Signup';
import { Login } from './components/pages/Login';
import { EmailVerification } from './components/pages/EmailVerification';
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const Profile = lazy(() => import('./components/pages/Profile'));
const Connections = lazy(() => import('./components/pages/Connections'));
const Discovery = lazy(() => import('./components/pages/Discovery'));
const Chat = lazy(() => import('./components/pages/Chat'));
const Guild = lazy(() => import('./components/pages/Guild'));
const Notifications = lazy(() => import('./components/pages/Notification'));
const StudyMode = lazy(() => import('./components/pages/StudyMode'));
import { ForgotPassword } from './components/pages/ForgotPassword';
import { ForgotPasswordVerification } from './components/pages/ForgotPasswordVerification';
import { ResetPassword } from './components/pages/ResetPassword';
import { NotFound } from './components/pages/NotFound';
import { isAuthenticated } from './utils/api';
import { AdminDashboard } from './components/pages/admin/AdminDashboard';
import { UserList } from './components/pages/admin/UserList';
import { GuildManagement } from './components/pages/admin/GuildManagement';
import { Analytics } from './components/pages/admin/Analytics';
import { isAdmin } from './utils/api';
import { ReportsManagement } from './components/pages/admin/Report';


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
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserList /></ProtectedRoute>} />
        <Route path="/admin/guilds" element={<ProtectedRoute adminOnly><GuildManagement /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><Analytics /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><Notifications /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Dashboard /></Suspense></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Profile /></Suspense></ProtectedRoute>} />
        <Route path="/connect" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Discovery /></Suspense></ProtectedRoute>} />
        <Route path="/connections" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Connections /></Suspense></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Chat /> </Suspense></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute> <Suspense fallback={<LoadingPage/>}><Chat /></Suspense></ProtectedRoute>} />
        <Route path="/guild" element={<ProtectedRoute><Suspense fallback={<LoadingPage/>}><Guild /></Suspense></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Suspense fallback={<LoadingPage />}><Notifications /></Suspense></ProtectedRoute>}/>
        <Route path="/study-mode" element={<ProtectedRoute><Suspense fallback={<LoadingPage />}><StudyMode /></Suspense></ProtectedRoute>}/>
        <Route path="/admin/report" element={<ProtectedRoute adminOnly><ReportsManagement /></ProtectedRoute>}/>
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;