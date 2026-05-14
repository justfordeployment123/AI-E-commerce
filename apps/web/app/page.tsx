"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ShieldCheck, RefreshCw, Leaf, ArrowRight,
  Star, Search, Play, Recycle, TrendingUp, Package, BadgeCheck,
  Zap, Check
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ─── Marquee Strip ────────────────────────────────────────────────────────────
function MarqueeStrip() {
  const items = [
    "12-Month Warranty", "Free 30-Day Returns", "Expert Certified",
    "Carbon Neutral Shipping", "25-Point Inspection", "Price Match Promise",
    "47,000+ Devices In Stock", "Same-Day Dispatch Before 2pm",
    "12-Month Warranty", "Free 30-Day Returns", "Expert Certified",
    "Carbon Neutral Shipping", "25-Point Inspection", "Price Match Promise",
    "47,000+ Devices In Stock", "Same-Day Dispatch Before 2pm",
  ];
  return (
    <div className="bg-zinc-950 overflow-hidden py-3.5">
      <div className="flex gap-0 animate-marquee whitespace-nowrap w-max">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-8 px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
            {item}
            <span className="h-1 w-1 rounded-full bg-accent flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Brands Bar ───────────────────────────────────────────────────────────────
function BrandsBar() {
  const brands = ["Apple", "Samsung", "Sony", "Google", "Microsoft", "OnePlus", "Nintendo", "Dyson"];
  return (
    <section className="border-y border-zinc-100 py-5 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 md:gap-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex-shrink-0 hidden sm:block">
            Top brands
          </p>
          <div className="h-4 w-px bg-zinc-200 flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-10 md:gap-14 overflow-x-auto scrollbar-hide w-full">
            {brands.map((b) => (
              <span key={b} className="text-sm md:text-base font-bold text-zinc-200 hover:text-zinc-800 transition-colors duration-200 flex-shrink-0 cursor-pointer select-none tracking-tight">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const grades = ["Pristine", "Excellent", "Good"];
  const [gradeIdx, setGradeIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setGradeIdx(i => (i + 1) % grades.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 min-h-[92vh] items-center gap-8 py-16 lg:py-0">

          {/* Left */}
          <div className="relative z-10 lg:pr-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 mb-8"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">2.4M devices saved from landfill</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-serif text-[clamp(3rem,7vw,5.5rem)] font-medium leading-[0.92] tracking-tight text-zinc-950 mb-8"
            >
              Tech worth<br />
              having.<br />
              <span className="relative inline-block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={gradeIdx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                    className="italic text-zinc-400"
                  >
                    {grades[gradeIdx]}.
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg text-zinc-500 max-w-[42ch] mb-10 leading-relaxed font-medium"
            >
              Every device on TechStop is certified by expert refurbishers — rigorously tested, graded honestly, and priced fairly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 mb-14"
            >
              <a
                href="/shop"
                className="h-14 px-8 bg-zinc-950 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.03] active:scale-[0.97]"
              >
                Shop all devices <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/how-it-works"
                className="h-14 px-8 border border-zinc-200 text-zinc-950 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
              >
                <Play className="h-4 w-4" /> How it works
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-6 border-t border-zinc-100 pt-10"
            >
              {[
                { val: "47K+", label: "Devices in stock" },
                { val: "4.8", label: "Trustpilot score" },
                { val: "£30M+", label: "Saved by buyers" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold tracking-tight text-zinc-950">{s.val}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — product showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            {/* BG blob */}
            <div className="absolute inset-0 bg-accent/30 rounded-[4rem] rotate-3 scale-90" />
            <div className="absolute inset-0 bg-zinc-50 rounded-[4rem] -rotate-1" />

            <div className="relative z-10 p-10 w-full">
              <img
                src="/hero-phone.png"
                alt="Certified refurbished iPhone"
                className="w-full max-w-[360px] mx-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
              />
            </div>

            {/* Floating cards */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 -left-6 bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Grade</p>
                <p className="text-sm font-bold text-zinc-950">Excellent</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-20 -right-4 bg-zinc-950 rounded-2xl px-4 py-3 shadow-xl"
            >
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Saved vs new</p>
              <p className="text-lg font-bold text-white">- £340</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-10 left-4 bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="flex -space-x-1">
                {["34", "56", "78"].map(seed => (
                  <img
                    key={seed}
                    src={`https://picsum.photos/seed/av${seed}/32/32`}
                    className="h-7 w-7 rounded-full ring-2 ring-white object-cover"
                    alt=""
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-zinc-950">1,240 bought this week</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Category Bento ───────────────────────────────────────────────────────────
function CategoryBento() {
  const cats = [
    { name: "Smartphones", sub: "From £149", img: "https://picsum.photos/seed/phones2/800/600", span: "lg:col-span-2 lg:row-span-2" },
    { name: "Laptops", sub: "From £249", img: "https://picsum.photos/seed/laptop9/800/600", span: "" },
    { name: "Audio", sub: "From £39", img: "https://picsum.photos/seed/audio3/800/600", span: "" },
    { name: "Gaming", sub: "From £89", img: "https://picsum.photos/seed/gaming7/800/600", span: "" },
    { name: "Tablets", sub: "From £129", img: "https://picsum.photos/seed/tablet4/800/600", span: "" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Browse</p>
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
            Pick your category
          </h2>
        </div>
        <a href="/shop" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
          All categories <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4 h-auto lg:h-[540px]">
        {cats.map((cat, i) => (
          <motion.a
            href="/shop"
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`group relative overflow-hidden rounded-3xl bg-zinc-100 cursor-pointer ${i === 0 ? "col-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
          >
            <img
              src={cat.img}
              alt={cat.name}
              className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/10 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 lg:p-7">
              <p className="font-serif text-white text-2xl font-medium leading-tight">{cat.name}</p>
              <p className="text-xs font-bold text-white/60 mt-1 uppercase tracking-widest">{cat.sub}</p>
            </div>
            <div className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

// ─── Trust Pillars ────────────────────────────────────────────────────────────
function TrustPillars() {
  const pillars = [
    { icon: ShieldCheck, title: "12-month warranty", body: "All devices come with a full year of coverage, no questions asked.", color: "bg-emerald-50 text-emerald-600" },
    { icon: RefreshCw, title: "30-day free returns", body: "Changed your mind? Ship it back within 30 days, completely free.", color: "bg-sky-50 text-sky-600" },
    { icon: BadgeCheck, title: "25-point inspection", body: "Certified experts test every single device before it ships to you.", color: "bg-violet-50 text-violet-600" },
    { icon: Leaf, title: "CO2 tracker built in", body: "See exactly how much carbon you saved by choosing refurbished.", color: "bg-lime-50 text-lime-700" },
  ];

  return (
    <section className="bg-zinc-950 py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Our promise</p>
          <h2 className="font-serif text-5xl font-medium text-white leading-tight">
            Built on trust,<br /><i>backed by proof.</i>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800">
          {pillars.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-950 p-8 lg:p-10 group hover:bg-zinc-900 transition-colors"
            >
              <div className={`h-12 w-12 rounded-2xl ${p.color} flex items-center justify-center mb-8`}>
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-white text-lg mb-3 leading-tight">{p.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trending Deals ───────────────────────────────────────────────────────────
function TrendingDeals() {
  const deals = [
    { name: "iPhone 14 Pro", spec: "256GB · Space Black", price: "£679", was: "£1,099", grade: "Excellent", img: "https://picsum.photos/seed/iph14/400/400" },
    { name: "MacBook Air M2", spec: "8GB · 256GB SSD", price: "£849", was: "£1,299", grade: "Pristine", img: "https://picsum.photos/seed/mbm2/400/400" },
    { name: "Sony WH-1000XM5", spec: "Noise Cancelling", price: "£199", was: "£380", grade: "Good", img: "https://picsum.photos/seed/sony5/400/400" },
    { name: "iPad Pro 12.9\"", spec: "M2 · 128GB · WiFi", price: "£699", was: "£1,099", grade: "Excellent", img: "https://picsum.photos/seed/ipadpro/400/400" },
  ];

  const gradeColor: Record<string, string> = {
    Pristine: "bg-emerald-50 text-emerald-700",
    Excellent: "bg-sky-50 text-sky-700",
    Good: "bg-amber-50 text-amber-700",
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Hot right now</p>
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">Trending deals</h2>
        </div>
        <a href="/shop" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {deals.map((deal, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-zinc-50 mb-5">
              <img
                src={deal.img}
                alt={deal.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${gradeColor[deal.grade]}`}>
                {deal.grade}
              </div>
              <button className="absolute bottom-4 right-4 h-11 w-11 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
            <p className="font-bold text-zinc-950 mb-1">{deal.name}</p>
            <p className="text-xs text-zinc-400 font-medium mb-3">{deal.spec}</p>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold text-zinc-950">{deal.price}</span>
              <span className="text-sm text-zinc-400 line-through">{deal.was}</span>
              <span className="text-xs font-bold text-emerald-600">
                -{Math.round((1 - parseInt(deal.price.replace(/[^0-9]/g,"")) / parseInt(deal.was.replace(/[^0-9]/g,""))) * 100)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: "01", icon: Search, title: "Find your device", body: "Browse 47,000+ certified refurbished phones, laptops, tablets and more." },
    { num: "02", icon: Package, title: "We ship fast", body: "Orders placed before 2pm dispatch same day. Free tracked delivery on all orders." },
    { num: "03", icon: BadgeCheck, title: "Enjoy with confidence", body: "Every device includes a 12-month warranty and 30-day hassle-free returns." },
  ];

  return (
    <section className="bg-zinc-50 py-24 border-y border-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">The process</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-tight mb-6">
              Simple as it<br /><i>should be.</i>
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-[45ch]">
              We handle all the hard work so you don't have to. From quality checks to doorstep delivery — it's effortless.
            </p>
          </div>

          <div className="flex flex-col gap-0 divide-y divide-zinc-200">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex items-start gap-6 py-8 group"
              >
                <span className="text-[11px] font-bold text-zinc-300 tracking-widest pt-1 w-8 flex-shrink-0">{step.num}</span>
                <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:border-accent transition-colors">
                  <step.icon className="h-5 w-5 text-zinc-600 group-hover:text-zinc-950 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-950 mb-1">{step.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
function Reviews() {
  const reviews = [
    { name: "Priya Mehta", loc: "London", rating: 5, text: "Absolutely flawless iPhone 13. Arrived next day, pristine condition. Saved £380 vs new. Will never buy new again.", product: "iPhone 13 Pro · Pristine", img: "https://picsum.photos/seed/rev11/64/64" },
    { name: "Marcus Osei", loc: "Birmingham", rating: 5, text: "The MacBook Air M1 I received was genuinely indistinguishable from new. Battery at 97% health. Incredible value.", product: "MacBook Air M1 · Excellent", img: "https://picsum.photos/seed/rev22/64/64" },
    { name: "Sophie Keller", loc: "Manchester", rating: 5, text: "Returned my first order no hassle — the replacement came in two days. Customer service actually picks up the phone.", product: "Samsung S23 · Good", img: "https://picsum.photos/seed/rev33/64/64" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex items-end justify-between mb-14">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Social proof</p>
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
            Real buyers,<br />real reviews.
          </h2>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <div className="flex gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-accent text-accent" />)}
          </div>
          <p className="text-sm font-bold text-zinc-950">4.8 / 5</p>
          <p className="text-[11px] text-zinc-400 font-medium">12,400 Trustpilot reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 flex flex-col gap-5"
          >
            <div className="flex gap-0.5">
              {[...Array(r.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-accent text-accent" />)}
            </div>
            <p className="text-zinc-700 leading-relaxed text-[15px]">"{r.text}"</p>
            <div className="pt-2 border-t border-zinc-200 flex items-center gap-3 mt-auto">
              <img src={r.img} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-zinc-950">{r.name} · {r.loc}</p>
                <p className="text-[11px] text-zinc-400 font-medium">{r.product}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Sustainability Impact ────────────────────────────────────────────────────
function SustainabilityBanner() {
  const stats = [
    { val: "2.4M", label: "Devices diverted from landfill", icon: Recycle },
    { val: "89K", label: "Tonnes of CO2 saved", icon: Leaf },
    { val: "£47M", label: "Saved collectively by buyers", icon: TrendingUp },
  ];

  return (
    <section className="relative overflow-hidden bg-accent py-24">
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-700 mb-4">Our impact</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-tight mb-6">
              Good for your wallet.<br /><i>Great for the planet.</i>
            </h2>
            <p className="text-zinc-700 text-lg leading-relaxed max-w-[44ch] mb-8">
              Every refurbished device sold is one less product in a landfill. Together, our customers have made a measurable difference.
            </p>
            <a href="/sustainability" className="inline-flex items-center gap-2 h-12 px-6 bg-zinc-950 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors">
              See our full impact report <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-col gap-px bg-zinc-950/10 rounded-3xl overflow-hidden">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-accent/40 backdrop-blur-sm px-8 py-7 flex items-center gap-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-zinc-950/10 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-6 w-6 text-zinc-950" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-zinc-950 tracking-tight">{s.val}</p>
                  <p className="text-sm font-medium text-zinc-700">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── App Preview ──────────────────────────────────────────────────────────────
function AppPreview() {
  const features = [
    { Icon: ShieldCheck, title: "Grade-verified listings",  desc: "Every listing shows battery health, cosmetic grade, and a full inspection certificate." },
    { Icon: RefreshCw,   title: "One-tap returns",          desc: "Initiate a return in seconds from your order page — no calls, no forms, no friction." },
    { Icon: Leaf,        title: "Your CO₂ dashboard",       desc: "Track exactly how much carbon and waste you've avoided with every purchase." },
    { Icon: BadgeCheck,  title: "Instant price alerts",     desc: "Set a target price on any device and get notified the moment it drops." },
  ];

  return (
    <section className="bg-white py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* ── Left: phone mockup ── */}
          <div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
            <div className="absolute inset-0 bg-accent/15 blur-3xl rounded-full scale-75 pointer-events-none" />

            <div className="relative">
              {/* Frame */}
              <div className="relative w-[272px] rounded-[3rem] bg-zinc-950 p-2.5 shadow-2xl ring-1 ring-white/10">
                {/* Screen */}
                <div className="rounded-[2.5rem] overflow-hidden bg-white" style={{ aspectRatio: "9/19.5" }}>
                  <div className="flex flex-col h-full bg-white text-zinc-950 text-[11px]">

                    {/* App header */}
                    <div className="flex items-center justify-between px-5 pt-10 pb-3 border-b border-zinc-100">
                      <span className="font-bold tracking-tighter text-xs">TECHSTOP</span>
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-4 w-4" />
                        <div className="h-7 w-7 rounded-full bg-zinc-100" />
                      </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="h-8 rounded-xl bg-zinc-100 flex items-center gap-2 px-3">
                        <Search className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] text-zinc-400 font-medium">Search 47,000+ devices…</span>
                      </div>
                    </div>

                    {/* Flash deal */}
                    <div className="mx-4 mb-3 rounded-2xl bg-accent p-3">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Flash Deal · 2h left</p>
                      <p className="text-[11px] font-bold">iPhone 15 Pro</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-sm font-bold">£679</span>
                        <span className="text-[9px] text-zinc-600 line-through">£1,199</span>
                      </div>
                    </div>

                    {/* Product list */}
                    <div className="flex-1 px-4 space-y-2 overflow-hidden">
                      {[
                        { name: "MacBook Air M2", price: "£849", grade: "Pristine", seed: "mbp2" },
                        { name: "AirPods Pro 2",  price: "£149", grade: "Good",     seed: "app2" },
                        { name: "iPad Air 5",     price: "£399", grade: "Excellent", seed: "iap5" },
                      ].map((p, j) => (
                        <div key={j} className="flex items-center gap-3 bg-zinc-50 rounded-xl p-2">
                          <img
                            src={`https://picsum.photos/seed/${p.seed}/48/48`}
                            alt={p.name}
                            className="h-9 w-9 rounded-lg object-cover bg-zinc-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{p.name}</p>
                            <p className="text-[9px] text-zinc-400 font-medium">{p.grade}</p>
                          </div>
                          <p className="font-bold flex-shrink-0">{p.price}</p>
                        </div>
                      ))}
                    </div>

                    {/* Bottom nav */}
                    <div className="flex items-center justify-around px-6 py-3 border-t border-zinc-100 mt-2">
                      {[Search, ShoppingCart, Star, RefreshCw].map((Icon, j) => (
                        <div key={j} className={`flex flex-col items-center gap-0.5 ${j === 0 ? "text-zinc-950" : "text-zinc-300"}`}>
                          <Icon className="h-5 w-5" />
                          {j === 0 && <span className="h-1 w-1 rounded-full bg-zinc-950" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating: shipped notification */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 top-16 bg-white rounded-2xl p-3.5 shadow-2xl border border-zinc-100 z-20 w-[168px]"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <BadgeCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Shipped</p>
                    <p className="text-xs font-bold text-zinc-950">iPhone 14 Pro</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[9px] text-zinc-400 mt-1.5 font-medium">Est. delivery: Tomorrow</p>
              </motion.div>

              {/* Floating: CO₂ saved */}
              <motion.div
                animate={{ y: [0, 9, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute -left-8 bottom-28 bg-zinc-950 rounded-2xl px-4 py-3 shadow-2xl z-20"
              >
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">You saved</p>
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-400" />
                  <p className="text-sm font-bold text-white">3.2 kg CO₂</p>
                </div>
              </motion.div>

              {/* Floating: rating */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -right-4 bottom-20 bg-accent rounded-2xl px-3.5 py-2.5 shadow-xl z-20"
              >
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-zinc-950 text-zinc-950" />)}
                </div>
                <p className="text-[9px] font-bold text-zinc-800">Verified purchase</p>
              </motion.div>
            </div>
          </div>

          {/* ── Right: feature list ── */}
          <div className="order-1 lg:order-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">The TechStop experience</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-tight tracking-tight mb-6">
              Better in every<br /><i>single way.</i>
            </h2>
            <p className="text-lg text-zinc-500 leading-relaxed mb-12 max-w-[44ch]">
              We rethought what buying refurbished should feel like — transparent, fast, and genuinely enjoyable from first click to delivery.
            </p>

            <div className="space-y-8">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="h-11 w-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:border-accent transition-all duration-300">
                    <f.Icon className="h-5 w-5 text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-950 mb-1">{f.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-5">
              <a href="/shop" className="h-12 px-7 bg-zinc-950 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                Start shopping <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/how-it-works" className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1.5">
                How it works <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Shop By Budget ───────────────────────────────────────────────────────────
function ShopByBudget() {
  const ranges = [
    { label: "Under £100",  sub: "Audio, accessories & basics",    count: "3,240+ deals", img: "https://picsum.photos/seed/bgt1/600/800" },
    { label: "£100–£300",  sub: "Tablets, gaming & wearables",     count: "7,810+ deals", img: "https://picsum.photos/seed/bgt2/600/800" },
    { label: "£300–£600",  sub: "Flagship phones & cameras",       count: "9,120+ deals", img: "https://picsum.photos/seed/bgt3/600/800" },
    { label: "£600+",      sub: "Pro laptops, no compromise",      count: "4,580+ deals", img: "https://picsum.photos/seed/bgt4/600/800" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Budget friendly</p>
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
            Shop by <i>price.</i>
          </h2>
        </div>
        <a href="/shop" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
          All deals <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ranges.map((r, i) => (
          <motion.a
            key={i}
            href="/shop"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-3xl cursor-pointer"
            style={{ aspectRatio: "3/4" }}
          >
            <img src={r.img} alt={r.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              <div className="self-end px-3 py-1 bg-white/10 border border-white/20 rounded-full backdrop-blur-sm">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{r.count}</span>
              </div>
              <div>
                <p className="font-serif text-white text-2xl md:text-3xl font-medium leading-tight mb-1">{r.label}</p>
                <p className="text-xs font-medium text-white/60 mb-3">{r.sub}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/70 group-hover:text-accent transition-colors">
                  Browse <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}

// ─── Flash Deals ──────────────────────────────────────────────────────────────
function FlashDeals() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 42, s: 17 });

  useEffect(() => {
    setMounted(true);
    const end = Date.now() + 5 * 3_600_000 + 42 * 60_000 + 17_000;
    const t = setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  const deals = [
    { name: "Samsung Galaxy S23",   spec: "256GB · Phantom Black",    price: "£429", was: "£849", stock: 7,  grade: "Excellent", img: "https://picsum.photos/seed/s23fd/400/400" },
    { name: "iPad Air 5th Gen",     spec: "64GB · Space Grey · WiFi", price: "£349", was: "£659", stock: 12, grade: "Pristine",  img: "https://picsum.photos/seed/ipadfd/400/400" },
    { name: "PS5 Digital Edition",  spec: "825GB · White",            price: "£299", was: "£449", stock: 4,  grade: "Good",      img: "https://picsum.photos/seed/ps5fd/400/400" },
  ];

  const gradeColor: Record<string, string> = {
    Pristine:  "bg-emerald-100 text-emerald-700",
    Excellent: "bg-sky-100 text-sky-700",
    Good:      "bg-amber-100 text-amber-700",
  };

  return (
    <section className="bg-zinc-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-zinc-950" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">Limited time</p>
              <h2 className="font-serif text-3xl font-medium text-white">Flash Deals</h2>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mr-1">Ends in</p>
            {[
              mounted ? timeLeft.h : 5,
              mounted ? timeLeft.m : 42,
              mounted ? timeLeft.s : 17,
            ].map((val, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-12 w-14 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center font-mono text-xl font-bold text-white tabular-nums">
                  {pad(val)}
                </span>
                {i < 2 && <span className="text-zinc-600 font-bold text-lg">:</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Deal cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deals.map((deal, i) => {
            const pct = Math.round((1 - parseInt(deal.price.replace(/[^0-9]/g, "")) / parseInt(deal.was.replace(/[^0-9]/g, ""))) * 100);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-zinc-900 border border-zinc-800 rounded-3xl p-5 cursor-pointer hover:border-zinc-600 transition-colors"
              >
                <div className="flex gap-4 mb-5">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
                    <img src={deal.img} alt={deal.name} className="h-full w-full object-cover" />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-accent text-zinc-950 text-[9px] font-bold rounded-full">
                      -{pct}%
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-1.5 ${gradeColor[deal.grade]}`}>
                      {deal.grade}
                    </div>
                    <p className="font-bold text-white text-sm leading-tight">{deal.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{deal.spec}</p>
                  </div>
                </div>

                {/* Stock bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold mb-1.5">
                    <span className="text-zinc-500">Stock remaining</span>
                    <span className="text-amber-400">{deal.stock} left</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(deal.stock / 20) * 100}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-white">{deal.price}</span>
                    <span className="text-sm text-zinc-600 line-through ml-2">{deal.was}</span>
                  </div>
                  <button className="h-10 px-4 bg-accent text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-accent/90 transition-colors">
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── New Arrivals ─────────────────────────────────────────────────────────────
function NewArrivals() {
  const items = [
    { name: "iPhone 15",          type: "Smartphone", price: "£699",   grade: "Pristine",  img: "https://picsum.photos/seed/ip15na/400/400" },
    { name: "MacBook Pro 14\"",   type: "Laptop",     price: "£1,199", grade: "Excellent", img: "https://picsum.photos/seed/mbp14na/400/400" },
    { name: "Samsung Tab S9",     type: "Tablet",     price: "£499",   grade: "Pristine",  img: "https://picsum.photos/seed/tabs9na/400/400" },
    { name: "Pixel 8 Pro",        type: "Smartphone", price: "£499",   grade: "Excellent", img: "https://picsum.photos/seed/px8pna/400/400" },
    { name: "DJI Mini 4 Pro",     type: "Camera",     price: "£549",   grade: "Good",      img: "https://picsum.photos/seed/djim4na/400/400" },
    { name: "Apple Watch S9",     type: "Wearable",   price: "£299",   grade: "Excellent", img: "https://picsum.photos/seed/aws9na/400/400" },
  ];

  const gradeColor: Record<string, string> = {
    Pristine:  "bg-emerald-50 text-emerald-700",
    Excellent: "bg-sky-50 text-sky-700",
    Good:      "bg-amber-50 text-amber-700",
  };

  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Just added</span>
            </div>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">New arrivals</h2>
          </div>
          <a href="/shop" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="group flex-shrink-0 w-[220px] md:w-[240px] cursor-pointer"
          >
            <div className="relative aspect-square rounded-3xl bg-zinc-50 overflow-hidden mb-4">
              <img
                src={item.img}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${gradeColor[item.grade]}`}>
                {item.grade}
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950 text-white text-[9px] font-bold uppercase tracking-widest">
                New
              </div>
              <button className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{item.type}</p>
            <p className="font-bold text-zinc-950 mb-1 truncate">{item.name}</p>
            <p className="text-lg font-bold text-zinc-950">{item.price}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Grade Guide ──────────────────────────────────────────────────────────────
function GradeGuide() {
  const [active, setActive] = useState(0);

  const grades = [
    {
      name: "Pristine",
      tagline: "Indistinguishable from new.",
      battery: "95%+",
      desc: "Pristine devices show absolutely no signs of prior use. Screen is flawless, all buttons and ports work perfectly, and original or equivalent accessories are included.",
      features: ["Zero scratches — flawless screen", "Battery health 95% or above", "All features pass 25-point check", "Original or equivalent accessories"],
      btnColor:  "bg-emerald-500 text-white",
      iconColor: "bg-emerald-500",
      cardBg:    "bg-emerald-50",
      border:    "border-emerald-200",
      tag:       "text-emerald-700",
      pill:      "bg-emerald-50 text-emerald-700",
    },
    {
      name: "Excellent",
      tagline: "Light signs of use. Fully functional.",
      battery: "85%+",
      desc: "Excellent devices may show very light micro-scratches only visible under strong direct light. Every function is tested and working perfectly.",
      features: ["Micro-scratches under strong light only", "Battery health 85% or above", "All features fully tested", "Fully clean and functional"],
      btnColor:  "bg-sky-500 text-white",
      iconColor: "bg-sky-500",
      cardBg:    "bg-sky-50",
      border:    "border-sky-200",
      tag:       "text-sky-700",
      pill:      "bg-sky-50 text-sky-700",
    },
    {
      name: "Good",
      tagline: "Visible wear. 100% working.",
      battery: "80%+",
      desc: "Good devices have clear cosmetic wear — scratches or scuffs — but are 100% tested and fully functional. Best value for money on the platform.",
      features: ["Visible scratches or scuffs", "Battery health 80% or above", "All features fully tested", "Best value on the platform"],
      btnColor:  "bg-amber-500 text-white",
      iconColor: "bg-amber-500",
      cardBg:    "bg-amber-50",
      border:    "border-amber-200",
      tag:       "text-amber-700",
      pill:      "bg-amber-50 text-amber-700",
    },
  ];

  const g = grades[active];

  return (
    <section className="bg-zinc-50 border-y border-zinc-100 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Quality grading</p>
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
            Understand your <i>grade.</i>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: tabs + detail */}
          <div>
            <div className="flex gap-3 mb-10 flex-wrap">
              {grades.map((gr, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-11 px-7 rounded-2xl font-bold text-sm transition-all duration-200 ${
                    active === i ? gr.btnColor + " shadow-lg" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {gr.name}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-zinc-500 text-base mb-8 leading-relaxed max-w-[46ch]">{g.desc}</p>
                <ul className="space-y-3 mb-8">
                  {g.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full ${g.iconColor} flex items-center justify-center flex-shrink-0`}>
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-zinc-700">{feat}</span>
                    </li>
                  ))}
                </ul>
                <div className={`inline-flex items-center gap-3 ${g.pill} rounded-2xl px-5 py-3`}>
                  <span className="text-sm font-bold">Min. battery health:</span>
                  <span className="text-xl font-bold">{g.battery}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: visual grade card */}
          <div className="relative flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.25 }}
                className={`w-[240px] md:w-[280px] rounded-[3rem] ${g.cardBg} border-4 ${g.border} shadow-2xl overflow-hidden`}
                style={{ aspectRatio: "9/19" }}
              >
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className={`h-24 w-24 rounded-full ${g.iconColor} flex items-center justify-center mb-6 shadow-xl`}>
                    <Check className="h-12 w-12 text-white" />
                  </div>
                  <p className={`text-3xl font-bold ${g.tag} mb-2`}>{g.name}</p>
                  <p className={`text-sm font-medium ${g.tag} opacity-70 mb-8`}>{g.tagline}</p>

                  {/* Battery bar */}
                  <div className={`w-full rounded-2xl ${g.pill} px-4 py-3`}>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span>Battery health</span>
                      <span>{g.battery}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${g.iconColor}`}
                        style={{ width: active === 0 ? "95%" : active === 1 ? "85%" : "80%" }}
                      />
                    </div>
                  </div>

                  {/* Scratch indicator for Good */}
                  {active === 2 && (
                    <div className="mt-4 w-full rounded-xl bg-white/40 px-4 py-2.5 text-center">
                      <p className="text-[11px] font-bold text-amber-700">Cosmetic wear visible</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">Fully tested · Works perfectly</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Side badge */}
            <motion.div
              key={`badge-${active}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`absolute -right-4 top-1/3 ${g.pill} border ${g.border} rounded-2xl px-4 py-3 shadow-lg`}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">Min. battery</p>
              <p className={`text-xl font-bold ${g.tag}`}>{g.battery}</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sell Your Device CTA ─────────────────────────────────────────────────────
function SellCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 px-10 py-16 md:px-20 md:py-20"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Sell with TechStop</p>
            <h2 className="font-serif text-5xl font-medium text-white leading-tight mb-4">
              Your old tech is<br />worth more than <i>you think.</i>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Get an instant quote, free collection, and same-week payment. No hassle, no lowball offers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 lg:justify-end">
            <a href="/sell" className="h-14 px-8 bg-accent text-zinc-950 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors">
              Get instant quote <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/how-it-works" className="h-14 px-8 border border-zinc-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center hover:border-zinc-400 transition-colors">
              How selling works
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function Newsletter() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="border-t border-zinc-100 bg-zinc-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">Stay in the loop</p>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-zinc-950 mb-4">
            Deals before they<br /><i>sell out.</i>
          </h2>
          <p className="text-zinc-500 mb-10">Weekly drops, exclusive discounts, and e-waste reports. No spam.</p>
          {mounted ? (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="you@example.com"
                className="h-14 flex-1 px-6 rounded-2xl bg-white border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-950 transition-shadow"
              />
              <button className="h-14 px-7 bg-zinc-950 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors flex-shrink-0">
                Subscribe
              </button>
            </div>
          ) : (
            <div className="h-14 max-w-md mx-auto rounded-2xl bg-zinc-200/60 animate-pulse" />
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-zinc-950 font-sans">
      <Navbar />
      <MarqueeStrip />
      <Hero />
      <BrandsBar />
      <CategoryBento />
      <ShopByBudget />
      <TrustPillars />
      <FlashDeals />
      <TrendingDeals />
      <NewArrivals />
      <HowItWorks />
      <GradeGuide />
      <AppPreview />
      <Reviews />
      <SustainabilityBanner />
      <SellCTA />
      <Newsletter />
      <Footer />
    </main>
  );
}
