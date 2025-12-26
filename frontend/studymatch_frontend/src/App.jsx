import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Landing } from '@/components/pages/Landing'
import { Login } from '@/components/pages/Login'
import { Signup } from '@/components/pages/Signup'
import { EmailVerification } from '@/components/pages/EmailVerification'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={<Login onLogin={() => {}} onAdminLogin={() => {}} />}
        />
        <Route
          path="/signup"
          element={<Signup onSignup={() => {}} />}
        />
        <Route 
            path="/verify-email" 
            element={<EmailVerification />} 
          />
      </Routes>
    </BrowserRouter>
  )
}

export default App