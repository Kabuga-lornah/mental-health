import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useNavigation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Homepage from "./components/Homepage";
import Journal from "./components/Journal";
import Navbar from "./components/Navbar";
import TherapistNavbar from "./components/TherapistNavbar_OLD"; // Assuming this is correct
import TherapistDashboard from "./components/TherapistDashboard";
import FindTherapist from "./components/FindTherapist";
import TherapistApplicationForm from "./components/TherapistApplicationForm";
import AdminDashboard from "./components/Admin";
import AdminNavbar from "./components/AdminNavbar";
import Footer from "./components/Footer";
import TherapistDetail from "./components/TherapistDetail";
import Meditation from "./components/Meditation";
import BreathingLoader from "./components/BreathingLoader";
import UserProfile from "./components/UserProfile"; // NEW IMPORT
import TherapistProfile from "./components/TherapistProfile"; // NEW IMPORT


const AppNavbar = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user && user.is_staff && user.is_superuser) {
    // AdminNavbar will now be a wrapper for admin content rendered in Layout
    return null; 
  }
  if (user && user.is_therapist) {
    return <TherapistNavbar />;
  }
  return <Navbar />;
};


const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log("DEBUG: ProtectedRoute - Rendered for path:", window.location.pathname, "Loading:", loading, "User:", user, "Required Role:", "admin", "Therapist Verified Required:", "false");
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

  // Role-based authorization logic specifically for admin protected routes
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

  // If all checks pass, render the children components
  return children;
};

// This component will house the common layout (Navbar, Footer, and Loader)
// and render the specific page content via <Outlet />
function Layout() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth(); // Get auth loading state

  // Show breathing loader if navigation is loading OR if authentication is still loading
  const showLoader = navigation.state === "loading" || authLoading;

  // Determine if it's an admin user for the special layout
  const isAdminUser = user && user.is_staff && user.is_superuser;

  return (
    <>
      {showLoader && <BreathingLoader />}
      {!isAdminUser && <AppNavbar />} {/* Render normal navbar only if not admin */}
      {isAdminUser ? (
        <AdminNavbar> {/* AdminNavbar now wraps the content */}
          <Outlet />
        </AdminNavbar>
      ) : (
        <Outlet /> // For non-admin users, Outlet renders directly after their navbar
      )}
      <Footer />
    </>
  );
}

// Define the router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Use the Layout component as the root element
    children: [
      {
        index: true, // This makes "/" render Homepage
        element: <Homepage />,
      },
      {
        path: "homepage",
        element: <Homepage />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "journal",
        element: <ProtectedRoute><Journal /></ProtectedRoute>,
      },
      {
        path: "dashboard",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: "find-therapist",
        element: <ProtectedRoute><FindTherapist /></ProtectedRoute>,
      },
      {
        path: "therapists/:id",
        element: <ProtectedRoute><TherapistDetail /></ProtectedRoute>,
      },
      {
        path: "meditation",
        element: <ProtectedRoute><Meditation /></ProtectedRoute>,
      },
      {
        path: "therapist-apply",
        element: <ProtectedRoute><TherapistApplicationForm /></ProtectedRoute>,
      },
      {
        path: "therapist/dashboard",
        element: <ProtectedRoute><TherapistDashboard /></ProtectedRoute>,
      },
      {
        path: "profile", // NEW: User Profile route
        element: <ProtectedRoute><UserProfile /></ProtectedRoute>,
      },
      {
        path: "therapist/profile", // NEW: Therapist Profile route
        element: <ProtectedRoute requiredRole="therapist" therapistVerified={true}><TherapistProfile /></ProtectedRoute>,
      },
      // Admin routes are now children of AdminProtectedRoute, and AdminProtectedRoute itself
      // will be wrapped by AdminNavbar if the user is an admin via the Layout component.
      // So, these paths just need the AdminProtectedRoute, and the layout handles the Navbar.
      {
        path: "admin", // Base admin path
        element: <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>,
      },
      {
        path: "admin/applications",
        element: <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>, // AdminDashboard handles tabs
      },
      {
        path: "admin/users",
        element: <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>,
      },
      {
        path: "admin/sessions",
        element: <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>,
      },
      {
        path: "admin/journals",
        element: <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>,
      },
      {
        path: "admin/analytics",
        element: <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>,
      },
      {
        path: "*", // Catch-all for unmatched routes
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;