"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 2 minutes before refetch
            staleTime: 2 * 60 * 1000,
            // Keep unused data in cache for 10 minutes (for back navigation)
            gcTime: 10 * 60 * 1000,
            // Retry failed queries twice
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            // Refetch on window focus (keep data fresh)
            refetchOnWindowFocus: true,
            // Don't refetch on mount if data is still fresh
            refetchOnMount: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}