"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, X, Check, Minus, RefreshCw,
  Truck, MapPin, Eye, MessageSquare, Phone, Mail
} from "lucide-react";

type Status = "pending" | "approved" | "rejected" | "paid" | "received";

interface TradeIn {
  id: string;
  date: string;
  device: string;
  category: string;
  brand: string;
  condition: string;
  specs: string;
  offer: number;
  status: Status;
  fulfillment: "ship" | "dropoff";
  customer: { name: string; email: string; phone: string };
  issues: Record<string, string>;
}

const MOCK_DATA: TradeIn[] = [
  {
    id: "TI-09161", date: "18 May 2026 14:22", device: "iPhone 14 Pro", category: "Phone", brand: "Apple",
    condition: "Good", specs: "256 GB · Unlocked", offer: 420, status: "pending", fulfillment: "ship",
    customer: { name: "Riley Okafor", email: "riley@email.com", phone: "+44 7712 481 029" },
    issues: { screen: "Light surface scratches", battery: "80–89% (Good)", charging: "Yes", reset: "I'll reset before sending" }
  },
  {
    id: "TI-09158", date: "18 May 2026 11:05", device: "Samsung Galaxy S23 Ultra", category: "Phone", brand: "Samsung",
    condition: "Excellent", specs: "512 GB · Unlocked", offer: 540, status: "approved", fulfillment: "dropoff",
    customer: { name: "Priya Nair", email: "priya@mail.co.uk", phone: "+44 7891 234 567" },
    issues: { screen: "No cracks or scratches", battery: "90%+ (Excellent)", charging: "Yes", reset: "Already reset" }
  },
  {
    id: "TI-09154", date: "17 May 2026 18:30", device: "PS5 Disc Edition", category: "Console", brand: "Sony",
    condition: "Used", specs: "1 Controller · HDMI + Power", offer: 195, status: "pending", fulfillment: "ship",
    customer: { name: "Marcus Webb", email: "m.webb@example.com", phone: "+44 7700 112 233" },
    issues: { power: "Yes, works perfectly", disc: "Yes, works great", body: "Minor scratches", reset: "Yes, already reset" }
  },
  {
    id: "TI-09151", date: "17 May 2026 10:14", device: "MacBook Air M2", category: "Laptop", brand: "Apple",
    condition: "Good", specs: "16 GB · 512 GB SSD", offer: 520, status: "approved", fulfillment: "dropoff",
    customer: { name: "Sienna Park", email: "sienna@outlook.com", phone: "+44 7623 449 108" },
    issues: { power: "Yes, fully", screen: "No damage", input: "Yes, all working", battery: "Holds charge well (4+ hours)", reset: "Already reset" }
  },
  {
    id: "TI-09148", date: "16 May 2026 09:00", device: "Nintendo Switch OLED", category: "Console", brand: "Nintendo",
    condition: "Used", specs: "No Controllers · HDMI + Power", offer: 185, status: "rejected", fulfillment: "ship",
    customer: { name: "Jordan Mitchell", email: "j.mitchell@gmail.com", phone: "+44 7908 778 412" },
    issues: { power: "Yes but has some issues", body: "Significant damage", reset: "I'll reset before sending" }
  },
  {
    id: "TI-09144", date: "15 May 2026 16:45", device: "iPad Pro 11\" M2", category: "Tablet", brand: "Apple",
    condition: "Excellent", specs: "256 GB · Wi-Fi + Cellular", offer: 480, status: "paid", fulfillment: "ship",
    customer: { name: "Alex Turner", email: "alex@email.co.uk", phone: "+44 7456 881 332" },
    issues: { screen: "No damage at all", body: "Like new", battery: "Holds charge well (6+ hours)", charging: "Yes", reset: "Already reset" }
  },
];

const STATUS_CONFIG: Record<Status, { label: string; className: string; dotColor: string }> = {
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-700", dotColor: "bg-amber-400" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700", dotColor: "bg-red-400" },
  paid: { label: "Paid", className: "bg-blue-100 text-blue-700", dotColor: "bg-blue-400" },
  received: { label: "Received", className: "bg-violet-100 text-violet-700", dotColor: "bg-violet-400" },
};

