"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  storeSessionToken,
  removeSessionToken,
  storeUserData,
  getSessionToken,
} from "./session";
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
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionTokenChecked, setSessionTokenChecked] = useState(false);

  // Convex mutations
  const loginMutation = useMutation(api.auth.login.loginUser);
  const registerMutation = useMutation(api.auth.register.registerUser);
  const logoutMutation = useMutation(api.auth.sessions.deleteSession);

  // Get session token on mount (only once)
  useEffect(() => {
    const token = getSessionToken();
    setSessionToken(token);
    setSessionTokenChecked(true);
  }, []);

  // Get current user from Convex using session token
  const currentUser = useQuery(
    api.auth.user.getCurrentUser,
    sessionTokenChecked && sessionToken && sessionToken.length > 0 ? { sessionToken } : "skip"
  );

  // Update user state when Convex query resolves or when session token changes
  useEffect(() => {
    // Wait until we've checked for session token
    if (!sessionTokenChecked) {
      return;
    }

    // If no session token, auth is done loading (user is not logged in)
    if (!sessionToken || sessionToken.length === 0) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // If we have a session token, wait for the query to resolve
    if (currentUser !== undefined) {
      setUser(currentUser);
      setIsLoading(false);

      // If session is invalid, clear local storage
      if (currentUser === null && sessionToken) {
        removeSessionToken();
        setSessionToken(null);
      }
    }
  }, [currentUser, sessionToken, sessionTokenChecked]);

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);

      // Call Convex login mutation
      const result = await loginMutation({ phone, password });

      if (result.success) {
        // Store session token
        storeSessionToken(result.sessionToken);
        storeUserData({
          userId: result.userId,
          phone: result.phone,
          role: result.role,
        });

        // Update local state
        setSessionToken(result.sessionToken);
        setUser({
          _id: result.userId,
          phone: result.phone,
          role: result.role,
          createdAt: Date.now(),
        });

        setIsLoading(false);

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

  const logout = async () => {
    try {
      // Delete session from database
      if (sessionToken) {
        await logoutMutation({ sessionToken });
      }
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      // Remove session token and user data
      removeSessionToken();
      setSessionToken(null);
      setUser(null);

      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
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
