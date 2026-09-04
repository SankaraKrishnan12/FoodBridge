import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function PrivateRoute({ children, roles }) {
  const auth = useAuth();

  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(auth.user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
