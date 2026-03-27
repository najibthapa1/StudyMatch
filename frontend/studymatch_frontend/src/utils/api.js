import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Authorization header to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Register new user
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Registration error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Registration failed' 
        };
    }
};

export const checkEmailAvailability = async (email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/check-email/`, { email });
        return response.data; // { available: true/false }
    } catch (error) {
        console.error('Email check error:', error.response?.data);
        return { available: true };
    }
};

// Verify email with code
export const verifyEmail = async (email, code) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/verify-email/`, { email, code });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Verification error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Verification failed' 
        };
    }
};

// Resend verification code
export const resendVerification = async (email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/resend-verification/`, { email });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Resend error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Resend failed' 
        };
    }
};

// Login user
export const loginUser = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login/`, { email, password });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Login error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Login failed' 
        };
    }
};

// Password Reset
export const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/forgot-password/`, { email });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Forgot password error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Failed to send reset code' 
        };
    }
};

export const verifyResetCode = async (email, code) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/verify-reset-code/`, { email, code });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Verify reset code error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Invalid code' 
        };
    }
};

export const resetPassword = async (email, code, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/reset-password/`, { 
            email, 
            code, 
            password 
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Reset password error:', error.response?.data);
        return { 
            success: false, 
            error: error.response?.data || 'Failed to reset password' 
        };
    }
};

// Save tokens to localStorage
export const saveTokens = (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
};

// Save user data to localStorage
export const saveUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('user_role', user.role); 
    localStorage.setItem('user_email', user.email);
};

// Get stored user
export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Check if user is logged in
export const isAuthenticated = () => {
    return !!localStorage.getItem('access_token');
};

// Logout
export const logout = async () => {
    try {
        // Clear local storage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_email');
        return { success: true };
    }
};

export const getProfile = async () => {
    try {
        const response = await api.get('/profile/profile/'); 
        
        // Update local storage with fresh data
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        console.error('Get profile error:', error.response?.data);
        throw error;
    }
};

export const updateProfile = async (profileData) => {
    try {
        const response = await api.put('/profile/profile/update/', { profile: profileData });  
        
        // Update local storage
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        console.error('Update profile error:', error.response?.data);
        throw error;
    }
};

export const uploadProfilePicture = async (file) => {
    try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        const response = await api.post('/profile/profile/upload-picture/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        // Update local storage
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error) {
        console.error('Upload picture error:', error.response?.data);
        throw error;
    }
};

export const getUserStats = async () => {
    try {
        const response = await api.get('/profile/profile/stats/');  
        return response.data;
    } catch (error) {
        console.error('Get stats error:', error.response?.data);
        throw error;
    }
};

export const getActivityTimeline = async () => {
    try {
        const response = await api.get('/profile/profile/activity/');  
        return response.data;
    } catch (error) {
        console.error('Get activity error:', error.response?.data);
        throw error;
    }
};

export const getStudyGoals = async () => {
    try {
        const response = await api.get('/profile/study-goals/');  
        return response.data;
    } catch (error) {
        console.error('Get goals error:', error.response?.data);
        throw error;
    }
};

export const createStudyGoal = async (title) => {
    try {
        const response = await api.post('/profile/study-goals/create/', { title });
        return response.data;
    } catch (error) {
        console.error('Create goal error:', error.response?.data);
        throw error;
    }
};

export const updateStudyGoal = async (goalId, title) => {
    try {
        const response = await api.put(`/profile/study-goals/${goalId}/update/`, { title });  
        return response.data;
    } catch (error) {
        console.error('Update goal error:', error.response?.data);
        throw error;
    }
};

export const deleteStudyGoal = async (goalId) => {
    try {
        const response = await api.delete(`/profile/study-goals/${goalId}/delete/`);  
        return response.data;
    } catch (error) {
        console.error('Delete goal error:', error.response?.data);
        throw error;
    }
};

export const toggleStudyGoal = async (goalId) => {
    try {
        const response = await api.post(`/profile/study-goals/${goalId}/toggle/`, {});  
        return response.data;
    } catch (error) {
        console.error('Toggle goal error:', error.response?.data);
        throw error;
    }
};

export const adminLogin = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/admin/login/`, credentials);  
        
        // Store tokens and role
        if (response.data.tokens) {
            localStorage.setItem('access_token', response.data.tokens.access);
            localStorage.setItem('refresh_token', response.data.tokens.refresh);
            localStorage.setItem('user_role', response.data.user.role);
            localStorage.setItem('user_email', response.data.user.email);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error) {
        console.error('Admin login error:', error.response?.data);
        throw error.response?.data || { error: 'Admin login failed' };
    }
};

export const getAdminDashboardStats = async () => {
    try {
        const response = await api.get('/admin/dashboard/stats/');  
        return response.data;
    } catch (error) {
        console.error('Get admin stats error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch admin stats' };
    }
};

