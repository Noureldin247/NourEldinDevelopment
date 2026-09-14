import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { canAccessModule } from '../lib/permissions';

export default function RequireRole({ allowedRoles, children }) {
  const { session } = useAuth();

  if (!session || !canAccessModule(session.role, allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
