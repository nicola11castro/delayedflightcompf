import { CheckCircle, XCircle, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { delayReasons, COMPENSATION_TABLE, DENIED_BOARDING_TABLE, DELAY_BANDS } from "@shared/appr";
import { Link } from "wouter";
import { useLang, useDynamicT } from "@/i18n";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export function ApprGuide() {
  const { t } = useLang();
  const dt = useDynamicT();
  const admissibleReasons = delayReasons.filter((reason) => reason.valid && reason.status !== "unknown");
  const nonAdmissibleReasons = delayReasons.filter((reason) => !reason.valid);
  const delayBands = DELAY_BANDS.filter((band) => band.value !== "0-3");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="win98-panel mb-6">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Link href="/">
              <Button variant="outline" size="sm" className="btn-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("guide.back")}
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">{t("guide.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("guide.lead")}</p>
        </div>

        <Card className="win98-panel mb-6">
          <CardHeader><CardTitle className="text-lg font-bold">{t("guide.overview")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{t("guide.overviewText")}</p>
            <div className="win98-inset p-4 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-bold text-sm mb-2">{t("guide.amounts")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <strong>{t("guide.large")}</strong>
                  <ul className="mt-1 space-y-1">
                    {delayBands.map((band) => <li key={band.value}>• {dt("band", band.value)}: ${COMPENSATION_TABLE.large[band.value].toLocaleString()} CAD</li>)}
                  </ul>
                </div>
                <div>
                  <strong>{t("guide.small")}</strong>
                  <ul className="mt-1 space-y-1">
                    {delayBands.map((band) => <li key={band.value}>• {dt("band", band.value)}: ${COMPENSATION_TABLE.small[band.value].toLocaleString()} CAD</li>)}
                  </ul>
                </div>
                <div>
                  <strong>{t("guide.denied")}</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• {dt("band", "0-3")} / {dt("band", "3-6")}: ${DENIED_BOARDING_TABLE["3-6"].toLocaleString()} CAD</li>
                    <li>• {dt("band", "6-9")}: ${DENIED_BOARDING_TABLE["6-9"].toLocaleString()} CAD</li>
                    <li>• {dt("band", "9+")}: ${DENIED_BOARDING_TABLE["9+"].toLocaleString()} CAD</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="win98-panel mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t("guide.admissible")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("guide.admissibleLead")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {admissibleReasons.map((reason) => (
                <div key={reason.value} className="win98-inset p-3 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-green-800 dark:text-green-200">{dt("reason", reason.value)}</h4>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">{dt("reasonDesc", reason.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="win98-panel mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              {t("guide.inadmissible")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("guide.inadmissibleLead")}</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {nonAdmissibleReasons.map((reason) => (
                <div key={reason.value} className="win98-inset p-3 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-red-800 dark:text-red-200">{dt("reason", reason.value)}</h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">{dt("reasonDesc", reason.value)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="win98-panel">
          <CardHeader><CardTitle className="text-lg font-bold">{t("guide.resources")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="btn-secondary w-full justify-start" onClick={() => window.open("https://otc-cta.gc.ca/eng/air-passenger-protection-regulations", "_blank")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("guide.cta")}
            </Button>
            <div className="win98-inset p-4 bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-bold text-sm mb-2 text-yellow-800 dark:text-yellow-200">{t("guide.notes")}</h3>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                {(["guide.note1", "guide.note2", "guide.note3", "guide.note4"] as const).map((key) => <li key={key}>• {t(key)}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
