import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, Clock, Users, CheckCircle, Plus, X,
    AlertCircle, Building2, Loader2, Trash2, ChevronRight,
    Award, UserCheck, ImagePlus, Camera, ZoomIn, Download,
    CalendarX, Image
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Navbar } from '../Navbar';

// ─── API helpers (add these to your api.js too) ───────────────────────────
import {
    getMyGuild,
    getGuildEvents,
    createEvent,
    joinEvent,
    leaveEvent,
    deleteEvent,
    getMyEvents,
    uploadEventPhoto,
    deleteEventPhoto,
} from '../../utils/api';

// ─── Constants ────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
    { value: 'workshop',    label: 'Workshop',    color: 'bg-blue-100 text-blue-700',   gradient: 'from-blue-500 to-blue-600' },
    { value: 'study_group', label: 'Study Group', color: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-teal-600' },
    { value: 'competition', label: 'Competition', color: 'bg-red-100 text-red-700',     gradient: 'from-red-500 to-rose-600' },
    { value: 'networking',  label: 'Networking',  color: 'bg-purple-100 text-purple-700', gradient: 'from-purple-500 to-violet-600' },
    { value: 'symposium',   label: 'Symposium',   color: 'bg-orange-100 text-orange-700', gradient: 'from-orange-500 to-amber-600' },
];

const getCat = (value) => CATEGORY_OPTIONS.find(c => c.value === value) || { label: value, color: 'bg-gray-100 text-gray-700', gradient: 'from-gray-400 to-gray-500' };

