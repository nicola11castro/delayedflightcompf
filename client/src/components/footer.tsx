import { Plane, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/i18n";
import { BRAND_NAME, SUPPORT_EMAIL } from "@shared/brand";

export function Footer() {
  const { t } = useLang();
  const scrollToSection = (sectionId: string) => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="bg-background py-8" style={{ borderTop: "2px inset", borderColor: "hsl(var(--border))" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="win98-panel mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Plane className="text-primary text-lg" />
                <span className="font-bold text-sm">{BRAND_NAME}</span>
              </div>
              <p className="text-muted-foreground mb-4 text-xs">{t("footer.tagline")}</p>

              <div className="win98-inset mb-4">
                <h4 className="font-bold mb-2 text-xs">{t("footer.promise")}</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {(["footer.p1", "footer.p2", "footer.p3", "footer.p4"] as const).map((key) => (
                    <li key={key} className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-secondary mr-1 flex-shrink-0" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-3">{t("footer.services")}</h3>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => scrollToSection("claims")} className="hover:underline">{t("footer.submit")}</button></li>
              <li><button onClick={() => scrollToSection("track")} className="hover:underline">{t("footer.track")}</button></li>
              <li><button onClick={() => scrollToSection("calculator")} className="hover:underline">{t("footer.calculator")}</button></li>
              <li><Link href="/appr-guide" className="hover:underline">{t("footer.guide")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-3">{t("footer.support")}</h3>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => scrollToSection("faq")} className="hover:underline">{t("footer.faq")}</button></li>
              <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">{t("footer.contact")}</a></li>
              <li><Link href="/register" className="hover:underline">{t("footer.privacy")}</Link></li>
              <li><Link href="/register" className="hover:underline">{t("footer.terms")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-muted-foreground text-xs text-center">{t("footer.rights", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
