"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw,
  Truck, MapPin, ImageIcon, User, Mail, Phone, Home,
  MessageSquare, Tag, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { tradeInsApi, type TradeInDetail } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { fmtDate } from "../../_utils";
import { GradeBadge } from "@/components/GradeBadge";

const CONDITION_QUESTIONS: Record<string, { id: string; question: string }[]> = {
  Phone: [
    { id: "screen",     question: "How is the screen?" },
    { id: "back",       question: "How is the back of the phone?" },
    { id: "battery",    question: "Battery health?" },
    { id: "biometrics", question: "Is Face ID / Touch ID working?" },
    { id: "charging",   question: "Is the charging port working?" },
    { id: "reset",      question: "Is the phone factory reset?" },
  ],
  Tablet: [
    { id: "screen",   question: "How is the screen?" },
    { id: "body",     question: "How is the body / casing?" },
    { id: "battery",  question: "How's the battery life?" },
    { id: "charging", question: "Is the charging port working?" },
    { id: "reset",    question: "Is the tablet factory reset?" },
  ],
  Console: [
    { id: "power", question: "Does the console power on and work?" },
    { id: "disc",  question: "Is the disc drive working?" },
    { id: "body",  question: "Any visible body damage?" },
    { id: "reset", question: "Have you done a factory reset?" },
  ],
  Laptop: [
    { id: "power",   question: "Does it power on?" },
    { id: "screen",  question: "How is the screen?" },
    { id: "input",   question: "Are the keyboard and trackpad fully working?" },
    { id: "battery", question: "How's the battery?" },
    { id: "body",    question: "Any body damage?" },
    { id: "reset",   question: "Have you done a factory reset?" },
  ],
  Smartwatch: [
    { id: "power",    question: "Does the watch power on and function?" },
    { id: "screen",   question: "How is the screen glass?" },
    { id: "battery",  question: "Does battery hold a normal charge?" },
    { id: "charging", question: "Is the charger working and connecting?" },
    { id: "reset",    question: "Is Activation Lock / iCloud turned off?" },
  ],
  Audio: [
    { id: "sound",    question: "How is the sound quality?" },
    { id: "body",     question: "How is the cosmetic condition?" },
    { id: "battery",  question: "How is the battery health?" },
    { id: "charging", question: "Does the charging case work?" },
  ],
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  SUBMITTED:       { label: "Submitted",       color: "text-zinc-600",   bg: "bg-zinc-100",    icon: Clock,        desc: "We've received your trade-in and will review it shortly." },
  UNDER_REVIEW:    { label: "Under Review",    color: "text-amber-700",  bg: "bg-amber-50",    icon: RefreshCw,    desc: "Our team is evaluating your device." },
  COUNTER_OFFERED: { label: "New Offer",       color: "text-violet-700", bg: "bg-violet-50",   icon: RefreshCw,    desc: "We've reviewed your device and have a new offer for you." },
  APPROVED:        { label: "Approved",        color: "text-emerald-700",bg: "bg-emerald-50",  icon: CheckCircle,  desc: "Your trade-in has been approved. We'll be in touch to arrange collection." },
  REJECTED:        { label: "Not Accepted",    color: "text-red-700",    bg: "bg-red-50",      icon: XCircle,      desc: "Unfortunately we're unable to accept this trade-in at this time." },
  COMPLETED:       { label: "Completed",       color: "text-emerald-700",bg: "bg-emerald-50",  icon: CheckCircle,  desc: "Trade-in complete — payment has been processed." },
  CANCELLED:       { label: "Cancelled",       color: "text-zinc-500",   bg: "bg-zinc-100",    icon: XCircle,      desc: "This trade-in was cancelled." },
};

