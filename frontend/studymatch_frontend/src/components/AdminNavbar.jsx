import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminNotificationDropdown } from './AdminNotificationDropdown';

export function AdminNavbar({ onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin/dashboard', label: 'DASHBOARD' },
        { path: '/admin/users', label: 'USERS' },
        { path: '/admin/guilds', label: 'GUILDS' },
        { path: '/admin/analytics', label: 'ANALYTICS' },
        { path: '/admin/report',       label: 'REPORTS'    }, 
    ];

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <>
        {/* Navigation Bar */}
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-2 left-0 right-0 z-50 flex justify-center px-2 sm:px-4">
            <div className="w-full max-w-7xl">
            <div className="bg-black/80 backdrop-blur-md rounded-full border border-gray-800 shadow-lg px-2 sm:px-4 md:px-6 py-2">
            <div className="flex items-center justify-between min-w-0">
                {/* Left - Hamburger Menu */}
                <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 sm:p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                {/* Center - Logo */}
                <Link to="/admin/dashboard" className="absolute left-1/2 -translate-x-1/2 flex-shrink-0">
                <h1 className="tracking-tight text-white font-semibold text-xs sm:text-sm md:text-base">STUDYMATCH ADMIN</h1>
                </Link>

                {/* Right - Notifications, Profile & Logout */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <AdminNotificationDropdown />
                
                <button
                    onClick={handleLogout}
                    className="p-1 sm:p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
                </div>
            </div>
            </div>
            </div>
        </motion.nav>

        {/* Full Page Menu Overlay */}
        <AnimatePresence>
            {isMenuOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 bg-black"
            >
                <div className="h-full flex items-center justify-center">
                <nav className="text-center space-y-12">
                    {navItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    
                    return (
                        <motion.div
                        key={item.path}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                        <Link
                            to={item.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block tracking-[0.4em] text-4xl transition-colors ${
                            isActive ? 'text-white' : 'text-gray-600 hover:text-gray-500'
                            }`}
                        >
                            {item.label}
                        </Link>
                        </motion.div>
                    );
                    })}
                </nav>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}