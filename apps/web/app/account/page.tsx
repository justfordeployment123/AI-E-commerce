"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, RefreshCw, Wrench, Settings, LogOut, ChevronRight,
  Clock, Check, Truck, AlertCircle, Star, ArrowRight
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const NAV_ITEMS = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "tradein", label: "Trade-Ins", icon: RefreshCw },
  { id: "repairs", label: "Repairs", icon: Wrench },
  { id: "settings", label: "Account settings", icon: Settings },
];

const MOCK_ORDERS = [
  { id: "TS-28471", date: "14 May 2026", status: "delivered", items: ["iPhone 14 Pro — 256 GB, Excellent"], total: 579 },
  { id: "TS-27340", date: "2 Apr 2026", status: "dispatched", items: ["Samsung Galaxy S23 — 128 GB, Very Good"], total: 349 },
  { id: "TS-26188", date: "18 Feb 2026", status: "processing", items: ["iPad Air 5th Gen — 64 GB, Excellent", "Sony WH-1000XM5 — Pristine"], total: 648 },
];

const MOCK_TRADEIN = [
  { id: "TI-09142", date: "10 May 2026", device: "iPhone 12 Pro Max", condition: "Good", offer: 240, status: "paid" },
  { id: "TI-07881", date: "15 Mar 2026", device: "PS4 Slim", condition: "Used", offer: 68, status: "received" },
];

const MOCK_REPAIRS = [
  { id: "RP-04432", date: "7 May 2026", device: "MacBook Air M1", issue: "Battery replacement", status: "in_repair" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  processing: { label: "Processing", color: "bg-amber-100 text-amber-700", icon: Clock },
  dispatched: { label: "Dispatched", color: "bg-blue-100 text-blue-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: Check },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-700", icon: Check },
  received: { label: "Received", color: "bg-blue-100 text-blue-700", icon: Truck },
  in_repair: { label: "In repair", color: "bg-violet-100 text-violet-700", icon: Wrench },
  pending: { label: "Pending", color: "bg-zinc-100 text-zinc-500", icon: Clock },
};

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-[1.5rem] bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-2xl">R</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Riley Okafor</h1>
                <p className="text-sm text-zinc-400 font-medium">riley.okafor@email.co.uk · Member since Jan 2025</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="grid lg:grid-cols-[240px_1fr] gap-10">

            {/* Sidebar nav */}
            <aside>
              <nav className="space-y-1">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-sm font-bold transition-all text-left ${
                      activeTab === id ? "bg-black text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
                <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left mt-4">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </nav>
            </aside>

            {/* Content */}
            <div>
              <AnimatePresence mode="wait">
                {/* Orders */}
                {activeTab === "orders" && (
                  <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 className="text-2xl font-bold mb-8">Your orders</h2>
                    {MOCK_ORDERS.length === 0 ? (
                      <div className="text-center py-20 text-zinc-400">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">No orders yet</p>
                        <a href="/shop/phones" className="mt-4 inline-flex items-center gap-2 text-black font-bold underline">Shop now</a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {MOCK_ORDERS.map(order => {
                          const cfg = STATUS_CONFIG[order.status];
                          const StatusIcon = cfg.icon;
                          return (
                            <div key={order.id} className="rounded-[1.5rem] border border-zinc-100 p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                  <p className="font-bold">{order.id}</p>
                                  <p className="text-xs text-zinc-400 font-medium mt-0.5">{order.date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {cfg.label}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1 mb-4">
                                {order.items.map(item => (
                                  <p key={item} className="text-sm font-medium text-zinc-600">{item}</p>
                                ))}
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <span className="font-bold">£{order.total}</span>
                                <button className="flex items-center gap-1 text-xs font-bold hover:text-black text-zinc-400 transition-colors">
                                  View details <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Trade-ins */}
                {activeTab === "tradein" && (
                  <motion.div key="tradein" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold">Trade-Ins</h2>
                      <a href="/trade-in" className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[1rem] text-xs font-bold hover:bg-zinc-800 transition-colors">
                        New trade-in <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="space-y-4">
                      {MOCK_TRADEIN.map(t => {
                        const cfg = STATUS_CONFIG[t.status];
                        const StatusIcon = cfg.icon;
                        return (
                          <div key={t.id} className="rounded-[1.5rem] border border-zinc-100 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <p className="font-bold">{t.device}</p>
                                <p className="text-xs text-zinc-400 font-medium mt-0.5">{t.id} · {t.date}</p>
                              </div>
                              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                              <div>
                                <p className="text-xs text-zinc-400 font-medium">Condition: {t.condition}</p>
                                <p className="font-bold text-lg mt-0.5">£{t.offer}</p>
                              </div>
                              <button className="flex items-center gap-1 text-xs font-bold hover:text-black text-zinc-400 transition-colors">
                                View details <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Repairs */}
                {activeTab === "repairs" && (
                  <motion.div key="repairs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold">Repairs</h2>
                      <a href="/repair" className="flex items-center gap-2 h-10 px-5 bg-black text-white rounded-[1rem] text-xs font-bold hover:bg-zinc-800 transition-colors">
                        Book repair <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    <div className="space-y-4">
                      {MOCK_REPAIRS.map(r => {
                        const cfg = STATUS_CONFIG[r.status];
                        const StatusIcon = cfg.icon;
                        return (
                          <div key={r.id} className="rounded-[1.5rem] border border-zinc-100 p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <p className="font-bold">{r.device}</p>
                                <p className="text-sm text-zinc-500 mt-0.5">{r.issue}</p>
                                <p className="text-xs text-zinc-400 font-medium mt-1">{r.id} · {r.date}</p>
                              </div>
                              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Settings */}
                {activeTab === "settings" && (
                  <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 className="text-2xl font-bold mb-8">Account settings</h2>
                    <div className="space-y-8 max-w-lg">
                      {[
                        { section: "Personal info", fields: [
                          { key: "firstName", label: "First name", value: "Riley", type: "text" },
                          { key: "lastName", label: "Last name", value: "Okafor", type: "text" },
                          { key: "email", label: "Email", value: "riley.okafor@email.co.uk", type: "email" },
                          { key: "phone", label: "Phone", value: "+44 7712 481 029", type: "tel" },
                        ]},
                        { section: "Security", fields: [
                          { key: "password", label: "Password", value: "••••••••••••", type: "password" },
                        ]},
                      ].map(({ section, fields }) => (
                        <div key={section}>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{section}</h3>
                          <div className="space-y-3">
                            {fields.map(({ key, label, value, type }) => (
                              <div key={key} className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                                <input
                                  type={type}
                                  defaultValue={value}
                                  className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="h-14 px-8 bg-black text-white rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-colors">
                        Save changes
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
