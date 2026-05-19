"use client";

import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Package, RefreshCw, Wrench,
  ShoppingBag, ArrowRight, Activity, BarChart3, SlidersHorizontal
} from "lucide-react";

const STATS = [
  { label: "Revenue (MTD)", value: "£14,820", change: "+18%", up: true, icon: BarChart3, iconBg: "bg-violet-50 text-violet-600" },
  { label: "Orders placed", value: "183", change: "+11%", up: true, icon: ShoppingBag, iconBg: "bg-blue-50 text-blue-600" },
  { label: "Trade-ins received", value: "47", change: "+24%", up: true, icon: RefreshCw, iconBg: "bg-amber-50 text-amber-600" },
  { label: "Repairs booked", value: "29", change: "-3%", up: false, icon: Wrench, iconBg: "bg-rose-50 text-rose-600" },
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
  { week: "Jan", amount: 9420 },
  { week: "Feb", amount: 11340 },
  { week: "Mar", amount: 10870 },
  { week: "Apr", amount: 13150 },
  { week: "May", amount: 14820 },
];
const maxRevenue = Math.max(...REVENUE_WEEKS.map(w => w.amount));

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Monday, 19 May 2026</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white border border-zinc-200 px-4 py-2.5 text-sm font-medium shadow-sm shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span>All systems operational</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
              className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${stat.up ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                  {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight mb-1 font-mono">{stat.value}</p>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[1fr_280px] gap-5 mb-5">
        {/* Revenue chart */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-7 shadow-sm">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-bold text-lg tracking-tight">Revenue</h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">Jan – May 2026</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono tracking-tight">£14,820</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">+18% vs last month</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {REVENUE_WEEKS.map((w, i) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-[11px] font-mono font-bold text-zinc-400">£{(w.amount / 1000).toFixed(1)}k</p>
                <div className="w-full relative" style={{ height: "100px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(w.amount / maxRevenue) * 100}%` }}
                    transition={{ delay: i * 0.09, type: "spring", stiffness: 180, damping: 22 }}
                    className={`absolute bottom-0 w-full rounded-xl ${i === REVENUE_WEEKS.length - 1 ? "bg-accent" : "bg-zinc-100 hover:bg-zinc-200 transition-colors"}`}
                  />
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">{w.week}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
          <h2 className="font-bold text-base mb-4 tracking-tight">Quick actions</h2>
          <div className="space-y-1.5">
            {[
              { label: "Add product",    href: "/products",  icon: Package,         color: "bg-blue-50 text-blue-600" },
              { label: "Trade-ins",      href: "/trade-ins", icon: RefreshCw,       color: "bg-amber-50 text-amber-600" },
              { label: "Repair queue",   href: "/repairs",   icon: Wrench,          color: "bg-rose-50 text-rose-600" },
              { label: "Pricing rules",  href: "/pricing",   icon: SlidersHorizontal, color: "bg-violet-50 text-violet-600" },
            ].map(({ label, href, icon: Icon, color }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-50 transition-colors group"
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium flex-1">{label}</span>
                <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        {/* Recent Trade-Ins */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <h2 className="font-bold tracking-tight">Recent Trade-Ins</h2>
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
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0 ${cfg.className}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
            <h2 className="font-bold tracking-tight">Recent Orders</h2>
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
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shrink-0 ${cfg.className}`}>
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
