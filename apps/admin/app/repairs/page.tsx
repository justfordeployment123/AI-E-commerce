"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Wrench, X, Check, Mail, Phone, MapPin, Truck, Eye, RefreshCw, ExternalLink } from "lucide-react";
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

  async function sendQuote(id: string) {
    const amount = Number(quoteInput);
    if (!amount) return;
    setSaving(true);
    try {
      const updated = await repairsApi.setQuote(id, amount);
      setItems(rs => rs.map(r => r.id === id ? updated : r));
      setSelected(updated);
      setQuoteInput("");
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function approveQuote(id: string) {
    setSaving(true);
    try {
      const updated = await repairsApi.approveQuote(id);
      setItems(rs => rs.map(r => r.id === id ? updated : r));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function startRepair(id: string) {
    setSaving(true);
    try {
      const updated = await repairsApi.start(id);
      setItems(rs => rs.map(r => r.id === id ? updated : r));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function completeRepair(id: string) {
    setSaving(true);
    try {
      const updated = await repairsApi.complete(id);
      setItems(rs => rs.map(r => r.id === id ? updated : r));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function cancelRepair(id: string) {
    setSaving(true);
    try {
      const updated = await repairsApi.cancel(id);
      setItems(rs => rs.map(r => r.id === id ? updated : r));
      setSelected(updated);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  const pending = items.filter(r => r.status === "SUBMITTED").length;
  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const cfg = (status: string) => STATUS_CFG[status] ?? STATUS_CFG.SUBMITTED;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background p-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repairs</h1>
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
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
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
                href={`/repairs/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-2xl border-2 border-zinc-200 hover:border-black hover:bg-black hover:text-white text-sm font-bold transition-all mb-4"
              >
                <ExternalLink className="h-4 w-4" /> View full details
              </Link>
              {detailLoading && (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-5 pb-5 border-b border-zinc-100">
                <div className={`h-2.5 w-2.5 rounded-full ${cfg(selected.status).dotColor}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${cfg(selected.status).cls} rounded-full px-2.5 py-1`}>
                  {cfg(selected.status).label}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  ["Device type", selected.deviceType],
                  ["Issue", selected.issue],
                  ["Fulfillment", selected.fulfillment === "ship" ? "Mail-in" : "Drop-off"],
                  ["Date submitted", fmtDate(selected.createdAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-medium">{k}</span>
                    <span className="font-bold text-right">{v}</span>
                  </div>
                ))}
                {selected.issueNotes && (
                  <div className="rounded-2xl bg-zinc-50 p-4 text-xs text-zinc-600 mt-2">{selected.issueNotes}</div>
                )}
              </div>

              {selected.images && selected.images.length > 0 && (
                <div className="mb-5">
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

              {selected.quote && (
                <div className="rounded-3xl bg-zinc-950 text-white p-5 mb-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Quote sent</p>
                  <p className="text-4xl font-bold tracking-tighter">£{selected.quote}</p>
                </div>
              )}

              <div className="space-y-2">
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
                        Send quote
                      </button>
                    </div>
                    <button
                      onClick={() => cancelRepair(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <X className="h-4 w-4" /> Cancel repair
                    </button>
                  </>
                )}
                {selected.status === "QUOTE_SENT" && (
                  <>
                    <button
                      onClick={() => approveQuote(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" /> Approve quote
                    </button>
                    <button
                      onClick={() => cancelRepair(selected.id)}
                      disabled={saving}
                      className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
                      className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-500 font-medium">
                    <Check className="h-4 w-4 inline mr-2" />
                    Repair completed.
                  </div>
                )}
                {selected.status === "CANCELLED" && (
                  <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                    <X className="h-4 w-4 inline mr-2" />
                    Repair was cancelled.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
