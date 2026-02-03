import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, ArrowLeft, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { AdminNavbar } from '../../AdminNavbar';
import { getAdminGuilds } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

export function GuildManagement() {
    const navigate = useNavigate();
    const [selectedGuild, setSelectedGuild] = useState(null);
    const [guilds, setGuilds] = useState([]);
    const [stats, setStats] = useState({
        total_guilds: 0,
        total_members: 0,
        total_events: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGuilds();
    }, []);

    const fetchGuilds = async () => {
        try {
        setLoading(true);
        const data = await getAdminGuilds();
        setGuilds(data.guilds);
        setStats(data.stats);
        setLoading(false);
        } catch (err) {
        console.error('Error fetching guilds:', err);
        setError(err.error || 'Failed to load guilds');
        setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        navigate('/login');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    if (loading) {
        return (
        <div className="min-h-screen bg-black">
            <AdminNavbar onLogout={handleLogout} />
            <div className="pt-24 flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading guilds...</p>
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
                <h2 className="text-2xl font-bold text-white mb-2">Error Loading Guilds</h2>
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
            {!selectedGuild ? (
            <>
                {/* Guilds List View */}
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
                >
                <h1 className="text-4xl tracking-tight mb-2 text-white">Guild Management</h1>
                <p className="text-gray-400">View all university guilds and their events</p>
                </motion.div>

                {/* Stats */}
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                >
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <Users className="w-10 h-10 mb-4 text-blue-400" />
                    <div className="text-3xl mb-1 text-white">{stats.total_guilds}</div>
                    <div className="text-gray-400">Total Guilds</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <Users className="w-10 h-10 mb-4 text-green-400" />
                    <div className="text-3xl mb-1 text-white">{stats.total_members}</div>
                    <div className="text-gray-400">Total Members</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
                    <Calendar className="w-10 h-10 mb-4 text-purple-400" />
                    <div className="text-3xl mb-1 text-white">{stats.total_events}</div>
                    <div className="text-gray-400">Total Events</div>
                </div>
                </motion.div>

                {/* Guilds Grid */}
                {guilds.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a1a] rounded-2xl p-12 border border-gray-800 text-center"
                >
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">No guilds found</p>
                    <p className="text-gray-600 text-sm mt-2">Guilds are automatically created when users join</p>
                </motion.div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guilds.map((guild, index) => (
                    <motion.div
                        key={guild.guild_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                        onClick={() => setSelectedGuild(guild)}
                        className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 hover:shadow-lg hover:shadow-blue-900/20 hover:border-blue-800 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-xl">{guild.name.charAt(0)}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            {guild.event_count || 0} events
                        </div>
                        </div>

                        <h3 className="text-xl mb-2 text-white group-hover:text-blue-400 transition-colors">
                        {guild.name}
                        </h3>
                        
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {guild.description || 'No description'}
                        </p>
                        
                        <div className="flex items-center space-x-2 text-gray-400 mb-4">
                        <Users className="w-4 h-4" />
                        <span>{guild.member_count} members</span>
                        </div>

                        {guild.events && guild.events.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {guild.events.slice(0, 2).map((event) => (
                            <span
                                key={event.event_id}
                                className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs"
                            >
                                {event.category.replace('_', ' ')}
                            </span>
                            ))}
                            {guild.events.length > 2 && (
                            <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs">
                                +{guild.events.length - 2} more
                            </span>
                            )}
                        </div>
                        )}

                        <Button 
                        variant="outline" 
                        className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-colors"
                        >
                        View Events
                        </Button>
                    </motion.div>
                    ))}
                </div>
                )}
            </>
            ) : (
            <>
                {/* Guild Events Detail View */}
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
                >
                <Button
                    onClick={() => setSelectedGuild(null)}
                    variant="ghost"
                    className="mb-4 text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Guilds
                </Button>
                
                <div className="flex items-center justify-between">
                    <div>
                    <h1 className="text-4xl tracking-tight mb-2 text-white">
                        {selectedGuild.name}
                    </h1>
                    <p className="text-gray-400">
                        {selectedGuild.member_count} members • {selectedGuild.events?.length || 0} events
                    </p>
                    </div>
                </div>
                </motion.div>

                {/* Events List */}
                {!selectedGuild.events || selectedGuild.events.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1a1a1a] rounded-2xl p-12 border border-gray-800 text-center"
                >
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">No events found for this guild</p>
                </motion.div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedGuild.events.map((event, index) => (
                    <motion.div
                        key={event.event_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                        className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden hover:shadow-lg hover:shadow-gray-900/50 transition-shadow"
                    >
                        {/* Event Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                            {event.category.replace('_', ' ').charAt(0).toUpperCase() + event.category.replace('_', ' ').slice(1)}
                            </span>
                            {event.status === 'pending' && (
                            <span className="px-3 py-1 bg-yellow-500/80 backdrop-blur-sm rounded-full text-sm flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                            </span>
                            )}
                            {event.status === 'confirmed' && (
                            <span className="px-3 py-1 bg-green-500/80 backdrop-blur-sm rounded-full text-sm flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Confirmed
                            </span>
                            )}
                        </div>
                        <h3 className="text-2xl mb-2">{event.title}</h3>
                        <p className="text-sm text-white/80">Created by {event.created_by_name}</p>
                        </div>

                        {/* Event Details */}
                        <div className="p-6">
                        <p className="text-gray-400 mb-6">{event.description}</p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center space-x-3 text-gray-300">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <span>{formatDate(event.date)}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-300">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <span>{formatTime(event.time_start)} - {formatTime(event.time_end)}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-300">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <span>{event.venue}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-gray-300">
                            <Users className="w-5 h-5 text-gray-500" />
                            {event.status === 'pending' ? (
                                <span>{event.pre_joined_count} / 5 students pre-joined</span>
                            ) : (
                                <span>{event.attendee_count} attending</span>
                            )}
                            </div>
                        </div>

                        {/* Pre-joined Students List (if pending) */}
                        {event.status === 'pending' && event.pre_joined_users && event.pre_joined_users.length > 0 && (
                            <div className="bg-gray-800 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-400 mb-2">Pre-joined Students:</p>
                            <div className="flex flex-wrap gap-2">
                                {event.pre_joined_users.map((student, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                                >
                                    {student.name}
                                </span>
                                ))}
                            </div>
                            </div>
                        )}
                        </div>
                    </motion.div>
                    ))}
                </div>
                )}
            </>
            )}
        </div>
        </div>
    );
}