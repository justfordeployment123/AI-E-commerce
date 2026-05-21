"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, RefreshCw, Wrench, Settings, LogOut, ChevronRight,
  Clock, Check, Truck, ArrowRight
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/auth-context";
import { ordersApi, tradeInsApi, repairsApi, authApi, type Order, type TradeIn, type Repair } from "../../lib/api";

const NAV_ITEMS = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "tradein", label: "Trade-Ins", icon: RefreshCw },
  { id: "repairs", label: "Repairs", icon: Wrench },
  { id: "settings", label: "Account settings", icon: Settings },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-zinc-100 text-zinc-500", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: Check },
  processing: { label: "Processing", color: "bg-amber-100 text-amber-700", icon: Clock },
  shipped: { label: "Shipped", color: "bg-blue-100 text-blue-700", icon: Truck },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", icon: Check },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: Clock },
  refunded: { label: "Refunded", color: "bg-zinc-100 text-zinc-500", icon: RefreshCw },
  submitted: { label: "Submitted", color: "bg-zinc-100 text-zinc-500", icon: Clock },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: Check },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: Clock },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: Check },
  quote_sent: { label: "Quote Sent", color: "bg-blue-100 text-blue-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-violet-100 text-violet-700", icon: Wrench },
};

function statusCfg(status: string) {
  return STATUS_CONFIG[status.toLowerCase()] ?? { label: status, color: "bg-zinc-100 text-zinc-500", icon: Clock };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Settings state
  const [settingsName, setSettingsName] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Pre-fill settings from user
  useEffect(() => {
    if (user) {
      setSettingsName(user.name);
      setSettingsPhone(user.phone ?? "");
    }
  }, [user]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const fetchFns: Record<string, () => Promise<void>> = {
      orders: () => ordersApi.myOrders().then(setOrders),
      tradein: () => tradeInsApi.my().then(setTradeIns),
      repairs: () => repairsApi.my().then(setRepairs),
    };
    fetchFns[activeTab]?.()
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [activeTab, user]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await authApi.updateProfile({ name: settingsName, phone: settingsPhone });
      setSaveMsg("Changes saved!");
    } catch {
      setSaveMsg("Failed to save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    logout();
    router.push("/");
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-12 w-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();
  const memberSince = fmtDate(user.createdAt);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-[1.5rem] bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-2xl">{initial}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-sm text-zinc-400 font-medium">{user.email} · Member since {memberSince}</p>
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
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[1rem] text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left mt-4"
                >
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
                    {dataLoading ? (
                      <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" /></div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-20 text-zinc-400">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">No orders yet</p>
                        <a href="/shop/phones" className="mt-4 inline-flex items-center gap-2 text-black font-bold underline">Shop now</a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => {
                          const cfg = statusCfg(order.status);
                          const StatusIcon = cfg.icon;
                          return (
                            <div key={order.id} className="rounded-[1.5rem] border border-zinc-100 p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                  <p className="font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                                  <p className="text-xs text-zinc-400 font-medium mt-0.5">{fmtDate(order.createdAt)}</p>
                                </div>
                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="space-y-1 mb-4">
                                {order.items.map(item => (
                                  <p key={item.id} className="text-sm font-medium text-zinc-600">
                                    {item.product.name} — {item.product.condition} × {item.quantity}
                                  </p>
                                ))}
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <span className="font-bold">£{order.total.toFixed(2)}</span>
                                {order.trackingNumber && (
                                  <span className="text-xs text-zinc-500 font-medium">Tracking: {order.trackingNumber}</span>
                                )}
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
                    {dataLoading ? (
                      <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" /></div>
                    ) : tradeIns.length === 0 ? (
                      <div className="text-center py-20 text-zinc-400">
                        <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">No trade-ins yet</p>
                        <a href="/trade-in" className="mt-4 inline-flex items-center gap-2 text-black font-bold underline">Start a trade-in</a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tradeIns.map(t => {
                          const cfg = statusCfg(t.status);
                          const StatusIcon = cfg.icon;
                          return (
                            <div key={t.id} className="rounded-[1.5rem] border border-zinc-100 p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                  <p className="font-bold">{t.model}</p>
                                  <p className="text-xs text-zinc-400 font-medium mt-0.5">{t.reference} · {fmtDate(t.createdAt)}</p>
                                </div>
                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                                <div>
                                  <p className="text-xs text-zinc-400 font-medium">Condition: {t.condition}</p>
                                  <p className="font-bold text-lg mt-0.5">£{t.offerPrice}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                    {dataLoading ? (
                      <div className="flex justify-center py-16"><div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" /></div>
                    ) : repairs.length === 0 ? (
                      <div className="text-center py-20 text-zinc-400">
                        <Wrench className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">No repairs yet</p>
                        <a href="/repair" className="mt-4 inline-flex items-center gap-2 text-black font-bold underline">Book a repair</a>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {repairs.map(r => {
                          const cfg = statusCfg(r.status);
                          const StatusIcon = cfg.icon;
                          return (
                            <div key={r.id} className="rounded-[1.5rem] border border-zinc-100 p-6">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                  <p className="font-bold">{r.brand} {r.model}</p>
                                  <p className="text-sm text-zinc-500 mt-0.5">{r.issue}</p>
                                  <p className="text-xs text-zinc-400 font-medium mt-1">{r.reference} · {fmtDate(r.createdAt)}</p>
                                </div>
                                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color}`}>
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
                  </motion.div>
                )}

                {/* Settings */}
                {activeTab === "settings" && (
                  <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <h2 className="text-2xl font-bold mb-8">Account settings</h2>
                    <form onSubmit={handleSaveSettings} className="space-y-8 max-w-lg">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Personal info</h3>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Full name</label>
                            <input
                              type="text"
                              value={settingsName}
                              onChange={e => setSettingsName(e.target.value)}
                              className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email</label>
                            <input
                              type="email"
                              value={user.email}
                              disabled
                              className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none bg-zinc-50 text-zinc-400 cursor-not-allowed"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Phone</label>
                            <input
                              type="tel"
                              value={settingsPhone}
                              onChange={e => setSettingsPhone(e.target.value)}
                              placeholder="+44 7700 000000"
                              className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          type="submit"
                          disabled={saving}
                          className="h-14 px-8 bg-black text-white rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
                        >
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                        {saveMsg && (
                          <p className={`text-sm font-bold ${saveMsg.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}>
                            {saveMsg}
                          </p>
                        )}
                      </div>
                    </form>
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
