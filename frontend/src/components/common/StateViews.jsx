import React from 'react';
import { AlertTriangleIcon, FileTextIcon } from './Icons';
import { Button } from './Button';

export const LoadingState = ({ message = 'Loading placement intelligence data...' }) => (
  <div className="state-container" role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true" />
    <h3 className="state-title">{message}</h3>
    <p className="state-desc">Please wait while the system processes your analytics query.</p>
  </div>
);

export const EmptyState = ({
  title = 'No records found',
  description = 'No matching student or placement records match your search criteria.',
  actionLabel,
  onAction
}) => (
  <div className="state-container">
    <div className="state-icon" aria-hidden="true">
      <FileTextIcon width={44} height={44} />
    </div>
    <h3 className="state-title">{title}</h3>
    <p className="state-desc">{description}</p>
    {actionLabel && onAction && (
      <Button variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export const ErrorState = ({
  title = 'Failed to load records',
  description = 'An error occurred while communicating with the analytics engine.',
  onRetry
}) => (
  <div className="state-container">
    <div className="state-icon" style={{ color: 'var(--status-at-risk-bar)' }} aria-hidden="true">
      <AlertTriangleIcon width={44} height={44} />
    </div>
    <h3 className="state-title">{title}</h3>
    <p className="state-desc">{description}</p>
    {onRetry && (
      <Button variant="primary" onClick={onRetry}>
        Retry Analysis
      </Button>
    )}
  </div>
);
