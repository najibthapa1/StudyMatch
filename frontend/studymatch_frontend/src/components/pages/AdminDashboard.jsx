import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Users, 
    Activity, 
    Calendar, 
    MessageSquare, 
    UserPlus, 
    TrendingUp, 
    Building2, 
    BarChart,
    UserCheck,
    UserX,
    Shield
} from 'lucide-react';
import { AdminNavbar } from '../AdminNavbar';
import { getAdminDashboardStats, verifyAdminAccess } from '../../utils/api';

export function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyAndFetchData = async () => {
        try {
            // Verify admin access
            await verifyAdminAccess();
            
            // Fetch dashboard stats
            const data = await getAdminDashboardStats();
            setStats(data);
            setLoading(false);
        } catch (err) {
            console.error('Error:', err);
            setError(err.error || 'Access denied');
            setLoading(false);
            
            // Redirect to login if unauthorized
            if (err.error?.includes('denied') || err.error?.includes('required')) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_role');
            navigate('/login');
            }
        }
        };

        verifyAndFetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        navigate('/login');
    };

    if (loading) {
        return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading admin dashboard...</p>
            </div>
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
            <div className="text-center">
                <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-gray-400">{error}</p>
            </div>
            </div>
        </div>
        );
    }

    const calculateChange = (current, previous = 0) => {
        if (previous === 0) return '+100%';
        const change = ((current - previous) / previous) * 100;
        return `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
    };

    // Prepare stats cards with real data
    const statsCards = [
        { 
        label: 'Total Users', 
        value: stats?.total_users || 0, 
        icon: Users, 
        change: '+12%', 
        iconBg: 'bg-blue-600',
        changeColor: 'text-green-400'
        },
        { 
        label: 'Verified Users', 
        value: stats?.verified_users || 0, 
        icon: UserCheck, 
        change: '+8%',
        iconBg: 'bg-green-600',
        changeColor: 'text-green-400'
        },
        { 
        label: 'Unverified Users', 
        value: stats?.unverified_users || 0, 
        icon: UserX, 
        change: stats?.unverified_users > 0 ? `${stats.unverified_users} pending` : '0',
        iconBg: 'bg-orange-600',
        changeColor: stats?.unverified_users > 5 ? 'text-orange-400' : 'text-green-400'
        },
        { 
        label: 'Total Profiles', 
        value: stats?.total_profiles || 0, 
        icon: TrendingUp, 
        change: '+15%',
        iconBg: 'bg-purple-600',
        changeColor: 'text-green-400'
        },
        { 
        label: 'New Users (7d)', 
        value: stats?.recent_signups?.length || 0, 
        icon: UserPlus, 
        change: '+18%',
        iconBg: 'bg-pink-600',
        changeColor: 'text-green-400'
        },
        { 
        label: 'Admin Users', 
        value: stats?.users_by_role?.admin || 0, 
        icon: Shield, 
        change: 'Secured',
        iconBg: 'bg-cyan-600',
        changeColor: 'text-cyan-400'
        },
    ];

    const quickActions = [
        { label: 'Manage Users', icon: Users, link: '/admin/users' },
        { label: 'View Guilds', icon: Building2, link: '/admin/guilds' },
        { label: 'View Analytics', icon: BarChart, link: '/admin/analytics' },
    ];

    // Use real recent users data
    const recentUsers = stats?.recent_signups?.slice(0, 5).map(user => ({
        name: user.full_name || 'N/A',
        email: user.email,
        time: formatTimeAgo(user.created_at),
        status: user.is_verified ? 'Active' : 'Pending'
    })) || [];

    // Upcoming events 
    const upcomingEvents = [
        { title: 'Machine Learning Workshop', attendees: 42, date: 'Nov 15, 2025' },
        { title: 'Tech Career Fair', attendees: 156, date: 'Nov 18, 2025' },
        { title: 'Hackathon 2025', attendees: 89, date: 'Nov 20-21, 2025' },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-black">
        <AdminNavbar onLogout={handleLogout} />
        
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
            >
            <h1 className="text-4xl tracking-tight mb-2 text-white">Admin Dashboard</h1>
            <p className="text-gray-400">Monitor and manage StudyMatch platform</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            >
            {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                    <div className="flex items-start justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm ${stat.changeColor}`}>{stat.change}</span>
                    </div>
                    <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                    <div className="text-3xl text-white">{stat.value}</div>
                </motion.div>
                );
            })}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-12"
            >
            <h2 className="text-xl text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                    <Link key={action.label} to={action.link}>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
                        className="w-full bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors text-left"
                    >
                        <Icon className="w-5 h-5 text-white mb-3" />
                        <span className="text-white text-sm">{action.label}</span>
                    </motion.button>
                    </Link>
                );
                })}
            </div>
            </motion.div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
            >
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-white">Recent Users</h2>
                <Link to="/admin/users">
                    <button className="text-gray-400 text-sm hover:text-white transition-colors">
                    View All
                    </button>
                </Link>
                </div>
                <div className="space-y-4">
                {recentUsers.length > 0 ? (
                    recentUsers.map((user, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 + index * 0.05 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-white text-sm">{user.name}</p>
                            <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                        </div>
                        <div className="flex items-center space-x-3">
                        <span
                            className={`px-3 py-1 rounded-full text-xs ${
                            user.status === 'Active'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-yellow-900 text-yellow-300'
                            }`}
                        >
                            {user.status}
                        </span>
                        <span className="text-gray-500 text-xs">{user.time}</span>
                        </div>
                    </motion.div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-8">No recent users</p>
                )}
                </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
            >
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-white">Upcoming Events</h2>
                <Link to="/admin/guilds">
                    <button className="text-gray-400 text-sm hover:text-white transition-colors">
                    View All Guilds
                    </button>
                </Link>
                </div>
                <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                    <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + index * 0.05 }}
                    className="bg-[#0f0f0f] rounded-xl p-4 border border-gray-800"
                    >
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white">{event.title}</h3>
                        <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees} attendees</span>
                        </div>
                        <span className="text-gray-500">{event.date}</span>
                    </div>
                    </motion.div>
                ))}
                </div>
            </motion.div>
            </div>

            {/* Users by Role Section */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-6 bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
            >
            <h2 className="text-xl text-white mb-6">Users by Role</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats?.users_by_role || {}).map(([role, count]) => (
                <div key={role} className="text-center p-4 bg-[#0f0f0f] rounded-xl border border-gray-800">
                    <p className="text-3xl font-bold text-white mb-2">{count}</p>
                    <p className="text-sm text-gray-400 capitalize">{role}s</p>
                </div>
                ))}
            </div>
            </motion.div>
        </div>
        </div>
    );
    }

    // Helper function to format time ago
    function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
}