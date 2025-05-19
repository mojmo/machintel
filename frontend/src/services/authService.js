import axios from 'axios';
import { API_URL } from '../config/constants';

const AUTH_API = `${API_URL}/auth`;
const USERS_API = `${API_URL}/users`;

// Register a new user
const register = async (userData) => {
  try {
    const response = await axios.post(`${USERS_API}/register/`, userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      // Just pass through the error response data without modification
      // Let the component handle the formatting based on the structure
      throw error.response.data;
    }
    throw new Error('Registration failed. Please try again later.');
  }
};

// Login a user
const login = async (credentials) => {
  try {
    const response = await axios.post(`${AUTH_API}/token/`, credentials);
    if (response.data.access) {
      localStorage.setItem('authToken', response.data.access);
      // Save refresh token for refreshing session
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
      
      // Save user data if provided
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Invalid email or password.');
      } else if (error.response.data) {
        // Format field errors for better display
        if (typeof error.response.data === 'object' && !error.response.data.message) {
          const formattedErrors = Object.entries(error.response.data)
            .map(([field, messages]) => {
              // Handle both string and array error messages
              const errorMessage = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${errorMessage}`;
            })
            .join('\n');
          throw formattedErrors;
        }
        throw error.response.data;
      }
    }
    throw new Error('Login failed. Please try again later.');
  }
};

// Refresh access token using refresh token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  try {
    const response = await axios.post(`${AUTH_API}/token/refresh/`, {
      refresh: refreshToken
    });
    
    if (response.data.access) {
      localStorage.setItem('authToken', response.data.access);
      
      // Update refresh token if a new one is provided
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }
    }
    
    return response.data;
  } catch (error) {
    // If refresh fails, log the user out
    logout();
    throw error;
  }
};

// Login as guest
const loginAsGuest = async () => {
  try {
    const response = await axios.post(`${USERS_API}/guest-sessions/`);
    if (response.data.session_id) {
      localStorage.setItem('guestToken', response.data.session_id);
      localStorage.setItem('isGuest', 'true');
    }
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object' && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error.response.data;
    }
    throw new Error('Failed to start guest session. Please try again later.');
  }
};

// Logout user
const logout = async () => {
  const authToken = localStorage.getItem('authToken');
  
  // Call the logout API if token exists
  if (authToken) {
    try {
      await axios.post(`${AUTH_API}/logout/`, {refresh: localStorage.getItem('refreshToken')}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Continue with local logout even if API call fails
    }
  }
  
  // Clear all stored tokens and user data
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('guestToken');
  localStorage.removeItem('user');
  localStorage.removeItem('isGuest');
};

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null || localStorage.getItem('guestToken') !== null;
};

// Get current user
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};


// TODO: All following functions to be completed later
// Update user profile
const updateProfile = async (userData) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.put(`${AUTH_API}/profile/`, userData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

// Change password
const changePassword = async (passwordData) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.post(`${AUTH_API}/change-password/`, passwordData, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

// Request password reset
const requestPasswordReset = async (email) => {
  const response = await axios.post(`${AUTH_API}/request-password-reset/`, { email });
  return response.data;
};

// Reset password
const resetPassword = async (token, password) => {
  const response = await axios.post(`${AUTH_API}/reset-password/`, { token, password });
  return response.data;
};

// Convert guest account to regular account
const convertGuestAccount = async (userData) => {
  const guestToken = localStorage.getItem('guestToken');
  const response = await axios.post(`${AUTH_API}/convert-guest/`, userData, {
    headers: {
      'Authorization': `Bearer ${guestToken}`
    }
  });
  
  if (response.data.token) {
    localStorage.removeItem('guestToken');
    localStorage.removeItem('isGuest');
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

const authService = {
  register,
  login,
  loginAsGuest,
  logout,
  refreshToken,
  isAuthenticated,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  convertGuestAccount
};

export default authService;