export function TrustIndicators() {
  // Static data for transparent commission structure - no API calls to avoid misleading metrics
  const stats = {
    avgCompensation: 650,
    commissionRate: 15,
  };

  return (
    <section className="py-6 bg-muted" style={{borderTop: '2px inset', borderBottom: '2px inset', borderColor: 'hsl(var(--border))'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-4 items-center text-center max-w-md mx-auto">
          <div className="win98-panel">
            <div className="text-lg font-bold text-accent mb-1">
              ${stats.avgCompensation}
            </div>
            <div className="text-muted-foreground text-xs font-bold">Avg. Compensation</div>
          </div>
          <div className="win98-panel">
            <div className="text-lg font-bold text-primary mb-1">
              {stats.commissionRate}%
            </div>
            <div className="text-muted-foreground text-xs font-bold">Our Commission</div>
          </div>
        </div>
      </div>
    </section>
  );
}
