"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wrench, X, Check, MapPin, Truck, Eye, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { repairsApi, type Repair } from "../../lib/api";

const STATUS_CFG: Record<string, { label: string; cls: string; dotColor: string }> = {
  SUBMITTED:   { label: "Pending review",   cls: "bg-amber-100 text-amber-700",   dotColor: "bg-amber-400" },
  QUOTE_SENT:  { label: "Quote sent",       cls: "bg-blue-100 text-blue-700",     dotColor: "bg-blue-400" },
  APPROVED:    { label: "Quote approved",   cls: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-400" },
  IN_PROGRESS: { label: "In repair",        cls: "bg-violet-100 text-violet-700", dotColor: "bg-violet-400" },
  COMPLETED:   { label: "Completed",        cls: "bg-zinc-100 text-zinc-500",     dotColor: "bg-zinc-400" },
  CANCELLED:   { label: "Cancelled",        cls: "bg-red-100 text-red-500",       dotColor: "bg-red-400" },
};

const FILTER_STATUSES = ["all", "SUBMITTED", "QUOTE_SENT", "APPROVED", "IN_PROGRESS", "COMPLETED"];

export default function RepairsPage() {
  const [items, setItems] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Repair | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  async function handlePurgeAll() {
    setPurging(true);
    try {
      await repairsApi.purgeAll();
      setItems([]);
      setSelected(null);
      setConfirmPurge(false);
    } catch { /* ignore */ }
    finally { setPurging(false); }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await repairsApi.list({ limit: 100 });
      setItems(res.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter(r => {
    const device = `${r.brand} ${r.model}`;
    const matchSearch =
      device.toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      (r.contact?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function refreshSelected(id: string) {
    try {
      const full = await repairsApi.getById(id);
      setSelected(full);
      setItems(rs => rs.map(r => r.id === id ? full : r));
    } catch { }
  }

  async function sendQuote(id: string) {
    const amount = Number(quoteInput);
    if (!amount) return;
    setSaving(true);
    try {
      await repairsApi.setQuote(id, amount);
      await refreshSelected(id);
      setQuoteInput("");
    } catch { }
    finally { setSaving(false); }
  }

  async function startRepair(id: string) {
    setSaving(true);
    try {
      await repairsApi.start(id);
      await refreshSelected(id);
    } catch { }
    finally { setSaving(false); }
  }

  async function completeRepair(id: string) {
    setSaving(true);
    try {
      await repairsApi.complete(id);
      await refreshSelected(id);
    } catch { }
    finally { setSaving(false); }
  }

  async function cancelRepair(id: string) {
    setSaving(true);
    try {
      await repairsApi.cancel(id);
      await refreshSelected(id);
    } catch { }
    finally { setSaving(false); }
  }

  const pending = items.filter(r => r.status === "SUBMITTED").length;
  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const cfg = (status: string) => STATUS_CFG[status] ?? STATUS_CFG.SUBMITTED;

  return (
    <div className="min-h-screen xl:h-screen flex flex-col xl:overflow-hidden bg-background p-4 sm:p-6 md:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repairs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {items.length} total — <span className="text-amber-600 font-bold">{pending} pending review</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confirmPurge ? (
            <>
              <span className="text-xs text-red-600 font-bold">Delete all {items.length} repairs?</span>
              <button onClick={handlePurgeAll} disabled={purging}
                className="h-9 px-4 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {purging ? "Deleting…" : "Yes, delete all"}
              </button>
              <button onClick={() => setConfirmPurge(false)}
                className="h-9 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmPurge(true)} disabled={items.length === 0}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <Trash2 className="h-3.5 w-3.5" /> Delete All
            </button>
          )}
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
              {s === "all" ? "All" : (STATUS_CFG[s]?.label ?? s)}
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
              <p className="font-bold text-sm">No repairs found</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead className="sticky top-0 bg-white z-10">
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
                    const c = cfg(r.status);
                    return (
                      <tr
                        key={r.id}
                        onClick={async () => {
                          if (selected?.id === r.id) { setSelected(null); return; }
                          setSelected(r);
                          setDetailLoading(true);
                          try {
                            const full = await repairsApi.getById(r.id);
                            setSelected(full);
                          } catch { }
                          finally { setDetailLoading(false); }
                        }}
                        className={`cursor-pointer transition-colors ${selected?.id === r.id ? "bg-zinc-50" : "hover:bg-zinc-50/50"}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold">{r.brand} {r.model}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{r.reference} · {r.deviceType}</p>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-zinc-600 font-medium">{r.contact?.name ?? "—"}</p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            {r.fulfillment === "ship" ? <Truck className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            {r.fulfillment === "ship" ? "Mail-in" : "Drop-off"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-zinc-500 text-xs font-medium hidden lg:table-cell max-w-45 truncate">{r.issue}</td>
                        <td className="px-4 py-4 text-right font-bold font-mono">{r.quote ? `£${r.quote}` : "—"}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${c.cls}`}>{c.label}</span>
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

        {/* Backdrop for detail drawer */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/40 z-30 xl:hidden"
            onClick={() => setSelected(null)}
          />
        )}

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 overflow-y-auto scrollbar-hide fixed inset-y-0 right-0 z-40 w-full sm:w-[400px] h-full max-h-full xl:static xl:h-auto xl:w-auto xl:max-h-none"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg truncate">{selected.brand} {selected.model}</p>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">{selected.reference} · {fmtDate(selected.createdAt)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="h-8 w-8 rounded-full hover:bg-zinc-100 flex items-center justify-center ml-2 shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Quote + Status card */}
              <div className="bg-zinc-950 text-white rounded-2xl px-5 py-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Repair Quote</p>
                    {selected.quote
                      ? <p className="text-4xl font-black font-mono tracking-tight">£{selected.quote}</p>
                      : <p className="text-2xl font-bold text-white/30">No quote yet</p>
                    }
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-1 ${cfg(selected.status).cls}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg(selected.status).dotColor}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{cfg(selected.status).label}</span>
                  </div>
                </div>
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["Issue",       selected.issue],
                  ["Fulfillment", selected.fulfillment === "ship" ? "Mail-in" : "Drop-off"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-zinc-50 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{k}</p>
                    <p className="text-xs font-bold text-zinc-800 truncate">{v}</p>
                  </div>
                ))}
              </div>

              {/* Customer */}
              {(selected.contact || selected.user) && (() => {
                const name  = selected.contact?.name  || selected.user?.name  || "—";
                const email = selected.contact?.email || selected.user?.email || "";
                const phone = selected.contact?.phone || "";
                return (
                  <div className="border border-zinc-100 rounded-2xl p-3 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Customer</p>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                        {name[0] || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{name}</p>
                        <p className="text-xs text-zinc-400 truncate">{email || "No email on file"}</p>
                        {phone && <p className="text-xs text-zinc-400">{phone}</p>}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Images strip */}
              {!detailLoading && selected.images && selected.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Photos ({selected.images.length})</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {selected.images.slice(0, 4).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 h-16 w-16 rounded-xl overflow-hidden border border-zinc-100 hover:opacity-80 transition-opacity">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {detailLoading && (
                <div className="flex items-center justify-center py-3 mb-4">
                  <div className="h-4 w-4 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                {selected.status === "SUBMITTED" && (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Quote amount (£)"
                        value={quoteInput}
                        onChange={e => setQuoteInput(e.target.value)}
                        className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                      />
                      <button
                        onClick={() => sendQuote(selected.id)}
                        disabled={saving}
                        className="h-11 px-4 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
                      >
                        Send
                      </button>
                    </div>
                    <button
                      onClick={() => cancelRepair(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-reject/10 text-reject font-bold text-sm hover:bg-reject/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Cancel repair
                    </button>
                  </>
                )}
                {selected.status === "QUOTE_SENT" && (
                  <>
                    <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 font-medium flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0" /> Quote sent — awaiting customer approval.
                    </div>
                    <button
                      onClick={() => cancelRepair(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-reject/10 text-reject font-bold text-sm hover:bg-reject/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Cancel repair
                    </button>
                  </>
                )}
                {selected.status === "APPROVED" && (
                  <>
                    <button
                      onClick={() => startRepair(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Wrench className="h-4 w-4" /> Start repair
                    </button>
                    <button
                      onClick={() => cancelRepair(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-reject/10 text-reject font-bold text-sm hover:bg-reject/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Cancel repair
                    </button>
                  </>
                )}
                {selected.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => completeRepair(selected.id)}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Mark as completed
                  </button>
                )}
                {selected.status === "COMPLETED" && (
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-500 font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> Repair completed.
                  </div>
                )}
                {selected.status === "CANCELLED" && (
                  <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
                    <X className="h-4 w-4 shrink-0" /> Repair was cancelled.
                  </div>
                )}
              </div>

              {/* Full details link */}
              <Link href={`/repairs/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-zinc-200 hover:border-black hover:bg-black hover:text-white text-xs font-bold transition-all mt-3">
                <ExternalLink className="h-3.5 w-3.5" /> View full details
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
