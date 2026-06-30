"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  storeSessionToken,
  removeSessionToken,
  storeUserData,
  getSessionToken,
  getUserData,
} from "./session";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  phone: string;
  role: "user" | "admin";
  createdAt: number;
  updatedAt?: number;
  referredBy?: Id<"users"> | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionToken: string | null;
  adminName: string | null;
  showAdminNameModal: boolean;
  isLoadingAdminSession: boolean;
  handleAdminNameSubmit: (name: string) => Promise<void>;
  login: (phone: string, password: string) => Promise<"user" | "admin" | undefined>;
  register: (phone: string, password: string, referralCode?: string) => Promise<"user" | "admin" | undefined>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionTokenChecked, setSessionTokenChecked] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [showAdminNameModal, setShowAdminNameModal] = useState(false);
  const [isLoadingAdminSession, setIsLoadingAdminSession] = useState(false);

  // Convex mutations
  const loginMutation = useMutation(api.auth.login.loginUser);
  const registerMutation = useMutation(api.auth.register.registerUser);
  const logoutMutation = useMutation(api.auth.sessions.deleteSession);
  const startAdminSessionMutation = useMutation(
    api.admin.sessions.startAdminSession
  );
  const endAdminSessionMutation = useMutation(
    api.admin.sessions.endAdminSession
  );

  // Get session token on mount (only once)
  useEffect(() => {
    const token = getSessionToken()
    const userData = getUserData()
    setSessionToken(token)
    setSessionTokenChecked(true)

    // Debug log
    if (typeof window !== 'undefined') {
      console.log('[AuthContext] Session token on mount:', token ? 'exists' : 'missing')
      console.log('[AuthContext] User data on mount:', userData ? 'exists' : 'missing')
      console.log('[AuthContext] Session storage keys:', Object.keys(localStorage))

      // TEMPORARY FIX: If we have user data in localStorage but getCurrentUser fails,
      // we can use the localStorage data as a fallback
      if (userData && !token) {
        console.log('[AuthContext] WARNING: Found user data without token, clearing invalid data')
        removeSessionToken()
      }
    }
  }, []);

  // Get current user from Convex using session token
  const currentUser = useQuery(
    api.auth.user.getCurrentUser,
    sessionTokenChecked && sessionToken && sessionToken.length > 0 ? { sessionToken } : "skip"
  );

  // Query current admin session
  const currentAdminSession = useQuery(
    api.admin.sessions.getCurrentAdminSession,
    user?.role === "admin" && sessionToken ? { sessionToken } : "skip"
  );

  // Update user state when Convex query resolves or when session token changes
  useEffect(() => {
    // Wait until we've checked for session token
    if (!sessionTokenChecked) {
      return;
    }

    // If no session token, auth is done loading (user is not logged in)
    if (!sessionToken || sessionToken.length === 0) {
      console.log('[AuthContext] No session token found, user not logged in');
      setUser(null);
      setIsLoading(false);
      return;
    }

    console.log('[AuthContext] Session token found, querying getCurrentUser...');

    // If we have a session token, wait for the query to resolve
    if (currentUser !== undefined) {
      console.log('[AuthContext] getCurrentUser resolved:', currentUser ? 'user found' : 'no user');
      if (currentUser) {
        console.log('[AuthContext] User details:', { id: currentUser._id, phone: currentUser.phone });
      }
      setUser(currentUser);
      setIsLoading(false);

      // If session is invalid, clear local storage
      if (currentUser === null && sessionToken) {
        console.log('[AuthContext] Session invalid, clearing token');
        removeSessionToken();
        setSessionToken(null);
      }
    } else {
      // Query is still loading
      console.log('[AuthContext] getCurrentUser query loading...');
    }
  }, [currentUser, sessionToken, sessionTokenChecked]);

  // Handle admin session logic
  useEffect(() => {
    if (!user || user.role !== "admin" || !sessionToken) {
      setShowAdminNameModal(false);
      setAdminName(null);
      return;
    }

    // If admin session already exists, use it
    if (currentAdminSession) {
      console.log('[AuthContext] Admin session found:', currentAdminSession.adminName);
      setAdminName(currentAdminSession.adminName);
      setShowAdminNameModal(false);
      return;
    }

    // If admin session query resolved but no session exists, show modal
    if (currentAdminSession === null && !isLoadingAdminSession) {
      console.log('[AuthContext] No admin session found, showing modal');
      setShowAdminNameModal(true);
    }
  }, [user, sessionToken, currentAdminSession, isLoadingAdminSession]);

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

  const register = async (phone: string, password: string, referralCode?: string) => {
    try {
      setIsLoading(true);

      // Call Convex register mutation with optional referral code
      const result = await registerMutation({
        phone,
        password,
        referralCode,
      });

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
      // End admin session if admin is logged out
      if (user?.role === "admin" && sessionToken && adminName) {
        try {
          await endAdminSessionMutation({
            sessionToken,
          });
        } catch (err) {
          console.error("Error ending admin session:", err);
        }
      }

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
      setAdminName(null);
      setShowAdminNameModal(false);

      // Redirect to home page
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const handleAdminNameSubmit = async (name: string) => {
    if (!user || !sessionToken) {
      throw new Error("User or session token not found");
    }

    setIsLoadingAdminSession(true);
    try {
      const result = await startAdminSessionMutation({
        userId: user._id,
        adminName: name,
        sessionToken,
      });

      setAdminName(result.adminName);
      setShowAdminNameModal(false);
      console.log("[AuthContext] Admin session created:", result.adminName);
    } catch (error) {
      console.error("Error creating admin session:", error);
      throw error;
    } finally {
      setIsLoadingAdminSession(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    sessionToken,
    adminName,
    showAdminNameModal,
    isLoadingAdminSession,
    handleAdminNameSubmit,
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
