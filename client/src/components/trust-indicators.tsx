import { useQuery } from "@tanstack/react-query";

interface Stats {
  avgCompensation: number;
  commissionRate: number;
}

export function TrustIndicators() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <section className="py-6 bg-muted" style={{borderTop: '2px inset', borderBottom: '2px inset', borderColor: 'hsl(var(--border))'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-4 items-center text-center">
          <div className="win98-panel">
            <div className="text-lg font-bold text-primary mb-1">
              {stats ? formatNumber(stats.totalClaims) : "12,847"}
            </div>
            <div className="text-muted-foreground text-xs font-bold">Claims Processed</div>
          </div>
          <div className="win98-panel">
            <div className="text-lg font-bold text-secondary mb-1">
              {stats ? `${stats.successRate}%` : "94%"}
            </div>
            <div className="text-muted-foreground text-xs font-bold">Success Rate</div>
          </div>
          <div className="win98-panel">
            <div className="text-lg font-bold text-accent mb-1">
              ${stats ? formatNumber(stats.avgCompensation) : "580"}
            </div>
            <div className="text-muted-foreground text-xs font-bold">Avg. Compensation</div>
          </div>
          <div className="win98-panel">
            <div className="text-lg font-bold text-primary mb-1">
              {stats ? `${stats.commissionRate}%` : "15%"}
            </div>
            <div className="text-muted-foreground text-xs font-bold">Commission Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}