export default function TradeInDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [tradeIn, setTradeIn] = useState<TradeInDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    tradeInsApi.myById(id)
      .then(setTradeIn)
      .catch(() => router.replace("/account/trade-ins"))
      .finally(() => setLoading(false));
  }, [user, id]);

  async function refetch() {
    const fresh = await tradeInsApi.myById(id);
    setTradeIn(fresh);
  }

  async function acceptCounter() {
    if (!tradeIn) return;
    setActing(true); setError(null);
    try {
      await tradeInsApi.acceptCounter(tradeIn.id);
      await refetch();
    } catch (e: any) { setError(e?.message ?? "Failed to accept offer"); }
    finally { setActing(false); }
  }

  async function declineCounter() {
    if (!tradeIn) return;
    setActing(true); setError(null);
    try {
      await tradeInsApi.declineCounter(tradeIn.id);
      await refetch();
    } catch (e: any) { setError(e?.message ?? "Failed to decline offer"); }
    finally { setActing(false); }
  }

  if (loading) return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 p-8 shadow-sm flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  if (!tradeIn) return null;

  const cfg = STATUS_CFG[tradeIn.status] ?? STATUS_CFG.SUBMITTED;
  const StatusIcon = cfg.icon;
  const displayPrice = tradeIn.counterOffer ?? tradeIn.offerPrice;

  const specs = tradeIn.specs && typeof tradeIn.specs === "object"
    ? Object.entries(tradeIn.specs).filter(([, v]) => v)
    : [];

  return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-zinc-100">
        <button
          onClick={() => router.push("/account/trade-ins")}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Trade-Ins
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{tradeIn.brand} {tradeIn.model}</h2>
            <p className="text-xs text-zinc-400 font-medium mt-1">{tradeIn.reference} · {fmtDate(tradeIn.createdAt)}</p>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0 ${cfg.color} ${cfg.bg}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-6">

        {/* Counter offer banner */}
        {tradeIn.status === "COUNTER_OFFERED" && tradeIn.counterOffer && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-violet-50 border border-violet-200 p-5"
          >
            <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mb-1">New offer from us</p>
            <p className="text-3xl font-black text-violet-900 mb-1">£{tradeIn.counterOffer}</p>
            <p className="text-xs text-violet-600 mb-4">
              We reviewed your {tradeIn.brand} {tradeIn.model} and are offering £{tradeIn.counterOffer}
              {tradeIn.offerPrice !== tradeIn.counterOffer && ` instead of your requested £${tradeIn.offerPrice}`}.
            </p>
            {error && <p className="text-xs text-red-600 font-medium mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={acceptCounter}
                disabled={acting}
                className="h-11 rounded-2xl bg-violet-900 text-white font-bold text-sm hover:bg-violet-800 active:scale-95 transition-all disabled:opacity-50"
              >
                Accept £{tradeIn.counterOffer}
              </button>
              <button
                onClick={declineCounter}
                disabled={acting}
                className="h-11 rounded-2xl bg-white border-2 border-violet-200 text-violet-700 font-bold text-sm hover:border-violet-400 active:scale-95 transition-all disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}

        {/* Status message */}
        {tradeIn.status !== "COUNTER_OFFERED" && (
          <div className={`rounded-2xl ${cfg.bg} border px-4 py-3 flex items-start gap-3 ${
            tradeIn.status === "APPROVED" || tradeIn.status === "COMPLETED" ? "border-emerald-200" :
            tradeIn.status === "REJECTED" || tradeIn.status === "CANCELLED" ? "border-red-200" :
            "border-zinc-200"
          }`}>
            <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
            <p className={`text-sm font-medium ${cfg.color}`}>{cfg.desc}</p>
          </div>
        )}

        {/* Price summary */}
        <div className="rounded-2xl bg-zinc-950 text-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {tradeIn.status === "COUNTER_OFFERED" ? "Counter Offer" : "Offer Price"}
          </p>
          <p className="text-4xl font-black mb-0.5">£{displayPrice}</p>
          {tradeIn.counterOffer && tradeIn.counterOffer !== tradeIn.offerPrice && (
            <p className="text-xs text-zinc-500">Original request: £{tradeIn.offerPrice}</p>
          )}
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Category</p>
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-zinc-500" />
              <p className="font-bold text-sm">{tradeIn.category}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Condition</p>
            <GradeBadge condition={tradeIn.condition ?? ""} />
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Fulfilment</p>
            <div className="flex items-center gap-1.5">
              {tradeIn.fulfillment === "ship" ? <Truck className="h-3.5 w-3.5 text-zinc-500" /> : <MapPin className="h-3.5 w-3.5 text-zinc-500" />}
              <p className="font-bold text-sm">{tradeIn.fulfillment === "ship" ? "Ship to us" : "Drop-off at store"}</p>
            </div>
          </div>
        </div>

        {/* Admin notes (if any) */}
        {tradeIn.adminNotes && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Note from TechStop</p>
            <p className="text-sm text-amber-800">{tradeIn.adminNotes}</p>
          </div>
        )}

        {/* Tracking */}
        {tradeIn.trackingNumber && (
          <div className="rounded-2xl bg-zinc-950 text-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Your Prepaid Shipping Label</p>
            </div>
            <p className="text-xs text-zinc-400 mb-1">Royal Mail Tracking Number</p>
            <p className="font-mono font-bold text-lg text-white mb-3">{tradeIn.trackingNumber}</p>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Your prepaid label has been emailed to you. Print it, attach it to your securely packaged device, and drop it at any Post Office.
            </p>
            <a
              href={`https://www.royalmail.com/track-your-item#/tracking-results/${tradeIn.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-100 transition-colors"
            >
              <Truck className="h-3.5 w-3.5" /> Track your parcel
            </a>
          </div>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Device Specs</p>
            <div className="grid grid-cols-2 gap-2">
              {specs.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{k}</p>
                  <p className="text-sm font-semibold mt-0.5">{String(v)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostic answers */}
        {tradeIn.answers && Object.keys(tradeIn.answers).length > 0 && (() => {
          const questions = CONDITION_QUESTIONS[tradeIn.category] ?? [];
          const entries = Object.entries(tradeIn.answers);
          return (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                <MessageSquare className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                Condition Answers
              </p>
              <div className="space-y-2">
                {entries.map(([qid, answer]) => {
                  const q = questions.find(x => x.id === qid);
                  return (
                    <div key={qid} className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {q?.question ?? qid}
                      </p>
                      <p className="text-sm font-semibold mt-0.5">{answer}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Contact details */}
        {tradeIn.contact && Object.keys(tradeIn.contact).length > 0 && (() => {
          const c = tradeIn.contact as Record<string, string>;
          return (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Contact Details</p>
              <div className="rounded-2xl bg-zinc-50 border border-zinc-100 divide-y divide-zinc-100">
                {c.name && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Name</p>
                      <p className="text-sm font-semibold">{c.name}</p>
                    </div>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email</p>
                      <p className="text-sm font-semibold">{c.email}</p>
                    </div>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phone</p>
                      <p className="text-sm font-semibold">{c.phone}</p>
                    </div>
                  </div>
                )}
                {(c.address || c.postcode) && (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Home className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Address</p>
                      <p className="text-sm font-semibold">
                        {[c.address, c.postcode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Photos */}
        {tradeIn.images && tradeIn.images.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Photos ({tradeIn.images.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tradeIn.images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(url)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 hover:opacity-90 transition-opacity"
                >
                  <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="25vw" />
                </button>
              ))}
            </div>
          </div>
        )}

        {tradeIn.images?.length === 0 && (
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 py-8 flex flex-col items-center gap-2 text-zinc-400">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <p className="text-xs font-medium">No photos submitted</p>
          </div>
        )}

      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              src={lightbox}
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
