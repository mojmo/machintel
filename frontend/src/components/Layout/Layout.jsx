import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    if (isNavOpen) setIsNavOpen(false);
  };

  return (
    <div className="app-layout">
      <header className="header">
        <div className="nav-container">
          <div className="logo-container">
            <NavLink to="/" className="logo">
              <img src="/settings-icon.svg" alt="MachIntel Logo" className="logo-img" />
              <span>MachIntel</span>
            </NavLink>
          </div>
          
          <button className="nav-toggle" onClick={toggleNav}>
            <span className={`hamburger ${isNavOpen ? 'open' : ''}`}></span>
          </button>
          
          <nav className={`nav ${isNavOpen ? 'open' : ''}`}>
            <ul className="nav-links">
              {user && (
                <>
                  <li>
                    <NavLink to="/datasets" onClick={closeNav}>
                      Datasets
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/upload" onClick={closeNav}>
                      Upload
                    </NavLink>
                  </li>
                  {user.isAuthenticated && (
                    <li>
                      <NavLink to="/recommendations" onClick={closeNav}>
                        AI Recommendations
                      </NavLink>
                    </li>
                  )}
                </>
              )}
            </ul>
            
            <div className="auth-buttons">
              {user ? (
                <div className="user-section">
                  <div className="user-info">
                    <span className="username">
                      {user.isGuest ? 'Guest User' : user.username}
                    </span>
                    {user.isGuest && (
                      <span className="guest-label">GUEST</span>
                    )}
                  </div>
                  <button className="logout-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button className="login-button" onClick={() => navigate('/login')}>
                    Login
                  </button>
                  <button className="register-button" onClick={() => navigate('/register')}>
                    Register
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="content" onClick={closeNav}>
        <div className="content-inner">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <img src="/settings-icon.svg" alt="MachIntel Logo" className="footer-logo-img" />
              <span>MachIntel</span>
            </div>
            <div className="footer-text">
              <p>© {new Date().getFullYear()} MachIntel. All rights reserved.</p>
              <p>Predictive Maintenance for CNC Machines</p>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="footer-nav">
              <h4>Navigation</h4>
              <ul>
                <li>
                  <NavLink to="/">Home</NavLink>
                </li>
                <li>
                  <NavLink to="/datasets">Datasets</NavLink>
                </li>
                <li>
                  <NavLink to="/upload">Upload</NavLink>
                </li>
                <li>
                  <NavLink to="/recommendations">AI Recommendations</NavLink>
                </li>
              </ul>
            </div>
            
            <div className="footer-legal">
              <h4>Legal</h4>
              <ul>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;