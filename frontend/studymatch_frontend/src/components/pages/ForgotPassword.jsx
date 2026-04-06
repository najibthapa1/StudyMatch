import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { forgotPassword } from '../../utils/api';

export function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [msgType, setMsgType] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
        const result = await forgotPassword(email);
        
        if (result.success) {
        setMsgType('success');
        setMessage('Check your email for a reset code');
        setTimeout(() => {
            navigate('/forgot-password-verify', { state: { email } });
        }, 1500);
        } else {
        setMsgType('error');
        setMessage(result.error?.error || 'Failed to send code');
        }
    } catch (error) {
        setMsgType('error');
        setMessage('Something went wrong');
    } finally {
        setIsSubmitting(false);
    }
};

    return (
        <div className="min-h-screen flex items-center justify-center px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
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
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-4xl tracking-tight mb-2">Forgot Password?</h1>
                <p className="text-gray-600">
                Enter your college email and we'll send you a verification code to reset your password
                </p>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
                    msgType === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}>
                {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    required
                />
                </div>

                <Button 
                type="submit" 
                className="w-full h-12 bg-black hover:bg-gray-800"
                disabled={isSubmitting}
                >
                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                </Button>
            </form>

            <div className="mt-8 text-center">
                <Link
                to="/login"
                className="inline-flex items-center text-gray-600 hover:text-black transition-colors text-sm"
                >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
                </Link>
            </div>
            </div>
        </motion.div>
        </div>
    );
    }