"use client";

import { useState } from "react";
import { Search, ShoppingBag, Eye, X, Truck, Check, Clock, MapPin, Package, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type OrderStatus = "processing" | "dispatched" | "delivered" | "returned" | "cancelled";

interface Order {
  id: string;
  date: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: { name: string; grade: string; storage: string; price: number }[];
  total: number;
  shipping: string;
  status: OrderStatus;
  tracking: string | null;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "TS-28471", date: "18 May 2026 14:08",
    customer: { name: "Riley Okafor", email: "riley@email.com", phone: "+44 7712 481 029", address: "14 Queens Rd, Leicester, LE2 1WJ" },
    items: [
      { name: "iPhone 14 Pro", grade: "Excellent", storage: "256 GB", price: 579 },
      { name: "Sony WH-1000XM5", grade: "Pristine", storage: "—", price: 219 },
    ],
    total: 798, shipping: "Royal Mail Tracked 24", status: "dispatched", tracking: "QD091840523GB"
  },
  {
    id: "TS-28469", date: "18 May 2026 09:14",
    customer: { name: "Priya Nair", email: "priya@mail.co.uk", phone: "+44 7891 234 567", address: "3 Granby St, Leicester, LE1 6EL" },
    items: [{ name: "iPad Air 5th Gen", grade: "Excellent", storage: "64 GB", price: 389 }],
    total: 389, shipping: "Royal Mail Tracked 24", status: "processing", tracking: null
  },
  {
    id: "TS-28465", date: "17 May 2026 16:52",
    customer: { name: "Marcus Webb", email: "m.webb@example.com", phone: "+44 7700 112 233", address: "78 Narborough Rd, Leicester, LE3 0LF" },
    items: [{ name: "Samsung Galaxy S23 Ultra", grade: "Very Good", storage: "512 GB", price: 529 }],
    total: 529, shipping: "Special Delivery", status: "delivered", tracking: "SD009142881GB"
  },
  {
    id: "TS-28460", date: "17 May 2026 11:33",
    customer: { name: "Alex Turner", email: "alex@email.co.uk", phone: "+44 7456 881 332", address: "22 Humberstone Gate, Leicester, LE1 3PJ" },
    items: [{ name: "PS5 Digital Edition", grade: "Excellent", storage: "825 GB", price: 329 }],
    total: 329, shipping: "Royal Mail Tracked 24", status: "processing", tracking: null
  },
  {
    id: "TS-28458", date: "16 May 2026 14:00",
    customer: { name: "Jordan Mitchell", email: "j.mitchell@gmail.com", phone: "+44 7908 778 412", address: "5 Victoria Park Rd, Leicester, LE2 1XB" },
    items: [
      { name: "MacBook Air M2", grade: "Pristine", storage: "512 GB", price: 899 },
    ],
    total: 899, shipping: "Special Delivery", status: "delivered", tracking: "SD009001728GB"
  },
];

const STATUS_CFG: Record<OrderStatus, { label: string; cls: string; icon: React.ElementType }> = {
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-700", icon: Clock },
  dispatched: { label: "Dispatched", cls: "bg-violet-100 text-violet-700", icon: Truck },
  delivered: { label: "Delivered", cls: "bg-emerald-100 text-emerald-700", icon: Check },
  returned: { label: "Returned", cls: "bg-amber-100 text-amber-700", icon: Package },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-500", icon: X },
};

const STATUS_FLOW: OrderStatus[] = ["processing", "dispatched", "delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function advanceStatus(id: string) {
    setOrders(os => os.map(o => {
      if (o.id !== id) return o;
      const idx = STATUS_FLOW.indexOf(o.status);
      const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
      return { ...o, status: next };
    }));
    setSelected(s => {
      if (!s || s.id !== id) return s;
      const idx = STATUS_FLOW.indexOf(s.status);
      return { ...s, status: STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)] };
    });
  }

  function addTracking(id: string) {
    if (!trackingInput) return;
    setOrders(os => os.map(o => o.id === id ? { ...o, tracking: trackingInput, status: "dispatched" } : o));
    setSelected(s => s?.id === id ? { ...s, tracking: trackingInput, status: "dispatched" } : s);
    setTrackingInput("");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {orders.length} total · {orders.filter(o => o.status === "processing").length} to dispatch
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-[1rem] bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "processing", "dispatched", "delivered"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-11 px-4 rounded-[1rem] text-sm font-bold transition-all capitalize ${filterStatus === s ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {s === "all" ? "All" : STATUS_CFG[s as OrderStatus]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "xl:grid-cols-[1fr_380px]" : ""}`}>
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Order</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden lg:table-cell">Shipping</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Total</th>
                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(o => {
                const cfg = STATUS_CFG[o.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={o.id} onClick={() => setSelected(selected?.id === o.id ? null : o)} className={`cursor-pointer transition-colors ${selected?.id === o.id ? "bg-zinc-50" : "hover:bg-zinc-50/50"}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold">{o.id}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{o.date}</p>
                    </td>
                    <td className="px-4 py-4 text-zinc-600 font-medium hidden md:table-cell">{o.customer.name}</td>
                    <td className="px-4 py-4 text-xs text-zinc-500 hidden lg:table-cell">{o.shipping}</td>
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
          {filtered.length === 0 && (
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
              className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 self-start sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-bold text-lg">{selected.id}</p>
                  <p className="text-xs text-zinc-400">{selected.date}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide mb-5 ${STATUS_CFG[selected.status].cls}`}>
                {selected.status}
              </span>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-50 last:border-0">
                    <div>
                      <p className="font-bold text-sm">{item.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.grade} · {item.storage}</p>
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
              <div className="rounded-[1rem] bg-zinc-50 p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Customer</p>
                <p className="font-bold mb-2">{selected.customer.name}</p>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{selected.customer.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{selected.customer.phone}</div>
                  <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5" />{selected.customer.address}</div>
                </div>
              </div>

              {/* Tracking */}
              {selected.tracking ? (
                <div className="rounded-[1rem] bg-zinc-50 p-4 mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Tracking</p>
                  <p className="font-mono font-bold">{selected.tracking}</p>
                </div>
              ) : selected.status === "processing" ? (
                <div className="flex gap-2 mb-5">
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    className="flex-1 h-11 rounded-[1rem] border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                  />
                  <button onClick={() => addTracking(selected.id)} className="h-11 px-4 rounded-[1rem] bg-black text-white font-bold text-sm">
                    Mark dispatched
                  </button>
                </div>
              ) : null}

              {selected.status !== "delivered" && selected.status !== "cancelled" && (
                <button
                  onClick={() => advanceStatus(selected.id)}
                  className="w-full h-11 rounded-[1rem] bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {selected.status === "dispatched" ? "Mark as delivered" : "Mark as dispatched"}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
