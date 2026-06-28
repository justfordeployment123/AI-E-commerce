"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Minus, RefreshCw, Truck, MapPin, Eye, ExternalLink, Trash2 } from "lucide-react";
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
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: "approve" | "reject" | "counter"; id: string } | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalCounter, setModalCounter] = useState("");
  const [purging, setPurging] = useState(false);
  const [confirmPurge, setConfirmPurge] = useState(false);

  async function handlePurgeAll() {
    setPurging(true);
    try {
      await tradeInsApi.purgeAll();
      setItems([]);
      setSelected(null);
      setConfirmPurge(false);
    } catch { /* ignore */ }
    finally { setPurging(false); }
  }

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

  async function refreshSelected(id: string) {
    try {
      const full = await tradeInsApi.getById(id);
      setSelected(full);
      setItems(ts => ts.map(t => t.id === id ? full : t));
    } catch { }
  }

  function openModal(type: "approve" | "reject" | "counter", id: string) {
    setActionError(null);
    setModalNotes("");
    setModalCounter(type === "counter" && selected?.counterOffer ? String(selected.counterOffer) : "");
    setModal({ type, id });
  }

  function closeModal() {
    setModal(null);
    setModalNotes("");
    setModalCounter("");
    setActionError(null);
  }

  async function handleModalConfirm() {
    if (!modal) return;
    if (modal.type === "counter" && !modalCounter) return;
    setSaving(true); setActionError(null);
    try {
      if (modal.type === "approve") {
        await tradeInsApi.approve(modal.id, modalNotes || undefined);
      } else if (modal.type === "reject") {
        await tradeInsApi.reject(modal.id, modalNotes || undefined);
      } else {
        await tradeInsApi.counterOffer(modal.id, Number(modalCounter), modalNotes || undefined);
      }
      await refreshSelected(modal.id);
      closeModal();
    } catch (e: any) { setActionError(e?.message ?? "Action failed"); }
    finally { setSaving(false); }
  }

  const pending = items.filter(t => t.status === "SUBMITTED").length;
  const fmtDate = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const cfg = (status: string) => STATUS_CONFIG[status] ?? STATUS_CONFIG.SUBMITTED;

  return (
    <div className="min-h-screen xl:h-screen flex flex-col xl:overflow-hidden bg-background p-4 sm:p-6 md:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade-Ins</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {items.length} total — <span className="text-amber-600 font-bold">{pending} pending review</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confirmPurge ? (
            <>
              <span className="text-xs text-red-600 font-bold">Delete all {items.length} trade-ins?</span>
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
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm min-w-[750px]">
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
                          setActionError(null);
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
                        <td className="px-4 py-4 text-right font-bold font-mono">
                          {t.offerPrice > 0
                            ? `£${t.offerPrice}`
                            : t.counterOffer
                            ? <span className="text-violet-600 text-[10px] font-black uppercase tracking-wide">£{t.counterOffer} sent</span>
                            : <span className="text-amber-500 text-[10px] font-black uppercase tracking-wide">Pending</span>}
                        </td>
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

              {/* Offer + Status */}
              <div className="bg-zinc-950 text-white rounded-2xl px-5 py-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                      {selected.offerPrice > 0 ? "Offer Price" : selected.counterOffer ? "Offer Sent" : "Offer Price"}
                    </p>
                    <p className="text-4xl font-black font-mono tracking-tight">
                      {selected.offerPrice > 0
                        ? `£${selected.offerPrice}`
                        : selected.counterOffer
                        ? <span className="text-violet-400">£{selected.counterOffer}</span>
                        : <span className="text-amber-400 text-2xl">Pending review</span>}
                    </p>
                    {selected.offerPrice === 0 && selected.counterOffer && (
                      <p className="text-xs text-white/40 mt-1">Awaiting customer response</p>
                    )}
                    {selected.offerPrice > 0 && selected.counterOffer && (
                      <p className="text-xs text-white/40 mt-1">Counter offer: £{selected.counterOffer} (awaiting customer)</p>
                    )}
                    {selected.finalPrice && selected.finalPrice !== selected.offerPrice && (
                      <p className="text-xs text-white/40 mt-1">Final: £{selected.finalPrice}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 mt-1 ${cfg(selected.status).className}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg(selected.status).dotColor}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">{cfg(selected.status).label}</span>
                  </div>
                </div>
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  ["Fulfillment", selected.fulfillment === "ship" ? "Ship to us" : "Drop-off"],
                  ["Submitted",   fmtDate(selected.createdAt)],
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
                <div className="flex items-center justify-center py-3">
                  <div className="h-4 w-4 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                </div>
              )}

              {/* Admin notes (read-only display) */}
              {selected.adminNotes && (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Note to customer</p>
                  <p className="text-xs text-amber-800">{selected.adminNotes}</p>
                </div>
              )}

              {/* Actions */}
              {["SUBMITTED", "UNDER_REVIEW", "COUNTER_OFFERED"].includes(selected.status) && (
                <div className="space-y-2.5 pt-1">
                  {selected.offerPrice === 0 && !selected.counterOffer ? (
                    <>
                      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700 font-medium">
                        No price set yet. Set an offer price to send to the customer, or reject this trade-in.
                      </div>
                      <button onClick={() => openModal("counter", selected.id)} disabled={saving}
                        className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        <Minus className="h-4 w-4" /> Set Offer Price
                      </button>
                      <button onClick={() => openModal("reject", selected.id)} disabled={saving}
                        className="w-full h-11 rounded-2xl bg-reject text-reject-fg font-bold text-sm flex items-center justify-center gap-2 hover:bg-reject-hover active:scale-95 transition-all disabled:opacity-50">
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={() => openModal("approve", selected.id)} disabled={saving}
                          className="h-11 rounded-2xl bg-approve text-approve-fg font-bold text-sm flex items-center justify-center gap-2 hover:bg-approve-hover active:scale-95 transition-all disabled:opacity-50">
                          <Check className="h-4 w-4" /> Approve{selected.offerPrice === 0 && selected.counterOffer ? ` £${selected.counterOffer}` : ""}
                        </button>
                        <button onClick={() => openModal("reject", selected.id)} disabled={saving}
                          className="h-11 rounded-2xl bg-reject text-reject-fg font-bold text-sm flex items-center justify-center gap-2 hover:bg-reject-hover active:scale-95 transition-all disabled:opacity-50">
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                      <button onClick={() => openModal("counter", selected.id)} disabled={saving}
                        className="w-full h-11 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:border-zinc-900 hover:bg-zinc-900 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Minus className="h-4 w-4" /> {selected.counterOffer ? `Update offer (£${selected.counterOffer})` : "Counter offer"}
                      </button>
                    </>
                  )}
                </div>
              )}
              {selected.status === "APPROVED" && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 font-medium flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" /> Approved — waiting for device.
                </div>
              )}
              {selected.status === "REJECTED" && (
                <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-medium flex items-center gap-2">
                  <X className="h-4 w-4 shrink-0" /> Trade-in rejected.
                </div>
              )}

              {/* Full details link */}
              <Link href={`/trade-ins/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full h-9 rounded-xl border border-zinc-200 hover:border-black hover:bg-black hover:text-white text-xs font-bold transition-all mt-3">
                <ExternalLink className="h-3.5 w-3.5" /> View full details
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.25 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-lg font-bold mb-0.5">
                {modal.type === "approve" ? "Approve Trade-In" : modal.type === "reject" ? "Reject Trade-In" : (selected?.offerPrice === 0 && !selected?.counterOffer) ? "Set Offer Price" : "Counter Offer"}
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                {selected?.brand} {selected?.model} · {selected?.reference}
              </p>

              {modal.type === "counter" && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1.5">
                    {(selected?.offerPrice === 0 && !selected?.counterOffer) ? "Offer Price (£)" : "Counter Amount (£)"}
                  </label>
                  <input
                    type="number"
                    value={modalCounter}
                    onChange={e => setModalCounter(e.target.value)}
                    placeholder="e.g. 150"
                    autoFocus
                    className="w-full h-11 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                  />
                </div>
              )}

              <div className="mb-5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1.5">
                  Note to customer <span className="normal-case font-normal text-zinc-400">(optional)</span>
                </label>
                <textarea
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  rows={3}
                  autoFocus={modal.type !== "counter"}
                  placeholder={
                    modal.type === "approve" ? "Any collection instructions or next steps..." :
                    modal.type === "reject"  ? "Reason for rejection..." :
                    "Explain the revised offer..."
                  }
                  className="w-full rounded-2xl border-2 border-zinc-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              {actionError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600 font-medium mb-4">
                  {actionError}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={closeModal}
                  className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:border-zinc-400 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleModalConfirm}
                  disabled={saving || (modal.type === "counter" && !modalCounter)}
                  className={`flex-1 h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 ${
                    modal.type === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                    modal.type === "reject"  ? "bg-red-600 hover:bg-red-700 text-white" :
                    "bg-black hover:bg-zinc-800 text-white"
                  }`}
                >
                  {saving
                    ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : modal.type === "approve" ? <><Check className="h-4 w-4" /> Approve</>
                    : modal.type === "reject"  ? <><X className="h-4 w-4" /> Reject</>
                    : <><Minus className="h-4 w-4" /> Send Offer</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
