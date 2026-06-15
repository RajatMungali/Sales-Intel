import { useEffect, useState } from "react";
import { X, ExternalLink, Flame } from "lucide-react";

function ScoreBar({ score }) {
  const color =
    score >= 80 ? "bg-red-500" : score >= 50 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-500`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function SignalRow({ label, points }) {
  const lower = label.toLowerCase();
  let icon = "📈",
    bg = "bg-blue-50",
    text = "text-blue-700";
  if (lower.includes("hir")) {
    icon = "👥";
    bg = "bg-green-50";
    text = "text-green-700";
  } else if (lower.includes("fund")) {
    icon = "💰";
    bg = "bg-purple-50";
    text = "text-purple-700";
  } else if (lower.includes("leader")) {
    icon = "⭐";
    bg = "bg-amber-50";
    text = "text-amber-700";
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <span
          className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center text-sm`}
        >
          {icon}
        </span>
        <span className={`text-sm font-medium ${text}`}>{label}</span>
      </div>
      <span className="text-sm font-semibold text-gray-700">+{points}</span>
    </div>
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
        `https://img.logo.dev/${domain}?token=YOUR_TOKEN`,
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
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-white flex items-center justify-center flex-shrink-0">
        <img
          src={fallbackSrcs[srcIndex]}
          alt={name}
          className="w-10 h-10 object-contain"
          onError={handleError}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center font-bold text-base flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function LeadDrawer({ lead, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!lead) return null;

  const score = lead.intent_score ?? 0;
  const signals = lead.signals || [];
  const signalPoints = [40, 30, 25, 20];

  const metaRows = [
    { label: "Industry", value: lead.industry },
    { label: "Employees", value: lead.employee_count },
    { label: "Location", value: lead.location },
    { label: "Source", value: lead.source || "NewsAPI" },
    {
      label: "Detected",
      value: lead.discovered_at
        ? new Date(lead.discovered_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
    },
  ].filter((r) => r.value);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 bottom-0 w-[380px] bg-white shadow-xl z-50 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <CompanyLogo name={lead.name} website={lead.website} />
            <div>
              <h2 className="font-semibold text-gray-900 text-base">
                {lead.name}
              </h2>
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5"
                >
                  {lead.website.replace(/^https?:\/\//, "")}
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1">
          {/* Meta rows */}
          {metaRows.length > 0 && (
            <div className="mb-5">
              <table className="w-full text-sm">
                <tbody>
                  {metaRows.map(({ label, value }) => (
                    <tr key={label}>
                      <td className="py-1.5 text-gray-400 w-24">{label}</td>
                      <td className="py-1.5 text-gray-800 font-medium">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Intent Score */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Intent Score
            </p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">{score}</span>
              <span className="text-gray-400 text-sm">/100</span>
              {score >= 80 && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <Flame size={11} /> Hot
                </span>
              )}
            </div>
            <ScoreBar score={score} />
            <p className="text-xs text-green-600 font-medium mt-1.5">
              {score >= 80
                ? "Excellent timing to reach out"
                : score >= 50
                  ? "Good timing to reach out"
                  : "Monitor for changes"}
            </p>
          </div>

          {/* Detected Triggers */}
          {signals.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Detected Triggers
              </p>
              <div className="bg-gray-50 rounded-xl px-3 py-1">
                {signals.map((sig, i) => (
                  <SignalRow
                    key={i}
                    label={sig}
                    points={signalPoints[i] ?? 15}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Why Now */}
          {lead.why_flagged && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Why Now
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">
                {lead.why_flagged}
              </p>
            </div>
          )}

          {/* Recommended Outreach Angle */}
          {lead.outreach_angle && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Recommended Outreach Angle
              </p>
              <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 rounded-xl p-3 border border-blue-100">
                {lead.outreach_angle}
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          {lead.website && (
            <a
              href={
                lead.website.startsWith("http")
                  ? lead.website
                  : `https://${lead.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              View Full Profile
            </a>
          )}
        </div>
      </aside>
    </>
  );
}
