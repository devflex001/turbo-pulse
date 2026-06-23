"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  createAuthToken,
  storeAuthToken,
  removeAuthToken,
  storeUserData,
  getUserData,
  getAuthToken,
} from "./jwt";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  phone: string;
  role: "user" | "admin";
  createdAt: number;
  updatedAt?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (phone: string, password: string) => Promise<"user" | "admin" | undefined>;
  register: (phone: string, password: string) => Promise<"user" | "admin" | undefined>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convex mutations
  const loginMutation = useMutation(api.auth.login.loginUser);
  const registerMutation = useMutation(api.auth.register.registerUser);

  // Get current user from Convex (using session)
  const currentUser = useQuery(api.auth.user.getCurrentUser);

  // Initialize user state from Convex session
  useEffect(() => {
    // Wait for Convex query to resolve
    if (currentUser !== undefined) {
      setUser(currentUser);
      setIsLoading(false);

      // If Convex session is valid but user is null, clear local storage
      if (currentUser === null) {
        const storedToken = getAuthToken();
        if (storedToken) {
          // Token exists but session is invalid - clear it
          removeAuthToken();
        }
      }
    }
  }, [currentUser]);

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);

      // Call Convex login mutation
      const result = await loginMutation({ phone, password });

      if (result.success) {
        // Create JWT token for Convex Auth session
        const token = await createAuthToken(result.userId, result.role);

        // Store token and user data
        storeAuthToken(token);
        storeUserData({
          userId: result.userId,
          phone: result.phone,
          role: result.role,
        });

        // Set user immediately to prevent flicker
        setUser({
          _id: result.userId,
          phone: result.phone,
          role: result.role,
          createdAt: Date.now(),
        });

        setIsLoading(false);

        // Trigger storage event to sync with ConvexProvider
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "convex_auth_token",
            newValue: token,
          })
        );

        // Return the role so the calling component can handle redirect
        return result.role;
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (phone: string, password: string) => {
    try {
      setIsLoading(true);

      // Call Convex register mutation
      const result = await registerMutation({ phone, password });

      if (result.success) {
        // Auto-login after registration
        return await login(phone, password);
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    // Remove auth token and user data
    removeAuthToken();
    setUser(null);

    // Dispatch storage event to clear auth in ConvexProvider
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "convex_auth_token",
          newValue: null,
        })
      );
    }

    // Force a page reload to clear Convex connection state
    // This ensures the client reconnects without the auth token
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
