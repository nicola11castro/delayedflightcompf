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
import { useLang } from "@/i18n";

const registerFormSchema = registerUserSchema
  .extend({
    confirmPassword: z.string().min(1, "auth.confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.passwordsMismatch",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function Register() {
  const { toast } = useToast();
  const { t, lang } = useLang();
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
      preferredLanguage: lang,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormData): Promise<{ user: PublicUser }> => {
      const { confirmPassword: _confirm, ...payload } = { ...data, preferredLanguage: lang };
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || t("auth.registerFailed"));
      }
      return body;
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({ title: t("auth.registered"), description: t("auth.registeredDesc") });
      navigate("/my-claims");
    },
    onError: (error: Error) => {
      toast({ title: t("auth.registerFailed"), description: error.message, variant: "destructive" });
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
            {t("auth.registerTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.registerLead")}</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="win98-panel p-4">
                <h3 className="font-bold text-sm mb-3">{t("auth.personal")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {t("auth.firstName")}
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
                          {t("auth.lastName")}
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
                        {t("auth.emailRequired")}
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
                          {t("auth.passwordRequired")}
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
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <KeyRound className="h-3 w-3" />
                          {t("auth.confirmPassword")}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="new-password" className="win98-input" />
                        </FormControl>
                        <FormMessage>
                          {fieldState.error?.message?.startsWith("auth.") ? t(fieldState.error.message as "auth.passwordsMismatch") : fieldState.error?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t("auth.minChars")}</p>
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
                    {t("auth.creating")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t("auth.create")}
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("auth.haveAccount")}{" "}
                  <Link href="/login" className="underline hover:text-primary">{t("auth.signInHere")}</Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("auth.explore")}{" "}
                  <Link href="/" className="underline hover:text-primary">{t("auth.goHome")}</Link>
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
