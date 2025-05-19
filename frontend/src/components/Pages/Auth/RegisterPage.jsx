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
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password strength indicator'
  });
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  
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
    
    // Calculate password strength when password field changes
    if (name === 'password') {
      calculatePasswordStrength(value);
      
      // Update password requirement checks
      setPasswordChecks({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
    }
    
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
  
  const calculatePasswordStrength = (password) => {
    // Score starts at 0 (very weak)
    let score = 0;
    let message = 'Very weak';
    
    // No password or very short password
    if (!password || password.length < 4) {
      setPasswordStrength({ score, message });
      return;
    }
    
    // Add points for length
    if (password.length >= 8) score += 1;
    if (password.length >= 10) score += 1;
    
    // Add points for complexity
    if (/[A-Z]/.test(password)) score += 1;  // Has uppercase
    if (/[a-z]/.test(password)) score += 1;  // Has lowercase
    if (/[0-9]/.test(password)) score += 1;  // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1;  // Has special character
    
    // Set message based on score
    if (score < 2) message = 'Very weak';
    else if (score < 3) message = 'Weak';
    else if (score < 4) message = 'Medium';
    else if (score < 5) message = 'Strong';
    else message = 'Very strong';
    
    setPasswordStrength({ score, message });
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
    } else if (!/^[a-zA-Z_]/.test(formData.username)) {
      newErrors.username = 'Username must start with a letter or underscore';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one special character';
      }
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

    // Prepare data for API - rename confirmPassword to password_confirm
    const registerData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password_confirm: formData.confirmPassword
    };
    
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
      console.error('Registration error:', error);
      
      // Handle various error formats
      if (typeof error === 'string') {
        setApiError(error);
      } else if (error?.detail && typeof error.detail === 'object') {
        // Handle nested error object in detail field
        const formattedErrors = Object.entries(error.detail)
          .map(([field, message]) => `${field}: ${message}`)
          .join('\n');
        setApiError(formattedErrors);
      } else if (error?.error && error?.detail) {
        // Handle error with both error and detail properties
        const detailText = typeof error.detail === 'object' 
          ? JSON.stringify(error.detail)
          : error.detail;
        setApiError(`${error.error}\n${detailText}`);
      } else {
        setApiError(error?.message || 'Registration failed. Please try again.');
      }
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
        
        <div className="login-info">
          <p>Please fill out the form below to create your account. All fields are required.</p>
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
                placeholder="Your first name"
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
                placeholder="Your last name"
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
              placeholder="Start with letter/underscore (e.g., john_doe)"
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
              placeholder="Min 8 chars with uppercase, lowercase, number, special char"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            <div className="password-strength">
              <div className="strength-meter">
                <div 
                  className={`strength-meter-fill strength-${passwordStrength.score}`} 
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                ></div>
              </div>
              <span className="strength-text">{passwordStrength.message}</span>
            </div>
            <div className="password-checks">
              <div className={`check ${passwordChecks.length ? 'valid' : ''}`}>
                <span className="check-icon">{passwordChecks.length ? '✓' : '✗'}</span>
                <span className="check-text">At least 8 characters</span>
              </div>
              <div className={`check ${passwordChecks.uppercase ? 'valid' : ''}`}>
                <span className="check-icon">{passwordChecks.uppercase ? '✓' : '✗'}</span>
                <span className="check-text">At least one uppercase letter</span>
              </div>
              <div className={`check ${passwordChecks.lowercase ? 'valid' : ''}`}>
                <span className="check-icon">{passwordChecks.lowercase ? '✓' : '✗'}</span>
                <span className="check-text">At least one lowercase letter</span>
              </div>
              <div className={`check ${passwordChecks.number ? 'valid' : ''}`}>
                <span className="check-icon">{passwordChecks.number ? '✓' : '✗'}</span>
                <span className="check-text">At least one number</span>
              </div>
              <div className={`check ${passwordChecks.special ? 'valid' : ''}`}>
                <span className="check-icon">{passwordChecks.special ? '✓' : '✗'}</span>
                <span className="check-text">At least one special character</span>
              </div>
            </div>
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
              placeholder="Re-enter your password"
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
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