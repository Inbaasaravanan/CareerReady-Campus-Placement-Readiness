import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { useCms } from '../../context/CmsContext';

export const Footer = () => {
  const { setting } = useCms();
  const footerText = setting('app.footer_text', 'AI-Driven Placement Readiness Analytics System for Students. Assess academic, aptitude, programming, and technical capabilities to ensure campus placement readiness.');
  const copyright = setting('app.copyright', `© ${new Date().getFullYear()} CareerReady AI. All institutional rights reserved.`);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo variant="light" />
            <p className="footer-tagline">
              {footerText}
            </p>
          </div>

          <nav className="footer-nav" aria-label="Footer Navigation">
            <Link to="/" className="footer-link">Home</Link>
            <a href="/#how-it-works" className="footer-link">How It Works</a>
            <a href="/#features" className="footer-link">Features</a>
            <a href="/#analytics" className="footer-link">Analytics</a>
            <a href="/#about" className="footer-link">About</a>
            <Link to="/login" className="footer-link">Login</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>{copyright}</span>
          <span>Placement Readiness Intelligence Engine &bull; Enterprise Institutional Edition</span>
        </div>
      </div>
    </footer>
  );
};
