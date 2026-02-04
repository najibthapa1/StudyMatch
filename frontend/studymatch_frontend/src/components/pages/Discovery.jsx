import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, UserPlus, MoreVertical, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Navbar } from '../Navbar';
import { ProfileModal } from '../ProfileModal';
import { getDiscoveryUsers, sendConnectionRequest, acceptConnectionRequest } from '../../utils/api';

export default function Discovery() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [students, setStudents] = useState([]);
    const [filters, setFilters] = useState({
        available_courses: [],
        available_years: []
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [connectingUserId, setConnectingUserId] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, [searchQuery, selectedCourse, selectedYear, pagination.page]);

    useEffect(() => {
        const timer = setTimeout(() => {
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        } else {
            fetchStudents();
        }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchStudents = async () => {
        try {
        setLoading(true);
        setError(null);
        
        const params = {
            page: pagination.page,
            per_page: pagination.per_page
        };
        
        if (searchQuery) params.search = searchQuery;
        if (selectedCourse) params.course = selectedCourse;
        if (selectedYear) params.year = selectedYear;
        
        const data = await getDiscoveryUsers(params);
        
        setStudents(data.users);
        setPagination(data.pagination);
        setFilters(data.filters);
        setLoading(false);
        } catch (err) {
        console.error('Error fetching students:', err);
        setError(err.error || 'Failed to load students');
        setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedCourse('');
        setSelectedYear('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleViewProfile = (student) => {
        setSelectedStudent(student);
        setProfileModalOpen(true);
    };

    const handleConnect = async (userId, student) => {
        if (!userId) {
        userId = selectedStudent?.user_id;
        student = selectedStudent;
        }
        
        if (!userId) return;
        
        try {
        setConnectingUserId(userId);
        
        if (student?.connection_status === 'pending_received' && student?.request_id) {
            await acceptConnectionRequest(student.request_id);
            alert('Connection request accepted!');
        } else {
            await sendConnectionRequest(userId);
            alert('Connection request sent successfully!');
        }
        
        await fetchStudents();
        
        if (profileModalOpen) {
            setProfileModalOpen(false);
        }
        } catch (err) {
        console.error('Error with connection request:', err);
        alert(err.error || 'Failed to process connection request');
        } finally {
        setConnectingUserId(null);
        }
    };

    const getConnectionButtonText = (student) => {
        if (student.is_connected) {
        return 'Connected';
        }
        if (student.connection_status === 'pending_sent') {
        return 'Request Sent';
        }
        if (student.connection_status === 'pending_received') {
        return 'Accept Request';
        }
        return 'Connect';
    };

    const isConnectionDisabled = (student) => {
        return student.is_connected || student.connection_status === 'pending_sent';
    };

    const hasActiveFilters = searchQuery || selectedCourse || selectedYear;

    if (error) {
        return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 pb-12 px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Students</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchStudents} className="bg-black hover:bg-gray-800">
                    Try Again
                    </Button>
                </div>
                </div>
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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
            >
                <h1 className="text-5xl tracking-tight mb-2">Discover Students</h1>
                <p className="text-xl text-gray-600">Connect with fellow learners from your university</p>
            </motion.div>

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
            >
                <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by name, interests, or bio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12"
                    />
                    </div>

                    {/* Course Filter */}
                    <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                    <option value="">All Courses</option>
                    {filters.available_courses.map((course) => (
                        <option key={course} value={course}>{course}</option>
                    ))}
                    </select>

                    {/* Year Filter */}
                    <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                    <option value="">All Years</option>
                    {filters.available_years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                    </select>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                    <div className="md:col-span-3">
                        <Button
                        onClick={handleClearFilters}
                        variant="outline"
                        className="h-12"
                        >
                        Clear Filters
                        </Button>
                    </div>
                    )}
                </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                <p>
                    Showing {students.length > 0 ? ((pagination.page - 1) * pagination.per_page) + 1 : 0} - {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} students
                </p>
                </div>
            </motion.div>

            {loading && (
                <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Loading students...</p>
                </div>
                </div>
            )}

            {!loading && students.length === 0 && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-12 border border-gray-200 text-center"
                >
                <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-2xl mb-2">No students found</h3>
                <p className="text-gray-600 mb-4">
                    {hasActiveFilters 
                    ? "Try adjusting your filters or search query" 
                    : "No students to discover yet"}
                </p>
                {hasActiveFilters && (
                    <Button onClick={handleClearFilters} className="bg-black hover:bg-gray-800">
                    Clear Filters
                    </Button>
                )}
                </motion.div>
            )}

            {/* Student Cards Grid */}
            {!loading && students.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {students.map((student, index) => (
                    <motion.div
                    key={student.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-all group"
                    >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                        {student.profile.profile_picture ? (
                            <img
                            src={student.profile.profile_picture}
                            alt={student.profile.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xl">{student.profile.initials}</span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-xl mb-1 truncate">{student.profile.full_name}</h3>
                            {student.is_connected && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                Connected
                            </span>
                            )}
                        </div>
                        </div>
                        <button
                        onClick={() => handleViewProfile(student)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Student Info */}
                    <div className="mb-4">
                        <p className="text-gray-600 mb-1">
                        {student.profile.course || 'Course not specified'} 
                        {student.profile.year && ` • ${student.profile.year}`}
                        </p>
                        <p className="text-sm text-gray-500">{student.profile.university_name}</p>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {student.profile.bio || 'No bio provided'}
                    </p>

                    {student.profile.interests && (
                        <div className="flex flex-wrap gap-2 mb-6">
                        {student.profile.interests.split(',').slice(0, 3).map((interest) => (
                            <span
                            key={interest.trim()}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                            {interest.trim()}
                            </span>
                        ))}
                        {student.profile.interests.split(',').length > 3 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            +{student.profile.interests.split(',').length - 3} more
                            </span>
                        )}
                        </div>
                    )}

                    <Button
                        onClick={() => handleConnect(student.user_id, student)}
                        disabled={isConnectionDisabled(student) || connectingUserId === student.user_id}
                        className={`w-full group-hover:scale-105 transition-transform ${
                        student.is_connected 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : student.connection_status === 'pending_received'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-black hover:bg-gray-800'
                        }`}
                    >
                        {connectingUserId === student.user_id ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                        </>
                        ) : (
                        <>
                            {student.is_connected ? (
                            <UserCheck className="w-4 h-4 mr-2" />
                            ) : (
                            <UserPlus className="w-4 h-4 mr-2" />
                            )}
                            {getConnectionButtonText(student)}
                        </>
                        )}
                    </Button>
                    </motion.div>
                ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && students.length > 0 && pagination.total_pages > 1 && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center justify-center space-x-2"
                >
                <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    variant="outline"
                    className="h-10"
                >
                    Previous
                </Button>

                {[...Array(Math.min(pagination.total_pages, 5))].map((_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                    } else {
                    pageNum = pagination.page - 2 + i;
                    }

                    return (
                    <Button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        className={`h-10 w-10 ${
                        pagination.page === pageNum ? 'bg-black hover:bg-gray-800' : ''
                        }`}
                    >
                        {pageNum}
                    </Button>
                    );
                })}

                <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.total_pages}
                    variant="outline"
                    className="h-10"
                >
                    Next
                </Button>
                </motion.div>
            )}

            {/* Profile Modal */}
            {selectedStudent && (
                <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                user={{
                    name: selectedStudent.profile.full_name,
                    email: selectedStudent.profile.email || 'Email not available',
                    major: selectedStudent.profile.course || 'Course not specified',
                    year: selectedStudent.profile.year || 'Year not specified',
                    bio: selectedStudent.profile.bio || 'No bio provided',
                    interests: selectedStudent.profile.interests ? selectedStudent.profile.interests.split(',').map(i => i.trim()) : [],
                    avatar: selectedStudent.profile.initials,
                    location: selectedStudent.profile.university_name,
                    isConnected: selectedStudent.is_connected,
                    connection_status: selectedStudent.connection_status
                }}
                onConnect={() => handleConnect(selectedStudent.user_id, selectedStudent)}
                />
            )}
            </div>
        </div>
        </>
    );
}