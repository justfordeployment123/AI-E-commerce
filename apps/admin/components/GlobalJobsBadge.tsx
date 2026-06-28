"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Minus } from "lucide-react";
import { productPricingApi, scraperApi, type PricingJobStatus, type ScraperRun } from "../lib/api";

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
    <svg className="h-3 w-3 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function GlobalJobsBadge() {
  const router = useRouter();
  const [state, setState] = useState<JobState>({ pricing: null, scraper: null });
  const [minimized, setMinimized] = useState(false);

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

  const hasJobs = state.pricing || state.scraper;
  if (!hasJobs) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-5 left-5 md:left-63 z-30">
        <button
          onClick={() => setMinimized(false)}
          className="relative h-11 w-11 rounded-full bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white shadow-2xl border border-zinc-700/60 flex items-center justify-center transition-all cursor-pointer"
          title="Show active jobs"
        >
          <Activity className="h-5 w-5 text-emerald-400 animate-pulse shrink-0" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 left-5 md:left-63 z-30 flex flex-col gap-1.5">

      {/* Auto-pricing pill */}
      {state.pricing && (
        <button
          onClick={() => router.push("/products")}
          className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white rounded-2xl px-4 py-2.5 shadow-2xl border border-zinc-700/60 transition-colors min-w-55 text-left relative group/pill"
        >
          <PulsingDot />
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs font-bold leading-tight">Auto-pricing</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {state.pricing.total > 0 ? `${state.pricing.done} / ${state.pricing.total} products` : "Starting…"}
            </p>
          </div>
          <Chevron />
          <span
            onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
            className="absolute top-1 right-1 p-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 opacity-100 md:opacity-0 md:group-hover/pill:opacity-100 transition-all cursor-pointer"
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </span>
        </button>
      )}

      {/* Scraper pill */}
      {state.scraper && (
        <button
          onClick={() => router.push("/scraper")}
          className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-white rounded-2xl px-4 py-3 shadow-2xl border border-zinc-700/60 transition-colors min-w-55 text-left relative group/pill"
        >
          <PulsingDot />
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-xs font-bold leading-tight mb-2">Scraper</p>
            <div className="space-y-1">
              <ScraperStat
                label="DEVICES"
                done={state.scraper.catalogProgress}
                total={state.scraper.totalCatalog}
              />
              <ScraperStat
                label="OTHERS"
                done={state.scraper.othersProgress}
                total={state.scraper.totalOthers}
              />
            </div>
          </div>
          <Chevron />
          <span
            onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
            className="absolute top-1 right-1 p-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 opacity-100 md:opacity-0 md:group-hover/pill:opacity-100 transition-all cursor-pointer"
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </span>
        </button>
      )}
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
