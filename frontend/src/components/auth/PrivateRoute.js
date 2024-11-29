import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function PrivateRoute({ children, roles = [] }) {
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login and remember the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check user roles
  if (roles.length > 0 && user) {
    const hasRequiredRole = roles.some(role => 
      user.roles && user.roles.includes(role)
    );

    if (!hasRequiredRole) {
      // Redirect to unauthorized or dashboard if no access
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If authenticated and has required roles (or no roles specified), render children
  return children;
}

export default PrivateRoute;
