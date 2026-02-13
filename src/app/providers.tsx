"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode, useState, useEffect } from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

// Suppress next-auth CLIENT_FETCH_ERROR in development
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString?.() || "";
    const fullMsg = args.map((a) => String(a)).join(" ");
    if (
      message.includes("CLIENT_FETCH_ERROR") ||
      message.includes("Cannot convert undefined or null to object") ||
      (fullMsg.includes("hydrated") && fullMsg.includes("data-cursor-ref"))
    ) {
      return; // Suppress known non-actionable errors (auth client, Cursor browser refs)
    }
    originalConsoleError.apply(console, args);
  };
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(() => getQueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <NextAuthSessionProvider 
        basePath="/api/auth"
        refetchInterval={0}
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
            },
          }}
        />
      </NextAuthSessionProvider>
    </QueryClientProvider>
  );
}
