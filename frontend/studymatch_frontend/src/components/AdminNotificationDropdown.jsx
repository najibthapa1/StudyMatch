import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertCircle, UserPlus, Flag, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export function AdminNotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        {
        id: 1,
        type: 'user',
        title: 'New User Registration',
        description: 'Emily Johnson just signed up',
        time: '10 minutes ago',
        read: false,
        },
        {
        id: 2,
        type: 'report',
        title: 'Content Report',
        description: 'User reported inappropriate content',
        time: '1 hour ago',
        read: false,
        },
        {
        id: 3,
        type: 'event',
        title: 'Event Capacity Alert',
        description: 'Machine Learning Workshop is 90% full',
        time: '2 hours ago',
        read: false,
        },
        {
        id: 4,
        type: 'system',
        title: 'System Update',
        description: 'Database backup completed successfully',
        time: '5 hours ago',
        read: true,
        },
    ]);

    const dropdownRef = useRef(null);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // TODO: Iteration 4 - Replace with API call
    // useEffect(() => {
    //   const fetchNotifications = async () => {
    //     try {
    //       const data = await getAdminNotifications();
    //       setNotifications(data);
    //     } catch (error) {
    //       console.error('Failed to fetch notifications:', error);
    //     }
    //   };
    //   
    //   fetchNotifications();
    //   
    //   // Set up polling for real-time updates
    //   const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds
    //   return () => clearInterval(interval);
    // }, []);

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

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
        ));
        
        // TODO: Iteration 4 - Add API call
        // markNotificationAsRead(id);
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        
        // TODO: Iteration 4 - Add API call
        // markAllNotificationsAsRead();
    };

    const removeNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
        
        // TODO: Iteration 4 - Add API call
        // deleteNotification(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
        >
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
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
                className="absolute right-0 mt-2 w-96 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-800 z-50"
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
                    onClick={markAllAsRead}
                    className="text-sm text-blue-400 hover:text-blue-300"
                    >
                    Mark all read
                    </button>
                )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[32rem] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                    {notifications.map((notification) => (
                        <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-[#0f0f0f] transition-colors ${
                            !notification.read ? 'bg-blue-950/20' : ''
                        }`}
                        >
                        <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full ${getIconColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                            {getIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                            <p className="text-sm text-white mb-1">
                                {notification.title}
                            </p>
                            <p className="text-sm text-gray-400 mb-2">
                                {notification.description}
                            </p>
                            <p className="text-xs text-gray-500">{notification.time}</p>
                            </div>

                            {/* Mark as Read / Remove */}
                            <div className="flex items-center space-x-1">
                            {!notification.read && (
                                <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-gray-800 rounded"
                                title="Mark as read"
                                >
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                </button>
                            )}
                            <button
                                onClick={() => removeNotification(notification.id)}
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