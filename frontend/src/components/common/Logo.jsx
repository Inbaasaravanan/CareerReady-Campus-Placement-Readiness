import React from 'react';
import { Link } from 'react-router-dom';
import { useCms } from '../../context/CmsContext';

export const Logo = ({ variant = 'light', showSubtitle = true, linkTo = '/' }) => {
  const { setting } = useCms();
  const appName = setting('app.name', 'CareerReady AI');
  const tagline = setting('app.tagline', 'Placement Analytics');
  const logoUrl = setting('app.logo', '');

  const content = (
    <div className={`brand-logo ${variant}`}>
      <div className="brand-icon-box" aria-hidden="true">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={appName}
            style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Analytical growth graph chevron + nodal bar */}
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M14 7h7v7" />
            <circle cx="21" cy="7" r="1.5" fill="currentColor" />
            <path d="M3 21h18" strokeWidth="1.5" strokeOpacity="0.6" />
          </svg>
        )}
      </div>
      <div className="brand-text">
        <span className="brand-title">{appName}</span>
        {showSubtitle && <span className="brand-subtitle">{tagline}</span>}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} style={{ textDecoration: 'none' }}>{content}</Link>;
  }

  return content;
};
