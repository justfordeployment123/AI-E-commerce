"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Wrench,
  Truck, MapPin, ImageIcon, User, Mail, Phone, Home, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { repairsApi, type RepairDetail } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { fmtDate } from "../../_utils";

const STATUS_CFG: Record<string, {
  label: string; color: string; bg: string;
  icon: React.ElementType; desc: string;
}> = {
  SUBMITTED:   { label: "Submitted",      color: "text-zinc-600",    bg: "bg-zinc-50",     icon: Clock,        desc: "We've received your repair request and will review it shortly." },
  QUOTE_SENT:  { label: "Quote Ready",    color: "text-blue-700",    bg: "bg-blue-50",     icon: Wrench,       desc: "We've assessed your device and have a repair quote ready for you." },
  APPROVED:    { label: "Quote Approved", color: "text-emerald-700", bg: "bg-emerald-50",  icon: CheckCircle,  desc: "You've approved the quote. Our technician will begin work shortly." },
  IN_PROGRESS: { label: "In Repair",      color: "text-violet-700",  bg: "bg-violet-50",   icon: Wrench,       desc: "Your device is currently being repaired by our technician." },
  COMPLETED:   { label: "Completed",      color: "text-emerald-700", bg: "bg-emerald-50",  icon: CheckCircle,  desc: "Your repair is done and ready for collection or dispatch." },
  CANCELLED:   { label: "Cancelled",      color: "text-zinc-500",    bg: "bg-zinc-100",    icon: XCircle,      desc: "This repair request was cancelled." },
};

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [repair, setRepair] = useState<RepairDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    repairsApi.myById(id)
      .then(setRepair)
      .catch(() => router.replace("/account/repairs"))
      .finally(() => setLoading(false));
  }, [user, id]);

  async function refetch() {
    const fresh = await repairsApi.myById(id);
    setRepair(fresh);
  }

  async function acceptQuote() {
    if (!repair) return;
    setActing(true); setError(null);
    try {
      await repairsApi.acceptQuote(repair.id);
      await refetch();
    } catch (e: any) { setError(e?.message ?? "Failed to accept quote"); }
    finally { setActing(false); }
  }

  async function declineQuote() {
    if (!repair) return;
    setActing(true); setError(null);
    try {
      await repairsApi.declineQuote(repair.id);
      await refetch();
    } catch (e: any) { setError(e?.message ?? "Failed to decline quote"); }
    finally { setActing(false); }
  }

  if (loading) return (
    <div className="flex-1 bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  if (!repair) return null;

  const cfg = STATUS_CFG[repair.status] ?? STATUS_CFG.SUBMITTED;
  const StatusIcon = cfg.icon;

  return (
    <div className="flex-1 bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-zinc-100">
        <button
          onClick={() => router.push("/account/repairs")}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Repairs
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{repair.brand} {repair.model}</h2>
            <p className="text-xs text-zinc-400 font-medium mt-1">{repair.reference} · {fmtDate(repair.createdAt)}</p>
          </div>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0 ${cfg.color} ${cfg.bg}`}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 space-y-6">

        {/* Quote approval banner */}
        {repair.status === "QUOTE_SENT" && repair.quote != null && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-blue-50 border border-blue-200 p-5"
          >
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Repair quote from us</p>
            <p className="text-3xl font-black text-blue-900 mb-1">£{repair.quote}</p>
            <p className="text-xs text-blue-600 mb-4">
              We've assessed your {repair.brand} {repair.model} and can fix it for £{repair.quote}.
              No payment now — approve and we'll begin immediately.
            </p>
            {error && <p className="text-xs text-red-600 font-medium mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={acceptQuote}
                disabled={acting}
                className="h-11 rounded-2xl bg-blue-700 text-white font-bold text-sm hover:bg-blue-800 active:scale-95 transition-all disabled:opacity-50"
              >
                Accept £{repair.quote}
              </button>
              <button
                onClick={declineQuote}
                disabled={acting}
                className="h-11 rounded-2xl bg-white border-2 border-blue-200 text-blue-700 font-bold text-sm hover:border-blue-400 active:scale-95 transition-all disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}

        {/* Status message (non-quote states) */}
        {repair.status !== "QUOTE_SENT" && (
          <div className={`rounded-2xl ${cfg.bg} border px-4 py-3 flex items-start gap-3 ${
            repair.status === "APPROVED" || repair.status === "COMPLETED" ? "border-emerald-200" :
            repair.status === "CANCELLED" ? "border-zinc-200" :
            repair.status === "IN_PROGRESS" ? "border-violet-200" :
            "border-zinc-200"
          }`}>
            <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
            <p className={`text-sm font-medium ${cfg.color}`}>{cfg.desc}</p>
          </div>
        )}

        {/* Quote display (approved/completed/in-progress) */}
        {repair.quote != null && repair.status !== "QUOTE_SENT" && (
          <div className="rounded-2xl bg-zinc-950 text-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Repair Quote</p>
            <p className="text-4xl font-black">£{repair.quote}</p>
          </div>
        )}

        {/* Admin notes */}
        {repair.adminNotes && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Note from TechStop</p>
            <p className="text-sm text-amber-800">{repair.adminNotes}</p>
          </div>
        )}

        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Issue</p>
            <p className="font-bold text-sm">{repair.issue}</p>
            {repair.issueNotes && (
              <p className="text-xs text-zinc-500 mt-1">{repair.issueNotes}</p>
            )}
          </div>
          <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Fulfilment</p>
            <div className="flex items-center gap-1.5">
              {repair.fulfillment === "ship" ? <Truck className="h-3.5 w-3.5 text-zinc-500" /> : <MapPin className="h-3.5 w-3.5 text-zinc-500" />}
              <p className="font-bold text-sm">{repair.fulfillment === "ship" ? "Ship to us" : "Drop-off at store"}</p>
            </div>
          </div>
        </div>

        {/* Tracking */}
        {repair.trackingNumber && (
          <div className="rounded-2xl bg-zinc-950 text-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-zinc-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Your Prepaid Shipping Label</p>
            </div>
            <p className="text-xs text-zinc-400 mb-1">Royal Mail Tracking Number</p>
            <p className="font-mono font-bold text-lg text-white mb-3">{repair.trackingNumber}</p>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Your prepaid label has been emailed to you. Print it, attach it to your securely packaged device, and drop it at any Post Office.
            </p>
            <a
              href={`https://www.royalmail.com/track-your-item#/tracking-results/${repair.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-100 transition-colors"
            >
              <Truck className="h-3.5 w-3.5" /> Track your parcel
            </a>
          </div>
        )}

        {/* Contact details */}
        {repair.contact && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Contact Details</p>
            <div className="rounded-2xl bg-zinc-50 border border-zinc-100 divide-y divide-zinc-100">
              {repair.contact.name && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Name</p>
                    <p className="text-sm font-semibold">{repair.contact.name}</p>
                  </div>
                </div>
              )}
              {repair.contact.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Email</p>
                    <p className="text-sm font-semibold">{repair.contact.email}</p>
                  </div>
                </div>
              )}
              {repair.contact.phone && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phone</p>
                    <p className="text-sm font-semibold">{repair.contact.phone}</p>
                  </div>
                </div>
              )}
              {(repair.contact.address || repair.contact.postcode) && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Home className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Address</p>
                    <p className="text-sm font-semibold">
                      {[repair.contact.address, repair.contact.postcode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        {repair.images && repair.images.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Photos ({repair.images.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {repair.images.map((url, i) => (
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
        ) : (
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
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
