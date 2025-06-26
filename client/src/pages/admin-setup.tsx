import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail } from "lucide-react";

export default function AdminSetup() {
  const [email, setEmail] = useState("pncastrodorion@gmail.com");
  const { toast } = useToast();

  const setupAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/setup-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to setup admin");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin Setup Complete",
        description: "Senior admin user has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSetup = () => {
    if (email.trim()) {
      setupAdminMutation.mutate(email.trim());
    }
  };

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
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="pl-10 win98-input"
              />
            </div>
          </div>

          <Button
            onClick={handleSetup}
            disabled={!email.trim() || setupAdminMutation.isPending}
            className="w-full btn-primary"
          >
            {setupAdminMutation.isPending ? "Setting up..." : "Setup Senior Admin"}
          </Button>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
            <strong>Note:</strong> This will create a senior admin account with full system access including:
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>View all claims and user data</li>
              <li>Export data to Google Sheets</li>
              <li>Manage user roles and permissions</li>
              <li>Access admin dashboard</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}