"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const savedToken = localStorage.getItem("traffic_token");
        const savedUser = localStorage.getItem("traffic_user");
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Re-validate token and refresh profile with backend
          try {
            const profile = await authService.getMe();
            setUser(profile);
            localStorage.setItem("traffic_user", JSON.stringify(profile));
          } catch (profileErr) {
            if (profileErr.status === 401) {
              setToken(null);
              setUser(null);
              localStorage.removeItem("traffic_token");
              localStorage.removeItem("traffic_user");
            }
          }
        }
      } catch (e) {
        console.error("Auth session hydration error:", e);
      } finally {
        setLoading(false);
      }
    }
    hydrateAuth();
  }, []);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    try {
      localStorage.setItem("traffic_token", newToken);
      localStorage.setItem("traffic_user", JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to persist auth session:", e);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Backend logout best-effort
    }
    setToken(null);
    setUser(null);
    setLogoutModalOpen(false);
    try {
      localStorage.removeItem("traffic_token");
      localStorage.removeItem("traffic_user");
    } catch (e) {
      console.error("Failed to remove auth session:", e);
    }
    router.push("/login?logged_out=true");
  };

  const openLogoutDialog = () => {
    setLogoutModalOpen(true);
  };

  const closeLogoutDialog = () => {
    setLogoutModalOpen(false);
  };

  const updateUserLanguage = (newLang) => {
    if (user) {
      const updated = { ...user, preferred_language: newLang };
      setUser(updated);
      try {
        localStorage.setItem("traffic_user", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update stored user language:", e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isCitizen: user?.role === "citizen",
        isAdmin: user?.role === "admin",
        login,
        logout,
        logoutModalOpen,
        openLogoutDialog,
        closeLogoutDialog,
        updateUserLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
