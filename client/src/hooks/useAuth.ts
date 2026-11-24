import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PublicUser } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn<PublicUser | null>({ on401: "returnNull" }),
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    },
    onSettled: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries();
    },
  });

  const role = user?.role ?? "user";

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: role === "junior_admin" || role === "senior_admin",
    isSeniorAdmin: role === "senior_admin",
    logout: () => logoutMutation.mutate(),
  };
}
