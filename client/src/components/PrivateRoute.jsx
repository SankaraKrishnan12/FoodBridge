import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider'; // Adjust import path as needed

export default function PrivateRoute({ children }) {
  const auth = useAuth();

  if (!auth.user) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the child component
  return children;
}
