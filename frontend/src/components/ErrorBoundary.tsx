import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an unhandled render error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleNavigateHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[350px] w-full flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-6 shadow-neo-raised">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20 shadow-neo-raised-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Something went wrong</h2>
            <p className="text-xs text-muted-foreground mb-4">
              An unexpected error occurred while rendering this view. You can reload or return to the dashboard.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <pre className="text-left bg-muted/50 p-2.5 rounded-lg text-[10px] text-destructive overflow-x-auto max-h-32 mb-4 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="gap-1.5 shadow-neo-raised-sm text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Page
              </Button>
              <Button
                size="sm"
                onClick={this.handleNavigateHome}
                className="gap-1.5 shadow-neo-raised-sm text-xs"
              >
                <Home className="h-3.5 w-3.5" />
                Dashboard Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
