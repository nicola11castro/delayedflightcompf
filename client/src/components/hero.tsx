import { FileText, Calculator, User } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n";

export function Hero() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLang();

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-background text-foreground py-12 border-b-2 border-border" style={{ borderStyle: "inset" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-bold text-2xl mb-4">
              {t("hero.title")}
              <span className="block text-accent">{t("hero.subtitle")}</span>
            </h1>
            <p className="text-sm text-foreground mb-6">{t("hero.lead")}</p>

            <div className="win98-panel mb-6">
              <h3 className="font-bold text-sm mb-2">
                <Calculator className="inline w-4 h-4 mr-1" />
                {t("hero.commissionTitle")}
              </h3>
              <div className="win98-inset mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>{t("hero.compensation")}: <strong>$700</strong></div>
                  <div>{t("hero.ourFee")}: <strong>$105</strong></div>
                  <div>{t("hero.youReceive")}: <strong>$595</strong></div>
                  <div>{t("hero.ifNoWin")}: <strong>{t("hero.noFee")}</strong></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="btn-accent" onClick={() => scrollToSection("claims")}>
                <FileText className="mr-1 h-4 w-4" />
                {t("hero.submit")}
              </Button>
              <Button variant="outline" className="btn-outline" onClick={() => scrollToSection("calculator")}>
                {t("hero.calculate")}
              </Button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 mt-3 text-xs bg-accent/10 border border-accent/20 rounded-lg p-2">
                <User className="h-3 w-3 text-accent" />
                <span className="text-accent">{t("hero.welcome", { name: user?.firstName || user?.email || "" })}</span>
                <Link href="/my-claims" className="ml-auto underline hover:text-primary">
                  {t("nav.myClaims")}
                </Link>
              </div>
            ) : (
              <div className="flex gap-2 mt-3 text-xs">
                <Link href="/register" className="underline hover:text-primary">{t("hero.newUser")}</Link>
                <span>•</span>
                <Link href="/login" className="underline hover:text-primary">{t("hero.haveAccount")}</Link>
              </div>
            )}
          </div>

          <div>
            <div className="win98-panel">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent flex items-center justify-center mx-auto mb-2" style={{ border: "2px outset" }}>
                  <FileText className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-sm mb-2">{t("hero.quickTitle")}</h3>
                <p className="text-xs mb-3">{t("hero.quickLead")}</p>
                <div className="space-y-1 text-left text-xs">
                  {(["hero.quick1", "hero.quick2", "hero.quick3"] as const).map((key) => (
                    <div key={key} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-secondary" style={{ border: "1px outset" }}></div>
                      <span>{t(key)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
