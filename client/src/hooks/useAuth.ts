import { useState, useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        
        if (mounted) {
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    refetch: () => {
      setIsLoading(true);
      // Re-run the auth check
      window.location.reload();
    }
  };
}