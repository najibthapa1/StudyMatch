import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl w-full text-center">
            {/* 404 Animation */}
            <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
            >
            <motion.h1
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[12rem] leading-none tracking-tight text-black mb-4"
            >
                404
            </motion.h1>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-2"
            >
                <h2 className="text-3xl tracking-tight">Page Not Found</h2>
                <p className="text-xl text-gray-600">
                Oops! The page you're looking for doesn't exist.
                </p>
            </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
            <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full sm:w-auto"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
            </Button>
            <Link to="/dashboard" className="w-full sm:w-auto">
                <Button className="w-full bg-black hover:bg-gray-800">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
                </Button>
            </Link>
            </motion.div>

            {/* Help Text */}
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 text-sm text-gray-500"
            >
            <p>
                If you believe this is a mistake, please{' '}
                <a href="mailto:support@studymatch.com" className="text-black hover:underline">
                contact support
                </a>
            </p>
            </motion.div>
        </div>
        </div>
    );
}