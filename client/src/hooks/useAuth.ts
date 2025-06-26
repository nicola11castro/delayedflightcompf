import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError: false,
  });

  const isAuthenticated = !!user && !error;
  const actualLoading = isLoading && !error?.message?.includes('401');

  return {
    user: user || null,
    isLoading: actualLoading,
    isAuthenticated,
  };
}