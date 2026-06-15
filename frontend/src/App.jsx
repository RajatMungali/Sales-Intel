import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import StatsCards from "./components/StatsCards";
import LeadTable from "./components/LeadTable";
import LeadDrawer from "./components/LeadDrawer";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("All");
  const [sortBy, setSortBy] = useState("Intent Score");

  const fetchData = useCallback(async () => {
    try {
      const [companiesRes, statsRes] = await Promise.all([
        fetch(`${API}/companies`),
        fetch(`${API}/stats`),
      ]);
      const companiesData = await companiesRes.json();
      const statsData = await statsRes.json();

      const raw = companiesData.companies || [];
      const mapped = raw.map((c) => ({
        ...c,
        name: c.company_name,
        why_flagged: c.reason,
        signals: [
          c.sales_hiring && "Sales Hiring",
          c.funding_signal && "Funding Signal",
          c.growth_signal && "Growth Signal",
        ].filter(Boolean),
      }));

      setCompanies(mapped);
      setStats(statsData);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshing) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/refresh/status`);
        const data = await res.json();
        if (!data.running) {
          setRefreshing(false);
          setLastRun(data.last_run);
          await fetchData();
        }
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshing, fetchData]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetch(`${API}/refresh`, { method: "POST" });
    } catch (e) {
      setRefreshing(false);
    }
  };

  const filteredCompanies = companies
    .filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier =
        filterTier === "All" ||
        (filterTier === "Hot" && c.intent_score >= 80) ||
        (filterTier === "Warm" &&
          c.intent_score >= 50 &&
          c.intent_score < 80) ||
        (filterTier === "Cold" && c.intent_score < 50);
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === "Intent Score") return b.intent_score - a.intent_score;
      if (sortBy === "Company Name")
        return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "Industry")
        return (a.industry || "").localeCompare(b.industry || "");
      return 0;
    });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FCFCFD] font-sans">
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-52 -left-52 h-[850px] w-[850px] rounded-full bg-blue-200/60 blur-[220px]" />
        <div className="absolute top-40 left-1/2 h-[950px] w-[950px] -translate-x-1/2 rounded-full bg-orange-100/50 blur-[260px]" />
        <div className="absolute bottom-[-250px] right-[-250px] h-[850px] w-[850px] rounded-full bg-sky-200/60 blur-[220px]" />
      </div>

      {/* Fixed Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-white/40 bg-white/35 backdrop-blur-2xl shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
          <div className="h-16 px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <img
                  src="/logo.png"
                  alt="SalesIntel"
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                SalesIntel
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw
                  size={13}
                  className={refreshing ? "animate-spin" : ""}
                />
                {refreshing ? "Scanning…" : "Refresh Signals"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main — pt-28 offsets the fixed navbar height (64px) + top padding (16px) */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-10">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center py-8 mb-12">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-medium tracking-[0.25em] uppercase text-slate-500 mb-6">
            AI SALES INTELLIGENCE
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.9] tracking-[-0.03em] text-slate-950">
            Surface companies at the
            <span className="block text-blue-600 italic">right moment</span>
            before your competitors do.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-500">
            Turn hiring, funding and growth signals into actionable
            opportunities.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} companies={companies} />

        {/* Table Section */}
        <div className="bg-white/75 backdrop-blur-xl rounded-2xl border border-white/60 overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900 text-base">
                Top Opportunities Today
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Showing {filteredCompanies.length} of {companies.length}{" "}
                opportunities
                {lastRun &&
                  ` · Last scan: ${new Date(lastRun).toLocaleTimeString()}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Intent Score</option>
                <option>Company Name</option>
                <option>Industry</option>
              </select>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {["All", "Hot", "Warm", "Cold"].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setFilterTier(tier)}
                    className={`text-xs px-3 py-1.5 transition-colors ${
                      filterTier === tier
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Loading leads…
            </div>
          ) : (
            <LeadTable
              companies={filteredCompanies}
              onSelect={setSelectedLead}
            />
          )}
        </div>
      </main>

      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
