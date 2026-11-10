import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { MenuIcon, XIcon } from '../common/Icons';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e, sectionId) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `/#${sectionId}`);
      }
    }
    setMobileMenuOpen(false);
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', '/');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Logo variant="light" />

          {/* Desktop Navigation */}
          <nav className="site-nav" aria-label="Main Navigation">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`nav-link ${location.pathname === '/' && !location.hash ? 'active' : ''}`}
            >
              Home
            </Link>
            <a
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className={`nav-link ${location.hash === '#how-it-works' ? 'active' : ''}`}
            >
              How It Works
            </a>
            <a
              href="/#features"
              onClick={(e) => handleNavClick(e, 'features')}
              className={`nav-link ${location.hash === '#features' ? 'active' : ''}`}
            >
              Features
            </a>
            <a
              href="/#analytics"
              onClick={(e) => handleNavClick(e, 'analytics')}
              className={`nav-link ${location.hash === '#analytics' ? 'active' : ''}`}
            >
              Analytics
            </a>
            <a
              href="/#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className={`nav-link ${location.hash === '#about' ? 'active' : ''}`}
            >
              About
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="header-actions">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon width={24} height={24} /> : <MenuIcon width={24} height={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu" aria-label="Mobile Navigation Menu">
          <nav className="mobile-nav-links">
            <Link
              to="/"
              onClick={handleHomeClick}
              className={`mobile-nav-link ${location.pathname === '/' && !location.hash ? 'active' : ''}`}
            >
              Home
            </Link>
            <a
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, 'how-it-works')}
              className={`mobile-nav-link ${location.hash === '#how-it-works' ? 'active' : ''}`}
            >
              How It Works
            </a>
            <a
              href="/#features"
              onClick={(e) => handleNavClick(e, 'features')}
              className={`mobile-nav-link ${location.hash === '#features' ? 'active' : ''}`}
            >
              Features
            </a>
            <a
              href="/#analytics"
              onClick={(e) => handleNavClick(e, 'analytics')}
              className={`mobile-nav-link ${location.hash === '#analytics' ? 'active' : ''}`}
            >
              Analytics
            </a>
            <a
              href="/#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className={`mobile-nav-link ${location.hash === '#about' ? 'active' : ''}`}
            >
              About
            </a>
          </nav>

          <div className="mobile-nav-actions">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ width: '100%' }}>
              <Button variant="outline" size="md" style={{ width: '100%', justifyContent: 'center' }}>
                Login
              </Button>
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ width: '100%' }}>
              <Button variant="primary" size="md" style={{ width: '100%', justifyContent: 'center' }}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