const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Lightbox ─────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }) {
    const [idx, setIdx] = useState(startIndex);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, photos.length - 1));
            if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [photos.length, onClose]);

    const photo = photos[idx];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
            onClick={onClose}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <span className="text-white/60 text-sm">{idx + 1} / {photos.length}</span>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
                {idx > 0 && (
                    <button
                        onClick={() => setIdx(i => i - 1)}
                        className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-white rotate-180" />
                    </button>
                )}
                <motion.img
                    key={idx}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    src={photo.photo_url || photo.photo}
                    alt={photo.caption || 'Event photo'}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl"
                />
                {idx < photos.length - 1 && (
                    <button
                        onClick={() => setIdx(i => i + 1)}
                        className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                )}
            </div>

            {/* Caption & uploader */}
            {(photo.caption || photo.uploaded_by_name) && (
                <div className="px-6 py-4 text-center flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {photo.caption && <p className="text-white text-sm mb-1">{photo.caption}</p>}
                    {photo.uploaded_by_name && (
                        <p className="text-white/40 text-xs">by {photo.uploaded_by_name}</p>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// ─── Photo Gallery Panel ───────────────────────────────────────────────────
function PhotoGallery({ event, currentUser, onPhotosChange }) {
    const [uploading, setUploading] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const fileRef = useRef(null);
    const photos = event.photos || [];

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('photo', file);
                await uploadEventPhoto(event.event_id, formData);
            }
            onPhotosChange();
        } catch (err) {
            alert(err?.error || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleDelete = async (photoId) => {
        if (!window.confirm('Delete this photo?')) return;
        setDeletingId(photoId);
        try {
            await deleteEventPhoto(photoId);
            onPhotosChange();
        } catch (err) {
            alert(err?.error || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    const isParticipant = event.is_joined;

    return (
        <div className="mt-5 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                        Event Photos
                        {photos.length > 0 && (
                            <span className="ml-1.5 text-xs text-gray-400">({photos.length})</span>
                        )}
                    </span>
                </div>
                {isParticipant && (
                    <>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleUpload}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            {uploading ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                            ) : (
                                <><ImagePlus className="w-3 h-3" /> Add Photos</>
                            )}
                        </button>
                    </>
                )}
            </div>

            {photos.length === 0 ? (
                <div className="bg-gray-50 rounded-xl py-6 text-center">
                    <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                        {isParticipant ? 'No photos yet — share your memories!' : 'No photos yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, i) => (
                        <div key={photo.photo_id} className="relative group aspect-square">
                            <img
                                src={photo.photo_url || photo.photo}
                                alt={photo.caption || `Photo ${i + 1}`}
                                className="w-full h-full object-cover rounded-lg cursor-pointer"
                                onClick={() => setLightboxIdx(i)}
                            />
                            {/* Hover overlay */}
                            <div
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                                onClick={() => setLightboxIdx(i)}
                            >
                                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {/* Delete (own photo only) */}
                            {photo.uploaded_by === currentUser?.user_id && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.photo_id); }}
                                    disabled={deletingId === photo.photo_id}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    {deletingId === photo.photo_id
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <X className="w-3 h-3" />
                                    }
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIdx !== null && (
                    <Lightbox
                        photos={photos}
                        startIndex={lightboxIdx}
                        onClose={() => setLightboxIdx(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Event Card ────────────────────────────────────────────────────────────
function EventCard({ event, currentUser, onJoin, onLeave, onDelete, onPhotosChange, actionLoading }) {
    const [expanded, setExpanded] = useState(false);
    const cat = getCat(event.category);
    const isExpired = event.is_expired;
    const isPending = event.status === 'pending';
    const isConfirmed = event.status === 'confirmed';
    const isCreator = event.created_by === currentUser?.user_id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-2xl border overflow-hidden transition-all duration-300 group ${
                isExpired ? 'border-gray-200 opacity-90' : 'border-gray-200 hover:shadow-xl hover:shadow-gray-100'
            }`}
        >
            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${isExpired ? 'from-gray-400 to-gray-500' : cat.gradient} p-6 text-white relative`}>
                {/* Expired ribbon */}
                {isExpired && (
                    <div className="absolute top-0 right-0">
                        <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-bl-xl flex items-center gap-1.5">
                            <CalendarX className="w-3 h-3" />
                            Event Ended
                        </div>
                    </div>
                )}

                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap pr-20">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                            {cat.label}
                        </span>
                        {!isExpired && isPending && (
                            <span className="px-3 py-1 bg-yellow-400/80 text-yellow-900 rounded-full text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending ({event.pre_joined_count}/3)
                            </span>
                        )}
                        {!isExpired && isConfirmed && (
                            <span className="px-3 py-1 bg-green-400/80 text-green-900 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Confirmed
                            </span>
                        )}
                        {isExpired && isConfirmed && (
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Was Confirmed
                            </span>
                        )}
                    </div>
                    {/* Delete button — creator, pending, future only */}
                    {isCreator && isPending && !isExpired && (
                        <button
                            onClick={() => onDelete(event.event_id)}
                            disabled={actionLoading === event.event_id}
                            className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg transition-colors ml-2"
                            title="Delete event"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <h3 className="text-xl font-semibold mb-1 leading-tight">{event.title}</h3>
                <p className="text-white/70 text-xs">Created by {event.created_by_name}</p>

                {/* Pending progress bar (future only) */}
                {isPending && !isExpired && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-white/70 mb-1">
                            <span>Pre-joins needed</span>
                            <span>{event.pre_joined_count}/3</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((event.pre_joined_count / 3) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-6">
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{formatTime(event.time_start)} – {formatTime(event.time_end)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {isPending
                            ? <span>{event.pre_joined_count} pre-joined</span>
                            : <span>{event.attendee_count} attended</span>
                        }
                    </div>
                </div>

                {/* Action button */}
                {isExpired ? (
                    <div className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl py-2.5 text-sm">
                        <CalendarX className="w-4 h-4" />
                        Event has ended
                    </div>
                ) : actionLoading === event.event_id ? (
                    <Button disabled className="w-full rounded-xl">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                    </Button>
                ) : event.is_joined ? (
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl py-2.5 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {isConfirmed ? "You're going" : 'Pre-joined'}
                        </div>
                        {isPending && !isCreator && (
                            <button
                                onClick={() => onLeave(event.event_id)}
                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-red-200 hover:text-red-500 transition-colors"
                            >
                                Leave
                            </button>
                        )}
                    </div>
                ) : (
                    <Button
                        onClick={() => onJoin(event.event_id)}
                        className="w-full bg-black hover:bg-gray-800 rounded-xl"
                    >
                        {isPending ? 'Pre-Join Event' : 'Join Event'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}

                {/* Photo gallery — only for expired events */}
                {isExpired && (
                    <>
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            {expanded ? 'Hide photos' : `${event.photos?.length ? `View ${event.photos.length} photo${event.photos.length !== 1 ? 's' : ''}` : 'Add event photos'}`}
                        </button>

                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <PhotoGallery
                                        event={event}
                                        currentUser={currentUser}
                                        onPhotosChange={onPhotosChange}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </motion.div>
    );
}

// ─── Main Guild Page ───────────────────────────────────────────────────────
export default function Guild() {
    const [guild, setGuild] = useState(null);
    const [events, setEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'upcoming' | 'past'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    const currentUser = (() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();

    const emptyForm = { title: '', description: '', category: '', date: '', time_start: '', time_end: '', venue: '' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchGuildData(); }, []);

    const fetchGuildData = async () => {
        try {
            setLoading(true);
            setError(null);
            const guildData = await getMyGuild();
            setGuild(guildData);
            const [eventsData, myEventsData] = await Promise.all([
                getGuildEvents(guildData.guild_id),
                getMyEvents()
            ]);
            setEvents(eventsData);
            setMyEvents(myEventsData);
        } catch (err) {
            setError(err?.error || 'Failed to load guild data');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (eventId) => {
        try {
            setActionLoading(eventId);
            await joinEvent(eventId);
            await fetchGuildData();
        } catch (err) { alert(err?.error || 'Failed to join event'); }
        finally { setActionLoading(null); }
    };

    const handleLeave = async (eventId) => {
        if (!window.confirm('Leave this event?')) return;
        try {
            setActionLoading(eventId);
            await leaveEvent(eventId);
            await fetchGuildData();
        } catch (err) { alert(err?.error || 'Failed to leave event'); }
        finally { setActionLoading(null); }
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm('Delete this event? This cannot be undone.')) return;
        try {
            setActionLoading(eventId);
            await deleteEvent(eventId);
            await fetchGuildData();
        } catch (err) { alert(err?.error || 'Failed to delete event'); }
        finally { setActionLoading(null); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateError('');
        if (!form.title.trim()) return setCreateError('Title is required');
        if (!form.category) return setCreateError('Category is required');
        if (!form.date) return setCreateError('Date is required');
        if (!form.time_start || !form.time_end) return setCreateError('Start and end time are required');
        if (!form.venue.trim()) return setCreateError('Venue is required');
        if (!form.description.trim()) return setCreateError('Description is required');

        try {
            setCreateLoading(true);
            await createEvent(guild.guild_id, form);
            setForm(emptyForm);
            setIsCreating(false);
            await fetchGuildData();
        } catch (err) {
            setCreateError(err?.error || 'Failed to create event');
        } finally {
            setCreateLoading(false);
        }
    };

    // Derived lists
    const source = activeTab === 'joined' ? myEvents : events;

    const filtered = source.filter(e => {
        const catOk = filterCategory === 'all' || e.category === filterCategory;
        const statusOk =
            filterStatus === 'all' ? true :
            filterStatus === 'upcoming' ? !e.is_expired :
            e.is_expired;
        return catOk && statusOk;
    });

    const upcomingCount = events.filter(e => !e.is_expired).length;
    const pastCount = events.filter(e => e.is_expired).length;
    const confirmedCount = events.filter(e => e.status === 'confirmed' && !e.is_expired).length;

    // ── Loading / Error states ──
    if (loading) return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Loading your guild...</p>
                </div>
            </div>
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Guild Not Found</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <Button onClick={fetchGuildData} className="bg-black hover:bg-gray-800">Try Again</Button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-16 px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">

                    {/* ── Guild Header ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-10"
                    >
                        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8 md:p-10 text-white">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                            <Building2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl md:text-4xl tracking-tight mb-1">{guild?.name}</h1>
                                            <p className="text-white/50 text-sm">{guild?.description || 'Official university guild'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setIsCreating(true)}
                                        className="bg-white text-black hover:bg-gray-100 self-start md:self-auto shadow-none"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Event
                                    </Button>
                                </div>
                            </div>

                            {/* Stats strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
                                {[
                                    { label: 'Members',   value: guild?.member_count || 0, icon: Users,        color: 'text-blue-500' },
                                    { label: 'Upcoming',  value: upcomingCount,             icon: Calendar,     color: 'text-purple-500' },
                                    { label: 'Confirmed', value: confirmedCount,             icon: CheckCircle,  color: 'text-green-500' },
                                    { label: 'My Events', value: myEvents.length,            icon: Award,        color: 'text-orange-500' },
                                ].map(stat => (
                                    <div key={stat.label} className="p-5 text-center">
                                        <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Tabs + Filters ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="flex flex-col gap-4 mb-8"
                    >
                        {/* Row 1: tab switcher + status filter */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            {/* Tabs */}
                            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 shadow-sm">
                                {[
                                    { id: 'all', label: 'All Events', count: events.length },
                                    { id: 'joined', label: 'My Joined', count: myEvents.length, icon: UserCheck },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                            activeTab === tab.id
                                                ? 'bg-black text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Status filter */}
                            <div className="flex gap-2">
                                {[
                                    { id: 'all',      label: 'All' },
                                    { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
                                    { id: 'past',     label: `Past (${pastCount})` },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilterStatus(f.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                            filterStatus === f.id
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 2: category chips */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterCategory('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    filterCategory === 'all'
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                All Categories
                            </button>
                            {CATEGORY_OPTIONS.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setFilterCategory(cat.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                        filterCategory === cat.value
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Pending events notice */}
                    {activeTab === 'all' && filterStatus !== 'past' && events.filter(e => e.status === 'pending' && !e.is_expired).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3"
                        >
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">
                                    {events.filter(e => e.status === 'pending' && !e.is_expired).length} event{events.filter(e => e.status === 'pending' && !e.is_expired).length > 1 ? 's' : ''} need{events.filter(e => e.status === 'pending' && !e.is_expired).length === 1 ? 's' : ''} 3 pre-joins to be confirmed.
                                </span>
                                {' '}Pre-join to help organizers!
                            </p>
                        </motion.div>
                    )}

                    {/* Past events photo hint */}
                    {(filterStatus === 'past' || activeTab === 'joined') && pastCount > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3"
                        >
                            <Camera className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                                Past events now show a <span className="font-medium">photo gallery</span>.
                                Participants can upload memories from the event!
                            </p>
                        </motion.div>
                    )}

                    {/* ── Events Grid ── */}
                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20 bg-white rounded-2xl border border-gray-200"
                        >
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                {activeTab === 'joined'
                                    ? "You haven't joined any events yet"
                                    : filterCategory !== 'all' || filterStatus !== 'all'
                                    ? 'Try changing the filters above'
                                    : 'Be the first to create an event!'}
                            </p>
                            {activeTab === 'joined'
                                ? <Button onClick={() => setActiveTab('all')} variant="outline">Browse All Events</Button>
                                : <Button onClick={() => setIsCreating(true)} className="bg-black hover:bg-gray-800">
                                    <Plus className="w-4 h-4 mr-2" />Create Event
                                  </Button>
                            }
                        </motion.div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filtered.map(event => (
                                    <EventCard
                                        key={event.event_id}
                                        event={event}
                                        currentUser={currentUser}
                                        onJoin={handleJoin}
                                        onLeave={handleLeave}
                                        onDelete={handleDelete}
                                        onPhotosChange={fetchGuildData}
                                        actionLoading={actionLoading}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── Create Event Modal ── */}
            <AnimatePresence>
                {isCreating && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setIsCreating(false); setCreateError(''); setForm(emptyForm); }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none"
                        >
                            <div
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto pointer-events-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-2xl tracking-tight text-gray-900">Create New Event</h2>
                                        <p className="text-sm text-gray-400 mt-0.5">For {guild?.name}</p>
                                    </div>
                                    <button
                                        onClick={() => { setIsCreating(false); setCreateError(''); setForm(emptyForm); }}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Info banner */}
                                <div className="mx-6 mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-blue-800">
                                        Your event needs <span className="font-medium">3 pre-joins</span> to be confirmed.
                                        You'll automatically be counted as the first pre-join.
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleCreate} className="p-6 space-y-4">
                                    {createError && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                            <p className="text-sm text-red-600">{createError}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ev-title">Event Title *</Label>
                                        <Input id="ev-title" placeholder="e.g., React Study Group" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-11" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ev-category">Category *</Label>
                                        <select
                                            id="ev-category"
                                            value={form.category}
                                            onChange={e => setForm({ ...form, category: e.target.value })}
                                            className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-black"
                                        >
                                            <option value="">Select category</option>
                                            {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ev-desc">Description *</Label>
                                        <Textarea id="ev-desc" placeholder="Describe your event..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="ev-date">Date *</Label>
                                            <Input id="ev-date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-11" min={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="ev-start">Start Time *</Label>
                                            <Input id="ev-start" type="time" value={form.time_start} onChange={e => setForm({ ...form, time_start: e.target.value })} className="h-11" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="ev-end">End Time *</Label>
                                            <Input id="ev-end" type="time" value={form.time_end} onChange={e => setForm({ ...form, time_end: e.target.value })} className="h-11" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="ev-venue">Venue *</Label>
                                        <Input id="ev-venue" placeholder="e.g., Library Room 201" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="h-11" />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button type="submit" disabled={createLoading} className="flex-1 h-11 bg-black hover:bg-gray-800">
                                            {createLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Event</>}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setCreateError(''); setForm(emptyForm); }} className="flex-1 h-11" disabled={createLoading}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}