"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wrench, X, Check, Phone, Mail, Clock, MapPin, Truck, Eye } from "lucide-react";

type RepairStatus = "pending" | "quoted" | "approved" | "in_repair" | "ready" | "completed" | "cancelled";

interface Repair {
  id: string;
  date: string;
  device: string;
  brand: string;
  issue: string;
  issueNotes: string;
  fulfillment: "dropoff" | "mail";
  status: RepairStatus;
  quote: number | null;
  customer: { name: string; email: string; phone: string };
}

const MOCK: Repair[] = [
  {
    id: "RP-04441", date: "18 May 2026 13:10", device: "iPhone 13", brand: "Apple",
    issue: "Cracked / damaged screen", issueNotes: "Screen is shattered, digitizer not responding.", fulfillment: "dropoff",
    status: "pending", quote: null,
    customer: { name: "Riley Okafor", email: "riley@email.com", phone: "+44 7712 481 029" }
  },
  {
    id: "RP-04440", date: "18 May 2026 09:45", device: "Galaxy S22 Ultra", brand: "Samsung",
    issue: "Charging port issue", issueNotes: "Charges intermittently, only at specific angle.", fulfillment: "mail",
    status: "quoted", quote: 65,
    customer: { name: "Priya Nair", email: "priya@mail.co.uk", phone: "+44 7891 234 567" }
  },
  {
    id: "RP-04437", date: "17 May 2026 16:20", device: "MacBook Air M1", brand: "Apple",
    issue: "Battery replacement", issueNotes: "Holds charge for about 1.5 hours only.", fulfillment: "mail",
    status: "in_repair", quote: 120,
    customer: { name: "Marcus Webb", email: "m.webb@example.com", phone: "+44 7700 112 233" }
  },
  {
    id: "RP-04433", date: "16 May 2026 14:00", device: "PS5 Disc Edition", brand: "Sony",
    issue: "Disc drive issue", issueNotes: "Discs are not being read, clicking noise on insert.", fulfillment: "dropoff",
    status: "ready", quote: 85,
    customer: { name: "Jordan Mitchell", email: "j.mitchell@gmail.com", phone: "+44 7908 778 412" }
  },
  {
    id: "RP-04428", date: "15 May 2026 11:30", device: "iPad Air 5th Gen", brand: "Apple",
    issue: "Cracked / damaged screen", issueNotes: "Front glass cracked, display still works.", fulfillment: "mail",
    status: "completed", quote: 95,
    customer: { name: "Sienna Park", email: "sienna@outlook.com", phone: "+44 7623 449 108" }
  },
];

