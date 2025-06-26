// frontend_work/src/App.jsx
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
import TherapistNavbar from "./components/TherapistNavbar_OLD";
import TherapistDashboard from "./components/TherapistDashboard";
import FindTherapist from "./components/FindTherapist";
import TherapistApplicationForm from "./components/TherapistApplicationForm";
import AdminDashboard from "./components/Admin";
import AdminNavbar from "./components/AdminNavbar";
import Footer from "./components/Footer";
import TherapistDetail from "./components/TherapistDetail";
import Meditation from "./components/Meditation";
import BreathingLoader from "./components/BreathingLoader";


const AppNavbar = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user && user.is_staff && user.is_superuser) {
    return <AdminNavbar />;
  }
  if (user && user.is_therapist) {
    return <TherapistNavbar />;
  }
  return <Navbar />;
};


const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }
  
  if (!user || !user.is_staff || !user.is_superuser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// This component will house the common layout (Navbar, Footer, and Loader)
// and render the specific page content via <Outlet />
function Layout() {
  const navigation = useNavigation();
  const { loading: authLoading } = useAuth(); // Get auth loading state

  // Show breathing loader if navigation is loading OR if authentication is still loading
  const showLoader = navigation.state === "loading" || authLoading;

  return (
    <>
      {showLoader && <BreathingLoader />}
      <AppNavbar />
      <Outlet /> {/* This is where the routed components will render */}
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
        path: "admin/applications",
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
