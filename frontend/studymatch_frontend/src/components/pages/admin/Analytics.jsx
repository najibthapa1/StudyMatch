import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Calendar, Target, Activity, AlertCircle } from 'lucide-react';
import { AdminNavbar } from '../../AdminNavbar';
import { getAdminAnalytics } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export function Analytics() {
    const navigate = useNavigate();
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
        setLoading(true);
        const data = await getAdminAnalytics();
        setAnalyticsData(data);
        setLoading(false);
        } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err.error || 'Failed to load analytics');
        setLoading(false);
        }
    };

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
                <p className="mt-4 text-gray-400">Loading analytics...</p>
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
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Error Loading Analytics</h2>
                <p className="text-gray-400">{error}</p>
            </div>
            </div>
        </div>
        );
    }

    const stats = [
        { 
        label: 'Avg Conversion Rate', 
        value: analyticsData.key_stats.conversion_rate, 
        icon: Target, 
        color: 'from-blue-500 to-blue-600' 
        },
        { 
        label: 'Active Guilds', 
        value: analyticsData.key_stats.active_guilds, 
        icon: Users, 
        color: 'from-purple-500 to-purple-600' 
        },
        { 
        label: 'Events This Month', 
        value: analyticsData.key_stats.events_this_month, 
        icon: Calendar, 
        color: 'from-green-500 to-green-600' 
        },
        { 
        label: 'Daily Active Users', 
        value: analyticsData.key_stats.daily_active_users, 
        icon: Activity, 
        color: 'from-orange-500 to-orange-600' 
        },
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
            <h1 className="text-4xl tracking-tight mb-2 text-white">Analytics Overview</h1>
            <p className="text-gray-400">Comprehensive platform insights and metrics</p>
            </motion.div>

            {/* Key Stats */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                    <div className="text-3xl text-white">{stat.value}</div>
                </motion.div>
                );
            })}
            </motion.div>

            {/* User Growth Chart */}
            {analyticsData.user_growth && analyticsData.user_growth.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-6"
            >
                <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl text-white mb-1">User Growth</h2>
                    <p className="text-sm text-gray-400">Total registered users over time</p>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Growing</span>
                </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.user_growth}>
                    <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
                </ResponsiveContainer>
            </motion.div>
            )}

            {/* Event Participation & Event Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Event Participation */}
            {analyticsData.event_stats && analyticsData.event_stats.length > 0 && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                <h2 className="text-xl text-white mb-1">Event Status Tracking</h2>
                <p className="text-sm text-gray-400 mb-6">Confirmed vs Pending events per month</p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.event_stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="confirmed" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </motion.div>
            )}

            {/* Event Category Distribution */}
            {analyticsData.event_categories && analyticsData.event_categories.length > 0 && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                <h2 className="text-xl text-white mb-1">Event Categories</h2>
                <p className="text-sm text-gray-400 mb-6">Distribution by event type</p>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={analyticsData.event_categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {analyticsData.event_categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    />
                    </PieChart>
                </ResponsiveContainer>
                </motion.div>
            )}
            </div>

            {/* Guild Distribution & Engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Guild Distribution */}
            {analyticsData.guild_stats && analyticsData.guild_stats.length > 0 && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                <h2 className="text-xl text-white mb-1">Guild Comparison</h2>
                <p className="text-sm text-gray-400 mb-6">Members and events by university</p>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.guild_stats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="members" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="events" fill="#ec4899" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </motion.div>
            )}

            {/* Weekly Engagement */}
            {analyticsData.engagement && analyticsData.engagement.length > 0 && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                <h2 className="text-xl text-white mb-1">Weekly Engagement</h2>
                <p className="text-sm text-gray-400 mb-6">Messages sent and connections made</p>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.engagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="day" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="connections" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
                </motion.div>
            )}
            </div>
        </div>
        </div>
    );
}