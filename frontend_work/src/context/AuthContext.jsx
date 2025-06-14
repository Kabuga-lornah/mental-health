import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);

  // Set axios default headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user)); // Store user data
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [token, user]);

  // Validate token on initial load
  useEffect(() => {
    const validateToken = async () => {
      try {
        if (token) {
          const res = await axios.get("http://localhost:8000/api/user/", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  // In AuthContext.jsx
const login = async (email, password) => {
  try {
    const res = await axios.post("http://localhost:8000/api/login/", {
      email,
      password,
    });
    
    console.log("Login response:", res.data); // Add this line
    
    setToken(res.data.access);
    setUser(res.data.user);
    localStorage.setItem("refresh_token", res.data.refresh);
    return res.data;
  } catch (err) {
    console.error("Login error:", err); // Add this line
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
      localStorage.setItem("refresh_token", res.data.refresh);
      return res.data;
    } catch (err) {
      throw err.response?.data || { error: err.message || "Registration failed" };
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("refresh_token");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);