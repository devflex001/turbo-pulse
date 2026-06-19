"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Auth error boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Authentication Error</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {this.state.error?.message || "Something went wrong with authentication"}
            </p>
          </div>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/auth";
            }}
            className="mt-2"
          >
            Return to Login
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper for auth-dependent components
 * Shows loading state while auth is initializing
 */
interface AuthWrapperProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  unauthenticatedFallback?: React.ReactNode;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function AuthWrapper({
  children,
  loadingFallback,
  unauthenticatedFallback,
  isLoading,
  isAuthenticated,
}: AuthWrapperProps) {
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (unauthenticatedFallback) return <>{unauthenticatedFallback}</>;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6">
        <div className="p-3 bg-muted rounded-full">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-base font-semibold">Authentication Required</h3>
          <p className="text-sm text-muted-foreground">
            Please log in to access this feature
          </p>
        </div>
        <Button
          onClick={() => (window.location.href = "/auth")}
          size="sm"
        >
          Log In
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
