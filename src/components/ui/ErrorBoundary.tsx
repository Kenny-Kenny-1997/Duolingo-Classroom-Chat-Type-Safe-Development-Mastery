// ============================================================
// DUOLINGO CLASSROOM CHAT — Error Boundary
// Type-safe React error boundaries for classroom safety
// ============================================================

"use client";

import React from "react";
import { ContentSafetyError, ApiClientError } from "@/lib/api/client";

// ─── Error Types ─────────────────────────────────────────────

type ErrorBoundaryState =
  | { hasError: false }
  | { hasError: true; error: Error; errorInfo: React.ErrorInfo };

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// ─── Error Boundary Class Component ─────────────────────────

export class ChatErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: { componentStack: "" } };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ hasError: true, error, errorInfo });
    this.props.onError?.(error, errorInfo);
    // In production, log to monitoring service (e.g. Sentry)
    console.error("[ChatErrorBoundary] Error caught:", error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    return (
      <ErrorDisplay
        error={this.state.error}
        onRetry={this.handleRetry}
      />
    );
  }
}

// ─── Error Display Component ─────────────────────────────────

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps): React.ReactElement {
  const isContentSafety = error instanceof ContentSafetyError;
  const isApiError = error instanceof ApiClientError;

  if (isContentSafety) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center space-y-3">
        <div className="text-4xl">🛡️</div>
        <h3 className="font-bold text-yellow-800 text-lg">
          Content Safety Notice
        </h3>
        <p className="text-yellow-700 text-sm">
          This content was blocked by Duolingo&apos;s classroom safety system to
          protect our learning community.
        </p>
        {onRetry !== undefined && (
          <button
            onClick={onRetry}
            className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            Back to Chat
          </button>
        )}
      </div>
    );
  }

  if (isApiError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
        <div className="text-4xl">🦉</div>
        <h3 className="font-bold text-red-700 text-lg">
          Duo ran into a problem!
        </h3>
        <p className="text-red-600 text-sm">{error.message}</p>
        <p className="text-gray-400 text-xs font-mono">
          Error code: {(error as ApiClientError).code}
        </p>
        {onRetry !== undefined && (
          <button
            onClick={onRetry}
            className="bg-duolingo-green hover:bg-duolingo-green-dark text-white font-bold px-4 py-2 rounded-xl text-sm shadow-duolingo active:shadow-none active:translate-y-0.5 transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-3">
      <div className="text-4xl">😅</div>
      <h3 className="font-bold text-gray-700 text-lg">Something went wrong</h3>
      <p className="text-gray-500 text-sm">
        Don&apos;t worry — your learning streak is safe! Please try again.
      </p>
      {onRetry !== undefined && (
        <button
          onClick={onRetry}
          className="bg-duolingo-blue hover:bg-duolingo-blue-dark text-white font-bold px-4 py-2 rounded-xl text-sm shadow-duolingo active:shadow-none active:translate-y-0.5 transition-all"
        >
          Reload Chat
        </button>
      )}
    </div>
  );
}

// ─── Inline Error Alert ──────────────────────────────────────

interface ErrorAlertProps {
  message: string;
  code?: string;
  onDismiss?: () => void;
}

export function ErrorAlert({
  message,
  code,
  onDismiss,
}: ErrorAlertProps): React.ReactElement {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
      <span className="text-red-500 text-xl shrink-0">⚠️</span>
      <div className="flex-1">
        <p className="text-sm text-red-700 font-medium">{message}</p>
        {code !== undefined && (
          <p className="text-xs text-red-400 font-mono mt-1">Code: {code}</p>
        )}
      </div>
      {onDismiss !== undefined && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-lg shrink-0 transition-colors"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
