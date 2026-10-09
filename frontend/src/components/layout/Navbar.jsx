import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';

export const Navbar = () => {
  const location = useLocation();

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Logo variant="light" />

          <nav className="site-nav" aria-label="Main Navigation">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              Home
            </Link>
            <a href="/#how-it-works" className="nav-link">
              How It Works
            </a>
            <a href="/#features" className="nav-link">
              Features
            </a>
            <a href="/#analytics" className="nav-link">
              Analytics
            </a>
            <a href="/#about" className="nav-link">
              About
            </a>
          </nav>

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
        </div>
      </div>
    </header>
  );
};
