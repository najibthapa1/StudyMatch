import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, UserPlus, MessageCircle, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([
        {
        id: 1,
        type: 'connection',
        title: 'New Connection Request',
        description: 'Sarah Chen wants to connect with you',
        time: '5 minutes ago',
        read: false,
        avatar: 'SC',
        },
        {
        id: 2,
        type: 'message',
        title: 'New Message',
        description: 'Michael Park sent you a message',
        time: '1 hour ago',
        read: false,
        avatar: 'MP',
        },
        {
        id: 3,
        type: 'connection',
        title: 'Connection Request Accepted',
        description: 'Emma Wilson accepted your connection request',
        time: '2 hours ago',
        read: false,
        avatar: 'EW',
        },
        {
        id: 4,
        type: 'event',
        title: 'Event Invitation',
        description: "You're invited to Machine Learning Workshop",
        time: '3 hours ago',
        read: true,
        avatar: 'ML',
        },
        {
        id: 5,
        type: 'mention',
        title: 'New Match',
        description: 'You matched with David Lee based on shared interests',
        time: '5 hours ago',
        read: true,
        avatar: 'DL',
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

    const getIcon = (type) => {
        switch (type) {
        case 'connection':
            return <UserPlus className="w-4 h-4" />;
        case 'message':
            return <MessageCircle className="w-4 h-4" />;
        case 'event':
            return <Calendar className="w-4 h-4" />;
        case 'mention':
            return <Users className="w-4 h-4" />;
        default:
            return <Bell className="w-4 h-4" />;
        }
    };

    const getIconColor = (type) => {
        switch (type) {
        case 'connection':
            return 'bg-blue-500';
        case 'message':
            return 'bg-green-500';
        case 'event':
            return 'bg-purple-500';
        case 'mention':
            return 'bg-orange-500';
        default:
            return 'bg-gray-500';
        }
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const handleAccept = (id) => {
        // Handle connection request accept
        removeNotification(id);
    };

    const handleReject = (id) => {
        // Handle connection request reject
        removeNotification(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
        {/* Notification Bell Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
            <Bell className="w-5 h-5 text-gray-700" />
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
                className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h3 className="text-lg">Notifications</h3>
                    <p className="text-sm text-gray-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    >
                    Mark all read
                    </button>
                )}
                </div>

                {/* Notifications List */}
                <div className="max-h-[32rem] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                        <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50' : ''
                        }`}
                        >
                        <div className="flex items-start space-x-3">
                            {/* Avatar/Icon */}
                            <div className={`w-10 h-10 rounded-full ${getIconColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                            {notification.avatar ? (
                                <span className="text-sm">{notification.avatar}</span>
                            ) : (
                                getIcon(notification.type)
                            )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 mb-1">
                                {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                {notification.description}
                            </p>
                            <p className="text-xs text-gray-500">{notification.time}</p>

                            {/* Action Buttons for Connection Requests */}
                            {notification.type === 'connection' && notification.title === 'New Connection Request' && (
                                <div className="flex items-center gap-2 mt-3">
                                <Button
                                    size="sm"
                                    onClick={() => handleAccept(notification.id)}
                                    className="bg-black hover:bg-gray-800 h-8 text-xs"
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(notification.id)}
                                    className="h-8 text-xs"
                                >
                                    Decline
                                </Button>
                                </div>
                            )}
                            </div>

                            {/* Mark as Read / Remove */}
                            <div className="flex items-center space-x-1">
                            {!notification.read && (
                                <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Mark as read"
                                >
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                </button>
                            )}
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Remove"
                            >
                                <X className="w-4 h-4 text-gray-400" />
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
                <div className="p-3 border-t border-gray-200 text-center">
                    <Link to="/notifications" className="text-sm text-gray-600 hover:text-black transition-colors">
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