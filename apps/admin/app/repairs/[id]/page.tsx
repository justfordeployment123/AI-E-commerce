"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { repairsApi, type Repair } from "../../../lib/api";
import {
  ArrowLeft, Check, X, Wrench, Truck, MapPin, Mail, Phone,
  Clock, RefreshCw, Image as ImageIcon, Package,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SUBMITTED:   { label: "Submitted",    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  QUOTE_SENT:  { label: "Quote Sent",   bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
  APPROVED:    { label: "Approved",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  IN_PROGRESS: { label: "In Progress",  bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
  COMPLETED:   { label: "Completed",    bg: "bg-zinc-100",   text: "text-zinc-500",    dot: "bg-zinc-400" },
  CANCELLED:   { label: "Cancelled",    bg: "bg-red-50",     text: "text-red-500",     dot: "bg-red-400" },
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Repair | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    repairsApi.getById(id)
      .then(setItem)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function act(fn: () => Promise<unknown>) {
    setSaving(true);
    try {
      await fn();
      const refreshed = await repairsApi.getById(id);
      setItem(refreshed);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="font-bold text-zinc-500">Repair not found.</p>
        <Link href="/repairs" className="text-sm font-bold underline">Back to list</Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.SUBMITTED;

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={lightbox}
            alt="Device photo"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">{item.brand} {item.model}</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Ref: {item.reference} · Submitted {fmtDate(item.createdAt)}</p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${cfg.bg}`}>
            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left column: Images + Details ── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Images */}
            {item.images && item.images.length > 0 ? (
              <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Device Photos ({item.images.length})</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {item.images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(url)}
                      className="aspect-square rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-400 hover:shadow-md transition-all group"
                    >
                      <img
                        src={url}
                        alt={`Device photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 font-medium mt-3">Click any photo to enlarge · Photos expire after 7 days</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 flex items-center gap-3 text-zinc-400">
                <ImageIcon className="h-5 w-5 opacity-40" />
                <p className="text-sm font-medium">No photos uploaded for this repair.</p>
              </div>
            )}

            {/* Device details */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Device Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ["Device Type", item.deviceType],
                  ["Brand", item.brand],
                  ["Model", item.model],
                  ["Issue", item.issue],
                  ["Fulfillment", item.fulfillment === "ship" ? "Mail-in (Royal Mail)" : "Drop-off in store"],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{k}</span>
                    <span className="text-sm font-bold text-zinc-900">{v}</span>
                  </div>
                ))}
              </div>
              {item.issueNotes && (
                <div className="mt-5 pt-5 border-t border-zinc-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Customer Notes</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{item.issueNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Quote + Customer + Actions ── */}
          <div className="space-y-6">

            {/* Quote card */}
            <div className="bg-zinc-950 text-white rounded-3xl p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Repair Quote</p>
              {item.quote ? (
                <p className="text-5xl font-black font-mono tracking-tighter">£{item.quote}</p>
              ) : (
                <p className="text-2xl font-bold text-white/30">No quote yet</p>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-white/40">
                <Clock className="h-3 w-3" /> Quote valid for 7 days once sent
              </div>
            </div>

            {/* Customer info */}
            {(item.contact || item.user) && (() => {
              const name     = item.contact?.name  || item.user?.name  || "—";
              const email    = item.contact?.email || item.user?.email || "";
              const phone    = item.contact?.phone || "";
              const address  = item.contact?.address || "";
              const postcode = item.contact?.postcode || "";
              return (
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Customer</h2>
                  <p className="font-bold text-base mb-3">{name}</p>
                  <div className="space-y-2 text-sm text-zinc-500">
                    {email && <div className="flex items-center gap-2.5"><Mail className="h-4 w-4 text-zinc-300 shrink-0" />{email}</div>}
                    {phone && <div className="flex items-center gap-2.5"><Phone className="h-4 w-4 text-zinc-300 shrink-0" />{phone}</div>}
                    {address && (
                      <div className="flex items-start gap-2.5 mt-1">
                        <MapPin className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                        <span>{address}{postcode ? `, ${postcode}` : ""}</span>
                      </div>
                    )}
                    {!email && !phone && <p className="text-zinc-400 text-xs italic">No contact details on file</p>}
                    <div className="flex items-center gap-2.5 pt-1">
                      {item.fulfillment === "ship" ? (
                        <><Truck className="h-4 w-4 text-zinc-300 shrink-0" /><span>Mail-in repair</span></>
                      ) : (
                        <><MapPin className="h-4 w-4 text-zinc-300 shrink-0" /><span>Drop-off in store</span></>
                      )}
                    </div>
                  </div>
                  {item.user && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 text-[10px] text-zinc-400 font-medium">
                      Linked account: {item.user.email}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Admin actions */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Actions</h2>

              {item.status === "SUBMITTED" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Quote amount (£)"
                      value={quoteInput}
                      onChange={e => setQuoteInput(e.target.value)}
                      className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                    />
                    <button
                      onClick={() => act(() => repairsApi.setQuote(item.id, Number(quoteInput)))}
                      disabled={saving || !quoteInput}
                      className="h-11 px-4 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60"
                    >
                      Send
                    </button>
                  </div>
                  <button
                    onClick={() => act(() => repairsApi.cancel(item.id))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Cancel repair
                  </button>
                </div>
              )}

              {item.status === "QUOTE_SENT" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 font-medium">
                    Quote of £{item.quote} sent — awaiting customer approval.
                  </div>
                  <button
                    onClick={() => act(() => repairsApi.cancel(item.id))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Cancel repair
                  </button>
                </div>
              )}

              {item.status === "APPROVED" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 font-medium">
                    <Check className="h-4 w-4 inline mr-2" />
                    Quote approved — ready to begin.
                  </div>
                  <button
                    onClick={() => act(() => repairsApi.start(item.id))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Wrench className="h-4 w-4" /> Start repair
                  </button>
                  <button
                    onClick={() => act(() => repairsApi.cancel(item.id))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" /> Cancel repair
                  </button>
                </div>
              )}

              {item.status === "IN_PROGRESS" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4 text-sm text-violet-700 font-medium">
                    <Wrench className="h-4 w-4 inline mr-2" />
                    Repair in progress.
                  </div>
                  <textarea
                    placeholder="Completion notes (optional)"
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    rows={2}
                    className="w-full rounded-2xl border-2 border-zinc-200 px-4 py-3 text-sm outline-none focus:border-black transition-colors resize-none"
                  />
                  <button
                    onClick={() => act(() => repairsApi.complete(item.id, notesInput || undefined))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Mark as completed
                  </button>
                </div>
              )}

              {item.status === "COMPLETED" && (
                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-500 font-medium">
                  <Check className="h-4 w-4 inline mr-2" /> Repair completed.
                </div>
              )}

              {item.status === "CANCELLED" && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                  <X className="h-4 w-4 inline mr-2" /> Repair was cancelled.
                </div>
              )}
            </div>

            {/* Tracking */}
            {item.trackingNumber && (
              <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Shipment Tracking</h2>
                </div>
                <p className="text-xs text-zinc-400 font-medium mb-1">Royal Mail Tracking Number</p>
                <p className="font-mono font-bold text-base text-zinc-900 mb-3">{item.trackingNumber}</p>
                <a
                  href={`https://www.royalmail.com/track-your-item#/tracking-results/${item.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
                >
                  <Truck className="h-3.5 w-3.5" /> Track on Royal Mail
                </a>
              </div>
            )}

            {/* Admin notes */}
            {item.adminNotes && (
              <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-3">Admin Notes</h2>
                <p className="text-sm text-zinc-600 leading-relaxed">{item.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
