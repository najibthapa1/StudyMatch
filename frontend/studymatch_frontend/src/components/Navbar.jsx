import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationDropdown } from './NotificationDropdown';
import { logout, getUser } from '../utils/api';

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Get user from localStorage
        const userData = getUser();
        setUser(userData);
    }, [location]); 

    const navItems = [
        { path: '/dashboard', label: 'HOME' },
        { path: '/connect', label: 'CONNECT' },
        { path: '/connections', label: 'CONNECTIONS' },
        { path: '/chat', label: 'CHAT' },
        { path: '/guild', label: 'GUILD' },
        { path: '/profile', label: 'PROFILE' },
    ];

    const handleLogout = async () => {
        try {
        await logout();
        navigate('/login');
        } catch (error) {
        console.error('Logout error:', error);
        localStorage.clear();
        navigate('/login');
        }
    };

    const getInitials = () => {
        if (user?.profile?.initials) return user.profile.initials;
        if (user?.profile?.full_name) {
        const names = user.profile.full_name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return names[0].substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <>
        {/* Navigation Bar */}
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-2 left-0 right-0 z-50 flex justify-center px-2 sm:px-4">
            <div className="w-full max-w-7xl">
            <div className="bg-white/80 backdrop-blur-md rounded-full border border-gray-200 shadow-md px-2 sm:px-4 md:px-6 py-2">
            <div className="flex items-center justify-between min-w-0">
                {/* Left - Hamburger Menu */}
                <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Center - Logo */}
                <Link to="/dashboard" className="absolute left-1/2 -translate-x-1/2 flex-shrink-0">
                <h1 className="tracking-tight text-xs sm:text-sm md:text-base font-medium">STUDYMATCH</h1>
                </Link>

                {/* Right - Notifications, Profile & Logout */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <NotificationDropdown />
                
                {/* Profile Button with Avatar/Initials */}
                <Link to="/profile">
                    <button className="relative p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors group flex-shrink-0">
                    {user?.profile?.profile_picture ? (
                        <img 
                        src={user.profile.profile_picture} 
                        alt="Profile" 
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] sm:text-[10px] font-medium text-gray-700">
                            {getInitials()}
                        </span>
                        </div>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute hidden group-hover:block top-full right-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-10">
                        {user?.profile?.full_name || 'Profile'}
                    </div>
                    </button>
                </Link>

                <button
                    onClick={handleLogout}
                    className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors group relative flex-shrink-0"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    {/* Tooltip on hover */}
                    <div className="absolute hidden group-hover:block top-full right-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap z-10">
                    Logout
                    </div>
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
                className="fixed inset-0 z-40 bg-gray-50"
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
                            isActive ? 'text-black' : 'text-gray-300 hover:text-gray-400'
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