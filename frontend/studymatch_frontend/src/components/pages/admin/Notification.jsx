import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, AlertCircle, UserPlus, Flag, Calendar, Filter, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { AdminNavbar } from '../../AdminNavbar';
import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

export function Notifications() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
        setLoading(true);
        const data = await getAdminNotifications(filter);
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
        setLoading(false);
        } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err.error || 'Failed to load notifications');
        setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
        await markNotificationAsRead(notificationId);
        fetchNotifications();
        } catch (err) {
        console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
        await markAllNotificationsAsRead();
        fetchNotifications();
        } catch (err) {
        console.error('Error marking all as read:', err);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
        await deleteNotification(notificationId);
        fetchNotifications();
        } catch (err) {
        console.error('Error deleting notification:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        navigate('/login');
    };

    const getIcon = (type) => {
        switch (type) {
        case 'user':
            return <UserPlus className="w-5 h-5" />;
        case 'report':
            return <Flag className="w-5 h-5" />;
        case 'event':
            return <Calendar className="w-5 h-5" />;
        case 'system':
            return <AlertCircle className="w-5 h-5" />;
        default:
            return <Bell className="w-5 h-5" />;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
        case 'user':
            return 'bg-blue-600';
        case 'report':
            return 'bg-red-600';
        case 'event':
            return 'bg-purple-600';
        case 'system':
            return 'bg-green-600';
        default:
            return 'bg-gray-600';
        }
    };

    const getPriorityBadge = (type) => {
        if (type === 'report') {
        return (
            <span className="px-3 py-1 bg-red-900 text-red-300 rounded-full text-xs">
            High Priority
            </span>
        );
        }
        return null;
    };

    if (loading) {
        return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading notifications...</p>
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
                <h2 className="text-2xl font-bold text-white mb-2">Error Loading Notifications</h2>
                <p className="text-gray-400">{error}</p>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-black">
        <AdminNavbar onLogout={handleLogout} />
        
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
            >
            <h1 className="text-4xl tracking-tight mb-2 text-white">Admin Notifications</h1>
            <p className="text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
            </p>
            </motion.div>

            {/* Filter and Actions */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-6"
            >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <div className="flex items-center space-x-2">
                    <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                        filter === 'all' 
                        ? 'bg-white text-black' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    >
                    All
                    </button>
                    <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                        filter === 'unread' 
                        ? 'bg-white text-black' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    >
                    Unread ({unreadCount})
                    </button>
                </div>
                </div>
                {unreadCount > 0 && (
                <Button
                    onClick={handleMarkAllAsRead}
                    variant="outline"
                    className="flex items-center space-x-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark all as read</span>
                </Button>
                )}
            </div>
            </motion.div>

            {/* Notifications List */}
            <div className="space-y-4">
            {notifications.length === 0 ? (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#1a1a1a] rounded-2xl p-12 border border-gray-800 text-center"
                >
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <p className="text-gray-500">No notifications to display</p>
                </motion.div>
            ) : (
                notifications.map((notification, index) => (
                <motion.div
                    key={notification.notification_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className={`bg-[#1a1a1a] rounded-2xl p-6 border transition-all ${
                    !notification.is_read 
                        ? 'border-blue-800 bg-blue-950/20' 
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                >
                    <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full ${getIconColor(notification.notification_type)} flex items-center justify-center text-white flex-shrink-0`}>
                        {getIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                            <h3 className="text-lg text-white">{notification.title}</h3>
                            {getPriorityBadge(notification.notification_type)}
                        </div>
                        <span className="text-sm text-gray-500">{notification.time_ago}</span>
                        </div>
                        <p className="text-gray-400">{notification.description}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                        {!notification.is_read && (
                        <button
                            onClick={() => handleMarkAsRead(notification.notification_id)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            title="Mark as read"
                        >
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        </button>
                        )}
                        <button
                        onClick={() => handleDeleteNotification(notification.notification_id)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Remove"
                        >
                        <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    </div>
                </motion.div>
                ))
            )}
            </div>
        </div>
        </div>
    );
}