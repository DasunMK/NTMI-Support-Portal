import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/auth.service';

const PrivateRoute = ({ children, allowedRoles }) => {
    const user = AuthService.getCurrentUser();

    // 1. If no user, send to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2. If roles are specified, check them
    if (allowedRoles) {
        const hasRole = user.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
            // User is logged in but unauthorized for this page -> redirect to their own dashboard
            return user.roles.includes("ROLE_ADMIN") 
                ? <Navigate to="/admin-dashboard" replace />
                : <Navigate to="/branch-dashboard" replace />;
        }
    }

    // 3. Render the page (Dashboard)
    return children;
};

export default PrivateRoute;