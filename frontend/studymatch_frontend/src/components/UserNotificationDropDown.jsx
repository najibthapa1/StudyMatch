import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Bell, X, Check, UserPlus, MessageCircle, Calendar,
    Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';


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

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await apiFetch('/notifications/?per_page=10');
            setNotifications(data.notifications.slice(0, 10));
            setUnreadCount(data.unread_count);
        } catch { /* silent on token absence during logout */ }
    }, []);

    // Poll for unread badge every 30 s
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) fetchNotifications(); // refresh on open
    };

    const handleMarkRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read/`, { method: 'POST' });
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiFetch('/notifications/mark-all-read/', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleRemove = async (id, wasUnread) => {
        try {
            await apiFetch(`/notifications/${id}/delete/`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={handleOpen}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">Notifications</p>
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
                                                className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                                                    !n.is_read ? 'bg-blue-50/50' : ''
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Icon / avatar */}
                                                    <div className={`w-9 h-9 rounded-full ${meta.bg} flex items-center justify-center text-white flex-shrink-0 overflow-hidden`}>
                                                        {n.sender_avatar ? (
                                                            <img
                                                                src={n.sender_avatar}
                                                                alt={n.sender_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Icon className="w-4 h-4" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                                                            {n.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                            {n.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-1">{n.time_ago}</p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={() => handleMarkRead(n.notification_id)}
                                                                className="p-1 hover:bg-white rounded transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRemove(n.notification_id, !n.is_read)}
                                                            className="p-1 hover:bg-white rounded transition-colors"
                                                            title="Dismiss"
                                                        >
                                                            <X className="w-3.5 h-3.5 text-gray-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-gray-100 text-center">
                            <Link
                                to="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-gray-500 hover:text-black transition-colors"
                            >
                                View all notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}