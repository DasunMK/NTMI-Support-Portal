import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/auth.service';

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = AuthService.getCurrentUser();

  // 1. Not Logged In -> Go to Login
  if (!user) {
    return <Navigate to="/signin" />;
  }

  // 2. Check Roles (if specific roles are required)
  if (allowedRoles) {
    const hasPermission = allowedRoles.some(role => user.roles.includes(role));
    
    if (!hasPermission) {
      // User is logged in but acts like a hacker trying to access the wrong page.
      // Redirect them to their CORRECT dashboard.
      if (user.roles.includes("ROLE_ADMIN")) {
        return <Navigate to="/admin-dashboard" />;
      } else {
        return <Navigate to="/branch-dashboard" />;
      }
    }
  }

  // 3. Authorized -> Render the Page
  return children;
};

export default PrivateRoute;