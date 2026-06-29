"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Truck, Star, X, ImagePlus, CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ordersApi, reviewsApi, uploadsApi, type Order } from "@/lib/api";

type MarkingId = string | null;
import { statusCfg, fmtDate } from "../_utils";
import { GradeBadge } from "@/components/GradeBadge";

interface ReviewModal {
  productId: string;
  productName: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              n <= (hover || value) ? "fill-amber-400 text-amber-400" : "fill-none text-zinc-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [modal, setModal] = useState<ReviewModal | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [markingReceived, setMarkingReceived] = useState<MarkingId>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    ordersApi.myOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function handleMarkReceived(orderId: string) {
    setMarkingReceived(orderId);
    try {
      const updated = await ordersApi.markReceived(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch { /* ignore */ }
    finally { setMarkingReceived(null); }
  }

  function openModal(productId: string, productName: string) {
    setModal({ productId, productName });
    setRating(0);
    setBody("");
    setImageFile(null);
    setImagePreview(null);
    setSubmitted(false);
  }

  function closeModal() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setModal(null);
    setImagePreview(null);
    setImageFile(null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitReview() {
    if (!modal || rating === 0 || !body.trim()) return;
    setSubmitting(true);
    try {
      let images: string[] = [];
      if (imageFile) {
        const { filePath } = await uploadsApi.reviewImage(imageFile);
        images = [filePath];
      }
      await reviewsApi.create(modal.productId, {
        rating,
        body: body.trim(),
        images,
      });
      setReviewedIds(prev => new Set([...prev, modal.productId]));
      setSubmitted(true);
    } catch {
      // ignore — leave modal open on error
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-8">Your orders</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-base">No orders yet</p>
          <a href="/shop/phones" className="mt-4 inline-flex items-center gap-1.5 text-black font-bold underline underline-offset-4">
            Shop now
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = statusCfg(order.status);
            const StatusIcon = cfg.icon;
            const isDelivered = order.status.toLowerCase() === "delivered";
            return (
              <div key={order.id} className="rounded-[1.25rem] border border-zinc-100 p-5 sm:p-6 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">{fmtDate(order.createdAt)}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-zinc-600">
                        {item.product.name} —{" "}
                        <GradeBadge condition={item.product.condition ?? ""} />{" "}
                        × {item.quantity}
                      </p>
                      {isDelivered && (
                        reviewedIds.has(item.product.id) ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => openModal(item.product.id, item.product.name)}
                            className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-zinc-500 border border-zinc-200 rounded-full px-2.5 py-1 hover:border-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            <Star className="h-3 w-3" /> Review
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <span className="font-bold text-base">£{order.total.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    {order.trackingNumber && (
                      <a
                        href={`https://parcelsapp.com/en/tracking/${order.trackingNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-black border border-zinc-200 rounded-full px-3 py-1 hover:bg-zinc-50 hover:border-zinc-400 transition-colors"
                      >
                        <Truck className="h-3.5 w-3.5" /> Track parcel
                      </a>
                    )}
                    {order.status.toLowerCase() === "shipped" && (
                      <button
                        onClick={() => handleMarkReceived(order.id)}
                        disabled={markingReceived === order.id}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {markingReceived === order.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <PackageCheck className="h-3.5 w-3.5" />
                        }
                        Mark as received
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-500" />
            </button>

            {submitted ? (
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Review submitted!</h3>
                <p className="text-sm text-zinc-500 mb-6">Your review is pending approval and will appear on the product page once approved.</p>
                <button
                  onClick={closeModal}
                  className="h-11 px-8 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-dark transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">Leave a review</h3>
                <p className="text-sm text-zinc-500 mb-6 truncate">{modal.productName}</p>

                <div className="space-y-5">
                  {/* Star rating */}
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Rating</p>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>

                  {/* Review text */}
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Your review</p>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      rows={4}
                      placeholder="Share your experience with this product…"
                      className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 resize-none outline-none focus:border-accent transition-colors"
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Photo <span className="normal-case font-normal">(optional)</span></p>
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200">
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          onClick={removeImage}
                          className="absolute top-1 right-1 h-5 w-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1 hover:border-zinc-400 transition-colors"
                      >
                        <ImagePlus className="h-6 w-6 text-zinc-400" />
                        <span className="text-[10px] text-zinc-400 font-medium">Add photo</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <button
                  onClick={submitReview}
                  disabled={rating === 0 || !body.trim() || submitting}
                  className="mt-6 w-full h-12 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
