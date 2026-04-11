import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertCircle, UserPlus, Flag, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../utils/api';

export function AdminNotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchNotifications();
        
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
        const data = await getAdminNotifications('all');
        // Get only the latest 10 for dropdown
        setNotifications(data.notifications.slice(0, 10));
        setUnreadCount(data.unread_count);
        } catch (error) {
        console.error('Failed to fetch notifications:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
        case 'user':
            return <UserPlus className="w-4 h-4" />;
        case 'report':
            return <Flag className="w-4 h-4" />;
        case 'event':
            return <Calendar className="w-4 h-4" />;
        case 'system':
            return <AlertCircle className="w-4 h-4" />;
        default:
            return <Bell className="w-4 h-4" />;
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

    const handleMarkAsRead = async (notificationId) => {
        try {
        await markNotificationAsRead(notificationId);
        fetchNotifications();
        } catch (error) {
        console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
        await markAllNotificationsAsRead();
        fetchNotifications();
        } catch (error) {
        console.error('Failed to mark all as read:', error);
        }
    };

    const handleRemoveNotification = async (notificationId) => {
        try {
        await deleteNotification(notificationId);
        fetchNotifications();
        } catch (error) {
        console.error('Failed to delete notification:', error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
            onClick={async () => {
                const wasOpen = isOpen;
                setIsOpen(!isOpen);
                if (!wasOpen) {
                    fetchNotifications();
                    if (unreadCount > 0) {
                        try {
                            await markAllNotificationsAsRead();
                            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            setUnreadCount(0);
                        } catch { /* silent */ }
                    }
                }
            }}
            className="relative p-1 sm:p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
        >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            )}
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
            {isOpen && (
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-800 z-50 max-h-[60vh] sm:max-h-[32rem]"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                    <h3 className="text-lg text-white">Admin Notifications</h3>
                    <p className="text-sm text-gray-400">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-400 hover:text-blue-300"
                    >
                    Mark all read
                    </button>
                )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[40vh] sm:max-h-[32rem] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                    {notifications.map((notification) => (
                        <motion.div
                        key={notification.notification_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-[#0f0f0f] transition-colors ${
                            !notification.is_read ? 'bg-blue-950/20' : ''
                        }`}
                        >
                        <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full ${getIconColor(notification.notification_type)} flex items-center justify-center text-white flex-shrink-0`}>
                            {getIcon(notification.notification_type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                            <p className="text-sm text-white mb-1">
                                {notification.title}
                            </p>
                            <p className="text-sm text-gray-400 mb-2">
                                {notification.description}
                            </p>
                            <p className="text-xs text-gray-500">{notification.time_ago}</p>
                            </div>

                            {/* Mark as Read / Remove */}
                            <div className="flex items-center space-x-1">
                            {!notification.is_read && (
                                <button
                                onClick={() => handleMarkAsRead(notification.notification_id)}
                                className="p-1 hover:bg-gray-800 rounded"
                                title="Mark as read"
                                >
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                </button>
                            )}
                            <button
                                onClick={() => handleRemoveNotification(notification.notification_id)}
                                className="p-1 hover:bg-gray-800 rounded"
                                title="Remove"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                            </div>
                        </div>
                        </motion.div>
                    ))}
                    </div>
                )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-800 text-center">
                    <Link 
                    to="/admin/notifications" 
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                    onClick={() => setIsOpen(false)}
                    >
                    View All Notifications
                    </Link>
                </div>
                )}
            </motion.div>
            )}
        </AnimatePresence>
        </div>
    );
}