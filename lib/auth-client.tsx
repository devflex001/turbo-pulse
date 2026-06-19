"use client";

/**
 * Custom auth client for phone + password authentication.
 *
 * Replaces the old better-auth/react client. All functions call
 * our Next.js API routes and manage session state client-side.
 */

import * as React from "react";

export interface AuthUser {
  id: string;
  phone: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // The JWT string — used by ConvexProviderWithAuth to send auth headers
  token: string | null;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = React.createContext<
  | (AuthState & {
      signIn: (phone: string, password: string) => Promise<{ error?: string }>;
      signUp: (phone: string, password: string) => Promise<{ error?: string }>;
      signOut: () => Promise<void>;
      fetchToken: () => Promise<string | null>;
    })
  | undefined
>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    token: null,
  });

  // On mount, check if there's an existing session
  React.useEffect(() => {
    fetchMe();
  }, []);

  async function fetchMe() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setState({
          user: data.user,
          token: data.token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }

  async function signIn(phone: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || "Login failed" };
    }
    const data = await res.json();
    setState({
      user: data.user,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    });
    return {};
  }

  async function signUp(phone: string, password: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || "Registration failed" };
    }
    // Auto sign-in after registration
    return signIn(phone, password);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }

  /**
   * Returns the current JWT token. Used by ConvexProviderWithAuth.
   * If there's no token (session expired), re-fetches /api/auth/me.
   */
  async function fetchToken() {
    if (state.token) return state.token;
    // Try to re-fetch from cookie session
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          token: data.token,
          user: data.user,
          isAuthenticated: true,
        }));
        return data.token as string;
      }
    } catch {
      // ignore
    }
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signIn, signUp, signOut, fetchToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAuthClient() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthClient must be used within AuthClientProvider");
  return ctx;
}

/**
 * useSession — drop-in replacement for better-auth's useSession.
 * Returns { data: session | null, isPending: boolean }
 */
export function useSession() {
  const { user, isLoading, isAuthenticated } = useAuthClient();
  return {
    data: isAuthenticated && user ? { user } : null,
    isPending: isLoading,
  };
}

/**
 * useAuth — hook for ConvexProviderWithAuth.
 * Returns { isLoading, isAuthenticated, fetchAccessToken }
 */
export function useConvexAuth() {
  const { isLoading, isAuthenticated, fetchToken } = useAuthClient();
  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      void forceRefreshToken;
      return fetchToken();
    },
  };
}

/**
 * signOut — standalone function for backwards compat.
 */
export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  // Reload to reset state
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}
