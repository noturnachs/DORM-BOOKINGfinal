import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored user data and token on mount
    const storage = localStorage.getItem("user")
      ? localStorage
      : sessionStorage;

    const storedUser = storage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token, rememberMe = false) => {
    setUser(userData);
    const storage = rememberMe ? localStorage : sessionStorage;

    // Store both user data and token
    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("token", token);
  };

  const logout = () => {
    setUser(null);
    // Clear both storages
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
