import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/i18n";
import type { PublicUser } from "@shared/schema";
import { KeyRound } from "lucide-react";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(8, "auth.minChars"),
    confirmPassword: z.string().min(1, "auth.confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "auth.passwordsMismatch", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const { t } = useLang();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { password: "", confirmPassword: "" } });

  const mutation = useMutation({
    mutationFn: async (data: FormData): Promise<{ user: PublicUser }> => {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: data.password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.code === "TOKEN_INVALID" ? t("auth.resetInvalid") : body.message || t("auth.resetFailed"));
      return body;
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({ title: t("auth.resetDone") });
      navigate("/my-claims");
    },
    onError: (error: Error) => toast({ title: t("auth.resetFailed"), description: error.message, variant: "destructive" }),
  });

  const msg = (m?: string) => (m && m.startsWith("auth.") ? t(m as "auth.minChars") : m);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md win98-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2"><KeyRound className="h-6 w-6" />{t("auth.resetTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.resetLead")}</p>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-3 text-sm">
              <p className="win98-inset p-3">{t("auth.resetInvalid")}</p>
              <Link href="/forgot-password" className="underline text-xs">{t("auth.forgot")}</Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="password" render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("auth.newPassword")}</FormLabel>
                    <FormControl><Input {...field} type="password" autoComplete="new-password" className="win98-input" /></FormControl>
                    <FormMessage>{msg(fieldState.error?.message)}</FormMessage>
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                    <FormControl><Input {...field} type="password" autoComplete="new-password" className="win98-input" /></FormControl>
                    <FormMessage>{msg(fieldState.error?.message)}</FormMessage>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? t("auth.resetting") : t("auth.resetButton")}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
