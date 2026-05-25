"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Trash2, Check, EyeOff, MessageSquare, Clock, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

interface Review {
  id: string;
  rating: number;
  body: string;
  guestName?: string;
  user?: { name: string };
  images: string[];
  isApproved: boolean;
  createdAt: string;
  product: { name: string; slug: string; category: string };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ts_admin_token") : null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

type ReviewFilter = "all" | "pending" | "approved";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const load = useCallback((f: ReviewFilter) => {
    setLoading(true);
    const q = f !== "all" ? `?filter=${f}` : "";
    apiFetch<Review[]>(`/admin/reviews${q}`)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      await apiFetch(`/admin/reviews/${id}/approve`, { method: "PATCH" });
      if (filter === "pending") {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
      }
    } catch {}
    setActionId(null);
  }

  async function handleHide(id: string) {
    setActionId(id);
    try {
      await apiFetch(`/admin/reviews/${id}/hide`, { method: "PATCH" });
      if (filter === "approved") {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: false } : r));
      }
    } catch {}
    setActionId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setActionId(id);
    try {
      await apiFetch(`/admin/reviews/${id}`, { method: "DELETE" });
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {}
    setActionId(null);
  }

  const pendingCount = filter === "all"
    ? reviews.filter(r => !r.isApproved).length
    : filter === "pending" ? reviews.length : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {reviews.length} total
            {pendingCount > 0 && (
              <> — <span className="text-amber-600 font-bold">{pendingCount} pending approval</span></>
            )}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "all"] as ReviewFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`h-9 px-4 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === f
                ? "bg-black text-white"
                : "bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <MessageSquare className="h-10 w-10 text-zinc-200" strokeWidth={1.5} />
            <p className="font-bold text-sm text-zinc-400">No {filter === "all" ? "" : filter} reviews</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {reviews.map(review => {
              const displayName = review.user?.name ?? review.guestName ?? "Anonymous";
              const initials = displayName.charAt(0).toUpperCase();
              const busy = actionId === review.id;
              const productUrl = `${process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"}/shop/${review.product.category.toLowerCase()}/${review.product.slug}`;

              return (
                <div key={review.id} className="flex items-start gap-4 px-6 py-5 hover:bg-zinc-50/50 transition-colors">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-sm text-zinc-600">
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + product */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-sm text-zinc-900">{displayName}</p>
                      <span className="text-xs text-zinc-400">on</span>
                      <a
                        href={productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:underline truncate max-w-60"
                      >
                        {review.product.name}
                      </a>
                    </div>

                    {/* Stars + date + badge */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {!review.isApproved ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Approved
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <p className="text-sm text-zinc-600 leading-relaxed">{review.body}</p>

                    {/* Images */}
                    {review.images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {review.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setExpandedImage(img)}
                            className="h-16 w-16 rounded-xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-all"
                          >
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    ) : (
                      <>
                        {!review.isApproved ? (
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHide(review.id)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100 text-xs font-bold transition-all"
                          >
                            <EyeOff className="h-3.5 w-3.5" /> Hide
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-xs font-bold transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setExpandedImage(null)}
        >
          <img src={expandedImage} alt="" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}
