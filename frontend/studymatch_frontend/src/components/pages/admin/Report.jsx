import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Flag, AlertCircle, CheckCircle, XCircle, Clock,
    Filter, ChevronDown, Loader2, UserX
} from 'lucide-react';
import { Button } from '../../ui/button';
import { AdminNavbar } from '../../AdminNavbar';
import { useNavigate } from 'react-router-dom';
import { getAdminReports, updateAdminReport } from '../../../utils/api';

const STATUS_META = {
    pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-800', icon: Clock        },
    reviewed:     { label: 'Reviewed',     color: 'bg-blue-100 text-blue-800',     icon: CheckCircle  },
    dismissed:    { label: 'Dismissed',    color: 'bg-gray-100 text-gray-600',     icon: XCircle      },
    action_taken: { label: 'Action Taken', color: 'bg-green-100 text-green-800',   icon: CheckCircle  },
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || STATUS_META.pending;
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
        </span>
    );
}

export function ReportsManagement() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, reviewed: 0, action_taken: 0 });
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [adminNotes, setAdminNotes] = useState({});
    const [sendNotification, setSendNotification] = useState({});
    const [notificationMessage, setNotificationMessage] = useState({});

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAdminReports(statusFilter);
            setReports(data.reports);
            setStats(data.stats);
        } catch (err) {
            setError(err.error || 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, [statusFilter]);

    const handleUpdateReport = async (reportId, newStatus) => {
        setUpdating(reportId);
        try {
            await updateAdminReport(reportId, {
                status: newStatus,
                admin_notes: adminNotes[reportId] || '',
                send_notification: sendNotification[reportId] || false,
                notification_message: notificationMessage[reportId] || '',
            });
            await fetchReports();
            setExpandedId(null);
            // Clear notification state
            setSendNotification(prev => ({ ...prev, [reportId]: false }));
            setNotificationMessage(prev => ({ ...prev, [reportId]: '' }));
        } catch (err) {
            alert(err.error || 'Failed to update report');
        } finally {
            setUpdating(null);
        }
    };

    const handleLogout = () => {
        ['access_token', 'refresh_token', 'user_role', 'user_email'].forEach(k =>
            localStorage.removeItem(k)
        );
        navigate('/login');
    };

    const statCards = [
        { label: 'Total Reports',  value: stats.total,        color: 'text-white',      bg: 'bg-gray-800'   },
        { label: 'Pending Review', value: stats.pending,      color: 'text-yellow-400', bg: 'bg-[#1a1a1a]'  },
        { label: 'Reviewed',       value: stats.reviewed,     color: 'text-blue-400',   bg: 'bg-[#1a1a1a]'  },
        { label: 'Action Taken',   value: stats.action_taken, color: 'text-green-400',  bg: 'bg-[#1a1a1a]'  },
    ];

    if (loading) return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-white mx-auto mb-3" />
                    <p className="text-gray-400">Loading reports...</p>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl text-white mb-2">Error Loading Reports</h2>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Button onClick={fetchReports}>Retry</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-black">
            <AdminNavbar onLogout={handleLogout} />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-4xl tracking-tight text-white mb-1">User Reports</h1>
                    <p className="text-gray-400">Review and action community reports</p>
                </motion.div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className={`${s.bg} rounded-2xl p-6 border border-gray-800`}
                        >
                            <p className="text-gray-400 text-sm mb-2">{s.label}</p>
                            <p className={`text-4xl font-light ${s.color}`}>{s.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Filter */}
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800 mb-6 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <div className="flex gap-1 flex-wrap">
                        {['all', 'pending', 'reviewed', 'dismissed', 'action_taken'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 rounded-xl text-sm capitalize transition-all ${
                                    statusFilter === s
                                        ? 'bg-white text-black'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                            >
                                {s === 'action_taken' ? 'Action Taken' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reports list */}
                <div className="space-y-3">
                    {reports.length === 0 ? (
                        <div className="bg-[#1a1a1a] rounded-2xl p-16 border border-gray-800 text-center">
                            <Flag className="w-14 h-14 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500">No reports found for this filter</p>
                        </div>
                    ) : (
                        reports.map((report, i) => (
                            <motion.div
                                key={report.report_id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden"
                            >
                                {/* Summary row — click to expand */}
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#222] transition-colors"
                                    onClick={() =>
                                        setExpandedId(expandedId === report.report_id ? null : report.report_id)
                                    }
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-sm font-medium">
                                                {report.reported_user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-white font-medium truncate">
                                                    {report.reported_user.full_name}
                                                </span>
                                                <span className="text-gray-500 text-sm">reported by</span>
                                                <span className="text-gray-300 text-sm truncate">
                                                    {report.reported_by.full_name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded-full capitalize">
                                                    {report.reason_display}
                                                </span>
                                                <span className="text-xs text-gray-500">{report.time_ago}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <StatusBadge status={report.status} />
                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-500 transition-transform ${
                                                expandedId === report.report_id ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {expandedId === report.report_id && (
                                    <div className="border-t border-gray-800 p-5 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-black/40 rounded-xl p-4">
                                                <p className="text-xs text-gray-500 mb-2">Reported User</p>
                                                <p className="text-white font-medium">{report.reported_user.full_name}</p>
                                                <p className="text-gray-400 text-sm">{report.reported_user.email}</p>
                                                {report.reported_user.is_suspended && (
                                                    <span className="mt-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-900/50 text-red-300 rounded-full">
                                                        <UserX className="w-3 h-3" /> Suspended
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-black/40 rounded-xl p-4">
                                                <p className="text-xs text-gray-500 mb-2">Reported By</p>
                                                <p className="text-white font-medium">{report.reported_by.full_name}</p>
                                                <p className="text-gray-400 text-sm">{report.reported_by.email}</p>
                                            </div>
                                        </div>

                                        {report.details && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Additional Details</p>
                                                <p className="text-gray-300 text-sm bg-black/40 rounded-xl p-4">{report.details}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Admin Notes</p>
                                            <textarea
                                                value={adminNotes[report.report_id] ?? report.admin_notes ?? ''}
                                                onChange={e =>
                                                    setAdminNotes(prev => ({ ...prev, [report.report_id]: e.target.value }))
                                                }
                                                placeholder="Add internal notes..."
                                                rows={2}
                                                className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
                                            />
                                        </div>

                                        {/* Send Notification Section */}
                                        <div className="border-t border-gray-800 pt-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sendNotification[report.report_id] ?? false}
                                                        onChange={e =>
                                                            setSendNotification(prev => ({
                                                                ...prev,
                                                                [report.report_id]: e.target.checked
                                                            }))
                                                        }
                                                        className="w-4 h-4 rounded border-gray-600 bg-black/40 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-gray-300">Send notification to user</span>
                                                </label>
                                            </div>
                                            
                                            {sendNotification[report.report_id] && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2">Message to Send</p>
                                                    <textarea
                                                        value={notificationMessage[report.report_id] ?? ''}
                                                        onChange={e =>
                                                            setNotificationMessage(prev => ({
                                                                ...prev,
                                                                [report.report_id]: e.target.value
                                                            }))
                                                        }
                                                        placeholder="Example: 'You have been reported for violating community guidelines. This is a warning. Continued violations will result in account suspension.'"
                                                        rows={3}
                                                        className="w-full bg-black/40 border border-gray-700 rounded-xl p-3 text-sm text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-2">The user will receive this message as a notification</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {report.status === 'pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => handleUpdateReport(report.report_id, 'reviewed')}
                                                        disabled={updating === report.report_id}
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    >
                                                        {updating === report.report_id
                                                            ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                            : <CheckCircle className="w-4 h-4 mr-1" />
                                                        }
                                                        Mark Reviewed
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUpdateReport(report.report_id, 'action_taken')}
                                                        disabled={updating === report.report_id}
                                                        size="sm"
                                                        className="bg-green-700 hover:bg-green-600 text-white"
                                                    >
                                                        <Flag className="w-4 h-4 mr-1" />
                                                        Action Taken
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUpdateReport(report.report_id, 'dismissed')}
                                                        disabled={updating === report.report_id}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-gray-700 text-gray-400 hover:text-white"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Dismiss
                                                    </Button>
                                                </>
                                            )}
                                            {report.status !== 'pending' && (
                                                <Button
                                                    onClick={() => handleUpdateReport(report.report_id, 'pending')}
                                                    disabled={updating === report.report_id}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-gray-700 text-gray-400 hover:text-white"
                                                >
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Reopen
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}