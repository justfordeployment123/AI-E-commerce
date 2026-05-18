"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package, RefreshCw, Wrench,
  ShoppingBag, ArrowRight, Activity, BarChart3, SlidersHorizontal
} from "lucide-react";

const STATS = [
  { label: "Revenue (MTD)", value: "£14,820", change: "+18%", up: true, icon: BarChart3 },
  { label: "Orders placed", value: "183", change: "+11%", up: true, icon: ShoppingBag },
  { label: "Trade-ins received", value: "47", change: "+24%", up: true, icon: RefreshCw },
  { label: "Repairs booked", value: "29", change: "-3%", up: false, icon: Wrench },
];

const RECENT_TRADE_INS = [
  { id: "TI-09161", device: "iPhone 14 Pro", condition: "Good", offer: 420, status: "pending", date: "Today 14:22" },
  { id: "TI-09158", device: "Samsung Galaxy S23 Ultra", condition: "Excellent", offer: 540, status: "approved", date: "Today 11:05" },
  { id: "TI-09154", device: "PS5 Disc Edition", condition: "Used", offer: 195, status: "pending", date: "Yesterday 18:30" },
  { id: "TI-09151", device: "MacBook Air M2", condition: "Good", offer: 520, status: "approved", date: "Yesterday 10:14" },
  { id: "TI-09148", device: "Nintendo Switch OLED", condition: "Mint", offer: 185, status: "rejected", date: "16 May 09:00" },
];

const RECENT_ORDERS = [
  { id: "TS-28471", customer: "Riley Okafor", items: "iPhone 14 Pro, WH-1000XM5", total: 798, status: "dispatched" },
  { id: "TS-28469", customer: "Priya Nair", items: "iPad Air 5th Gen", total: 389, status: "processing" },
  { id: "TS-28465", customer: "Marcus Webb", items: "Galaxy S23 Ultra", total: 529, status: "delivered" },
  { id: "TS-28460", customer: "Alex Turner", items: "PS5 Digital Edition", total: 329, status: "processing" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700" },
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700" },
  dispatched: { label: "Dispatched", className: "bg-violet-100 text-violet-700" },
  delivered: { label: "Delivered", className: "bg-emerald-100 text-emerald-700" },
};

const REVENUE_WEEKS = [
  { week: "W1", amount: 2840 },
  { week: "W2", amount: 3120 },
  { week: "W3", amount: 4250 },
  { week: "W4", amount: 4610 },
];
const maxRevenue = Math.max(...REVENUE_WEEKS.map(w => w.amount));

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Monday, 18 May 2026</p>
        </div>
        <div className="flex items-center gap-2 rounded-[1rem] bg-white border border-zinc-200 px-4 py-2.5 text-sm font-medium shadow-sm">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span>All systems operational</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-[1.5rem] border border-zinc-100 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-zinc-500" />
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${stat.up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                  {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight mb-1">{stat.value}</p>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[1fr_300px] gap-6 mb-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg">Revenue — May 2026</h2>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Weekly</span>
          </div>
          <div className="flex items-end gap-4 h-36">
            {REVENUE_WEEKS.map((w, i) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-xs font-mono font-bold text-zinc-400">£{(w.amount / 1000).toFixed(1)}k</p>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(w.amount / maxRevenue) * 100}%` }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 150, damping: 20 }}
                  className={`w-full rounded-[0.6rem] ${i === REVENUE_WEEKS.length - 1 ? "bg-accent" : "bg-zinc-100"}`}
                />
                <p className="text-[10px] font-bold text-zinc-400 uppercase">{w.week}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-sm text-zinc-500">Month to date</p>
            <p className="font-bold text-lg">£14,820</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-5">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: "Add new product", href: "/products", icon: Package },
              { label: "Review trade-ins", href: "/trade-ins", icon: RefreshCw },
              { label: "Repair queue", href: "/repairs", icon: Wrench },
              { label: "Adjust pricing", href: "/pricing", icon: SlidersHorizontal },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 p-3 rounded-[1rem] hover:bg-zinc-50 transition-colors group"
              >
                <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-zinc-500" />
                </div>
                <span className="text-sm font-medium flex-1">{label}</span>
                <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Recent Trade-Ins */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <h2 className="font-bold">Recent Trade-Ins</h2>
            <a href="/trade-ins" className="text-xs font-bold text-zinc-400 hover:text-black flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="divide-y divide-zinc-50">
            {RECENT_TRADE_INS.map(t => {
              const cfg = STATUS_CONFIG[t.status];
              return (
                <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{t.device}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{t.id} · {t.date}</p>
                  </div>
                  <p className="font-bold text-sm font-mono">£{t.offer}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <h2 className="font-bold">Recent Orders</h2>
            <a href="/orders" className="text-xs font-bold text-zinc-400 hover:text-black flex items-center gap-1 transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="divide-y divide-zinc-50">
            {RECENT_ORDERS.map(o => {
              const cfg = STATUS_CONFIG[o.status];
              return (
                <div key={o.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{o.customer}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{o.items}</p>
                  </div>
                  <p className="font-bold text-sm font-mono">£{o.total}</p>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
