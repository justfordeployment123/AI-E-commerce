"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { tradeInsApi, type TradeIn } from "../../../lib/api";
import {
  ArrowLeft, Check, X, Minus, MapPin, Mail, Phone,
  Clock, Image as ImageIcon, Truck, Package,
} from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  SUBMITTED:      { label: "Submitted",      bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-400" },
  UNDER_REVIEW:   { label: "Under Review",   bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-400" },
  APPROVED:       { label: "Approved",       bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-400" },
  REJECTED:       { label: "Rejected",       bg: "bg-red-50",      text: "text-red-600",     dot: "bg-red-400" },
  COUNTER_OFFERED:{ label: "Counter Offered",bg: "bg-violet-50",   text: "text-violet-700",  dot: "bg-violet-400" },
  COMPLETED:      { label: "Completed",      bg: "bg-zinc-100",    text: "text-zinc-500",    dot: "bg-zinc-400" },
  CANCELLED:      { label: "Cancelled",      bg: "bg-red-50",      text: "text-red-500",     dot: "bg-red-400" },
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function TradeInDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<TradeIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [counterInput, setCounterInput] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    tradeInsApi.getById(id)
      .then(setItem)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function act(fn: () => Promise<unknown>) {
    setSaving(true);
    setActionError(null);
    try {
      await fn();
      const refreshed = await tradeInsApi.getById(id);
      setItem(refreshed);
      setShowCounter(false);
      setCounterInput("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally { setSaving(false); }
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
        <p className="font-bold text-zinc-500">Trade-in not found.</p>
        <Link href="/trade-ins" className="text-sm font-bold underline">Back to list</Link>
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
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" onClick={() => setLightbox(null)}>
            <X className="h-5 w-5 text-white" />
          </button>
          <img src={lightbox} alt="Device photo" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain" onClick={e => e.stopPropagation()} />
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
                <p className="text-sm font-medium">No photos uploaded for this trade-in.</p>
              </div>
            )}

            {/* Device details */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Device Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ["Category", item.category],
                  ["Brand", item.brand],
                  ["Model", item.model],
                  ["Condition", item.condition],
                  ["Fulfillment", item.fulfillment === "ship" ? "Ship via Royal Mail" : "Drop-off in store"],
                  ...(item.storeId ? [["Store ID", item.storeId]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{k}</span>
                    <span className="text-sm font-bold text-zinc-900">{v}</span>
                  </div>
                ))}
              </div>
              {item.specs && Object.keys(item.specs).length > 0 && (
                <div className="mt-5 pt-5 border-t border-zinc-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Specifications</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.specs).map(([k, v]) => (
                      <span key={k} className="bg-zinc-100 text-zinc-700 font-bold text-xs px-3 py-1 rounded-full">{k}: {v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostics */}
            {item.answers && Object.keys(item.answers).length > 0 && (
              <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Diagnostics Answers</h2>
                <div className="space-y-3">
                  {Object.entries(item.answers).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-50 last:border-0">
                      <span className="text-xs font-medium text-zinc-500 capitalize">{k.replace(/_/g, " ")}</span>
                      <span className="text-xs font-bold text-zinc-900 text-right max-w-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer notes */}
            {item.customerNotes && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-amber-600 mb-3">Customer Notes</h2>
                <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{item.customerNotes}</p>
              </div>
            )}
          </div>

          {/* ── Right column: Offer + Customer + Actions ── */}
          <div className="space-y-6">

            {/* Offer card */}
            <div className="bg-zinc-950 text-white rounded-3xl p-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                {item.offerPrice > 0 ? "Offer Price" : item.counterOffer ? "Offer Sent" : "Offer Price"}
              </p>
              {item.offerPrice > 0 ? (
                <p className="text-5xl font-black font-mono tracking-tighter">£{item.offerPrice}</p>
              ) : item.counterOffer ? (
                <>
                  <p className="text-5xl font-black font-mono tracking-tighter text-violet-400">£{item.counterOffer}</p>
                  <p className="text-xs text-white/50 mt-2">Sent to customer — awaiting response</p>
                </>
              ) : (
                <p className="text-2xl font-black text-amber-400 mt-1">Pending Manual Review</p>
              )}
              {item.offerPrice > 0 && item.counterOffer && (
                <p className="text-sm text-white/50 mt-2">Counter offer: £{item.counterOffer} (awaiting customer)</p>
              )}
              {item.offerPrice > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-white/40">
                  <Clock className="h-3 w-3" /> Price locked 14 days from submission
                </div>
              )}
            </div>

            {/* Customer info */}
            {(item.contact || item.user) && (() => {
              const name    = item.contact?.name  || item.user?.name  || "—";
              const email   = item.contact?.email || item.user?.email || "";
              const phone   = item.contact?.phone || "";
              const address = item.contact?.address || "";
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

              {actionError && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-3.5 text-xs text-red-600 font-medium mb-3">
                  {actionError}
                </div>
              )}

              {["SUBMITTED", "UNDER_REVIEW", "COUNTER_OFFERED"].includes(item.status) && (
                <div className="space-y-3">
                  {item.offerPrice === 0 && !item.counterOffer ? (
                    <>
                      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3.5 text-xs text-amber-700 font-medium">
                        No price has been set for this device yet. Set an offer price to send to the customer, or reject this trade-in outright.
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Offer price (£)"
                          value={counterInput}
                          onChange={e => setCounterInput(e.target.value)}
                          className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                        />
                        <button
                          onClick={() => act(() => tradeInsApi.counterOffer(item.id, Number(counterInput)))}
                          disabled={saving || !counterInput || Number(counterInput) <= 0}
                          className="h-12 px-5 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Send Offer
                        </button>
                      </div>
                      <button
                        onClick={() => act(() => tradeInsApi.reject(item.id))}
                        disabled={saving}
                        className="w-full h-12 rounded-2xl bg-reject text-reject-fg font-bold text-sm flex items-center justify-center gap-2 hover:bg-reject-hover active:scale-95 transition-all disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => act(() => tradeInsApi.approve(item.id))}
                          disabled={saving}
                          className="h-12 rounded-2xl bg-approve text-approve-fg font-bold text-sm flex items-center justify-center gap-2 hover:bg-approve-hover active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> Approve{item.offerPrice === 0 && item.counterOffer ? ` £${item.counterOffer}` : ""}
                        </button>
                        <button
                          onClick={() => act(() => tradeInsApi.reject(item.id))}
                          disabled={saving}
                          className="h-12 rounded-2xl bg-reject text-reject-fg font-bold text-sm flex items-center justify-center gap-2 hover:bg-reject-hover active:scale-95 transition-all disabled:opacity-50"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>
                      {!showCounter ? (
                        <button
                          onClick={() => setShowCounter(true)}
                          className="w-full h-12 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:border-zinc-900 hover:bg-zinc-900 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Minus className="h-4 w-4" /> {item.counterOffer ? "Update offer" : "Counter offer"}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Counter amount (£)"
                            value={counterInput}
                            onChange={e => setCounterInput(e.target.value)}
                            className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors"
                          />
                          <button
                            onClick={() => act(() => tradeInsApi.counterOffer(item.id, Number(counterInput)))}
                            disabled={saving || !counterInput || Number(counterInput) <= 0}
                            className="h-12 px-5 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {item.status === "APPROVED" && (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700 font-medium">
                    <Check className="h-4 w-4 inline mr-2" />
                    Offer approved — waiting for device.
                  </div>
                  <button
                    onClick={() => act(() => tradeInsApi.complete(item.id))}
                    disabled={saving}
                    className="w-full h-11 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" /> Mark as completed
                  </button>
                </div>
              )}

              {item.status === "REJECTED" && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                  <X className="h-4 w-4 inline mr-2" /> Trade-in rejected.
                </div>
              )}

              {item.status === "COMPLETED" && (
                <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 text-sm text-zinc-500 font-medium">
                  <Check className="h-4 w-4 inline mr-2" /> Trade-in completed.
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
