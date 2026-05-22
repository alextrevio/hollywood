import { QueryClient } from "@tanstack/react-query"

/**
 * Shared TanStack Query client.
 *
 * Defaults chosen for an internal tool:
 * - staleTime 60s: data is considered fresh for a minute, so navigating between
 *   screens doesn't refetch constantly.
 * - gcTime 5m: unused cache is kept for 5 minutes before garbage collection.
 * - retry 1: one retry on failure (avoids hammering on a real error).
 * - refetchOnWindowFocus false: no surprise refetches when switching tabs.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
