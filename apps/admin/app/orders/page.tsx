"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ShoppingBag, Eye, X, Truck, Check, Clock, MapPin, Package, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ordersApi, type Order } from "../../lib/api";

type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:   { label: "Processing", cls: "bg-blue-100 text-blue-700",    icon: Clock },
  CONFIRMED: { label: "Confirmed",  cls: "bg-violet-100 text-violet-700", icon: Check },
  SHIPPED:   { label: "Dispatched", cls: "bg-violet-100 text-violet-700", icon: Truck },
  DELIVERED: { label: "Delivered",  cls: "bg-emerald-100 text-emerald-700", icon: Check },
  CANCELLED: { label: "Cancelled",  cls: "bg-red-100 text-red-500",       icon: X },
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("q")?.replace("#", "").toLowerCase() ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(deepLinkId);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [saving, setSaving] = useState(false);
  const autoSelected = useRef(false);

  async function load() {
    setLoading(true);
    try {
      const res = await ordersApi.list({ limit: 100 });
      setOrders(res.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // Auto-open the order when arriving from a deep link (?q=DA8DE705)
  useEffect(() => {
    if (!deepLinkId || autoSelected.current || orders.length === 0) return;
    const match = orders.find(o => o.id.toLowerCase().startsWith(deepLinkId));
    if (match) {
      setSelected(match);
      autoSelected.current = true;
    }
  }, [orders, deepLinkId]);

  const filtered = orders.filter(o => {
    const customerName = o.user?.name ?? o.shippingAddress?.name ?? "";
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleShip(id: string) {
    if (!trackingInput.trim()) return;
    setSaving(true);
    try {
      const updated = await ordersApi.ship(id, trackingInput.trim());
      setOrders(os => os.map(o => o.id === id ? updated : o));
      setSelected(updated);
      setTrackingInput("");
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDeliver(id: string) {
    setSaving(true);
    try {
      const updated = await ordersApi.deliver(id);
      setOrders(os => os.map(o => o.id === id ? updated : o));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleCancel(id: string) {
    setSaving(true);
    try {
      const updated = await ordersApi.cancel(id);
      setOrders(os => os.map(o => o.id === id ? updated : o));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const customerName = (o: Order) => o.user?.name ?? o.shippingAddress?.name ?? "Guest";
  const customerEmail = (o: Order) => o.user?.email ?? o.shippingAddress?.email ?? "—";
  const addr = (o: Order) => {
    const a = o.shippingAddress;
    if (!a) return "—";
    return [a.address, a.city, a.postcode].filter(Boolean).join(", ");
  };

  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {orders.length} total · {orders.filter(o => o.status === "PENDING").length} to dispatch
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-55">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-2xl bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "PENDING", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all ${filterStatus === s ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {s === "all" ? "All" : (STATUS_CFG[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "xl:grid-cols-[1fr_380px]" : ""}`}>
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Order</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden md:table-cell">Customer</th>
                  <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Total</th>
                  <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map(o => {
                  const cfg = STATUS_CFG[o.status] ?? STATUS_CFG.PENDING;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(selected?.id === o.id ? null : o)}
                      className={`cursor-pointer transition-colors ${selected?.id === o.id ? "bg-zinc-50" : "hover:bg-zinc-50/50"}`}
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{fmtDate(o.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4 text-zinc-600 font-medium hidden md:table-cell">{customerName(o)}</td>
                      <td className="px-4 py-4 text-right font-bold font-mono">£{o.total}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>
                          <StatusIcon className="h-3 w-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4"><Eye className="h-4 w-4 text-zinc-300" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-zinc-400">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No orders found</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 self-start sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-bold text-lg font-mono">{selected.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-zinc-400">{fmtDate(selected.createdAt)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {(() => { const cfg = STATUS_CFG[selected.status] ?? STATUS_CFG.PENDING; return (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide mb-5 ${cfg.cls}`}>
                  {cfg.label}
                </span>
              ); })()}

              {/* Items */}
              <div className="space-y-3 mb-5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-50 last:border-0">
                    <div>
                      <p className="font-bold text-sm">{item.product.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.product.condition} · qty {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm font-mono">£{item.price}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-bold">
                  <span>Total</span>
                  <span className="font-mono">£{selected.total}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-2xl bg-zinc-50 p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Customer</p>
                <p className="font-bold mb-2">{customerName(selected)}</p>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{customerEmail(selected)}</div>
                  <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{addr(selected)}</div>
                </div>
              </div>

              {/* Tracking */}
              {selected.trackingNumber ? (
                <div className="rounded-2xl bg-zinc-50 p-4 mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Tracking</p>
                  <p className="font-mono font-bold">{selected.trackingNumber}</p>
                </div>
              ) : selected.status === "PENDING" || selected.status === "CONFIRMED" ? (
                <div className="flex gap-2 mb-5">
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                  />
                  <button
                    onClick={() => handleShip(selected.id)}
                    disabled={saving}
                    className="h-11 px-4 rounded-2xl bg-black text-white font-bold text-sm disabled:opacity-60"
                  >
                    Dispatch
                  </button>
                </div>
              ) : null}

              <div className="space-y-2">
                {selected.status === "SHIPPED" && (
                  <button
                    onClick={() => handleDeliver(selected.id)}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Mark as delivered
                  </button>
                )}
                {(selected.status === "PENDING" || selected.status === "CONFIRMED") && (
                  <button
                    onClick={() => handleCancel(selected.id)}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Cancel order
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
