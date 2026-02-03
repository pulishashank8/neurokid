"use client";

/**
 * Global Error Boundary
 * 
 * This component catches all unhandled errors in the application.
 * It integrates with Sentry to report errors and shows a user-friendly error page.
 */

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error("[Global Error]", error);

    // Send error to Sentry
    Sentry.captureException(error, {
      tags: {
        error_boundary: "global",
      },
      extra: {
        digest: error.digest,
        stack: error.stack,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>

          <p className="text-gray-600 mb-6">
            We apologize for the inconvenience. Our team has been notified and
            is working to fix the issue.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 p-4 bg-gray-100 rounded text-left overflow-auto">
              <p className="text-sm font-mono text-red-600 mb-2">
                {error.message}
              </p>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={reset} className="w-full">
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="w-full"
            >
              Go Home
            </Button>
          </div>

          {error.digest && (
            <p className="mt-4 text-xs text-gray-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
