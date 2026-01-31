import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './components/pages/Landing';
import { Signup } from './components/pages/Signup';
import { Login } from './components/pages/Login';
import { EmailVerification } from './components/pages/EmailVerification';
import { Dashboard } from './components/pages/Dashboard';
import { Profile } from './components/pages/Profile';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile"   element={ <ProtectedRoute> <Profile /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;