import { useLang } from "@/i18n";

/** Facts from the regulation, not invented performance numbers. */
export function TrustIndicators() {
  const { t } = useLang();
  const tiles = [
    { value: t("trust.maxAmount"), label: t("trust.maxLabel"), color: "text-accent" },
    { value: t("trust.commission"), label: t("trust.commissionLabel"), color: "text-primary" },
    { value: t("trust.noWin"), label: t("trust.noWinLabel"), color: "text-secondary" },
  ];

  return (
    <section className="py-6 bg-muted" style={{ borderTop: "2px inset", borderBottom: "2px inset", borderColor: "hsl(var(--border))" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-4 items-stretch text-center max-w-3xl mx-auto">
          {tiles.map((tile) => (
            <div key={tile.label} className="win98-panel">
              <div className={`text-lg font-bold mb-1 ${tile.color}`}>{tile.value}</div>
              <div className="text-muted-foreground text-xs font-bold">{tile.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
