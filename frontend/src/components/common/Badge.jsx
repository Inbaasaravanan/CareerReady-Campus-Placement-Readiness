import React from 'react';

export const Badge = ({ children, status, variant, className = '' }) => {
  let badgeClass = 'badge-neutral';

  const s = (status || children || '').toString().toLowerCase();

  if (s.includes('highly ready') || s === 'strong' || s === 'active' || s === 'eligible') {
    badgeClass = 'badge-highly-ready';
  } else if (s.includes('ready') || s === 'moderate' || s === 'scheduled') {
    badgeClass = 'badge-ready';
  } else if (s.includes('needs improvement') || s === 'upcoming' || s === 'planning') {
    badgeClass = 'badge-needs-improvement';
  } else if (s.includes('at risk') || s === 'at-risk' || s === 'high' || s === 'disabled' || s === 'not eligible') {
    badgeClass = 'badge-at-risk';
  } else if (variant) {
    badgeClass = `badge-${variant}`;
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      <span className="badge-dot" aria-hidden="true" />
      {children}
    </span>
  );
};
