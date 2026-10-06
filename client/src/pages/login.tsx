import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginInput, type PublicUser } from "@shared/schema";
import { LogIn, Mail, KeyRound } from "lucide-react";
import { useLang } from "@/i18n";

export default function Login() {
  const { toast } = useToast();
  const { t } = useLang();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginInput): Promise<{ user: PublicUser }> => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || t("auth.loginFailed"));
      }
      return body;
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({ title: t("auth.welcomeBack"), description: t("auth.signedInAs", { email: user.email ?? "" }) });
      const isAdmin = user.role === "senior_admin" || user.role === "junior_admin";
      navigate(isAdmin ? "/admin" : "/");
    },
    onError: (error: Error) => {
      toast({ title: t("auth.loginFailed"), description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md win98-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            {t("auth.loginTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.loginLead")}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {t("auth.email")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="email" autoComplete="email" className="win98-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <KeyRound className="h-3 w-3" />
                      {t("auth.password")}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" autoComplete="current-password" className="win98-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? t("auth.signingIn") : t("auth.signIn")}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  <Link href="/forgot-password" className="underline hover:text-primary">{t("auth.forgot")}</Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("auth.newHere")}{" "}
                  <Link href="/register" className="underline hover:text-primary">{t("auth.createAccount")}</Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  <Link href="/" className="underline hover:text-primary">{t("auth.backHome")}</Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
