import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Obsolete page - Mentor Assignment has been completely replaced by Staff Assignment.
 * Redirects immediately to /hod/staff-monitoring.
 */
export const HodMentorAssignments = () => {
  return <Navigate to="/hod/staff-monitoring" replace />;
};
