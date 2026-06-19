"use client";

import * as React from "react";

export interface AuthUser {
  id: string;
  phone: string;
  role: "admin" | "user";
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = React.createContext<
  | (AuthState & {
      signIn: (phone: string, password: string) => Promise<{ error?: string }>;
      signUp: (phone: string, password: string) => Promise<{ error?: string }>;
      signOut: () => void;
      fetchToken: () => Promise<string | null>;
    })
  | undefined
>(undefined);

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

  // On mount, restore from sessionStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const stored = sessionStorage.getItem("auth_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({
          user: parsed.user,
          token: parsed.token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  async function signIn(phone: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || "Login failed" };
    }

    const data = await res.json();
    const newState = {
      user: data.user,
      token: data.token,
      isLoading: false,
      isAuthenticated: true,
    };

    // Store in sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_state", JSON.stringify(newState));
    }

    setState(newState);
    return {};
  }

  async function signUp(phone: string, password: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || "Registration failed" };
    }

    return signIn(phone, password);
  }

  function signOut() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_state");
    }
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }

  async function fetchToken() {
    if (state.token) return state.token;
    return null;
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, fetchToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthClient() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuthClient must be used within AuthClientProvider");
  return ctx;
}

export function useSession() {
  const { user, isLoading, isAuthenticated } = useAuthClient();
  return {
    data: isAuthenticated && user ? { user } : null,
    isPending: isLoading,
  };
}

export function useConvexAuth() {
  const { isLoading, isAuthenticated, token } = useAuthClient();
  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken: async () => token,
  };
}

export function signOut() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("auth_state");
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    window.location.href = "/auth";
  }
}
