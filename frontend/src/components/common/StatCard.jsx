import React from 'react';

export const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  className = ''
}) => {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon" aria-hidden="true">
            <Icon width={18} height={18} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
};
