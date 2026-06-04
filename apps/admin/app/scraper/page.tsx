"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { scraperApi, healthApi, type ScrapedPriceRow, type ScraperStats, type ScraperRun } from "../../lib/api";
import { Play, RefreshCw, Search, TrendingUp, CheckCircle2, AlertCircle, Clock, XCircle, Loader2 } from "lucide-react";

function fmt(v: number | null) {
  return v !== null ? `£${v.toFixed(0)}` : <span className="text-zinc-300">—</span>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

function RunStatusBadge({ status }: { status: ScraperRun["status"] }) {
  if (status === "COMPLETED") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  );
  if (status === "FAILED") return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
      <XCircle className="h-3 w-3" /> Failed
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
      <Loader2 className="h-3 w-3 animate-spin" /> Running
    </span>
  );
}

function duration(start: string, end: string | null) {
  if (!end) return "—";
  const secs = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const SCRAPER_ENABLED = process.env.NEXT_PUBLIC_SCRAPER_ENABLED === "true";

export default function ScraperPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [runs, setRuns] = useState<ScraperRun[]>([]);
  const [rows, setRows] = useState<ScrapedPriceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loadingTable, setLoadingTable] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState("");
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);

  const loadStats = useCallback(() => {
    scraperApi.stats().then(setStats).catch(() => {});
  }, []);

  const checkServiceHealth = useCallback(() => {
    healthApi.check()
      .then(h => setServiceOnline(h.scraper))
      .catch(() => setServiceOnline(false));
  }, []);

  const loadRuns = useCallback(() => {
    scraperApi.runs(20).then(setRuns).catch(() => {});
  }, []);

  const loadPrices = useCallback(() => {
    setLoadingTable(true);
    scraperApi.prices(page, 50, search || undefined)
      .then(r => { setRows(r.items); setTotal(r.total); setPages(r.pages); })
      .catch(() => {})
      .finally(() => setLoadingTable(false));
  }, [page, search]);

  useEffect(() => {
    if (!SCRAPER_ENABLED) { router.replace("/"); return; }
    loadStats();
    loadRuns();
    checkServiceHealth();
  }, [loadStats, loadRuns, checkServiceHealth, router]);

  useEffect(() => {
    if (!SCRAPER_ENABLED) return;
    loadPrices();
  }, [loadPrices]);

  // Auto-poll: 8s while a run is active, 30s when idle
  useEffect(() => {
    if (!SCRAPER_ENABLED) return;
    const isRunning = runs.some(r => r.status === "RUNNING");
    const tick = () => {
      loadStats();
      loadRuns();
      checkServiceHealth();
      if (isRunning) loadPrices();
    };
    const id = setInterval(tick, isRunning ? 8_000 : 30_000);
    return () => clearInterval(id);
  }, [runs, loadStats, loadRuns, loadPrices, checkServiceHealth]);

  if (!SCRAPER_ENABLED) return null;

  async function handleRunScraper() {
    setRunning(true);
    setRunMsg("");
    try {
      const res = await scraperApi.run();
      setRunMsg(res.message);
      if (res.ok) {
        setTimeout(() => { loadStats(); loadRuns(); loadPrices(); }, 3000);
      }
    } catch (e: any) {
      setRunMsg(e.message ?? "Failed to start scraper");
    } finally {
      setRunning(false);
    }
  }

  async function handleCleanup() {
    setCleaning(true);
    setCleanMsg("");
    try {
      const res = await scraperApi.cleanup();
      setCleanMsg(`Cleaned ${res.cleaned} stuck run${res.cleaned !== 1 ? "s" : ""}.`);
      loadRuns();
    } catch (e: any) {
      setCleanMsg(e.message ?? "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const coverage = stats && stats.total > 0
    ? Math.round((stats.withMarketPrice / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitor Prices</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-zinc-500">
              Scraped from CeX, Back Market, Music Magpie &amp; Envirofone. Runs automatically every hour.
            </p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
              serviceOnline === true
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : serviceOnline === false
                  ? "text-red-700 bg-red-50 border-red-200"
                  : "text-zinc-500 bg-zinc-50 border-zinc-200"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                serviceOnline === true ? "bg-emerald-500"
                : serviceOnline === false ? "bg-red-500 animate-pulse"
                : "bg-zinc-400"
              }`} />
              {serviceOnline === true ? "Scraper online"
                : serviceOnline === false ? "Scraper offline"
                : "Checking…"}
            </span>
          </div>
        </div>
        <button
          onClick={handleRunScraper}
          disabled={running}
          className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-60"
        >
          {running
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running…</>
            : <><Play className="h-4 w-4" /> Run Now</>}
        </button>
      </div>

      {/* Run message */}
      {runMsg && (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold ${
          runMsg.toLowerCase().includes("fail") || runMsg.toLowerCase().includes("error")
            ? "bg-red-50 border border-red-100 text-red-700"
            : "bg-emerald-50 border border-emerald-100 text-emerald-700"
        }`}>
          {runMsg.toLowerCase().includes("fail") ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {runMsg}
          {!runMsg.toLowerCase().includes("fail") && <span className="font-normal text-emerald-600 ml-1">— prices will update in the background.</span>}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard label="Total devices" value={stats.total} />
          <StatCard label="With market price" value={stats.withMarketPrice} sub={`${coverage}% coverage`} />
          <StatCard label="CeX" value={stats.withCex} sub={`${stats.total ? Math.round(stats.withCex / stats.total * 100) : 0}%`} />
          <StatCard label="Back Market" value={stats.withBM} sub={`${stats.total ? Math.round(stats.withBM / stats.total * 100) : 0}%`} />
          <StatCard label="Music Magpie" value={stats.withMM} sub={`${stats.total ? Math.round(stats.withMM / stats.total * 100) : 0}%`} />
          <StatCard label="Envirofone" value={stats.withEnvirofone ?? 0} sub={`${stats.total ? Math.round((stats.withEnvirofone ?? 0) / stats.total * 100) : 0}%`} />
          <StatCard
            label="Last scraped"
            value={stats.lastScrapedAt ? new Date(stats.lastScrapedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never"}
            sub={stats.lastScrapedAt ? new Date(stats.lastScrapedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : undefined}
          />
        </div>
      )}

      {/* Run History */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="font-bold text-base">Run History</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Last 20 scraper executions</p>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
              const stuckCount = runs.filter(r => r.status === "RUNNING" && new Date(r.startedAt).getTime() < oneHourAgo).length;
              return stuckCount > 0 ? (
                <button onClick={handleCleanup} disabled={cleaning}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {cleaning ? "Cleaning…" : `${stuckCount} stuck — fix`}
                </button>
              ) : null;
            })()}
            {cleanMsg && <span className="text-xs font-bold text-emerald-600">{cleanMsg}</span>}
            <button onClick={() => { loadRuns(); loadStats(); }} className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-black transition-colors">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-zinc-200 mb-3" />
            <p className="font-bold text-zinc-500">No runs yet</p>
            <p className="text-sm text-zinc-400">The scraper hasn&apos;t run yet. Click &quot;Run Now&quot; or wait for the hourly trigger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["Status", "Started", "Finished", "Duration", "Devices scraped", "Error"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-6 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {runs.map(run => (
                  <tr key={run.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-3.5"><RunStatusBadge status={run.status} /></td>
                    <td className="px-6 py-3.5 text-zinc-700 whitespace-nowrap font-medium">{fmtTime(run.startedAt)}</td>
                    <td className="px-6 py-3.5 text-zinc-500 whitespace-nowrap">{run.finishedAt ? fmtTime(run.finishedAt) : <span className="text-zinc-300">—</span>}</td>
                    <td className="px-6 py-3.5 text-zinc-500 font-mono">{duration(run.startedAt, run.finishedAt)}</td>
                    <td className="px-6 py-3.5">
                      {run.totalScraped !== null
                        ? <span className="font-bold text-zinc-700">{run.totalScraped}</span>
                        : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-red-500 text-xs max-w-xs truncate">
                      {run.errorMessage ?? <span className="text-zinc-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prices Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-zinc-100">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search brand or model…"
                className="w-full h-10 pl-9 pr-4 rounded-xl border-2 border-zinc-200 text-sm font-medium outline-none focus:border-black transition-colors"
              />
            </div>
            <button type="submit" className="h-10 px-4 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors">
              Search
            </button>
          </form>
          <p className="text-sm text-zinc-400 font-medium">{total} devices</p>
        </div>

        {loadingTable ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="h-12 w-12 text-zinc-200 mb-4" />
            <p className="font-bold text-zinc-600 mb-1">No scraped prices yet</p>
            <p className="text-sm text-zinc-400">Click &quot;Run Now&quot; to fetch competitor prices for all active devices.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {["Device", "Storage", "CeX Sell", "CeX Cash", "CeX Exchange", "Back Market", "Music Magpie", "Envirofone", "Market Price", "Last Updated"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-6 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-black whitespace-nowrap">{row.brand} {row.model}</td>
                      <td className="px-6 py-3.5 text-zinc-500">{row.storage || "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-700">{fmt(row.cexSellPrice)}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-500">{fmt(row.cexCashPrice)}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-500">{fmt(row.cexExchangePrice)}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-700">{fmt(row.backMarketPrice)}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-700">{fmt(row.musicMagpiePrice)}</td>
                      <td className="px-6 py-3.5 font-mono text-zinc-700">{fmt(row.envirofonePrice)}</td>
                      <td className="px-6 py-3.5">
                        {row.marketPrice !== null ? (
                          <span className="inline-flex items-center gap-1.5 font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">
                            £{row.marketPrice.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-zinc-300 text-xs font-medium">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400 whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {fmtTime(row.scrapedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-9 px-4 rounded-xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors disabled:opacity-40"
                >
                  Previous
                </button>
                <p className="text-sm text-zinc-500 font-medium">Page {page} of {pages}</p>
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="h-9 px-4 rounded-xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
