import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { motion } from 'framer-motion';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { loginAsGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestMode = async () => {
    try {
      setIsLoading(true);
      await loginAsGuest();
      navigate('/upload');
    } catch (error) {
      console.error('Error starting guest session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const features = [
    {
      title: 'Predictive Maintenance',
      description: 'Detect potential CNC machine failures before they occur, reducing downtime and maintenance costs.',
      icon: '🔍'
    },
    {
      title: 'Data-Driven Insights',
      description: 'Transform your machine data into actionable insights with advanced analytics and machine learning.',
      icon: '📊'
    },
    {
      title: 'Easy Dataset Upload',
      description: 'Simply upload your CSV data and get instant predictions and analytics.',
      icon: '📤'
    },
    {
      title: 'Comprehensive Visualization',
      description: 'Interactive charts and visualizations to better understand your machine performance.',
      icon: '📈'
    }
  ];
  
  return (
    <div className="landing-page">
      <section className="hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>MachIntel</h1>
          <p className="subtitle">Predictive Maintenance for CNC Milling Machines</p>
          <p className="description">
            Use machine learning to predict and prevent failures, optimize maintenance schedules, 
            and maximize the performance of your CNC milling equipment.
          </p>
          <div className="cta-buttons">
            <motion.button 
              className="primary-btn register-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
            >
              Register Now
            </motion.button>
            <motion.button 
              className="secondary-btn guest-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGuestMode}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Try Guest Mode'}
            </motion.button>
          </div>
        </motion.div>
        <motion.div 
          className="hero-image"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <img src="/settings-icon.svg" alt="MachIntel" className="hero-logo" />
        </motion.div>
      </section>
      
      <section className="features">
        <h2>Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 * index }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      <section className="cta-section">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h2>Ready to optimize your machine maintenance?</h2>
          <p>Start using MachIntel today and transform your manufacturing process.</p>
          <div className="cta-buttons">
            <button className="primary-btn" onClick={() => navigate('/register')}>Get Started</button>
            <button className="outline-btn secondary-btn" onClick={() => navigate('/login')}>Login</button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;