const STATUS_CFG: Record<RepairStatus, { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "bg-amber-100 text-amber-700" },
  quoted: { label: "Quote sent", cls: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
  in_repair: { label: "In repair", cls: "bg-violet-100 text-violet-700" },
  ready: { label: "Ready for pickup", cls: "bg-teal-100 text-teal-700" },
  completed: { label: "Completed", cls: "bg-zinc-100 text-zinc-500" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-500" },
};

const STATUS_FLOW: RepairStatus[] = ["pending", "quoted", "in_repair", "ready", "completed"];

export default function RepairsPage() {
  const [items, setItems] = useState(MOCK);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<RepairStatus | "all">("all");
  const [selected, setSelected] = useState<Repair | null>(null);
  const [quoteInput, setQuoteInput] = useState("");

  const filtered = items.filter(r => {
    const matchSearch = r.device.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()) || r.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function advanceStatus(id: string) {
    setItems(rs => rs.map(r => {
      if (r.id !== id) return r;
      const idx = STATUS_FLOW.indexOf(r.status);
      const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
      return { ...r, status: next };
    }));
    setSelected(s => {
      if (!s || s.id !== id) return s;
      const idx = STATUS_FLOW.indexOf(s.status);
      return { ...s, status: STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)] };
    });
  }

  function sendQuote(id: string) {
    const amount = Number(quoteInput);
    if (!amount) return;
    setItems(rs => rs.map(r => r.id === id ? { ...r, quote: amount, status: "quoted" } : r));
    setSelected(s => s?.id === id ? { ...s, quote: amount, status: "quoted" } : s);
    setQuoteInput("");
  }

  const pending = items.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repairs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items.length} total — <span className="text-amber-600 font-bold">{pending} pending review</span>
          </p>
        </div>
      </div>

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
          {(["all", "pending", "quoted", "in_repair", "ready", "completed"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-11 px-4 rounded-[1rem] text-sm font-bold transition-all ${filterStatus === s ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {s === "all" ? "All" : STATUS_CFG[s as RepairStatus]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${selected ? "xl:grid-cols-[1fr_380px]" : ""}`}>
        <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Device</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400 hidden lg:table-cell">Issue</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Quote</th>
                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(r => {
                const cfg = STATUS_CFG[r.status];
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(selected?.id === r.id ? null : r)}
                    className={`cursor-pointer transition-colors ${selected?.id === r.id ? "bg-zinc-50" : "hover:bg-zinc-50/50"}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold">{r.device}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{r.id} · {r.date.split(" ")[0]}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-zinc-600 font-medium">{r.customer.name}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        {r.fulfillment === "mail" ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {r.fulfillment === "mail" ? "Mail-in" : "Drop-off"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-zinc-500 text-xs font-medium hidden lg:table-cell max-w-[180px] truncate">{r.issue}</td>
                    <td className="px-4 py-4 text-right font-bold font-mono">{r.quote ? `£${r.quote}` : "—"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td className="px-6 py-4"><Eye className="h-4 w-4 text-zinc-300" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-20 text-zinc-400">
              <Wrench className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">No repairs found</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6 self-start sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="font-bold text-lg">{selected.device}</p>
                  <p className="text-xs text-zinc-400">{selected.id} · {selected.date}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`rounded-[1rem] px-4 py-3 mb-5 text-xs font-bold uppercase tracking-widest ${STATUS_CFG[selected.status].cls}`}>
                {STATUS_CFG[selected.status].label}
              </div>

              <div className="space-y-2 mb-5 text-sm">
                {[["Issue", selected.issue], ["Brand", selected.brand], ["Method", selected.fulfillment === "mail" ? "Mail-in" : "Drop-off"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-zinc-400">{k}</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
                {selected.issueNotes && (
                  <div className="rounded-[1rem] bg-zinc-50 p-4 text-xs text-zinc-600 mt-2">{selected.issueNotes}</div>
                )}
              </div>

              <div className="rounded-[1rem] bg-zinc-50 p-4 mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Customer</p>
                <p className="font-bold mb-2">{selected.customer.name}</p>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{selected.customer.email}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{selected.customer.phone}</div>
                </div>
              </div>

              {selected.quote && (
                <div className="rounded-[1.5rem] bg-zinc-950 text-white p-4 mb-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Quote sent</p>
                  <p className="text-3xl font-bold">£{selected.quote}</p>
                </div>
              )}

              <div className="space-y-2">
                {selected.status === "pending" && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Quote amount (£)"
                      value={quoteInput}
                      onChange={e => setQuoteInput(e.target.value)}
                      className="flex-1 h-11 rounded-[1rem] border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                    />
                    <button
                      onClick={() => sendQuote(selected.id)}
                      className="h-11 px-4 rounded-[1rem] bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors"
                    >
                      Send quote
                    </button>
                  </div>
                )}
                {selected.status !== "completed" && selected.status !== "cancelled" && selected.status !== "pending" && (
                  <button
                    onClick={() => advanceStatus(selected.id)}
                    className="w-full h-11 rounded-[1rem] bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {selected.status === "quoted" ? "Mark as in repair" :
                     selected.status === "in_repair" ? "Mark as ready" :
                     selected.status === "ready" ? "Mark as completed" : "Next step"}
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