export default function TradeInsPage() {
  const [items, setItems] = useState(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<TradeIn | null>(null);
  const [counterOffer, setCounterOffer] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  const filtered = items.filter(t => {
    const matchSearch = t.device.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function updateStatus(id: string, status: Status) {
    setItems(ts => ts.map(t => t.id === id ? { ...t, status } : t));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
  }

  const pending = items.filter(t => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade-Ins</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} total — <span className="text-amber-600 font-bold">{pending} pending review</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search device, ID or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-[1rem] bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "rejected", "paid"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-11 px-4 rounded-[1rem] text-sm font-bold transition-all capitalize ${filterStatus === s ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s as Status]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "xl:grid-cols-[1fr_400px]" : ""}`}>
        {/* List */}
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Device</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden lg:table-cell">Condition</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Offer</th>
                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(t => {
                const cfg = STATUS_CONFIG[t.status];
                const isSelected = selected?.id === t.id;
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(isSelected ? null : t)}
                    className={`cursor-pointer transition-colors ${isSelected ? "bg-zinc-50" : "hover:bg-zinc-50/50"}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold">{t.device}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{t.id} · {t.specs}</p>
                    </td>
                    <td className="px-4 py-4 text-zinc-600 font-medium hidden md:table-cell">
                      <p>{t.customer.name}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        {t.fulfillment === "ship" ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {t.fulfillment === "ship" ? "Ship" : "Drop-off"}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase">{t.condition}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-bold font-mono">£{t.offer}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Eye className="h-4 w-4 text-zinc-300" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-zinc-400">
              <RefreshCw className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No trade-ins found</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 self-start sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="font-bold text-lg">{selected.device}</p>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">{selected.id} · {selected.date}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Offer */}
              <div className="rounded-[1.5rem] bg-zinc-950 text-white p-5 mb-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Offer amount</p>
                <p className="text-4xl font-bold tracking-tighter">£{selected.offer}</p>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 mb-5 pb-5 border-b border-zinc-100">
                <div className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[selected.status].dotColor}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${STATUS_CONFIG[selected.status].className} rounded-full px-2.5 py-1`}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-5">
                {[
                  ["Specs", selected.specs],
                  ["Condition", selected.condition],
                  ["Fulfillment", selected.fulfillment === "ship" ? "Ship to us" : "Drop-off in store"],
                  ["Date submitted", selected.date],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-medium">{k}</span>
                    <span className="font-bold text-right">{v}</span>
                  </div>
                ))}
              </div>

              {/* Customer */}
              <div className="rounded-[1rem] bg-zinc-50 p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Customer</p>
                <p className="font-bold mb-2">{selected.customer.name}</p>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{selected.customer.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{selected.customer.phone}</div>
                </div>
              </div>

              {/* Condition answers */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Device condition answers</p>
                <div className="space-y-2">
                  {Object.entries(selected.issues).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-zinc-400 capitalize">{k}</span>
                      <span className="font-medium text-right max-w-[180px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selected.status === "pending" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateStatus(selected.id, "approved")}
                      className="h-11 rounded-[1rem] bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, "rejected")}
                      className="h-11 rounded-[1rem] bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                  {!showCounter ? (
                    <button
                      onClick={() => setShowCounter(true)}
                      className="w-full h-11 rounded-[1rem] border-2 border-zinc-200 font-bold text-sm hover:border-zinc-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Minus className="h-4 w-4" /> Counter offer
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Counter amount (£)"
                        value={counterOffer}
                        onChange={e => setCounterOffer(e.target.value)}
                        className="flex-1 h-11 rounded-[1rem] border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                      />
                      <button
                        onClick={() => { setShowCounter(false); setCounterOffer(""); }}
                        className="h-11 px-4 rounded-[1rem] bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selected.status === "approved" && (
                <div className="rounded-[1rem] bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 font-medium">
                  <Check className="h-4 w-4 inline mr-2" />
                  Offer approved. Waiting for device to be {selected.fulfillment === "ship" ? "posted" : "dropped off"}.
                </div>
              )}

              {selected.status === "rejected" && (
                <div className="rounded-[1rem] bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                  <X className="h-4 w-4 inline mr-2" />
                  Trade-in was rejected. Customer notified by email.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
