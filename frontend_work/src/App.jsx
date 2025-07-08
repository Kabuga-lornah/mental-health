// frontend_work/src/App.jsx
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useNavigation,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SessionFilterProvider } from "./context/SessionFilterContext"; // Import SessionFilterProvider
// import Login from "./components/Auth/Login"; // Remove this import
// import Register from "./components/Auth/Register"; // Remove this import
import AuthPage from "./components/Auth/AuthPage"; // Import the new AuthPage
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
import UserProfile from "./components/UserProfile";
import TherapistProfile from "./components/TherapistProfile";
import ChatInterface from "./components/ChatInterface";

const AppNavbar = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user && user.is_staff && user.is_superuser) {
    return null;
  }
  if (user && user.is_therapist) {
    return <TherapistNavbar />;
  }
  return <Navbar />;
};

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  console.log(
    "DEBUG: ProtectedRoute - Rendered for path:",
    window.location.pathname,
    "Loading:",
    loading,
    "User:",
    user,
    "Required Role:",
    "admin",
    "Therapist Verified Required:",
    "false"
  );
  if (user) {
    console.log("DEBUG: ProtectedRoute - User object in ProtectedRoute:", {
      id: user.id,
      email: user.email,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      is_therapist: user.is_therapist,
      is_verified: user.is_verified,
    });
  }

  if (loading) {
    console.log(
      "DEBUG: ProtectedRoute - Still loading auth state, returning loading indicator..."
    );
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl text-gray-700">Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    console.log(
      "DEBUG: ProtectedRoute - No user found, redirecting to /login."
    );
    return <Navigate to="/login" replace />;
  }

  const adminPath = "/admin/applications";
  const therapistDashboardPath = "/therapist/dashboard";
  const therapistApplyPath = "/therapist-apply";
  const userHomepagePath = "/homepage";

  console.log("DEBUG: ProtectedRoute - Handling 'admin' requiredRole.");
  if (!user.is_staff || !user.is_superuser) {
    console.log(
      "DEBUG: ProtectedRoute - User is NOT an admin, redirecting based on their actual role."
    );
    if (user.is_therapist) {
      return (
        <Navigate
          to={user.is_verified ? therapistDashboardPath : therapistApplyPath}
          replace
        />
      );
    }
    return <Navigate to={userHomepagePath} replace />;
  }
  console.log(
    "DEBUG: ProtectedRoute - User is an admin, allowing access to admin path."
  );

  return children;
};

function Layout() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();

  const showLoader = navigation.state === "loading" || authLoading;

  const isAdminUser = user && user.is_staff && user.is_superuser;

  return (
    <>
      {showLoader && <BreathingLoader />}
      {!isAdminUser && <AppNavbar />}
      {isAdminUser ? (
        <AdminNavbar>
          <Outlet />
        </AdminNavbar>
      ) : (
        <Outlet />
      )}
      {!isAdminUser && <Footer />} {/* Conditional rendering for Footer */}
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Homepage />,
      },
      {
        path: "homepage",
        element: <Homepage />,
      },
      {
        path: "login",
        element: <AuthPage />, // Use AuthPage for login
      },
      {
        path: "register",
        element: <AuthPage />, // Use AuthPage for register
      },
      {
        path: "journal",
        element: (
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "find-therapist",
        element: (
          <ProtectedRoute>
            <FindTherapist />
          </ProtectedRoute>
        ),
      },
      {
        path: "therapists/:id",
        element: (
          <ProtectedRoute>
            <TherapistDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "meditation",
        element: (
          <ProtectedRoute>
            <Meditation />
          </ProtectedRoute>
        ),
      },
      {
        path: "therapist-apply",
        element: (
          <ProtectedRoute>
            <TherapistApplicationForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "therapist/dashboard",
        element: (
          <ProtectedRoute>
            <TherapistDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "therapist/profile",
        element: (
          <ProtectedRoute requiredRole="therapist" therapistVerified={true}>
            <TherapistProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/applications",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/sessions",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/journals",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "admin/analytics",
        element: (
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        ),
      },
      {
        path: "chat/:roomName",
        element: (
          <ProtectedRoute>
            <ChatInterface />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <SessionFilterProvider>
        <RouterProvider router={router} />
      </SessionFilterProvider>
    </AuthProvider>
  );
}

export default App;