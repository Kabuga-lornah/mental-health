import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Dashboard from "./components/Dashboard"; // Assuming this is for regular users
import ProtectedRoute from "./components/ProtectedRoute";
import Homepage from "./components/Homepage";
import Journal from "./components/Journal";
import Navbar from "./components/Navbar"; // User Navbar
import TherapistNavbar from "./components/TherapistNavbar"; // Therapist Navbar
import TherapistDashboard from "./components/TherapistDashboard"; // Changed from pages/TherapistDashboard
import FindTherapist from "./components/FindTherapist"; // Changed from pages/FindTherapist
import TherapistApplicationForm from "./components/TherapistApplicationForm"; // Changed from pages/TherapistApplicationForm
import AdminDashboard from "./components/Admin"; // Changed from pages/Admin
import Footer from "./components/Footer";

// A component to render the correct Navbar based on user role
const AppNavbar = () => {
  const { user, loading } = useAuth();

  // Show nothing while authentication state is loading
  if (loading) return null;

  // If user is a therapist (verified or not), render TherapistNavbar
  if (user && user.is_therapist) {
    return <TherapistNavbar />;
  }
  // Otherwise (regular user, admin, or logged out), render the regular Navbar
  // Admins will also see the regular Navbar unless you create a separate AdminNavbar
  return <Navbar />;
};

// A specialized ProtectedRoute for Admin access
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Still loading auth state
  if (!user || !user.is_staff || !user.is_superuser) {
    // If not logged in, or not staff/superuser, redirect to login
    return <Navigate to="/login" replace />;
  }
  return children;
};


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Render the conditional Navbar globally */}
        <AppNavbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Protected Routes */}
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/find-therapist" element={<ProtectedRoute><FindTherapist /></ProtectedRoute>} />

          {/* Therapist-related Routes */}
          {/* Therapist application form - accessible to logged-in users who intend to be therapists */}
          <Route
            path="/therapist-apply"
            element={
              <ProtectedRoute>
                <TherapistApplicationForm />
              </ProtectedRoute>
            }
          />

          {/* Therapist Dashboard - accessible only to therapists (content varies by verification) */}
          <Route
            path="/therapist/dashboard"
            element={
              <ProtectedRoute>
                <TherapistDashboard />
              </ProtectedRoute>
            }
          />
          {/* Add more therapist specific routes here, e.g., /therapist/clients, /therapist/appointments */}

          {/* Admin Protected Route */}
          <Route
            path="/admin/applications" // A specific path for the admin dashboard
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
