import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical, UserX, UserCheck, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { AdminNavbar } from '../../AdminNavbar';
import { getAdminUsers, suspendUser, unsuspendUser, deleteUser } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

export function UserList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        total_users: 0,
        active_users: 0,
        suspended_users: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendDays, setSuspendDays] = useState(7);

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, statusFilter]);

    const fetchUsers = async () => {
        try {
        setLoading(true);
        const params = {
            search: searchQuery,
            status: statusFilter,
            page: 1,
            per_page: 50
        };
        const data = await getAdminUsers(params);
        setUsers(data.users);
        setStats(data.stats);
        setLoading(false);
        } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.error || 'Failed to load users');
        setLoading(false);
        }
    };

    const handleSuspendUser = async () => {
        if (!selectedUser || !suspendReason) return;
        
        try {
        await suspendUser(selectedUser.user_id, {
            reason: suspendReason,
            duration_days: suspendDays
        });
        setShowSuspendModal(false);
        setSuspendReason('');
        setSuspendDays(7);
        setSelectedUser(null);
        fetchUsers();
        } catch (err) {
        console.error('Error suspending user:', err);
        alert(err.error || 'Failed to suspend user');
        }
    };

    const handleUnsuspendUser = async (userId) => {
        if (!confirm('Are you sure you want to remove the suspension?')) return;
        
        try {
        await unsuspendUser(userId);
        fetchUsers();
        } catch (err) {
        console.error('Error unsuspending user:', err);
        alert(err.error || 'Failed to unsuspend user');
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!confirm(`Are you sure you want to permanently delete ${userEmail}? This action cannot be undone.`)) return;
        
        try {
        await deleteUser(userId);
        fetchUsers();
        } catch (err) {
        console.error('Error deleting user:', err);
        alert(err.error || 'Failed to delete user');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        navigate('/login');
    };

    const statusStats = [
        { label: 'Total Users', value: stats.total_users, color: 'text-white' },
        { label: 'Active', value: stats.active_users, color: 'text-green-400' },
        { label: 'Suspended', value: stats.suspended_users, color: 'text-red-400' },
    ];

    if (loading) {
        return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading users...</p>
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
                <h2 className="text-2xl font-bold text-white mb-2">Error Loading Users</h2>
                <p className="text-gray-400">{error}</p>
            </div>
            </div>
        </div>
        );
    }

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
            <h1 className="text-4xl tracking-tight mb-2 text-white">User Management</h1>
            <p className="text-gray-400">View and manage all registered users</p>
            </motion.div>

            {/* Status Stats */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8"
            >
            {statusStats.map((stat, index) => (
                <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800"
                >
                <div className="text-gray-400 text-sm mb-2">{stat.label}</div>
                <div className={`text-4xl ${stat.color}`}>{stat.value}</div>
                </motion.div>
            ))}
            </motion.div>

            {/* Search and Filters */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-8"
            >
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-black border-gray-800 text-white placeholder:text-gray-500"
                />
                </div>
                <select 
                className="h-12 px-4 bg-black border border-gray-800 rounded-lg text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                </select>
            </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden"
            >
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-black border-b border-gray-800">
                    <tr>
                    <th className="px-6 py-4 text-left text-sm text-gray-400">User</th>
                    <th className="px-6 py-4 text-left text-sm text-gray-400">University</th>
                    <th className="px-6 py-4 text-left text-sm text-gray-400">Course</th>
                    <th className="px-6 py-4 text-left text-sm text-gray-400">Status</th>
                    <th className="px-6 py-4 text-left text-sm text-gray-400">Join Date</th>
                    <th className="px-6 py-4 text-left text-sm text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No users found
                        </td>
                    </tr>
                    ) : (
                    users.map((user, index) => (
                        <motion.tr
                        key={user.user_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.03 }}
                        className="border-b border-gray-800 hover:bg-[#0f0f0f] transition-colors"
                        >
                        <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user.profile?.initials || 'U'}
                            </div>
                            <div>
                                <p className="text-white text-sm">{user.profile?.full_name || 'N/A'}</p>
                                <p className="text-gray-500 text-xs">{user.email}</p>
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{user.profile?.university_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{user.profile?.course || 'N/A'}</td>
                        <td className="px-6 py-4">
                            {user.is_suspended ? (
                            <div>
                                <span className="px-3 py-1 rounded-full text-xs bg-red-900 text-red-300 block mb-1">
                                Suspended
                                </span>
                                {user.active_suspension && (
                                <span className="text-xs text-gray-500">
                                    {user.active_suspension.days_remaining} days left
                                </span>
                                )}
                            </div>
                            ) : (
                            <span className="px-3 py-1 rounded-full text-xs bg-green-900 text-green-300">
                                Active
                            </span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                            {user.is_suspended ? (
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnsuspendUser(user.user_id)}
                                className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Unsuspend
                                </Button>
                            ) : (
                                <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedUser(user);
                                    setShowSuspendModal(true);
                                }}
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                                >
                                <UserX className="w-4 h-4 mr-1" />
                                Suspend
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.user_id, user.email)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                            </Button>
                            </div>
                        </td>
                        </motion.tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </motion.div>
        </div>

        {/* Suspend Modal */}
        {showSuspendModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 max-w-md w-full"
            >
                <h2 className="text-2xl text-white mb-4">Suspend User</h2>
                <p className="text-gray-400 mb-4">
                Suspending: <span className="text-white">{selectedUser?.email}</span>
                </p>
                
                <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Reason</label>
                <textarea
                    className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white"
                    rows="3"
                    placeholder="Enter suspension reason..."
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                />
                </div>
                
                <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Duration (days)</label>
                <input
                    type="number"
                    className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white"
                    min="1"
                    max="365"
                    value={suspendDays}
                    onChange={(e) => setSuspendDays(parseInt(e.target.value))}
                />
                </div>
                
                <div className="flex items-center space-x-3">
                <Button
                    onClick={handleSuspendUser}
                    disabled={!suspendReason}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                    Suspend User
                </Button>
                <Button
                    onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedUser(null);
                    setSuspendReason('');
                    setSuspendDays(7);
                    }}
                    variant="outline"
                    className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                    Cancel
                </Button>
                </div>
            </motion.div>
            </div>
        )}
        </div>
    );
}