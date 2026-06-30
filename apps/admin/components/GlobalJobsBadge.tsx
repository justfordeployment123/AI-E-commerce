"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Minus, Scissors, Tag, Database, DatabaseZap } from "lucide-react";
import { productPricingApi, scraperApi, type PricingJobStatus, type ScraperRun } from "../lib/api";
import { useBgRemoval } from "../context/bg-removal-context";

interface JobState {
  pricing: PricingJobStatus | null;
  scraper: ScraperRun | null;
}

function PulsingDot() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
    </span>
  );
}

function Chevron() {
  return (
    <svg className="h-3 w-3 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function GlobalJobsBadge() {
  const router = useRouter();
  const [state, setState] = useState<JobState>({ pricing: null, scraper: null });
  const [minimized, setMinimized] = useState(false);
  const { bgState, seeding } = useBgRemoval();

  useEffect(() => {
    async function poll() {
      let pricing: PricingJobStatus | null = null;
      let scraper: ScraperRun | null = null;

      try {
        const p = await productPricingApi.status();
        if (p.running) pricing = p;
      } catch {}

      try {
        const runs = await scraperApi.runs(1);
        if (runs[0]?.status === "RUNNING") scraper = runs[0];
      } catch {}

      setState({ pricing, scraper });
    }

    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  const hasJobs = state.pricing || state.scraper || bgState || seeding;
  if (!hasJobs) return null;

  const jobCount = [state.pricing, state.scraper, bgState, seeding || null].filter(Boolean).length;

  // Minimized: single icon button
  if (minimized) {
    return (
      <div className="fixed bottom-5 left-5 md:left-63 z-30">
        <button
          onClick={() => setMinimized(false)}
          className="relative h-11 w-11 rounded-full bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white shadow-2xl border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer"
          title="Show active jobs"
        >
          <Activity className="h-5 w-5 text-emerald-400 animate-pulse shrink-0" />
          {jobCount > 1 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-[9px] font-black text-white flex items-center justify-center">
              {jobCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Expanded: single card with all active jobs listed
  return (
    <div className="fixed bottom-5 left-5 md:left-63 z-30 w-64 bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-300">
            Active Jobs
          </span>
          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">
            {jobCount}
          </span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
          title="Minimize"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Job rows */}
      <div className="divide-y divide-zinc-800">

        {/* Auto-pricing */}
        {state.pricing && (
          <button
            onClick={() => router.push("/products")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
          >
            <PulsingDot />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-zinc-400 shrink-0" />
                <p className="text-xs font-bold text-white leading-tight">Auto-pricing</p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {state.pricing.total > 0 ? `${state.pricing.done} / ${state.pricing.total} products` : "Starting…"}
              </p>
            </div>
            <Chevron />
          </button>
        )}

        {/* Scraper */}
        {state.scraper && (
          <button
            onClick={() => router.push("/scraper")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
          >
            <PulsingDot />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Database className="h-3 w-3 text-zinc-400 shrink-0" />
                <p className="text-xs font-bold text-white leading-tight">Scraper</p>
              </div>
              <ScraperStat label="DEVICES" done={state.scraper.catalogProgress} total={state.scraper.totalCatalog} />
              <div className="mt-1">
                <ScraperStat label="OTHERS" done={state.scraper.othersProgress} total={state.scraper.totalOthers} />
              </div>
            </div>
            <Chevron />
          </button>
        )}

        {/* Seeding */}
        {seeding && (
          <button
            onClick={() => router.push("/seed")}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
          >
            <PulsingDot />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <DatabaseZap className="h-3 w-3 text-zinc-400 shrink-0" />
                <p className="text-xs font-bold text-white leading-tight">Database Seed</p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">This may take 1–3 minutes…</p>
            </div>
            <Chevron />
          </button>
        )}

        {/* Background removal */}
        {bgState && (
          <button
            onClick={() => router.push(bgState.redirectUrl)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-left"
          >
            <PulsingDot />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Scissors className="h-3 w-3 text-zinc-400 shrink-0" />
                <p className="text-xs font-bold text-white leading-tight">Removing Background</p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{bgState.label}</p>
            </div>
            <Chevron />
          </button>
        )}
      </div>
    </div>
  );
}

function ScraperStat({ label, done, total }: { label: string; done: number | null; total: number | null }) {
  const d = done ?? 0;
  const t = total ?? 0;
  const pct = t > 0 ? Math.round((d / t) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[10px] font-bold tabular-nums">
          <span className="text-emerald-400">{d}</span>
          <span className="text-zinc-600"> / {t}</span>
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-zinc-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
