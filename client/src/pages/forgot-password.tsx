import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLang } from "@/i18n";
import { forgotPasswordSchema } from "@shared/schema";
import { KeyRound, Mail } from "lucide-react";
import { z } from "zod";

type FormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await fetch("/api/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    },
    onSettled: () => setSent(true),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md win98-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2"><KeyRound className="h-6 w-6" />{t("auth.forgotTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("auth.forgotLead")}</p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-sm">
              <p className="win98-inset p-3">{t("auth.forgotSent")}</p>
              <Link href="/login" className="underline text-xs">{t("auth.signInHere")}</Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1"><Mail className="h-3 w-3" />{t("auth.email")}</FormLabel>
                    <FormControl><Input {...field} type="email" autoComplete="email" className="win98-input" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? t("auth.sending") : t("auth.sendLink")}
                </Button>
                <p className="text-xs text-center text-muted-foreground"><Link href="/login" className="underline">{t("auth.backHome")}</Link></p>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
