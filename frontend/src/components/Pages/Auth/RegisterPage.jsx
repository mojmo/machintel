import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import './Auth.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginAsGuest, user } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  useEffect(() => {
    // Only check for user state when not in success mode
    if (!registerSuccess && user && (user.isAuthenticated || user.isGuest)) {
      navigate('/datasets');
    }
  }, [user, navigate, registerSuccess]);
  
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
    
    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const { ...registerData } = formData;
    
    try {
      setIsLoading(true);
      setApiError('');
      
      await register(registerData);
      setRegisterSuccess(true);
      
      // Automatically redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      
    } catch (error) {
      setApiError(
        typeof error === 'string' 
          ? error 
          : 'Registration failed. Please try again.'
      );
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
      setApiError(`Failed to start guest session. Please try again. ${error}`,);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (registerSuccess) {
    return (
      <div className="auth-page">
        <motion.div 
          className="auth-card success-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="success-icon">✓</div>
          <h2>Registration Successful!</h2>
          <p>Your account has been created successfully. You will be redirected to login shortly...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="auth-page">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h2>Create an Account</h2>
          <img src="/settings-icon.svg" alt="MachIntel" className="auth-logo" />
        </div>
        
        
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={errors.first_name ? 'error' : ''}
              />
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
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
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>

          {apiError && <div className="error-message">{apiError}</div>}
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
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;