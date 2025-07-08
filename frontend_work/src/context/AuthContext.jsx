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
      const newRefreshToken = response.data.refresh; // Get the new refresh token returned by the backend

      setToken(newAccessToken);
      setRefreshToken(newRefreshToken); // Update refresh token state with the new one
      localStorage.setItem("access_token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken); // Update refresh token in localStorage with the new one

      console.log("AuthContext - Access token refreshed successfully.");
      return newAccessToken;
    } catch (err) {
      console.error("AuthContext - Error refreshing access token:", err.response?.data || err.message);
      logout(); // Logout on refresh failure
      return null;
    }
  }, [refreshToken]); // refreshToken is a dependency because it's used in the function

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
        localStorage.removeItem("refresh_token"); // Ensure refresh token is also cleared if no access token
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

  }, [token, refreshToken, refreshAccessToken]); // Add refreshAccessToken as dependency

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
      // Log the full response data as a stringified JSON for better visibility
      // This is the key change to ensure all nested error details are visible
      console.error("AuthContext - Login error response data (full):", JSON.stringify(err.response?.data, null, 2));

      let errorMessage = "Invalid credentials. Please try again.";
      if (err.response && err.response.data) {
        if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error && typeof err.response.data.error === 'string') {
          // Handle cases where 'error' key is a string
          errorMessage = err.response.data.error;
        } else if (err.response.data.error && typeof err.response.data.error === 'object') {
          // Handle cases where 'error' key is an object (e.g., {detail: "..."} or field errors)
          const nestedErrors = err.response.data.error;
          if (nestedErrors.detail) {
            errorMessage = nestedErrors.detail;
          } else {
            // Fallback for other structured errors within the 'error' object
            errorMessage = Object.keys(nestedErrors).map(key => {
              const fieldError = nestedErrors[key];
              const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `${fieldName}: ${Array.isArray(fieldError) ? fieldError.join(', ') : fieldError}`;
            }).join('; ');
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else {
          // General fallback for other structured errors at the root level
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

  // Register function with improved error handling and therapist fields
  const register = async (userData) => {
    setLoading(true);
    try {
      console.log("AuthContext - Calling register API...");
      const payload = {
        email: userData.email,
        password: userData.password,
        password2: userData.password, // Assuming password and password2 are the same for registration
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone || '',
        is_therapist: userData.isTherapist || false,
      };

      // Add therapist-specific fields only if registering as a therapist
      if (payload.is_therapist) {
        payload.is_available = userData.is_available;
        payload.is_free_consultation = userData.is_free_consultation;
        payload.hourly_rate = userData.hourly_rate; // Can be null if free consultation
        payload.session_modes = userData.session_modes;
        payload.physical_address = userData.physical_address;
        // Add other therapist fields if they are part of the registration flow
        payload.years_of_experience = userData.years_of_experience || null;
        payload.specializations = userData.specializations ? userData.specializations.join(',') : null;
        payload.license_credentials = userData.license_credentials || null;
        payload.approach_modalities = userData.approach_modalities || null;
        payload.languages_spoken = userData.languages_spoken || null;
        payload.client_focus = userData.client_focus || null;
        payload.insurance_accepted = userData.insurance_accepted;
        payload.video_introduction_url = userData.video_introduction_url || null;
        // profile_picture is typically updated after registration, not during initial registration
        // payload.profile_picture = userData.profile_picture || null;
      }

      const response = await axios.post('http://localhost:8000/api/register/', payload);

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
      console.error("AuthContext - Registration error:", err.response?.data || err);

      let errorMessage = "Registration failed. Please check your input and try again.";
      if (err.response && err.response.data) {
        const errors = err.response.data;
        const errorKey = Object.keys(errors)[0]; // Get the first error key
        if (errorKey) {
          const fieldError = errors[errorKey];
          const fieldName = errorKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (Array.isArray(fieldError)) {
            errorMessage = `${fieldName}: ${fieldError.join(', ')}`;
          } else if (typeof fieldError === 'string') {
            errorMessage = `${fieldName}: ${fieldError}`;
          } else if (errors.detail) { // For generic detail errors
            errorMessage = errors.detail;
          } else {
            // Fallback for other structured errors
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
