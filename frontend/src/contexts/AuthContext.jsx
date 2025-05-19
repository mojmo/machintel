import { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { useContext } from 'react';

// Create the context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider component that wraps the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('guestToken');
        
        if (!token) {
          setLoading(false);
          return;
        }

        const userData = await authService.getCurrentUser();
        
        // Set user with authentication type flag
        setUser({
          ...userData,
          isAuthenticated: !!localStorage.getItem('authToken'),
          isGuest: !!localStorage.getItem('guestToken')
        });
      } catch (err) {
        console.error('Failed to load user:', err);
        setError('Failed to authenticate user. Please login again.');
        // Clear tokens on authentication error
        localStorage.removeItem('authToken');
        localStorage.removeItem('guestToken');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      const userData = await authService.login(credentials);
      setUser({
        ...userData.user,
        isAuthenticated: true,
        isGuest: false
      });
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = typeof err === 'string' 
        ? err 
        : err?.message || 'Login failed. Please check your credentials.';
      
      setError(errorMessage);
      throw err;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      
      // Pass through the error to be handled by the component
      if (typeof err === 'object' && err !== null) {
        throw err;
      } else {
        const errorMessage = typeof err === 'string' 
          ? err 
          : 'Registration failed. Please try again.';
        
        setError(errorMessage);
        throw err;
      }
    }
  };

  // Guest login function
  const loginAsGuest = async () => {
    try {
      setError(null);
      const userData = await authService.loginAsGuest();
      setUser({
        ...userData.user,
        isAuthenticated: false,
        isGuest: true
      });
      return userData;
    } catch (err) {
      console.error('Guest login error:', err);
      const errorMessage = typeof err === 'string' 
        ? err 
        : err?.message || 'Guest login failed. Please try again.';
      
      setError(errorMessage);
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      // Still reset user even if logout API call fails
      setUser(null);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    loginAsGuest,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};