import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ConsentCheckboxes } from "@/components/consent-checkboxes";
import { registerUserSchema, type PublicUser } from "@shared/schema";
import { UserPlus, Mail, User, KeyRound } from "lucide-react";
import { z } from "zod";

const registerFormSchema = registerUserSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function Register() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      allConsentsAccepted: false,
      emailMarketingConsent: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormData): Promise<{ user: PublicUser }> => {
      const { confirmPassword: _confirm, ...payload } = data;
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "Registration failed");
      }
      return body;
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Registration Successful",
        description: "Your account has been created and you are now signed in.",
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl win98-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6" />
            Register for YUL Flight Claims
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create your account to submit and track flight compensation claims
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="win98-panel p-4">
                <h3 className="font-bold text-sm mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          First Name *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="given-name" className="win98-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Last Name *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="family-name" className="win98-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email Address *
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="email" autoComplete="email" className="win98-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <KeyRound className="h-3 w-3" />
                          Password *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" className="win98-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <KeyRound className="h-3 w-3" />
                          Confirm Password *
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" className="win98-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">At least 8 characters.</p>
              </div>

              {/* Consent Checkboxes */}
              <ConsentCheckboxes form={form} type="registration" />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="underline hover:text-primary">
                    Sign in here
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Want to explore first?{" "}
                  <Link href="/" className="underline hover:text-primary">
                    Go back to home
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
