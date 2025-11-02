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
      const newRefreshToken = response.data.refresh; // Get the new refresh token

      setToken(newAccessToken);
      setRefreshToken(newRefreshToken); // Update refresh token state
      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken); // Update refresh token in localStorage

      console.log("AuthContext - Access token refreshed successfully.");
      return newAccessToken;
    } catch (err) {
      console.error("AuthContext - Error refreshing access token:", err.response?.data || err.message);
      logout(); // Logout on refresh failure
      return null;
    }
  }, [refreshToken]); // refreshToken is a dependency

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
      return mergedUser; // Return the fetched user
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
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
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
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          console.log("AuthContext - 401 Unauthorized, attempting to refresh token via interceptor...");
          const newAccessToken = await refreshAccessToken();
          if (newAccessToken) {
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            console.log("AuthContext - Retrying original request with new token.");
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token, refreshToken, refreshAccessToken]);

  // Login function (MERGED LOGIC)
  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log("AuthContext - Calling token API (merged logic)...");
      // 1. Get tokens (from Block 2's logic, using /api/token/ endpoint)
      const res = await axios.post("http://localhost:8000/api/login/", {
        email,
        password,
      });

      // Assuming endpoint returns only tokens
      const { access, refresh } = res.data;

      setToken(access);
      setRefreshToken(refresh);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // 2. Fetch user details separately (the "FIX" from Block 2)
      console.log("AuthContext - Tokens received, fetching user details...");
      const userData = await fetchUserDetails(access);

      console.log("AuthContext - Login successful. User set:", userData);
      return { success: true, user: userData };

    } catch (err) {
      console.error("AuthContext - Login error:", err);
      // Re-using the detailed error handling from your original Block 1
      console.error("AuthContext - Login error response data (full):", JSON.stringify(err.response?.data, null, 2));

      let errorMessage = "Invalid credentials. Please try again.";
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error && typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        } else if (err.response.data.error && typeof err.response.data.error === 'object') {
          const nestedErrors = err.response.data.error;
          if (nestedErrors.detail) {
            errorMessage = nestedErrors.detail;
          } else {
            errorMessage = Object.keys(nestedErrors).map(key => {
              const fieldError = nestedErrors[key];
              const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `${fieldName}: ${Array.isArray(fieldError) ? fieldError.join(', ') : fieldError}`;
            }).join('; ');
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else {
          const errors = err.response.data;
          const errorKeys = Object.keys(errors);
          if (errorKeys.length > 0) {
            errorMessage = errorKeys.map(key => {
              const fieldError = errors[key];
              const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `${fieldName}: ${Array.isArray(fieldError) ? fieldError.join(', ') : fieldError}`;
            }).join('; ');
          }
        }
      }
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Register function (APPLYING MERGED LOGIC FOR CONSISTENCY)
  const register = async (userData) => {
    setLoading(true);
    try {
      console.log("AuthContext - Calling register API (merged logic)...");
      const payload = {
        email: userData.email,
        password: userData.password,
        password2: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        is_therapist: userData.isTherapist || false,
      };

      if (payload.is_therapist) {
        // ... (all therapist fields logic remains the same)
        payload.is_available = userData.is_available;
        payload.is_free_consultation = userData.is_free_consultation;
        payload.hourly_rate = userData.hourly_rate;
        payload.session_modes = userData.session_modes;
        payload.physical_address = userData.physical_address;
        payload.years_of_experience = userData.years_of_experience || null;
        payload.specializations = userData.specializations ? userData.specializations.join(',') : null;
        payload.license_credentials = userData.license_credentials || null;
        payload.approach_modalities = userData.approach_modalities || null;
        payload.languages_spoken = userData.languages_spoken || null;
        payload.client_focus = userData.client_focus || null;
        payload.insurance_accepted = userData.insurance_accepted;
        payload.video_introduction_url = userData.video_introduction_url || null;
      }

      const response = await axios.post('http://localhost:8000/api/register/', payload);

      // Assuming registration also *only* returns tokens, consistent with login
      const { access, refresh } = response.data;

      setToken(access);
      setRefreshToken(refresh);
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Fetch the new user's details after successful registration
      console.log("AuthContext - Registration successful, fetching user details...");
      const newUser = await fetchUserDetails(access);

      console.log("AuthContext - User details fetched. User set:", newUser);
      return { success: true, user: newUser };

    } catch (err) {
      console.error("AuthContext - Registration error:", err.response?.data || err);
      // Re-using the detailed error handling from your original Block 1
      let errorMessage = "Registration failed. Please check your input and try again.";
      if (err.response && err.response.data) {
        const errors = err.response.data;
        const errorKey = Object.keys(errors)[0];
        if (errorKey) {
          const fieldError = errors[errorKey];
          const fieldName = errorKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (Array.isArray(fieldError)) {
            errorMessage = `${fieldName}: ${fieldError.join(', ')}`;
          } else if (typeof fieldError === 'string') {
            errorMessage = `${fieldName}: ${fieldError}`;
          } else if (errors.detail) {
            errorMessage = errors.detail;
          } else {
            errorMessage = Object.keys(errors).map(key => {
              const errValue = errors[key];
              const name = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `${name}: ${Array.isArray(errValue) ? errValue.join(', ') : errValue}`;
            }).join('; ');
          }
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