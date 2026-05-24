"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Minus, RefreshCw, Truck, MapPin, Eye, Mail, Phone, ExternalLink, Image } from "lucide-react";
import Link from "next/link";
import { tradeInsApi, type TradeIn } from "../../lib/api";

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  SUBMITTED:      { label: "Submitted",       className: "bg-amber-100 text-amber-700",    dotColor: "bg-amber-400" },
  UNDER_REVIEW:   { label: "Under review",    className: "bg-blue-100 text-blue-700",      dotColor: "bg-blue-400" },
  APPROVED:       { label: "Approved",        className: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-400" },
  REJECTED:       { label: "Rejected",        className: "bg-red-100 text-red-700",        dotColor: "bg-red-400" },
  COUNTER_OFFERED:{ label: "Counter offered", className: "bg-violet-100 text-violet-700",  dotColor: "bg-violet-400" },
  COMPLETED:      { label: "Completed",       className: "bg-zinc-100 text-zinc-500",      dotColor: "bg-zinc-400" },
  CANCELLED:      { label: "Cancelled",       className: "bg-red-100 text-red-500",        dotColor: "bg-red-400" },
};

const FILTER_STATUSES = ["all", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"];

export default function TradeInsPage() {
  const [items, setItems] = useState<TradeIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<TradeIn | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [counterOffer, setCounterOffer] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await tradeInsApi.list({ limit: 100 });
      setItems(res.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter(t => {
    const name = t.contact?.name ?? "";
    const matchSearch =
      t.model.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase()) ||
      name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function approve(id: string, price: number) {
    setSaving(true);
    try {
      const updated = await tradeInsApi.approve(id, price);
      setItems(ts => ts.map(t => t.id === id ? updated : t));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function reject(id: string) {
    setSaving(true);
    try {
      const updated = await tradeInsApi.reject(id);
      setItems(ts => ts.map(t => t.id === id ? updated : t));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function sendCounter(id: string) {
    const amount = Number(counterOffer);
    if (!amount) return;
    setSaving(true);
    try {
      const updated = await tradeInsApi.counterOffer(id, amount);
      setItems(ts => ts.map(t => t.id === id ? updated : t));
      setSelected(updated);
      setShowCounter(false);
      setCounterOffer("");
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const pending = items.filter(t => t.status === "SUBMITTED").length;
  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const cfg = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG.SUBMITTED;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background p-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade-Ins</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {items.length} total — <span className="text-amber-600 font-bold">{pending} pending review</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        <div className="relative flex-1 min-w-55">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search device, ref or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-xl bg-white border border-zinc-200 pl-10 pr-4 text-sm font-medium outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-9 px-3 rounded-xl text-xs font-bold transition-all capitalize ${filterStatus === s ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {s === "all" ? "All" : (STATUS_CONFIG[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Content grid — takes all remaining height */}
      <div className={`flex-1 min-h-0 grid gap-6 ${selected ? "xl:grid-cols-[1fr_400px]" : ""}`}>

        {/* Table card — scrollable body, sticky header */}
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
              <RefreshCw className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-bold text-sm">No trade-ins found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10">
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
                    const c = cfg(t.status);
                    return (
                      <tr
                        key={t.id}
                        onClick={async () => {
                          if (selected?.id === t.id) { setSelected(null); return; }
                          setSelected(t);
                          setDetailLoading(true);
                          try {
                            const full = await tradeInsApi.getById(t.id);
                            setSelected(full);
                          } catch { }
                          finally { setDetailLoading(false); }
                        }}
                        className={`cursor-pointer transition-colors ${selected?.id === t.id ? "bg-zinc-50" : "hover:bg-zinc-50/50"}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold">{t.brand} {t.model}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{t.reference} · {t.category}</p>
                        </td>
                        <td className="px-4 py-4 text-zinc-600 font-medium hidden md:table-cell">
                          <p>{t.contact?.name ?? "—"}</p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            {t.fulfillment === "ship" ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {t.fulfillment === "ship" ? "Ship" : "Drop-off"}
                          </p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase">{t.condition}</span>
                        </td>
                        <td className="px-4 py-4 text-right font-bold font-mono">£{t.offerPrice}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${c.className}`}>{c.label}</span>
                        </td>
                        <td className="px-6 py-4"><Eye className="h-4 w-4 text-zinc-300" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 overflow-y-auto scrollbar-hide"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{selected.brand} {selected.model}</p>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">{selected.reference} · {fmtDate(selected.createdAt)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center ml-2 shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Link
                href={`/trade-ins/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-2xl border-2 border-zinc-200 hover:border-black hover:bg-black hover:text-white text-sm font-bold transition-all mb-5"
              >
                <ExternalLink className="h-4 w-4" /> View full details
              </Link>
              {detailLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                </div>
              )}

              <div className="rounded-3xl bg-zinc-950 text-white p-5 mb-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Offer amount</p>
                <p className="text-4xl font-bold tracking-tighter">£{selected.offerPrice}</p>
                {selected.finalPrice && selected.finalPrice !== selected.offerPrice && (
                  <p className="text-sm text-white/50 mt-1">Final: £{selected.finalPrice}</p>
                )}
              </div>

              <div className="flex items-center gap-2 mb-5 pb-5 border-b border-zinc-100">
                <div className={`h-2.5 w-2.5 rounded-full ${cfg(selected.status).dotColor}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${cfg(selected.status).className} rounded-full px-2.5 py-1`}>
                  {cfg(selected.status).label}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  ["Category", selected.category],
                  ["Condition", selected.condition],
                  ["Fulfillment", selected.fulfillment === "ship" ? "Ship to us" : "Drop-off in store"],
                  ["Date submitted", fmtDate(selected.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-medium">{k}</span>
                    <span className="font-bold text-right">{v}</span>
                  </div>
                ))}
              </div>

              {(selected.contact || selected.user) && (() => {
                const name  = selected.contact?.name  || selected.user?.name  || "—";
                const email = selected.contact?.email || selected.user?.email || "";
                const phone = selected.contact?.phone || "";
                return (
                  <div className="rounded-2xl bg-zinc-50 p-4 mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Customer</p>
                    <p className="font-bold mb-2">{name}</p>
                    <div className="space-y-1.5 text-xs text-zinc-500">
                      {email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{email}</div>}
                      {phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{phone}</div>}
                      {!email && !phone && <p className="text-zinc-400 italic">No contact details on file</p>}
                    </div>
                  </div>
                );
              })()}

              {selected.images && selected.images.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Device Photos ({selected.images.length})</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.images.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-zinc-100 hover:opacity-90 transition-opacity">
                        <img src={url} alt={`Device photo ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selected.answers && Object.keys(selected.answers).length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Device condition answers</p>
                  <div className="space-y-2">
                    {Object.entries(selected.answers).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-zinc-400 capitalize">{k}</span>
                        <span className="font-medium text-right max-w-45">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.status === "SUBMITTED" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => approve(selected.id, selected.offerPrice)}
                      disabled={saving}
                      className="h-11 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => reject(selected.id)}
                      disabled={saving}
                      className="h-11 rounded-2xl bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                  {!showCounter ? (
                    <button
                      onClick={() => setShowCounter(true)}
                      className="w-full h-11 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:border-zinc-400 transition-colors flex items-center justify-center gap-2"
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
                        className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                      />
                      <button
                        onClick={() => sendCounter(selected.id)}
                        disabled={saving}
                        className="h-11 px-4 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selected.status === "APPROVED" && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 font-medium">
                  <Check className="h-4 w-4 inline mr-2" />
                  Offer approved. Waiting for device to be {selected.fulfillment === "ship" ? "posted" : "dropped off"}.
                </div>
              )}
              {selected.status === "REJECTED" && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                  <X className="h-4 w-4 inline mr-2" />
                  Trade-in was rejected.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
