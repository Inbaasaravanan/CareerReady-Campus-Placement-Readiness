import React from 'react';

export const PageHeader = ({ title, subtitle, actions, children }) => {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="page-actions">
          {actions}
          {children}
        </div>
      )}
    </header>
  );
};
