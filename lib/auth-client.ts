"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Id } from "@/convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  phone: string;
  role: "user" | "admin";
  createdAt: number;
  updatedAt?: number;
}

export function useAuthClient() {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn: login,
    signUp: register,
    signOut: logout,
  };
}

export function useSession() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    data: user
      ? {
        user,
      }
      : null,
    isPending: isLoading,
    status: isAuthenticated ? "authenticated" : "unauthenticated",
  };
}
