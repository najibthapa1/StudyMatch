import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, MoreVertical, Flag, MessageCircle, UserX, User, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Navbar } from '../Navbar';
import { ProfileModal } from '../ProfileModal';
import { getConnections, removeConnection } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

function SkeletonConnectionCard() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
        </div>

        {/* Bio Skeleton */}
        <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Interests Skeleton */}
        <div className="flex gap-2 mb-6">
            <div className="h-8 bg-gray-200 rounded-full w-20" />
            <div className="h-8 bg-gray-200 rounded-full w-24" />
            <div className="h-8 bg-gray-200 rounded-full w-16" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="h-3 bg-gray-200 rounded w-28" />
            <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
        </div>
    );
    }

    export default function Connections() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ Start as true for initial load
    const [error, setError] = useState(null);
    const [removingUserId, setRemovingUserId] = useState(null);
    const [menuOpenId, setMenuOpenId] = useState(null);
    
    const hasLoadedOnce = useRef(false);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
        setLoading(true);
        setError(null);
        const data = await getConnections({ search: searchQuery });
        setConnections(data.connections);
        setLoading(false);
        hasLoadedOnce.current = true; 
        } catch (err) {
        console.error('Error fetching connections:', err);
        setError(err.error || 'Failed to load connections');
        setLoading(false);
        hasLoadedOnce.current = true;
        }
    };

    useEffect(() => {
        if (!hasLoadedOnce.current) {
        return;
        }

        const timer = setTimeout(() => {
        fetchConnections();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleReport = (connection) => {
        alert('Report functionality will be implemented in the next iteration');
        setMenuOpenId(null);
    };

    const handleMessage = (connection) => {
        navigate('/chat');
        console.log('Open chat with:', connection.profile.full_name);
    };

    const handleRemoveConnection = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this connection?')) {
        return;
        }

        try {
        setRemovingUserId(userId);
        await removeConnection(userId);
        
        setConnections(connections.filter(conn => conn.user_id !== userId));
        setProfileModalOpen(false);
        setMenuOpenId(null);
        
        alert('Connection removed successfully');
        } catch (err) {
        console.error('Error removing connection:', err);
        alert(err.error || 'Failed to remove connection');
        } finally {
        setRemovingUserId(null);
        }
    };

    const handleViewProfile = (connection) => {
        setSelectedConnection({
        name: connection.profile.full_name,
        email: connection.profile.email,
        major: connection.profile.course,
        year: connection.profile.year,
        interests: connection.profile.interests ? connection.profile.interests.split(',').map(i => i.trim()) : [],
        bio: connection.profile.bio,
        avatar: connection.profile.initials,
        location: connection.profile.university_name,
        isConnected: true,
        user_id: connection.user_id,
        });
        setProfileModalOpen(true);
        setMenuOpenId(null);
    };

    if (error) {
        return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Connections</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchConnections} className="bg-black hover:bg-gray-800">
                Try Again
                </Button>
            </div>
            </div>
        </>
        );
    }

    return (
        <>
        <Navbar />
        <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
            {/* Header - Always Visible */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
            >
                <h1 className="text-5xl tracking-tight mb-2">My Connections</h1>
                <p className="text-xl text-gray-600">
                {!hasLoadedOnce.current && loading ? (
                    'Loading your connections...'
                ) : (
                    `${connections.length} ${connections.length === 1 ? 'student' : 'students'} in your network`
                )}
                </p>
            </motion.div>

            {/* Search Bar*/}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
            >
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                    type="text"
                    placeholder="Search connections by name or major..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-0 focus-visible:ring-0"
                    />
                </div>
                </div>
            </motion.div>

            {!hasLoadedOnce.current && loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <SkeletonConnectionCard key={i} />
                ))}
                </div>
            )}

            {hasLoadedOnce.current && loading && (
                <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            )}

            {!loading && (
                <>
                {connections.length === 0 ? (
                    <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center py-16 bg-white rounded-2xl border border-gray-200"
                    >
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-2xl text-gray-600 mb-2">
                        {searchQuery ? 'No connections found' : 'No connections yet'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchQuery ? 'Try adjusting your search' : 'Start connecting with students in the Discovery page'}
                    </p>
                    {!searchQuery && (
                        <Button
                        onClick={() => navigate('/connect')}
                        className="bg-black hover:bg-gray-800"
                        >
                        Discover Students
                        </Button>
                    )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connections.map((connection, index) => (
                        <motion.div
                        key={connection.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-all"
                        >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                            {connection.profile.profile_picture ? (
                                <img
                                src={connection.profile.profile_picture}
                                alt={connection.profile.full_name}
                                className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xl">{connection.profile.initials}</span>
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl mb-1">{connection.profile.full_name}</h3>
                                <p className="text-sm text-gray-600">
                                {connection.profile.course || 'Course not specified'} 
                                {connection.profile.year && ` • ${connection.profile.year}`}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                Active {connection.last_active}
                                </p>
                            </div>
                            </div>
                            <div className="relative">
                            <button
                                onClick={() => setMenuOpenId(menuOpenId === connection.user_id ? null : connection.user_id)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>
                            
                            {menuOpenId === connection.user_id && (
                                <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                    <button
                                    onClick={() => handleViewProfile(connection)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm"
                                    >
                                    <User className="w-4 h-4 mr-2" />
                                    View Profile
                                    </button>
                                    <button
                                    onClick={() => handleRemoveConnection(connection.user_id)}
                                    disabled={removingUserId === connection.user_id}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-red-600 disabled:opacity-50"
                                    >
                                    <UserX className="w-4 h-4 mr-2" />
                                    {removingUserId === connection.user_id ? 'Removing...' : 'Remove Connection'}
                                    </button>
                                    <button
                                    onClick={() => handleReport(connection)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center text-sm text-red-600"
                                    >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Report User
                                    </button>
                                </div>
                                </>
                            )}
                            </div>
                        </div>

                        {/* Bio */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {connection.profile.bio || 'No bio provided'}
                        </p>

                        {/* Interests */}
                        {connection.profile.interests && (
                            <div className="flex flex-wrap gap-2 mb-6">
                            {connection.profile.interests.split(',').slice(0, 3).map((interest) => (
                                <span
                                key={interest.trim()}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                                >
                                {interest.trim()}
                                </span>
                            ))}
                            {connection.profile.interests.split(',').length > 3 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                +{connection.profile.interests.split(',').length - 3} more
                                </span>
                            )}
                            </div>
                        )}

                        {/* Connection Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                            Connected on {connection.connected_date}
                            </div>
                            <Button
                            onClick={() => handleMessage(connection)}
                            size="sm"
                            className="bg-black hover:bg-gray-800"
                            >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                            </Button>
                        </div>
                        </motion.div>
                    ))}
                    </div>
                )}
                </>
            )}

            {/* Profile Modal */}
            {selectedConnection && (
                <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                user={selectedConnection}
                onMessage={() => handleMessage(selectedConnection)}
                onRemove={() => handleRemoveConnection(selectedConnection.user_id)}
                />
            )}
            </div>
        </div>
        </>
    );
}