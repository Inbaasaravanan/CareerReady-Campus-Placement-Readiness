import React from 'react';

export const ProgressBar = ({
  label,
  value,
  max = 100,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'indigo'
  showValue = true,
  className = ''
}) => {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let colorClass = variant;
  if (variant === 'auto') {
    if (percent >= 85) colorClass = 'success';
    else if (percent >= 70) colorClass = 'primary';
    else if (percent >= 55) colorClass = 'warning';
    else colorClass = 'danger';
  }

  return (
    <div className={`progress-container ${className}`}>
      {(label || showValue) && (
        <div className="progress-header">
          {label && <span className="progress-title">{label}</span>}
          {showValue && <span className="progress-percent">{percent}%</span>}
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
        <div
          className={`progress-fill ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
