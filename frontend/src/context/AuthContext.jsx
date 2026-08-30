import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("pps_token");
      if (storedToken) {
        api.setToken(storedToken);
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.warn("Session restore failed, logging out:", err);
          api.setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener("pps_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("pps_auth_expired", handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.login(email, password);
      api.setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await api.register(userData);
      api.setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