export const verifyAdminAccess = async () => {
    try {
        const response = await api.get('/admin/verify/');  
        return response.data;
    } catch (error) {
        console.error('Verify admin access error:', error.response?.data);
        throw error.response?.data || { error: 'Admin verification failed' };
    }
};

// Helper function to check if user is admin
export const isAdmin = () => {
    const role = localStorage.getItem('user_role');
    return role === 'admin';
};

// Admin User Management
export const getAdminUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/admin/users/${queryParams ? '?' + queryParams : ''}`);  
        return response.data;
    } catch (error) {
        console.error('Get admin users error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch users' };
    }
};

export const getAdminUserDetail = async (userId) => {
    try {
        const response = await api.get(`/admin/users/${userId}/`);  
        return response.data;
    } catch (error) {
        console.error('Get user detail error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch user details' };
    }
};

export const updateAdminUser = async (userId, userData) => {
    try {
        const response = await api.put(`/admin/users/${userId}/update/`, userData);  
        return response.data;
    } catch (error) {
        console.error('Update user error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to update user' };
    }
};

export const suspendUser = async (userId, suspensionData) => {
    try {
        const response = await api.post(`/admin/users/${userId}/suspend/`, suspensionData);  
        return response.data;
    } catch (error) {
        console.error('Suspend user error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to suspend user' };
    }
};

export const unsuspendUser = async (userId) => {
    try {
        const response = await api.post(`/admin/users/${userId}/unsuspend/`);  
        return response.data;
    } catch (error) {
        console.error('Unsuspend user error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to unsuspend user' };
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`/admin/users/${userId}/delete/`);  
        return response.data;
    } catch (error) {
        console.error('Delete user error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to delete user' };
    }
};

// Admin Guild Management
export const getAdminGuilds = async () => {
    try {
        const response = await api.get('/admin/guilds/');  
        return response.data;
    } catch (error) {
        console.error('Get guilds error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch guilds' };
    }
};

export const getAdminGuildDetail = async (guildId) => {
    try {
        const response = await api.get(`/admin/guilds/${guildId}/`);  
        return response.data;
    } catch (error) {
        console.error('Get guild detail error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch guild details' };
    }
};

// Admin Analytics
export const getAdminAnalytics = async () => {
    try {
        const response = await api.get('/admin/analytics/');  
        return response.data;
    } catch (error) {
        console.error('Get analytics error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch analytics' };
    }
};

// Admin Notifications
export const getAdminNotifications = async (filter = 'all') => {
    try {
        const response = await api.get(`/admin/notifications/?filter=${filter}`);  
        return response.data;
    } catch (error) {
        console.error('Get notifications error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch notifications' };
    }
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await api.post(`/admin/notifications/${notificationId}/read/`);  
        return response.data;
    } catch (error) {
        console.error('Mark notification read error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to mark notification as read' };
    }
};

export const markAllNotificationsAsRead = async () => {
    try {
        const response = await api.post('/admin/notifications/read-all/');  
        return response.data;
    } catch (error) {
        console.error('Mark all notifications read error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to mark all notifications as read' };
    }
};

export const deleteNotification = async (notificationId) => {
    try {
        const response = await api.delete(`/admin/notifications/${notificationId}/delete/`);  
        return response.data;
    } catch (error) {
        console.error('Delete notification error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to delete notification' };
    }
};
export const getDiscoveryUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/discovery/users/${queryParams ? '?' + queryParams : ''}`);  
        return response.data;
    } catch (error) {
        console.error('Get discovery users error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch users' };
    }
};

export const getUserDetail = async (userId) => {
    try {
        const response = await api.get(`/discovery/user/${userId}/`);  
        return response.data;
    } catch (error) {
        console.error('Get user detail error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch user details' };
    }
};
export const sendConnectionRequest = async (userId) => {
    try {
        const response = await api.post(`/connections/send/${userId}/`);
        return response.data;
    } catch (error) {
        console.error('Send connection request error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to send connection request' };
    }
};

export const getConnectionRequests = async (type = 'all') => {
    try {
        const response = await api.get(`/connections/requests/?type=${type}`);  
        return response.data;
    } catch (error) {
        console.error('Get connection requests error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch connection requests' };
    }
};

export const acceptConnectionRequest = async (requestId) => {
    try {
        const response = await api.post(`/connections/accept/${requestId}/`);  
        return response.data;
    } catch (error) {
        console.error('Accept connection request error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to accept connection request' };
    }
};

export const rejectConnectionRequest = async (requestId) => {
    try {
        const response = await api.post(`/connections/reject/${requestId}/`);  
        return response.data;
    } catch (error) {
        console.error('Reject connection request error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to reject connection request' };
    }
};

