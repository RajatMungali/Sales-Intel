import { Building2, Flame, Users, DollarSign, TrendingUp } from "lucide-react";

const cards = [
  {
    key: "total",
    label: "Companies",
    sublabel: "Tracked in total",
    icon: Building2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    getValue: (stats, companies) =>
      stats.total_companies ?? companies.length ?? 0,
    trend: null,
  },
  {
    key: "hot",
    label: "Hot Leads",
    sublabel: "Score 80–100",
    icon: Flame,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    getValue: (stats, companies) =>
      stats.hot_leads ?? companies.filter((c) => c.intent_score >= 80).length,
    trend: "+12%",
    trendUp: true,
  },
  {
    key: "hiring",
    label: "Sales Hiring",
    sublabel: "Active hiring signals",
    icon: Users,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    getValue: (stats, companies) =>
      stats.hiring_signals ??
      companies.filter((c) =>
        c.signals?.some((s) => s.toLowerCase().includes("hir")),
      ).length,
    trend: "+18%",
    trendUp: true,
  },
  {
    key: "funding",
    label: "Funding Signals",
    sublabel: "Recent funding rounds",
    icon: DollarSign,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    getValue: (stats, companies) =>
      stats.funding_signals ??
      companies.filter((c) =>
        c.signals?.some((s) => s.toLowerCase().includes("fund")),
      ).length,
    trend: "+8%",
    trendUp: true,
  },
];

export default function StatsCards({ stats = {}, companies = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-6">
      {cards.map(
        ({
          key,
          label,
          sublabel,
          icon: Icon,
          iconBg,
          iconColor,
          getValue,
          trend,
          trendUp,
        }) => (
          <div
            key={key}
            className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 flex items-start gap-3 shadow-[0_2px_12px_rgba(15,23,42,0.06)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.10)] transition-shadow duration-200"
          >
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}
            >
              <Icon size={16} className={iconColor} />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {getValue(stats, companies).toLocaleString()}
                </span>
                {trend && (
                  <span
                    className={`text-xs font-medium ${trendUp ? "text-green-600" : "text-red-500"} flex items-center gap-0.5`}
                  >
                    <TrendingUp size={11} />
                    {trend}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-800 leading-tight">
                {label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                {sublabel}
              </p>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
