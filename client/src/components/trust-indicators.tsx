import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalClaims: number;
  successRate: number;
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
    <section className="py-12 bg-white dark:bg-dark-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 items-center text-center">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats ? formatNumber(stats.totalClaims) : "12,847"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Claims Processed</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-secondary mb-2">
              {stats ? `${stats.successRate}%` : "94%"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-accent mb-2">
              ${stats ? formatNumber(stats.avgCompensation) : "580"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Avg. Compensation</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {stats ? `${stats.commissionRate}%` : "15%"}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Commission Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}
