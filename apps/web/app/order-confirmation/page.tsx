"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Check, Truck, Package, ArrowRight, Star, ShieldCheck } from "lucide-react";
import Footer from "../../components/Footer";

function OrderConfirmationContent() {
  const params = useSearchParams();
  const orderId = params.get("id") ?? "TS-28471";
  const email = params.get("email") ?? "your email";
  const total = params.get("total") ?? "798.00";

  const items = [
    { name: "iPhone 14 Pro", grade: "Excellent", storage: "256 GB", price: "£579" },
    { name: "Sony WH-1000XM5", grade: "Pristine", storage: "—", price: "£219" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">

      <main className="flex-1">
        {/* Success hero */}
        <section className="bg-mood-emerald dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="mx-auto max-w-3xl px-4 py-16 md:py-24 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className="mx-auto h-24 w-24 bg-black rounded-[2rem] flex items-center justify-center mb-8"
            >
              <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-sans text-5xl md:text-7xl font-extrabold mb-4 leading-tight text-foreground tracking-tight"
            >
              Order confirmed!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-xl text-zinc-500 font-medium mb-6 animate-none"
            >
              Thank you for your purchase. A receipt has been sent to <strong className="text-foreground">{email}</strong>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-3 rounded-[1.5rem] bg-zinc-900 dark:bg-zinc-800 text-white px-8 py-4 border border-zinc-800"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Order ID</span>
              <span className="font-bold text-lg font-mono text-white">{orderId}</span>
            </motion.div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-14">

          {/* What happens next */}
          <div className="mb-12">
            <h2 className="font-bold text-xl mb-6">What happens next</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  icon: Package,
                  title: "We're packing it",
                  desc: "Your order is being packed and quality checked. This takes up to 24 hours.",
                  mood: "bg-mood-sky text-sky-950 dark:bg-sky-950/20 dark:text-sky-300 border border-transparent dark:border-sky-900/30",
                },
                {
                  step: "02",
                  icon: Truck,
                  title: "Dispatched",
                  desc: "You'll get a tracking email the moment your parcel leaves our warehouse.",
                  mood: "bg-mood-amber text-amber-950 dark:bg-amber-950/20 dark:text-amber-300 border border-transparent dark:border-amber-900/30",
                },
                {
                  step: "03",
                  icon: Check,
                  title: "Delivered",
                  desc: "Expect delivery in 1–2 working days via Royal Mail Tracked 24.",
                  mood: "bg-mood-emerald text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300 border border-transparent dark:border-emerald-900/30",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.4 }}
                  className={`${s.mood} rounded-[2rem] p-7`}
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/70 dark:bg-zinc-900/50 flex items-center justify-center mb-5">
                    <s.icon className="h-6 w-6 text-foreground" strokeWidth={1.5} />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">{s.step}</p>
                  <h3 className="font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-sm opacity-85 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div className="rounded-[2rem] border border-border overflow-hidden mb-12">
            <div className="px-7 py-5 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg">Order summary</h2>
              <span className="text-xs font-bold font-mono text-zinc-400">{orderId}</span>
            </div>
            <div className="divide-y divide-border">
              {items.map(item => (
                <div key={item.name} className="flex items-center gap-4 px-7 py-5">
                  <div className="h-14 w-14 rounded-[1rem] bg-muted border border-border flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.grade} · {item.storage}</p>
                  </div>
                  <p className="font-bold">{item.price}</p>
                </div>
              ))}
            </div>
            <div className="px-7 py-5 bg-muted flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-zinc-400 font-medium">Total paid</p>
                <p className="font-bold text-2xl tracking-tight">£{total}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-xs text-zinc-400 font-medium">Shipping</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Free</p>
              </div>
            </div>
          </div>

          {/* Trust signals */}
          <div className="grid md:grid-cols-2 gap-5 mb-12">
            {[
              { icon: ShieldCheck, title: "2-Year Warranty", desc: "Every device sold is covered by our comprehensive 2-year warranty. If something's wrong, we fix it." },
              { icon: ArrowRight, title: "30-Day Returns", desc: "Changed your mind? Return any device within 30 days for a full refund, no questions asked." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-[1.5rem] bg-muted border border-border">
                <div className="h-11 w-11 rounded-xl bg-background border border-border flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold mb-1">{title}</p>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Review prompt */}
          <div className="rounded-[2rem] bg-zinc-950 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border border-zinc-800">
            <div>
              <div className="flex mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
              </div>
              <h3 className="font-bold text-xl mb-1">Leave a review</h3>
              <p className="text-white/60 text-sm">Share your experience once your order arrives. It helps other buyers.</p>
            </div>
            <a
              href="/account"
              className="flex-shrink-0 flex items-center gap-2 h-14 px-8 bg-white hover:bg-zinc-150 text-zinc-950 rounded-[1.5rem] font-bold transition-colors"
            >
              View my orders <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/shop/phones"
              className="flex-1 flex items-center justify-center gap-2 h-16 bg-accent hover:bg-accent-dark text-white rounded-[1.5rem] font-bold text-base transition-colors"
            >
              Continue shopping <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="/trade-in"
              className="flex-1 flex items-center justify-center gap-2 h-16 border-2 border-border text-foreground rounded-[1.5rem] font-bold text-base hover:border-accent transition-colors"
            >
              Sell your old device
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground" />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
