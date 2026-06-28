"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, RefreshCw, ShoppingBag, DollarSign } from "lucide-react";
import { adminApi, type AnalyticsData } from "../../lib/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.analytics()
      .then(setData)
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false));
  }, []);

  const fmtCurrency = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const maxRev = Math.max(...(data?.monthly.map(m => m.revenue) ?? [1]));
  const maxUnits = Math.max(...(data?.topProducts.map(p => p.units) ?? [1]));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Last 6 months</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-40">
          <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[
              { label: "Total revenue",       value: fmtCurrency(data?.summary.totalRevenue ?? 0),  icon: DollarSign,   color: "bg-violet-50 text-violet-600" },
              { label: "Orders placed",        value: String(data?.summary.totalOrders ?? 0),        icon: ShoppingBag,  color: "bg-blue-50 text-blue-600" },
              { label: "Trade-ins received",   value: String(data?.summary.totalTradeIns ?? 0),      icon: RefreshCw,    color: "bg-amber-50 text-amber-600" },
              { label: "Avg order value",      value: fmtCurrency(data?.summary.avgOrderValue ?? 0), icon: BarChart3,    color: "bg-emerald-50 text-emerald-600" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6"
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{s.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid xl:grid-cols-[1fr_280px] gap-6 mb-6">
            {/* Revenue bar chart */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-6">Monthly revenue</h2>
              {(data?.monthly ?? []).every(m => m.revenue === 0) ? (
                <p className="text-sm text-zinc-400 text-center py-16">No revenue data yet.</p>
              ) : (
                <div className="flex items-end gap-5 h-44">
                  {(data?.monthly ?? []).map((m, i) => (
                    <div key={`${m.month}-${m.year}`} className="flex-1 flex flex-col items-center gap-2">
                      <p className="text-xs font-mono font-bold text-zinc-400">
                        {m.revenue > 0 ? `£${(m.revenue / 1000).toFixed(1)}k` : "—"}
                      </p>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${maxRev > 0 ? (m.revenue / maxRev) * 100 : 0}%` }}
                        transition={{ delay: i * 0.08, type: "spring", stiffness: 140, damping: 20 }}
                        className={`w-full rounded-t-xl ${i === (data?.monthly.length ?? 1) - 1 ? "bg-accent" : "bg-zinc-100"}`}
                        style={{ minHeight: m.revenue > 0 ? "4px" : "0" }}
                      />
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{m.month}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category split */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-6">Sales by category</h2>
              {(data?.categorySplit ?? []).length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-10">No sales data yet.</p>
              ) : (
                <div className="space-y-4">
                  {(data?.categorySplit ?? []).map((c, i) => (
                    <div key={c.category}>
                      <div className="flex justify-between text-sm font-medium mb-1.5">
                        <span className="capitalize">{c.category}</span>
                        <span className="font-bold font-mono">{c.pct}%</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.pct}%` }}
                          transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 20 }}
                          className={`h-full rounded-full ${i === 0 ? "bg-black" : i === 1 ? "bg-zinc-600" : i === 2 ? "bg-zinc-400" : "bg-zinc-200"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monthly activity table */}
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-lg mb-6">Activity breakdown by month</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Month</th>
                    <th className="text-right pb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Orders</th>
                    <th className="text-right pb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Trade-ins</th>
                    <th className="text-right pb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Repairs</th>
                    <th className="text-right pb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {[...(data?.monthly ?? [])].reverse().map(m => (
                    <tr key={`${m.month}-${m.year}`}>
                      <td className="py-3 font-bold">{m.month} {m.year}</td>
                      <td className="py-3 text-right font-mono">{m.orders}</td>
                      <td className="py-3 text-right font-mono">{m.tradeIns}</td>
                      <td className="py-3 text-right font-mono">{m.repairs}</td>
                      <td className="py-3 text-right font-mono font-bold">{fmtCurrency(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-6">Top selling products</h2>
              {(data?.topProducts ?? []).length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-10">No sales data yet.</p>
              ) : (
                <div className="space-y-5">
                  {(data?.topProducts ?? []).map((p, i) => (
                    <div key={p.productId}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <div>
                          <span className="font-bold">{p.name}</span>
                          <span className="text-zinc-400 ml-2 text-xs capitalize">{p.category}</span>
                        </div>
                        <span className="font-bold font-mono">{p.units} sold</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${maxUnits > 0 ? (p.units / maxUnits) * 100 : 0}%` }}
                          transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 100, damping: 20 }}
                          className="h-full bg-accent rounded-full"
                        />
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">Revenue: {fmtCurrency(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top trade-ins */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="font-bold text-lg mb-6">Most traded devices</h2>
              {(data?.topTradeIns ?? []).length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-10">No trade-in data yet.</p>
              ) : (
                <div className="space-y-4">
                  {(data?.topTradeIns ?? []).map((t, i) => (
                    <div key={t.device} className="flex items-center gap-4 py-3 border-b border-zinc-50 last:border-0">
                      <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-sm text-zinc-500">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{t.device}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Avg offer: {fmtCurrency(t.avgOffer)}</p>
                      </div>
                      <p className="font-bold font-mono text-sm">{t.count} items</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
