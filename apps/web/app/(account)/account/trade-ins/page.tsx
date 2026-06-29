"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { tradeInsApi, type TradeIn } from "@/lib/api";
import { statusCfg, fmtDate } from "../_utils";
import { GradeBadge } from "@/components/GradeBadge";

export default function TradeInsPage() {
  const { user } = useAuth();
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    tradeInsApi.my()
      .then(setTradeIns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">Trade-Ins</h2>
        <a
          href="/trade-in"
          className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[1rem] text-xs font-bold hover:bg-zinc-800 transition-colors"
        >
          New trade-in <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : tradeIns.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-base">No trade-ins yet</p>
          <a href="/trade-in" className="mt-4 inline-flex items-center gap-1.5 text-black font-bold underline underline-offset-4">
            Start a trade-in
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {tradeIns.map(t => {
            const cfg = statusCfg(t.status);
            const StatusIcon = cfg.icon;
            return (
              <Link key={t.id} href={`/account/trade-ins/${t.id}`}
                className="block rounded-[1.25rem] border border-zinc-100 p-5 sm:p-6 hover:border-zinc-200 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold">{t.brand} {t.model}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">{t.reference} · {fmtDate(t.createdAt)}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                      Condition:{" "}
                      <GradeBadge condition={t.condition ?? ""} />
                    </p>
                    <p className="font-bold text-lg mt-0.5">
                      £{t.counterOffer ?? t.offerPrice}
                      {t.counterOffer && t.counterOffer !== t.offerPrice && (
                        <span className="ml-2 text-xs text-zinc-400 line-through font-normal">£{t.offerPrice}</span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
