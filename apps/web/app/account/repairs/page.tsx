"use client";

import { useState, useEffect } from "react";
import { Wrench, ArrowRight } from "lucide-react";
import { useAuth } from "../../../context/auth-context";
import { repairsApi, type Repair } from "../../../lib/api";
import { statusCfg, fmtDate } from "../_utils";

export default function RepairsPage() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    repairsApi.my()
      .then(setRepairs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Repairs</h2>
        <a
          href="/repair"
          className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[1rem] text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          Book repair <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : repairs.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-base">No repairs yet</p>
          <a href="/repair" className="mt-4 inline-flex items-center gap-1.5 text-black font-bold underline underline-offset-4">
            Book a repair
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {repairs.map(r => {
            const cfg = statusCfg(r.status);
            const StatusIcon = cfg.icon;
            return (
              <div key={r.id} className="rounded-[1.25rem] border border-zinc-100 p-5 sm:p-6 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold">{r.brand} {r.model}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{r.issue}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-1">{r.reference} · {fmtDate(r.createdAt)}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
                {r.quote != null && (
                  <div className="pt-4 border-t border-zinc-100">
                    <p className="text-xs text-zinc-400 font-medium">Quote</p>
                    <p className="font-bold text-lg">£{r.quote}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
