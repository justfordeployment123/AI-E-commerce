"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, Wrench, ShoppingBag } from "lucide-react";

const MONTHLY_REVENUE = [
  { month: "Jan", rev: 8200, tradeins: 18, repairs: 11, orders: 72 },
  { month: "Feb", rev: 9100, tradeins: 22, repairs: 14, orders: 81 },
  { month: "Mar", rev: 11400, tradeins: 31, repairs: 19, orders: 103 },
  { month: "Apr", rev: 10800, tradeins: 28, repairs: 16, orders: 97 },
  { month: "May", rev: 14820, tradeins: 47, repairs: 29, orders: 183 },
];

const maxRev = Math.max(...MONTHLY_REVENUE.map(m => m.rev));

const TOP_PRODUCTS = [
  { name: "iPhone 14 Pro", category: "Phones", units: 28, revenue: 16212 },
  { name: "MacBook Air M2", category: "Laptops", units: 14, revenue: 12586 },
  { name: "Samsung Galaxy S23", category: "Phones", units: 22, revenue: 7678 },
  { name: "PS5 Disc Edition", category: "Consoles", units: 19, revenue: 7581 },
  { name: "iPad Air 5th Gen", category: "Tablets", units: 17, revenue: 6613 },
];
const maxUnits = Math.max(...TOP_PRODUCTS.map(p => p.units));

const TOP_TRADEIN = [
  { device: "iPhone 12 series", count: 24, avgOffer: 218 },
  { device: "Galaxy S21 series", count: 18, avgOffer: 195 },
  { device: "PS4 / PS4 Slim", count: 15, avgOffer: 108 },
  { device: "MacBook Air M1", count: 11, avgOffer: 472 },
];

const CATEGORY_SPLIT = [
  { cat: "Phones", pct: 48 },
  { cat: "Laptops", pct: 22 },
  { cat: "Consoles", pct: 18 },
  { cat: "Tablets", pct: 9 },
  { cat: "Accessories", pct: 3 },
];

const STAT_CARDS = [
  { label: "Total revenue", value: "£54,320", change: "+38%", up: true, period: "vs last 4 months" },
  { label: "Items sold", value: "536", change: "+29%", up: true, period: "vs last 4 months" },
  { label: "Trade-ins processed", value: "146", change: "+41%", up: true, period: "vs last 4 months" },
  { label: "Avg order value", value: "£312", change: "+7%", up: true, period: "vs last 4 months" },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">January – May 2026</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {STAT_CARDS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{s.label}</p>
            <p className="text-2xl font-bold tracking-tight mb-1">{s.value}</p>
            <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
              {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {s.change}
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">{s.period}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="grid xl:grid-cols-[1fr_280px] gap-6 mb-6">
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
          <h2 className="font-bold text-lg mb-6">Monthly revenue</h2>
          <div className="flex items-end gap-5 h-44">
            {MONTHLY_REVENUE.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-xs font-mono font-bold text-zinc-400">£{(m.rev / 1000).toFixed(1)}k</p>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(m.rev / maxRev) * 100}%` }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 140, damping: 20 }}
                  className={`w-full rounded-t-[0.75rem] ${i === MONTHLY_REVENUE.length - 1 ? "bg-accent" : "bg-zinc-100"}`}
                />
                <p className="text-[10px] font-bold text-zinc-400 uppercase">{m.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category split */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
          <h2 className="font-bold text-lg mb-6">Sales by category</h2>
          <div className="space-y-4">
            {CATEGORY_SPLIT.map((c, i) => (
              <div key={c.cat}>
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span>{c.cat}</span>
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
        </div>
      </div>

      {/* Activity counts chart */}
      <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 mb-6">
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
              {[...MONTHLY_REVENUE].reverse().map(m => (
                <tr key={m.month}>
                  <td className="py-3 font-bold">{m.month} 2026</td>
                  <td className="py-3 text-right font-mono">{m.orders}</td>
                  <td className="py-3 text-right font-mono">{m.tradeins}</td>
                  <td className="py-3 text-right font-mono">{m.repairs}</td>
                  <td className="py-3 text-right font-mono font-bold">£{m.rev.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
          <h2 className="font-bold text-lg mb-6">Top selling products</h2>
          <div className="space-y-5">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div>
                    <span className="font-bold">{p.name}</span>
                    <span className="text-zinc-400 ml-2 text-xs">{p.category}</span>
                  </div>
                  <span className="font-bold font-mono">{p.units} sold</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.units / maxUnits) * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.3, type: "spring", stiffness: 100, damping: 20 }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
                <p className="text-xs text-zinc-400 mt-1">Revenue: £{p.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top trade-ins */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
          <h2 className="font-bold text-lg mb-6">Most traded devices</h2>
          <div className="space-y-4">
            {TOP_TRADEIN.map((t, i) => (
              <div key={t.device} className="flex items-center gap-4 py-3 border-b border-zinc-50 last:border-0">
                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 font-bold text-sm text-zinc-500">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{t.device}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Avg offer: £{t.avgOffer}</p>
                </div>
                <p className="font-bold font-mono text-sm">{t.count} items</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
