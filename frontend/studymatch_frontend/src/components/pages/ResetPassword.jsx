import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
        }

        if (password.length < 8) {
        alert('Password must be at least 8 characters');
        return;
        }

        setIsSubmitting(true);
        
        // Simulate password reset
        setTimeout(() => {
        navigate('/login');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Back to Home */}
        <Link
            to="/"
            className="fixed top-8 left-8 flex items-center space-x-2 text-gray-600 hover:text-black transition-colors"
        >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">SM</span>
            </div>
            <span>StudyMatch</span>
        </Link>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
        >
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200">
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-4xl tracking-tight mb-2">Reset Password</h1>
                <p className="text-gray-600">
                Enter your new password below
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    required
                    minLength={8}
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                    <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 pr-10"
                    required
                    minLength={8}
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                </div>

                <Button 
                type="submit" 
                className="w-full h-12 bg-black hover:bg-gray-800"
                disabled={isSubmitting}
                >
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                </Button>
            </form>

            <div className="mt-8 text-center">
                <Link
                to="/login"
                className="text-gray-600 hover:text-black transition-colors text-sm"
                >
                Back to login
                </Link>
            </div>
            </div>
        </motion.div>
        </div>
    );
}