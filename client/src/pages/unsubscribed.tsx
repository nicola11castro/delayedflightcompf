import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n";
import { MailX } from "lucide-react";

export default function Unsubscribed() {
  const { t } = useLang();
  const ok = new URLSearchParams(window.location.search).get("ok") !== "0";
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md win98-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <MailX className="h-6 w-6" />
            {t("unsub.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-center">
          <p>{ok ? t("unsub.text") : t("unsub.invalid")}</p>
          <Link href="/"><Button className="btn-primary">{t("auth.backHome")}</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
