import { useState } from "react";
import { ExternalLink, Download } from "lucide-react";

function TierBadge({ score }) {
  if (score >= 80)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        🔥 Hot
      </span>
    );
  if (score >= 50)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
        🌤 Warm
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
      ❄️ Cold
    </span>
  );
}

function ScoreBar({ score }) {
  const color =
    score >= 80 ? "bg-red-500" : score >= 50 ? "bg-amber-400" : "bg-blue-400";
  const label =
    score >= 80
      ? "Excellent Timing"
      : score >= 50
        ? "Good Timing"
        : "Low Priority";
  return (
    <div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-green-600 font-medium">{label}</p>
    </div>
  );
}

function SignalChip({ label }) {
  const lower = label.toLowerCase();
  if (lower.includes("hir"))
    return (
      <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
        👥 {label}
      </span>
    );
  if (lower.includes("fund"))
    return (
      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
        💰 {label}
      </span>
    );
  if (lower.includes("growth") || lower.includes("expan"))
    return (
      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
        📈 {label}
      </span>
    );
  return (
    <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}

function CompanyLogo({ name, website }) {
  const getDomain = (url) => {
    if (!url) return null;
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      return new URL(fullUrl).hostname;
    } catch {
      return null;
    }
  };

  const domain = getDomain(website);

  const fallbackSrcs = domain
    ? [
        `https://logo.clearbit.com/${domain}`,
        `https://img.logo.dev/${domain}?token=pk_X9vMHpzSQpChHe6k7Gy5JA`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      ]
    : [];

  const [srcIndex, setSrcIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const handleError = () => {
    const next = srcIndex + 1;
    if (next < fallbackSrcs.length) {
      setSrcIndex(next);
    } else {
      setAllFailed(true);
    }
  };

  const initials =
    name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

  const hues = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
  ];
  const color = hues[name?.charCodeAt(0) % hues.length] || hues[0];

  if (!allFailed && fallbackSrcs.length > 0) {
    return (
      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 bg-white flex items-center justify-center flex-shrink-0">
        <img
          src={fallbackSrcs[srcIndex]}
          alt={name}
          className="w-8 h-8 object-contain"
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center font-bold text-sm flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

function exportCSV(companies) {
  const headers = [
    "Company",
    "Website",
    "Industry",
    "Intent Score",
    "Tier",
    "Signals",
    "Why Now",
    "Outreach Angle",
  ];

  const tier = (score) => (score >= 80 ? "Hot" : score >= 50 ? "Warm" : "Cold");

  const rows = companies.map((c) => [
    c.name ?? "",
    c.website ?? "",
    c.industry ?? "",
    c.intent_score ?? 0,
    tier(c.intent_score ?? 0),
    (c.signals || []).join(" | "),
    c.why_flagged ?? "",
    c.outreach_angle ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `salesintel_leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadTable({ companies = [], onSelect }) {
  if (!companies.length) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p className="text-sm">No leads found matching your filters.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end px-6 py-3 border-b border-gray-100">
        <button
          onClick={() => exportCSV(companies)}
          className="inline-flex items-center gap-1.5 text-xs font-medium border border-blue-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {companies.map((company, i) => {
          const signals = company.signals || [];
          const score = company.intent_score ?? 0;

          return (
            <div
              key={company.id || i}
              className="px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => onSelect(company)}
            >
              <div className="flex items-start gap-4">
                {/* Logo */}
                <CompanyLogo name={company.name} website={company.website} />

                {/* Company Info */}
                <div className="flex-1 min-w-0 grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start">
                  {/* Name + URL + tags */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                        {company.name}
                      </h3>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <p className="text-xs text-blue-500 hover:underline truncate mt-0.5">
                      {company.website?.replace(/^https?:\/\//, "") || ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {company.industry && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {company.industry}
                        </span>
                      )}
                      {company.employee_count && (
                        <span className="text-xs text-gray-400">
                          {company.employee_count} employees
                        </span>
                      )}
                    </div>
                    {company.outreach_angle && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2 max-w-xs">
                        <span className="font-medium text-gray-600">
                          Outreach angle:{" "}
                        </span>
                        {company.outreach_angle}
                      </p>
                    )}
                  </div>

                  {/* Detected Triggers */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      Detected Triggers
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {signals.slice(0, 3).map((sig, j) => (
                        <SignalChip key={j} label={sig} />
                      ))}
                      {signals.length === 0 && (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </div>

                  {/* Why Now */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      Why Now
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {company.why_flagged || "No specific reason provided."}
                    </p>
                  </div>

                  {/* Intent Score */}
                  <div className="text-right min-w-[120px]">
                    <p className="text-xs font-medium text-gray-400 mb-1.5">
                      Intent Score
                    </p>
                    <div className="flex items-baseline justify-end gap-1.5 mb-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {score}
                      </span>
                      <span className="text-xs text-gray-400">/100</span>
                      <TierBadge score={score} />
                    </div>
                    <ScoreBar score={score} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(company);
                      }}
                      className="mt-3 w-full text-xs font-medium border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
