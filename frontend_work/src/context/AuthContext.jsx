// frontend_work/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refresh_token") || "");
  const [loading, setLoading] = useState(true);

  // Function to refresh the access token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      console.log("AuthContext - No refresh token available. Logging out.");
      logout(); // Call logout if no refresh token
      return null;
    }
    try {
      console.log("AuthContext - Attempting to refresh access token...");
      const response = await axios.post("http://localhost:8000/api/token/refresh/", {
        refresh: refreshToken,
      });
      const newAccessToken = response.data.access;
      setToken(newAccessToken);
      localStorage.setItem("access_token", newAccessToken);
      console.log("AuthContext - Access token refreshed successfully.");
      return newAccessToken;
    } catch (err) {
      console.error("AuthContext - Error refreshing access token:", err.response?.data || err.message);
      logout(); // Logout on refresh failure
      return null;
    }
  }, [refreshToken]);

  // Fetch user details from API
  const fetchUserDetails = async (currentToken) => {
    try {
      const response = await axios.get('http://localhost:8000/api/user/', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      
      // Merge with existing user data if any
      const existingUser = JSON.parse(localStorage.getItem("user")) || {};
      const mergedUser = { ...existingUser, ...response.data };
      
      setUser(mergedUser);
      localStorage.setItem("user", JSON.stringify(mergedUser));
      console.log("AuthContext - User details fetched:", mergedUser);
      return mergedUser;
    } catch (error) {
      console.error("AuthContext - Could not fetch user details:", error);
      throw error;
    }
  };

  // Set axios default headers when token changes and validate token
  useEffect(() => {
    const validateAndRefresh = async () => {
      setLoading(true);
      console.log("AuthContext - Initializing AuthContext: validateAndRefresh called.");
      
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; // Set default header immediately
        localStorage.setItem("access_token", token);
        try {
          // Validate token expiration
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp > currentTime) {
            console.log("AuthContext - Token is valid, fetching user details...");
            await fetchUserDetails(token);
          } else {
            console.log("AuthContext - Token expired, attempting to refresh...");
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
              await fetchUserDetails(newAccessToken);
            }
          }
        } catch (err) {
          console.error("AuthContext - Token validation failed:", err);
          logout();
        }
      } else {
        console.log("AuthContext - No token found on initial load.");
        delete axios.defaults.headers.common["Authorization"];
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("refresh_token");
      }
      setLoading(false);
    };

    validateAndRefresh();

    // Axios Interceptor for automatic token refresh on 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        // If the error is 401 (Unauthorized) and it's not a retry attempt
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Mark as retried
          console.log("AuthContext - 401 Unauthorized, attempting to refresh token via interceptor...");
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            console.log("AuthContext - Retrying original request with new token.");
            return axios(originalRequest); // Retry the original request
          }
        }
        return Promise.reject(error); // Reject the error if not 401 or refresh failed
      }
    );

    // Clean up interceptor on component unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };

  }, [token, refreshToken, refreshAccessToken]);


  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log("AuthContext - Calling login API...");
      const res = await axios.post("http://localhost:8000/api/login/", {
        email,
        password,
      });

      const { access, refresh, user: userData } = res.data;
      
      setToken(access);
      setRefreshToken(refresh);
      setUser(userData);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(userData));
      
      console.log("AuthContext - Login successful. User set:", userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error("AuthContext - Login error:", err);
      const errorMessage = err.response?.data?.error || "Invalid credentials. Please try again.";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function with improved error handling
  const register = async (userData) => {
    setLoading(true);
    try {
      console.log("AuthContext - Calling register API...");
      const response = await axios.post('http://localhost:8000/api/register/', {
        email: userData.email,
        password: userData.password,
        password2: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        is_therapist: userData.isTherapist || false
      });

      const { access, refresh, user: newUser } = response.data;
      
      setToken(access);
      setRefreshToken(refresh);
      setUser(newUser);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify(newUser));
      
      console.log("AuthContext - Registration successful. User set:", newUser);
      return { success: true, user: newUser };
    } catch (err) {
      console.error("AuthContext - Registration error:", err);
      
      let errorMessage = "Registration failed. Please check your input and try again.";
      if (err.response && err.response.data) {
        const errors = err.response.data;
        const errorKey = Object.keys(errors)[0];
        if (errorKey && Array.isArray(errors[errorKey])) {
          const fieldName = errorKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          errorMessage = `${fieldName}: ${errors[errorKey][0]}`;
        }
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken("");
    setRefreshToken("");
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    console.log("AuthContext - User logged out.");
  };

  const contextData = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={contextData}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);