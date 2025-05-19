import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import './Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginAsGuest, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (user && (user.isAuthenticated || user.isGuest)) {
      navigate('/datasets');
    }
  }, [user, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      setApiError('');
      
      await login(formData);
      navigate('/datasets');
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || 'Failed to login. Please check your credentials.';
      
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGuestMode = async () => {
    try {
      setIsLoading(true);
      await loginAsGuest();
      navigate('/datasets');
    } catch (error) {
      console.error('Guest login error:', error);
      setApiError(error?.message || 'Failed to start guest session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h2>Login to MachIntel</h2>
          <img src="/settings-icon.svg" alt="MachIntel" className="auth-logo" />
        </div>
        
        {apiError && (
          <div className="error-message">
            {apiError.includes('\n') ? (
              <ul className="error-list">
                {apiError.split('\n').map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            ) : (
              apiError
            )}
          </div>
        )}
        
        <div className="login-info">
          <p>Please enter your registered email and password to log in.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Your email address"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Your password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            <span className="help-text">Forgot your password? Contact an administrator for assistance.</span>
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="auth-links">
          <button 
            className="guest-button" 
            onClick={handleGuestMode}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Try Guest Mode'}
          </button>
          
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;