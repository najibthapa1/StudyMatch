import axios from 'axios';

// Backend URL
const API_URL = 'http://localhost:8000/api/auth';

// Register new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || 'Registration failed' 
    };
  }
};

// Verify email with code
export const verifyEmail = async (email, code) => {
  try {
    const response = await axios.post(`${API_URL}/verify-email/`, { email, code });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || 'Verification failed' 
    };
  }
};

// Resend verification code
export const resendVerification = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/resend-verification/`, { email });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || 'Resend failed' 
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, { email, password });
    return { success: true, data: response.data };
  } catch (error) {
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
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};