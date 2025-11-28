"use client";

import { createContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { notifySuccess } from "@/lib/toast";

export const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Only run on client side
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      // Skip auth check if we're already on the login page
      const isOnLoginPage = window.location.pathname.includes("/login");
      if (isOnLoginPage) {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const userData = await apiClient.getCurrentUser();
          // Try to hydrate permissions from localStorage (if backend doesn't return them)
          let storedPermissions = null;
          try {
            const raw = localStorage.getItem("moderator_permissions");
            if (raw) storedPermissions = JSON.parse(raw);
          } catch {
            storedPermissions = null;
          }

          // Map backend user data to frontend User type
          const mappedUser = {
            id: userData.user_id,
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
            name: userData.first_name && userData.last_name 
              ? `${userData.first_name} ${userData.last_name}` 
              : userData.username || userData.email,
            email: userData.email,
            role: userData.role || (userData.is_admin ? "admin" : userData.is_moderator ? "moderator" : "customer"),
            is_admin: userData.is_admin,
            is_moderator: userData.is_moderator,
            permissions: userData.permissions || storedPermissions || null,
            avatar: userData.avatar_url,
            phone: userData.phone,
            bio: userData.bio,
            verified: userData.verified,
          };
          setUser(mappedUser);
        } catch (error) {
          // Handle network errors gracefully
          const isNetworkError = !error.response || error.code === "ERR_NETWORK" || error.message === "Network Error";
          const isUnauthorized = error.response?.status === 401;
          
          // Only log non-network errors to avoid console spam
          if (!isNetworkError) {
            console.error("Failed to fetch user:", error);
          }
          
          // Clear tokens on unauthorized or network errors (but not on login page)
          if (isUnauthorized || isNetworkError) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            // Don't redirect if we're already on login page
            if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
              // Small delay to let interceptor handle redirect first
              setTimeout(() => {
                if (!window.location.pathname.includes("/login")) {
                  window.location.href = "/admin/login";
                }
              }, 100);
            }
          }
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      
      // Store tokens
      localStorage.setItem("access_token", response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }
      // Store permissions for moderators/admins
      if (response.permissions) {
        localStorage.setItem("moderator_permissions", JSON.stringify(response.permissions));
      } else {
        localStorage.removeItem("moderator_permissions");
      }
      
      // Map backend user data to frontend User type
      const mappedUser = {
        id: response.user.user_id || response.user.id,
        username: response.user.username,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        name: response.user.first_name && response.user.last_name 
          ? `${response.user.first_name} ${response.user.last_name}` 
          : response.user.username || response.user.email,
        email: response.user.email,
        role: response.user.role || (response.user.is_admin ? "admin" : response.user.is_moderator ? "moderator" : "customer"),
        is_admin: response.user.is_admin,
        is_moderator: response.user.is_moderator,
        permissions: response.permissions || null,
        avatar: response.user.avatar_url,
        phone: response.user.phone,
        bio: response.user.bio,
        verified: response.user.verified,
      };
      
      // Check if user has admin or moderator access
      if (!mappedUser.is_admin && !mappedUser.is_moderator) {
        throw new Error("Access denied. Admin or moderator privileges required.");
      }
      
      setUser(mappedUser);
    } catch (error) {
      console.error("Login failed:", error);
      const responseData = error.response?.data;
      const apiMessage =
        responseData?.detail ||
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null);
      const fallbackByStatus =
        error.response?.status === 401 ? "Invalid email or password" : null;
      const finalMessage =
        apiMessage ||
        fallbackByStatus ||
        error.message ||
        "Login failed";
      throw new Error(finalMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // Log error but don't prevent logout - clear tokens regardless
      // 403/401 errors are acceptable during logout (token might already be invalid)
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        console.error("Logout error:", error);
      }
    } finally {
      // Always clear user state and tokens, even if API call failed
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("moderator_permissions");
      // Redirect to login page after showing toast
      if (typeof window !== "undefined") {
        notifySuccess("You have been logged out.");
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 300);
      }
    }
  };

  const updateUser = async (userData) => {
    if (user) {
      try {
        await apiClient.updateProfile({
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          bio: userData.bio,
        });
        
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
      } catch (error) {
        console.error("Update user failed:", error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

