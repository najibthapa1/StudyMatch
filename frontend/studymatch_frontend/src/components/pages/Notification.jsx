import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, X, Check, CheckCircle, UserPlus, Calendar,
    Filter, Trash2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Navbar } from '../Navbar';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteUserNotification,
    clearAllNotifications,
} from '../../utils/api';

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

export default function Notifications() {
    const [filter, setFilter] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getNotifications(filter);
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (err) {
            setError(err.error || 'Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, [filter]);

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

    const handleDelete = async (id, wasUnread) => {
        try {
            await deleteUserNotification(id);
            setNotifications(prev => prev.filter(n => n.notification_id !== id));
            if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
        } catch { /* silent */ }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Clear all notifications?')) return;
        try {
            await clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    if (loading) return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500">Loading notifications...</p>
                </div>
            </div>
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <p className="text-gray-700 mb-4">{error}</p>
                    <Button onClick={fetchNotifications}>Retry</Button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <h1 className="text-5xl tracking-tight mb-1">Notifications</h1>
                        <p className="text-gray-500">
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                                : 'All caught up!'}
                        </p>
                    </motion.div>

                    {/* Filter bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-white rounded-2xl p-4 border border-gray-200 mb-6 flex items-center justify-between gap-4 flex-wrap"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                                {['all', 'unread'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                                            filter === f
                                                ? 'bg-white text-black shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {f}{f === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button onClick={handleMarkAllRead} variant="outline" size="sm" className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    Mark all read
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    onClick={handleClearAll}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1.5 text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </motion.div>

                    {/* List */}
                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white rounded-2xl p-16 border border-gray-200 text-center"
                            >
                                <Bell className="w-14 h-14 mx-auto mb-4 text-gray-200" />
                                <p className="text-gray-500">
                                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                </p>
                            </motion.div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {notifications.map((n, i) => {
                                    const meta = getMeta(n.notification_type);
                                    const Icon = meta.icon;
                                    return (
                                        <motion.div
                                            key={n.notification_id}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                                            transition={{ duration: 0.3, delay: i * 0.03 }}
                                            className={`bg-white rounded-2xl p-5 border transition-all ${
                                                !n.is_read
                                                    ? 'border-blue-100 shadow-sm shadow-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-11 h-11 rounded-full ${meta.bg} flex items-center justify-center text-white flex-shrink-0 overflow-hidden`}>
                                                    {n.sender_avatar ? (
                                                        <img src={n.sender_avatar} alt={n.sender_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Icon className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                                        <p className="font-medium text-gray-900 leading-snug">{n.title}</p>
                                                        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{n.time_ago}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{n.message}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!n.is_read && (
                                                        <button
                                                            onClick={() => handleMarkRead(n.notification_id)}
                                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(n.notification_id, !n.is_read)}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Remove"
                                                    >
                                                        <X className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}