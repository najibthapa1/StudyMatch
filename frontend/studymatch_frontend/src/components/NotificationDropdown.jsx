import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Bell, X, CheckCircle, UserPlus, Calendar,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteUserNotification,
} from '../utils/api';

const TYPE_META = {
    connection_request:  { icon: UserPlus,    bg: 'bg-blue-500'   },
    connection_accepted: { icon: UserPlus,    bg: 'bg-green-500'  },
    event_created:       { icon: Calendar,    bg: 'bg-purple-500' },
    event_updated:       { icon: Calendar,    bg: 'bg-amber-500'  },
    event_deleted:       { icon: Calendar,    bg: 'bg-red-500'    },
    event_confirmed:     { icon: CheckCircle, bg: 'bg-green-600'  },
    event_reminder:      { icon: Calendar,    bg: 'bg-orange-500' },
    report_received:     { icon: AlertCircle, bg: 'bg-red-600'    },
    general:             { icon: Bell,        bg: 'bg-gray-500'   },
};

function getMeta(type) {
    return TYPE_META[type] || TYPE_META.general;
}

export function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getNotifications('all');
            setNotifications(data.notifications.slice(0, 10));
            setUnreadCount(data.unread_count);
        } catch {
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleRemove = async (id, wasUnread) => {
        try {
            await deleteUserNotification(id);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={async () => {
                    const wasOpen = isOpen;
                    setIsOpen(prev => !prev);
                    if (!wasOpen) {
                        fetchNotifications();
                        if (unreadCount > 0) {
                            try {
                                await markAllNotificationsRead();
                                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                                setUnreadCount(0);
                            } catch { /* silent */ }
                        }
                    }
                }}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900">Notifications</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[28rem] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                    <p className="text-sm text-gray-500">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(n => {
                                        const meta = getMeta(n.notification_type);
                                        const Icon = meta.icon;
                                        return (
                                            <motion.div
                                                key={n.notification_id}
                                                layout
                                                className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors ${
                                                    !n.is_read ? 'bg-blue-50/60' : ''
                                                }`}
                                            >
                                                {/* Icon / avatar */}
                                                <div className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center text-white flex-shrink-0 overflow-hidden`}>
                                                    {n.sender_avatar ? (
                                                        <img src={n.sender_avatar} alt={n.sender_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Icon className="w-4 h-4" />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 leading-snug">
                                                        {n.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-1">{n.time_ago}</p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!n.is_read && (
                                                        <button
                                                            onClick={() => handleMarkRead(n.notification_id)}
                                                            title="Mark as read"
                                                            className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                        >
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemove(n.notification_id, !n.is_read)}
                                                        title="Remove"
                                                        className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                                <Link
                                    to="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    View all notifications
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}