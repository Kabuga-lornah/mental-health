import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component to guard routes based on authentication and user roles.
 *
 * @param {object} props - The component props.
 * @param {string} [props.requiredRole] - The role required to access this route ('user', 'therapist', 'admin').
 * If not provided, only authentication is checked.
 * @param {boolean} [props.therapistVerified] - If true, requires the therapist to be verified. Only applicable if requiredRole is 'therapist'.
 * @param {React.ReactNode} props.children - The child components to render if authorized.
 * @returns {JSX.Element} The protected route content or a redirect.
 */
const ProtectedRoute = ({ requiredRole, therapistVerified, children }) => {
  const { user, loading } = useAuth(); // Get user and loading state from AuthContext

  console.log("DEBUG: ProtectedRoute - Rendered for path:", window.location.pathname, "Loading:", loading, "User:", user, "Required Role:", requiredRole, "Therapist Verified Required:", therapistVerified);
  if (user) {
    console.log("DEBUG: ProtectedRoute - User object in ProtectedRoute:", { id: user.id, email: user.email, is_staff: user.is_staff, is_superuser: user.is_superuser, is_therapist: user.is_therapist, is_verified: user.is_verified });
  }


  // Show a loading indicator while authentication status is being determined
  if (loading) {
    console.log("DEBUG: ProtectedRoute - Still loading auth state, returning loading indicator...");
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-700">Loading user data...</p>
      </div>
    );
  }

  // If no user is logged in, redirect to login page
  if (!user) {
    console.log("DEBUG: ProtectedRoute - No user found, redirecting to /login.");
    return <Navigate to="/login" replace />;
  }

  // Define target paths for different roles
  const adminPath = "/admin/applications";
  const therapistDashboardPath = "/therapist/dashboard";
  const therapistApplyPath = "/therapist-apply";
  const userHomepagePath = "/homepage";

  // Role-based authorization logic
  if (requiredRole) {
    console.log(`DEBUG: ProtectedRoute - Checking required role: ${requiredRole} for user: ${user.email}`);

    switch (requiredRole) {
      case 'user':
        // If the user is an admin, redirect to admin dashboard
        if (user.is_staff && user.is_superuser) {
          console.log("DEBUG: ProtectedRoute - User is admin, redirecting from user path to admin dashboard.");
          return <Navigate to={adminPath} replace />;
        }
        // If the user is a therapist (verified or unverified), redirect to therapist specific paths
        if (user.is_therapist) {
          console.log("DEBUG: ProtectedRoute - User is therapist, redirecting from user path to therapist path.");
          return <Navigate to={user.is_verified ? therapistDashboardPath : therapistApplyPath} replace />;
        }
        // If none of the above, they are a regular user, proceed to render children
        console.log("DEBUG: ProtectedRoute - User is a regular user, allowing access.");
        break;

      case 'therapist':
        // If user is not a therapist, redirect to user homepage or login
        if (!user.is_therapist) {
          console.log("DEBUG: ProtectedRoute - User is NOT a therapist, redirecting to homepage.");
          return <Navigate to={userHomepagePath} replace />;
        }
        // If therapist is required to be verified but is not, redirect to application form
        if (therapistVerified && !user.is_verified) {
          console.log("DEBUG: ProtectedRoute - Therapist not verified, redirecting to application form.");
          return <Navigate to={therapistApplyPath} replace />;
        }
        // If therapist is NOT required to be verified (e.g., on the application page itself)
        // AND they ARE already verified, redirect them to their dashboard
        if (!therapistVerified && user.is_verified) {
            console.log("DEBUG: ProtectedRoute - Therapist is verified, but trying to access therapist-apply, redirecting to dashboard.");
            return <Navigate to={therapistDashboardPath} replace />;
        }
        console.log("DEBUG: ProtectedRoute - Therapist is allowed access to this therapist path.");
        break;

      case 'admin':
        console.log("DEBUG: ProtectedRoute - Handling 'admin' requiredRole.");
        // If user is not an admin, redirect based on their role (therapist or regular user)
        if (!user.is_staff || !user.is_superuser) {
          console.log("DEBUG: ProtectedRoute - User is NOT an admin, redirecting based on their actual role.");
          if (user.is_therapist) {
            return <Navigate to={user.is_verified ? therapistDashboardPath : therapistApplyPath} replace />;
          }
          return <Navigate to={userHomepagePath} replace />;
        }
        console.log("DEBUG: ProtectedRoute - User is an admin, allowing access to admin path.");
        break;

      default:
        // Unknown required role, default to homepage or login
        console.warn(`DEBUG: ProtectedRoute - Unknown requiredRole: ${requiredRole}. Redirecting to homepage.`);
        return <Navigate to={userHomepagePath} replace />;
    }
  } else {
    console.log("DEBUG: ProtectedRoute - No requiredRole specified, only checking authentication.");
  }


  // If all checks pass, render the children components
  console.log("DEBUG: ProtectedRoute - All checks passed, rendering children.");
  return children;
};

export default ProtectedRoute;
