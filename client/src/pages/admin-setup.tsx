import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { PublicUser } from "@shared/schema";
import { Shield, LogIn, UserPlus, LayoutDashboard } from "lucide-react";

export default function AdminSetup() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const setupAdminMutation = useMutation({
    mutationFn: async (): Promise<{ message: string; user: PublicUser }> => {
      const response = await apiRequest("POST", "/api/setup-admin");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({ title: "Admin Setup Complete", description: data.message });
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({ title: "Setup Failed", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full win98-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <Shield className="h-6 w-6 text-primary" />
            Admin Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Initialize the admin system for FlightClaim Pro
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-center">Checking your session...</p>
          ) : !isAuthenticated ? (
            <>
              <div className="text-xs bg-muted/50 p-3 rounded border win98-inset">
                Admin access is tied to the email addresses listed in <code>ADMIN_EMAILS</code> on the server.
                Register or sign in with one of those emails and you will become a senior admin automatically.
              </div>
              <div className="flex gap-2">
                <Link href="/login" className="flex-1">
                  <Button className="w-full btn-primary">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button variant="outline" className="w-full btn-outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </div>
            </>
          ) : isAdmin ? (
            <>
              <div className="text-xs bg-muted/50 p-3 rounded border win98-inset">
                <strong>{user?.email}</strong> already has <strong>{user?.role}</strong> access.
              </div>
              <Link href="/admin">
                <Button className="w-full btn-primary">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Open Admin Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="text-xs bg-muted/50 p-3 rounded border win98-inset">
                Signed in as <strong>{user?.email}</strong>. If this email is listed in <code>ADMIN_EMAILS</code>,
                the button below grants senior admin access.
              </div>
              <Button
                onClick={() => setupAdminMutation.mutate()}
                disabled={setupAdminMutation.isPending}
                className="w-full btn-primary"
              >
                {setupAdminMutation.isPending ? "Setting up..." : "Grant Senior Admin Access"}
              </Button>
            </>
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
            <strong>Senior admin can:</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>View all claims and user data</li>
              <li>Update claim status and email airlines</li>
              <li>Export data to Google Sheets</li>
              <li>Manage user roles and permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