// Get all connections (accepted connections)
export const getConnections = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/connections/${queryParams ? '?' + queryParams : ''}`);  
        return response.data;
    } catch (error) {
        console.error('Get connections error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch connections' };
    }
};

// Remove a connection
export const removeConnection = async (userId) => {
    try {
        const response = await api.delete(`/connections/remove/${userId}/`);  
        return response.data;
    } catch (error) {
        console.error('Remove connection error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to remove connection' };
    }
};

export const getGuilds = async () => {
    try {
        const response = await api.get('/guilds/');
        return response.data;
    } catch (error) {
        console.error('Get guilds error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch guilds' };
    }
};

export const getGuildDetail = async (guildId) => {
    try {
        const response = await api.get(`/guilds/${guildId}/`);
        return response.data;
    } catch (error) {
        console.error('Get guild detail error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch guild details' };
    }
};


export const getConversations = async () => {
    try {
        const response = await api.get('/chat/conversations/');
        return response.data;
    } catch (error) {
        console.error('Get conversations error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch conversations' };
    }
};

export const createOrGetConversation = async (userId) => {
    try {
        const response = await api.post('/chat/conversations/create/', { user_id: userId });
        return response.data;
    } catch (error) {
        console.error('Create conversation error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to create conversation' };
    }
};

export const getConversationMessages = async (conversationId) => {
    try {
        const response = await api.get(`/chat/conversations/${conversationId}/messages/`);
        return response.data;
    } catch (error) {
        console.error('Get messages error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch messages' };
    }
};

export const sendMessage = async (conversationId, formData) => {
    try {
        const response = await api.post(
            `/chat/conversations/${conversationId}/messages/send/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Send message error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to send message' };
    }
};

export const deleteMessage = async (messageId) => {
    try {
        const response = await api.delete(`/chat/messages/${messageId}/delete/`);
        return response.data;
    } catch (error) {
        console.error('Delete message error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to delete message' };
    }
};

export const markMessagesAsRead = async (conversationId) => {
    try {
        const response = await api.post(`/chat/conversations/${conversationId}/messages/read/`);
        return response.data;
    } catch (error) {
        console.error('Mark messages read error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to mark messages as read' };
    }
};


// Get current user's guild
export const getMyGuild = async () => {
    try {
        const response = await api.get('/guilds/my-guild/');
        return response.data;
    } catch (error) {
        console.error('Get my guild error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch guild' };
    }
};

// Get events for a guild
export const getGuildEvents = async (guildId) => {
    try {
        const response = await api.get(`/guilds/${guildId}/events/`);
        return response.data;
    } catch (error) {
        console.error('Get guild events error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch events' };
    }
};

// Create event in a guild
export const createEvent = async (guildId, eventData) => {
    try {
        const response = await api.post(`/guilds/${guildId}/events/create/`, eventData);
        return response.data;
    } catch (error) {
        console.error('Create event error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to create event' };
    }
};

// Join an event
export const joinEvent = async (eventId) => {
    try {
        const response = await api.post(`/guilds/events/${eventId}/join/`);
        return response.data;
    } catch (error) {
        console.error('Join event error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to join event' };
    }
};

// Leave an event
export const leaveEvent = async (eventId) => {
    try {
        const response = await api.post(`/guilds/events/${eventId}/leave/`);
        return response.data;
    } catch (error) {
        console.error('Leave event error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to leave event' };
    }
};

// Delete an event (creator only)
export const deleteEvent = async (eventId) => {
    try {
        const response = await api.delete(`/guilds/events/${eventId}/delete/`);
        return response.data;
    } catch (error) {
        console.error('Delete event error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to delete event' };
    }
};

// Get events I've joined
export const getMyEvents = async () => {
    try {
        const response = await api.get('/guilds/events/my-events/');
        return response.data;
    } catch (error) {
        console.error('Get my events error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch my events' };
    }
};


// Upload photo to a past event 
export const uploadEventPhoto = async (eventId, formData) => {
    try {
        const response = await api.post(
            `/guilds/events/${eventId}/photos/upload/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    } catch (error) {
        console.error('Upload event photo error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to upload photo' };
    }
};

// Get all photos for an event
export const getEventPhotos = async (eventId) => {
    try {
        const response = await api.get(`/guilds/events/${eventId}/photos/`);
        return response.data;
    } catch (error) {
        console.error('Get event photos error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to fetch photos' };
    }
};

// Delete your own photo
export const deleteEventPhoto = async (photoId) => {
    try {
        const response = await api.delete(`/guilds/photos/${photoId}/delete/`);
        return response.data;
    } catch (error) {
        console.error('Delete event photo error:', error.response?.data);
        throw error.response?.data || { error: 'Failed to delete photo' };
    }
};