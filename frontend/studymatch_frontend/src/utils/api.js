import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';


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

    // Save tokens to localStorage
    export const saveTokens = (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    };

    // Save user data to localStorage
    export const saveUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
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
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        return { success: true };
    }
    };


    // Profile Management
    export const getProfile = async () => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
        });
        
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
        const token = localStorage.getItem('access_token');
        const response = await axios.put(
        `${API_BASE_URL}/auth/profile/update/`,
        { profile: profileData },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
        );
        
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
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('profile_picture', file);
        
        const response = await axios.post(
        `${API_BASE_URL}/auth/profile/upload-picture/`,
        formData,
        {
            headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
            }
        }
        );
        
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
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/auth/profile/stats/`, {
        headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Get stats error:', error.response?.data);
        throw error;
    }
    };

    export const getActivityTimeline = async () => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/auth/profile/activity/`, {
        headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Get activity error:', error.response?.data);
        throw error;
    }
    };

    // Study Goals Management
    export const getStudyGoals = async () => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/auth/study-goals/`, {
        headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error('Get goals error:', error.response?.data);
        throw error;
    }
    };

    export const createStudyGoal = async (title) => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.post(
        `${API_BASE_URL}/auth/study-goals/create/`,
        { title },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
        );
        return response.data;
    } catch (error) {
        console.error('Create goal error:', error.response?.data);
        throw error;
    }
    };

    export const updateStudyGoal = async (goalId, title) => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.put(
        `${API_BASE_URL}/auth/study-goals/${goalId}/update/`,
        { title },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
        );
        return response.data;
    } catch (error) {
        console.error('Update goal error:', error.response?.data);
        throw error;
    }
    };

    export const deleteStudyGoal = async (goalId) => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.delete(
        `${API_BASE_URL}/auth/study-goals/${goalId}/delete/`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
        );
        return response.data;
    } catch (error) {
        console.error('Delete goal error:', error.response?.data);
        throw error;
    }
    };

    export const toggleStudyGoal = async (goalId) => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.post(
        `${API_BASE_URL}/auth/study-goals/${goalId}/toggle/`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` }
        }
        );
        return response.data;
    } catch (error) {
        console.error('Toggle goal error:', error.response?.data);
        throw error;
    }
};

//Password Reset

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
