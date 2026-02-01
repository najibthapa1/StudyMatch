import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mail, ArrowLeft } from 'lucide-react';
import { verifyEmail, resendVerification, saveTokens, saveUser } from '../../utils/api';

export function EmailVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Redirect if no email provided
    if (!email) {
      navigate('/signup');
      return;
    }

    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, email, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError('');
    setSuccess('');

    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      setIsVerifying(false);
      return;
    }

    // Call API
    const result = await verifyEmail(email, verificationCode);

    if (result.success) {
      // Save tokens and user data
      saveTokens(result.data.tokens);
      saveUser(result.data.user);

      setSuccess('Email verified successfully! Redirecting...');

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      // Show error
      setError(result.error.error || 'Verification failed');
    }

    setIsVerifying(false);
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setError('');
    setSuccess('');

    // Call API
    const result = await resendVerification(email);

    if (result.success) {
      setSuccess('Verification code resent! Check your email.');
      setCode(['', '', '', '', '', '']);
      setCountdown(60);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error.error || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 lg:px-8 bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl mb-4">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to
            <br />
            <span className="text-black font-medium">{email}</span>
          </p>
        </div>

        {/* White Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Label */}
            <div className="text-center">
              <label className="text-gray-600 text-sm">Enter verification code</label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600 text-center">{success}</p>
              </div>
            )}

            {/* Code Input Boxes */}
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl bg-gray-100 border-0 focus:bg-gray-200 focus:ring-0"
                  required
                  disabled={isVerifying}
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-black hover:bg-gray-800 text-white"
              disabled={isVerifying || code.some(d => !d)}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>

            {/* Resend Section */}
            <div className="text-center space-y-2">
              <p className="text-gray-900 text-sm">Didn't receive the code?</p>
              {countdown > 0 ? (
                <p className="text-gray-400 text-sm">
                  Resend code in {countdown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-black text-sm hover:underline transition-colors font-medium"
                >
                  Resend code
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}