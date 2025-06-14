import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage, parsing the JSON string
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);

  // Set axios default headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("refresh_token");
    }
  }, [token]);

  // Validate token on initial load and when token changes
  useEffect(() => {
    const validateToken = async () => {
      try {
        if (token) {
          const res = await axios.get("http://localhost:8000/api/user/", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          // Ensure user data is stored in localStorage after successful validation
          localStorage.setItem("user", JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Token validation failed:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post("http://localhost:8000/api/login/", {
        email,
        password,
      });

      setToken(res.data.access);
      setUser(res.data.user);
      // Store user data immediately after login
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("refresh_token", res.data.refresh);
      return res.data;
    } catch (err) {
      console.error("Login error:", err);
      throw err.response?.data || { error: err.message || "Login failed" };
    }
  };

  const register = async (userData) => {
    try {
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
      setUser(res.data.user);
      // Store user data immediately after registration
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("refresh_token", res.data.refresh);
      return res.data;
    } catch (err) {
      throw err.response?.data || { error: err.message || "Registration failed" };
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  };

  const contextData = {
    user,
    token,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={contextData}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);