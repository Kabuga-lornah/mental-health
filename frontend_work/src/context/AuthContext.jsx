import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // Corrected import for jwt-decode

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh_token") || ""); // New state for refresh token
  const [loading, setLoading] = useState(true);

  // Function to refresh the access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      console.log("AuthContext - No refresh token available. Logging out.");
      logout(); // If no refresh token, force logout
      return null;
    }
    try {
      console.log("AuthContext - Attempting to refresh access token...");
      const response = await axios.post("http://localhost:8000/api/token/refresh/", {
        refresh: refreshToken,
      });
      const newAccessToken = response.data.access;
      setToken(newAccessToken);
      localStorage.setItem("token", newAccessToken);
      console.log("AuthContext - Access token refreshed successfully.");
      return newAccessToken;
    } catch (err) {
      console.error("AuthContext - Error refreshing access token:", err.response?.data || err.message);
      logout(); // If refresh fails, log out the user
      return null;
    }
  }, [refreshToken]); // Dependency on refreshToken

  // Set axios default headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
      console.log("AuthContext - Axios default header set with new token.");
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refresh_token");
      console.log("AuthContext - Token cleared, removed from localStorage and Axios headers.");
    }
  }, [token]);

  // Validate token on initial load and set up refresh interval
  useEffect(() => {
    const validateAndRefresh = async () => {
      setLoading(true);
      console.log("AuthContext - Initializing AuthContext: validateAndRefresh called.");
      if (token) {
        try {
          console.log("AuthContext - Attempting initial token validation by fetching user data...");
          const res = await axios.get("http://localhost:8000/api/user/", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
          console.log("AuthContext - Initial token validation successful. User set:", res.data);
        } catch (err) {
          console.error("AuthContext - Initial token validation failed:", err);
          // If initial validation fails (e.g., token expired), try to refresh
          console.log("AuthContext - Initial validation failed, attempting to refresh token...");
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            // Re-attempt user data fetch with new token
            try {
              console.log("AuthContext - Re-attempting user data fetch with refreshed token...");
              const res = await axios.get("http://localhost:8000/api/user/", {
                headers: { Authorization: `Bearer ${newAccessToken}` }
              });
              setUser(res.data);
              localStorage.setItem("user", JSON.stringify(res.data));
              console.log("AuthContext - User data fetched with refreshed token. User set:", res.data);
            } catch (retryErr) {
              console.error("AuthContext - Failed to fetch user data after refresh:", retryErr);
              logout();
            }
          } else {
            console.log("AuthContext - Token refresh also failed, logging out.");
            logout(); // If refresh also fails, log out
          }
        }
      } else {
        console.log("AuthContext - No token found on initial load.");
      }
      setLoading(false);
      console.log("AuthContext - Loading set to false.");
    };

    validateAndRefresh();

    // Set up automatic token refresh interval (e.g., every 4 minutes if token expires in 5 minutes)
    // Adjust interval based on your JWT access token expiry time.
    const refreshInterval = setInterval(() => {
      console.log("AuthContext - Automatic token refresh triggered.");
      refreshAccessToken();
    }, 4 * 60 * 1000); // Refresh every 4 minutes (240000 ms)

    return () => clearInterval(refreshInterval); // Clean up interval on unmount
  }, [token, refreshToken, refreshAccessToken]); // Dependencies for useEffect


  // Login function
  const login = async (email, password) => {
    try {
      console.log("AuthContext - Calling login API...");
      const res = await axios.post("http://localhost:8000/api/login/", {
        email,
        password,
      });

      setToken(res.data.access);
      setRefreshToken(res.data.refresh); // Store refresh token
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("refresh_token", res.data.refresh); // Persist refresh token
      console.log("AuthContext - Login successful. User set:", res.data.user);
      return res.data;
    } catch (err) {
      console.error("AuthContext - Login error:", err);
      throw err.response?.data || { error: err.message || "Login failed" };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log("AuthContext - Calling register API...");
      const res = await axios.post("http://localhost:8000/api/register/", {
        email: userData.email,
        password: userData.password,
        password2: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        is_therapist: userData.isTherapist || false
      });

      setToken(res.data.access);
      setRefreshToken(res.data.refresh); // Store refresh token
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("refresh_token", res.data.refresh); // Persist refresh token
      console.log("AuthContext - Registration successful. User set:", res.data.user);
      return res.data;
    } catch (err) {
      console.error("AuthContext - Registration error:", err);
      throw err.response?.data || { error: err.message || "Registration failed" };
    }
  };

  // Logout function
  const logout = () => {
    setToken("");
    setRefreshToken(""); // Clear refresh token on logout
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    console.log("AuthContext - User logged out.");
  };

  const contextData = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshAccessToken // Expose refresh function if needed elsewhere
  };

  return (
    <AuthContext.Provider value={contextData}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
