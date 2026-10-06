import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n";
import { BookOpen, Handshake, Scale, CheckCircle } from "lucide-react";

interface Config {
  pricing?: { commissionPct: number; escalatedCommissionPct: number | null; kitPriceCents: number; kitRequiresPayment: boolean };
}

export default function Pricing() {
  const { t } = useLang();
  const { data } = useQuery<Config>({ queryKey: ["/api/config"] });
  const pricing = data?.pricing;
  const kitPrice = pricing ? (pricing.kitPriceCents > 0 ? `$${(pricing.kitPriceCents / 100).toFixed(2)} CAD` : t("pricing.tba")) : "";
  const escalated = pricing?.escalatedCommissionPct ? t("pricing.escalatedFee", { pct: pricing.escalatedCommissionPct }) : t("pricing.tba");

  const tiers = [
    { icon: BookOpen, title: t("pricing.kitTitle"), who: t("pricing.kitWho"), includes: t("pricing.kitIncludes"), price: kitPrice, note: t("pricing.kitKeep"), cta: { href: "/#claims", label: t("hero.submit") } },
    { icon: Handshake, title: t("pricing.managedTitle"), who: t("pricing.managedWho"), includes: t("pricing.managedIncludes"), price: t("pricing.managedFee", { pct: pricing?.commissionPct ?? 15 }), note: t("pricing.noWin"), cta: { href: "/#claims", label: t("hero.submit") } },
    { icon: Scale, title: t("pricing.escalatedTitle"), who: t("pricing.escalatedWho"), includes: t("pricing.escalatedIncludes"), price: escalated, note: t("pricing.noWin"), cta: { href: "/appr-guide", label: t("footer.guide") } },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="win98-panel">
          <h1 className="text-xl font-bold">{t("pricing.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pricing.lead")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.title} className="win98-panel flex flex-col gap-3 text-sm">
              <h2 className="font-bold flex items-center gap-2"><tier.icon className="h-4 w-4" />{tier.title}</h2>
              <p className="text-xs text-muted-foreground">{tier.who}</p>
              <div className="win98-inset p-2 text-lg font-bold text-center">{tier.price}</div>
              <p className="text-xs">{tier.includes}</p>
              <p className="text-xs flex items-start gap-1"><CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />{tier.note}</p>
              <Link href={tier.cta.href} className="mt-auto"><Button className="btn-primary text-xs w-full">{tier.cta.label}</Button></Link>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("pricing.compare")}</p>
      </div>
      <Footer />
    </div>
  );
}
