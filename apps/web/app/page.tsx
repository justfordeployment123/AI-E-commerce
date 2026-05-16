"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ShieldCheck, RefreshCw, Leaf, ArrowRight,
  Star, Search, Play, Recycle, TrendingUp, Package, BadgeCheck,
  Zap, Check, Smartphone, Laptop, Headphones, Gamepad2, Tablet
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ─── Promo Carousel Banner ───────────────────────────────────────────────────
function PromoCarouselBanner() {
  const [idx, setIdx] = useState(0);
  const slides = [
    {
      title: "Weekend Offer+",
      img: "/galaxy_watch_promo_1778927696615.png", 
      text: "Save up to £20 on Galaxy Watch\nthis weekend only.*",
      bg: "bg-[#d4c3f4]", // Light purple
      accent: "text-purple-700",
      btn: "Save now",
    },
    {
      title: "Student Discount",
      img: "/laptop_student_promo_1778927711734.png", 
      text: "Get 5% off everything\nall year round.",
      bg: "bg-[#b8e4d3]", // Light green
      accent: "text-emerald-700",
      btn: "Unlock code",
    },
    {
      title: "Trade-in Bonus",
      img: "/iphone_tradein_promo_1778927727005.png", 
      text: "Extra £30 when you trade in\nyour old iPhone.",
      bg: "bg-[#ffdca8]", // Light orange
      accent: "text-orange-700",
      btn: "Get a quote",
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="w-full relative overflow-hidden bg-white">
      <div className={`w-full transition-colors duration-700 ease-in-out ${slides[idx].bg}`}>
        <div className="mx-auto max-w-[1600px] px-6 lg:px-12 py-12 md:py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            
            {/* Left: Title & Branding */}
            <div className="w-full lg:w-[35%] flex flex-col gap-6 text-center lg:text-left">
              <motion.div
                key={`title-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-950/40 mb-3 block">Special Event</span>
                <h2 className="font-bold text-4xl md:text-6xl text-zinc-950 tracking-tighter leading-[0.95]">
                  <span className="font-sans text-3xl font-black align-top mr-2 opacity-30">«</span>
                  {slides[idx].title}
                </h2>
              </motion.div>
            </div>
            
            {/* Center: Image with Decorative Elements */}
            <div className="w-full lg:w-[30%] flex justify-center relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative z-10 h-64 md:h-80 w-full flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-75" />
                  <img 
                    src={slides[idx].img} 
                    alt={slides[idx].title} 
                    className="h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)] mix-blend-multiply transition-transform hover:scale-105 duration-500" 
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: CTA & Footer Text */}
            <div className="w-full lg:w-[35%] flex flex-col items-center lg:items-end text-center lg:text-right gap-8">
              <motion.div
                key={`text-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center lg:items-end gap-6"
              >
                <p className="text-2xl md:text-3xl font-bold text-zinc-950 whitespace-pre-line leading-tight tracking-tight">
                  {slides[idx].text}
                </p>
                <a 
                  href="/shop" 
                  className="group relative inline-flex h-14 px-10 items-center justify-center bg-zinc-950 text-white rounded-2xl font-bold text-sm overflow-hidden transition-all hover:pr-12"
                >
                  <span className="relative z-10">{slides[idx].btn}</span>
                  <ArrowRight className="absolute right-4 h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                </a>
              </motion.div>
              
              <div className="mt-4">
                <p className="text-[10px] font-medium text-zinc-600/70 tracking-wide">*Terms and conditions apply. Limited time offer.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination & Navigation */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-between px-8 lg:px-16 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="group relative h-8 w-8 flex items-center justify-center"
            >
              <div className={`h-1.5 rounded-full transition-all duration-300 ${idx === i ? "w-6 bg-zinc-950" : "w-1.5 bg-zinc-950/20 group-hover:bg-zinc-950/40"}`} />
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setIdx(i => (i === 0 ? slides.length - 1 : i - 1))} 
            className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-zinc-950 flex items-center justify-center hover:bg-white transition-all shadow-sm active:scale-95"
          >
            <span className="text-xl font-light">‹</span>
          </button>
          <button 
            onClick={() => setIdx(i => (i === slides.length - 1 ? 0 : i + 1))} 
            className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-zinc-950 flex items-center justify-center hover:bg-white transition-all shadow-sm active:scale-95"
          >
            <span className="text-xl font-light">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}

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
  const brands = [
    { name: "Apple",     count: "12,400+ items" },
    { name: "Samsung",   count: "8,900+ items" },
    { name: "Sony",      count: "4,200+ items" },
    { name: "Google",    count: "2,100+ items" },
    { name: "Microsoft", count: "1,800+ items" },
    { name: "OnePlus",   count: "1,400+ items" },
    { name: "Nintendo",  count: "3,600+ items" },
    { name: "Dyson",     count: "900+ items" },
  ];
  return (
    <section className="border-y border-zinc-100 py-6 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 md:gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex-shrink-0 hidden sm:block whitespace-nowrap">
            Shop by brand
          </p>
          <div className="h-5 w-px bg-zinc-200 flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide w-full pb-0.5">
            {brands.map((b) => (
              <a
                key={b.name}
                href="/shop"
                className="group flex-shrink-0 flex flex-col items-center justify-center h-14 px-6 rounded-2xl border border-zinc-100 hover:border-zinc-950 hover:bg-zinc-950 transition-all duration-200 cursor-pointer"
              >
                <span className="text-sm font-bold text-zinc-700 group-hover:text-white transition-colors leading-none mb-0.5">
                  {b.name}
                </span>
                <span className="text-[9px] font-medium text-zinc-400 group-hover:text-zinc-400 transition-colors">
                  {b.count}
                </span>
              </a>
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
        <div className="grid lg:grid-cols-2 min-h-[85vh] items-center gap-8 py-20 lg:py-24">

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
              className="text-lg text-zinc-500 max-w-[42ch] mb-6 leading-relaxed font-medium"
            >
              Every device on TechStop is certified by expert refurbishers — rigorously tested, graded honestly, and priced fairly.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mb-8 max-w-[520px]"
            >
              <div className="flex items-center gap-3 h-14 px-5 rounded-2xl bg-zinc-50 border border-zinc-200 focus-within:ring-2 focus-within:ring-zinc-950 focus-within:border-transparent focus-within:bg-white transition-all">
                <Search className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder='Try "iPhone 15 Pro" or "MacBook Air"'
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400"
                />
                <a href="/shop" className="h-9 px-5 bg-zinc-950 text-white rounded-xl font-bold text-xs flex-shrink-0 flex items-center">
                  Search
                </a>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quick Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "iPhones", icon: Smartphone },
                    { name: "MacBooks", icon: Laptop },
                    { name: "Tablets", icon: Tablet },
                    { name: "Audio", icon: Headphones },
                    { name: "Gaming", icon: Gamepad2 }
                  ].map((cat) => (
                    <a key={cat.name} href="/shop" className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-950 text-zinc-600 hover:text-white transition-colors border border-zinc-200 hover:border-zinc-950">
                      <cat.icon className="h-3.5 w-3.5" />
                      {cat.name}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

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
            {/* BG decoration */}
            <div className="absolute inset-0 bg-accent/20 rounded-[4rem] rotate-3 scale-95 z-0 blur-sm" />
            <div className="absolute inset-0 bg-zinc-50/50 backdrop-blur-3xl rounded-[4rem] -rotate-1 z-0 ring-1 ring-zinc-200" />

            <div className="relative z-10 p-8 w-full max-w-[540px]">
              {/* Featured product card */}
              <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] mb-4 ring-1 ring-zinc-100 group cursor-pointer hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)] transition-all duration-500">
                <div className="flex items-center gap-6">
                  <div className="h-32 w-32 rounded-3xl overflow-hidden bg-zinc-50 flex-shrink-0">
                    <img src="/showcase_iphone.png" alt="iPhone 15 Pro" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full">Excellent Grade</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full">Save £460</span>
                    </div>
                    <h3 className="font-bold text-xl text-zinc-950 mb-1">iPhone 15 Pro</h3>
                    <p className="text-[13px] text-zinc-400 font-medium">256GB · Natural Titanium</p>
                    <div className="flex items-baseline gap-2.5 mt-3">
                      <span className="text-2xl font-black text-zinc-950">£739</span>
                      <span className="text-sm text-zinc-300 line-through font-medium">£1,199</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two smaller cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "MacBook Air M2", price: "£849", pct: "35", img: "/showcase_macbook.png", grade: "Pristine", gradeClr: "text-emerald-700 bg-emerald-50" },
                  { name: "AirPods Pro 2",  price: "£149", pct: "47", img: "/showcase_airpods_pro.png", grade: "Excellent", gradeClr: "text-sky-700 bg-sky-50" },
                ].map((p, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] ring-1 ring-zinc-100 group cursor-pointer hover:shadow-[0_32px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                    <div className="h-28 w-full rounded-2xl overflow-hidden bg-zinc-50 mb-4">
                      <img src={p.img} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <p className="font-bold text-sm text-zinc-950 truncate mb-1.5">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-zinc-950">{p.price}</span>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${p.gradeClr}`}>-{p.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-12 -left-8 z-20 bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Verified</p>
                <p className="text-sm font-black text-zinc-950">Expert Grade</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-32 -right-8 z-20 bg-zinc-950 rounded-2xl px-5 py-4 shadow-2xl"
            >
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Saved vs new</p>
              <p className="text-xl font-black text-white tracking-tight">- £340</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 right-12 z-20 bg-white border border-zinc-100 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="flex -space-x-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-zinc-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-black text-zinc-950">1.2K bought</p>
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
    {
      name: "Smartphones", sub: "From £149", count: "12,400+ devices",
      Icon: Smartphone, iconBg: "bg-blue-600",
      img: "/bento_smartphones.png",
    },
    {
      name: "Laptops", sub: "From £249", count: "4,200+ devices",
      Icon: Laptop, iconBg: "bg-violet-600",
      img: "/bento_laptops.png",
    },
    {
      name: "Audio", sub: "From £39", count: "3,600+ devices",
      Icon: Headphones, iconBg: "bg-pink-600",
      img: "/bento_audio.png",
    },
    {
      name: "Gaming", sub: "From £89", count: "6,100+ devices",
      Icon: Gamepad2, iconBg: "bg-emerald-600",
      img: "/bento_gaming.png",
    },
    {
      name: "Tablets", sub: "From £129", count: "2,800+ devices",
      Icon: Tablet, iconBg: "bg-amber-600",
      img: "/bento_tablets.png",
    },
  ];

  return (
    <section className="bg-white border-y border-zinc-100 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Browse by tech</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
              Pick your <i>category.</i>
            </h2>
          </div>
          <a href="/shop" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
            All categories <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-5 h-auto lg:h-[600px]">
          {cats.map((cat, i) => (
            <motion.a
              href="/shop"
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-[2rem] bg-zinc-100 cursor-pointer ${i === 0 ? "col-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Category icon badge */}
              <div className={`absolute top-6 left-6 h-12 w-12 rounded-2xl ${cat.iconBg} flex items-center justify-center shadow-xl z-10 transition-transform group-hover:scale-110`}>
                <cat.Icon className="h-6 w-6 text-white" />
              </div>

              {/* Hover arrow */}
              <div className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10">
                <ArrowRight className="h-5 w-5 text-white" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10 z-10">
                <h3 className="font-serif text-white text-3xl font-medium leading-tight mb-2">{cat.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-white/70 uppercase tracking-widest">{cat.sub}</p>
                  <p className="text-[10px] font-bold text-white/50 hidden sm:block uppercase tracking-tighter">{cat.count}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
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
    { name: "Priya Mehta",    loc: "London",      rating: 5, text: "Absolutely flawless iPhone 13. Arrived next day, pristine condition. Saved £380 vs new. Will never buy new again.",                       product: "iPhone 13 Pro · Pristine",      img: "https://picsum.photos/seed/rev11/64/64" },
    { name: "Marcus Osei",    loc: "Birmingham",  rating: 5, text: "MacBook Air M1 indistinguishable from new. Battery at 97% health. This is the only way I'll buy tech from now on.",                        product: "MacBook Air M1 · Excellent",    img: "https://picsum.photos/seed/rev22/64/64" },
    { name: "Sophie Keller",  loc: "Manchester",  rating: 5, text: "Returned my first order no hassle — replacement arrived in two days. Customer service actually picks up the phone.",                        product: "Samsung S23 · Good",            img: "https://picsum.photos/seed/rev33/64/64" },
    { name: "Rahul Sharma",   loc: "Leicester",   rating: 5, text: "iPad Pro arrived perfectly packaged with a full inspection report. The grade description was 100% accurate. Brilliantly run.",             product: "iPad Pro M2 · Pristine",        img: "https://picsum.photos/seed/rev44/64/64" },
    { name: "Emily Walsh",    loc: "Edinburgh",   rating: 5, text: "Saved £420 on my PS5 and it genuinely looks new. The 12-month warranty gave me total confidence. Already recommended to everyone.",        product: "PlayStation 5 · Excellent",     img: "https://picsum.photos/seed/rev55/64/64" },
    { name: "Daniel Adeyemi", loc: "Bristol",     rating: 5, text: "Pixel 8 Pro came with 94% battery health — better than some brand new phones I've had. Delivery was next day. Phenomenal service.",      product: "Pixel 8 Pro · Excellent",       img: "https://picsum.photos/seed/rev66/64/64" },
  ];

  return (
    <section className="py-24 bg-zinc-50 border-y border-zinc-100 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Social proof</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
              Real buyers,<br />real reviews.
            </h2>
          </div>
          {/* Trustpilot-style score */}
          <div className="flex items-center gap-6 bg-white rounded-3xl px-7 py-5 border border-zinc-100 shadow-sm self-start md:self-auto">
            <div>
              <div className="flex gap-0.5 mb-1.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-accent text-accent" />)}
              </div>
              <p className="text-3xl font-bold text-zinc-950 leading-none">4.8</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">out of 5</p>
            </div>
            <div className="h-12 w-px bg-zinc-100" />
            <div>
              <p className="text-2xl font-bold text-zinc-950 leading-none">12,400</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">Verified reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-5 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2">
        {reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex-shrink-0 w-[320px] md:w-[360px] bg-white rounded-3xl p-7 border border-zinc-100 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex gap-0.5">
              {[...Array(r.rating)].map((_, j) => <Star key={j} className="h-4 w-4 fill-accent text-accent" />)}
            </div>
            <p className="text-zinc-700 leading-relaxed text-[15px] flex-1">"{r.text}"</p>
            <div className="pt-4 border-t border-zinc-100 flex items-center gap-3">
              <img src={r.img} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-zinc-950">{r.name} · {r.loc}</p>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{r.product}</p>
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
    {
      label: "Under £100",
      sub: "Audio, accessories & basics",
      count: "3,240+",
      tags: ["Earbuds", "Cables", "Smart Speakers", "Mice"],
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=700&fit=crop&q=80",
      accent: "bg-emerald-400",
    },
    {
      label: "£100 – £300",
      sub: "Tablets, gaming & wearables",
      count: "7,810+",
      tags: ["Nintendo Switch", "Tablets", "Smartwatches", "Cameras"],
      img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=700&fit=crop&q=80",
      accent: "bg-sky-400",
    },
    {
      label: "£300 – £600",
      sub: "Flagship phones & cameras",
      count: "9,120+",
      tags: ["iPhone 14", "Pixel 8 Pro", "Galaxy S23", "iPad Pro"],
      img: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=1200&h=700&fit=crop&q=80",
      accent: "bg-violet-400",
    },
    {
      label: "£600 and over",
      sub: "Pro laptops, no compromise",
      count: "4,580+",
      tags: ["MacBook Pro M3", "iPhone 15 Pro", "Surface Pro", "Dell XPS"],
      img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=700&fit=crop&q=80",
      accent: "bg-amber-400",
    },
  ];

  return (
    <section className="bg-zinc-50 border-y border-zinc-100 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {ranges.map((r, i) => (
          <motion.a
            key={i}
            href="/shop"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-3xl cursor-pointer h-[280px] md:h-[320px]"
          >
            <img
              src={r.img}
              alt={r.label}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/50 to-zinc-950/10" />

            <div className="absolute inset-0 p-7 flex flex-col justify-between">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className={`${r.accent} text-zinc-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                  {r.count} deals
                </div>
                <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Bottom content */}
              <div>
                <p className="font-serif text-white text-3xl md:text-4xl font-medium leading-tight mb-1.5">
                  {r.label}
                </p>
                <p className="text-sm font-medium text-white/60 mb-4">{r.sub}</p>
                <div className="flex flex-wrap gap-2">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold text-white/70 bg-white/10 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.a>
        ))}
      </div>
      </div>
    </section>
  );
}

// ─── Best Deals Split ─────────────────────────────────────────────────────────
function BestDealsSplit() {
  const pills = [
    { name: "Flash Deals", icon: Zap, bg: "bg-emerald-100", text: "text-emerald-700" },
    { name: "Price drop", icon: TrendingUp, bg: "bg-emerald-100", text: "text-emerald-700" },
    { name: "MacBook", img: "https://picsum.photos/seed/macp/60/60" },
    { name: "iPad", img: "https://picsum.photos/seed/ipadp/60/60" },
    { name: "Android", img: "https://picsum.photos/seed/andp/60/60" },
    { name: "iPhone", img: "https://picsum.photos/seed/iphp/60/60" },
    { name: "Retro tech", img: "https://picsum.photos/seed/retp/60/60" },
    { name: "AirPods", img: "https://picsum.photos/seed/airp/60/60" },
  ];

  const products = [
    { name: "Smart Watch Samsung HR", spec: "GPS Galaxy Watch 8 Classic", price: "209.00", was: "£459.24 new", grade: "Excellent", rating: "4.7/5 (27)", img: "https://picsum.photos/seed/sw1/400/400" },
    { name: "Smart Watch Samsung HR", spec: "GPS Galaxy Watch 8 Classic", price: "232.00", was: "£459.24 new", grade: "Good", rating: "4.7/5 (27)", img: "https://picsum.photos/seed/sw2/400/400" },
    { name: "Smart Watch Samsung HR", spec: "GPS Galaxy Watch 8 Classic", price: "197.00", was: "£550.00 new", grade: "Excellent", rating: "5/5 (3)", img: "https://picsum.photos/seed/sw3/400/400" },
  ];

  return (
    <section className="bg-zinc-50 py-16 md:py-24 overflow-hidden border-t border-zinc-100">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-zinc-950 mb-6">Shop our best deals</h2>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Image */}
          <div className="w-full lg:w-[40%] xl:w-[450px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[500px]">
            <img src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&h=1000&fit=crop" alt="Tennis court with tech" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Pills */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-4 mb-2">
              {pills.map((pill, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px] cursor-pointer group">
                  <div className="h-12 w-[64px] rounded-xl bg-zinc-50 border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center overflow-hidden group-hover:bg-white group-hover:border-zinc-200 transition-colors">
                    {pill.icon ? (
                      <div className={`h-8 w-10 rounded-lg flex items-center justify-center ${pill.bg} ${pill.text}`}>
                        <pill.icon className="h-4 w-4" />
                      </div>
                    ) : (
                      <img src={pill.img} alt={pill.name} className="h-8 w-8 object-contain mix-blend-multiply" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 text-center leading-tight">{pill.name}</span>
                </div>
              ))}
            </div>

            {/* Products */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {products.map((p, i) => (
                <div key={i} className="w-[260px] flex-shrink-0 bg-white rounded-xl p-4 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-widest w-fit mb-3">
                    <Zap className="h-3 w-3" /> Flash deal
                  </div>
                  <div className="h-40 w-full rounded-xl mb-3 overflow-hidden flex items-center justify-center relative">
                    <img src={p.img} alt={p.name} className="h-full object-contain mix-blend-multiply" />
                  </div>
                  <p className="font-normal text-zinc-950 text-[13px] leading-snug mb-1 line-clamp-2">{p.name} {p.spec}</p>
                  <p className="text-[11px] text-zinc-500 mb-2">{p.grade}</p>
                  <div className="flex items-center gap-1 mb-5">
                    {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-zinc-950 text-zinc-950" />)}
                    <span className="text-[10px] font-bold text-zinc-500 ml-1">{p.rating}</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-zinc-100">
                    <p className="text-2xl font-bold text-emerald-700 mb-0.5">
                      £{p.price.split('.')[0]}
                      <span className="text-sm font-bold relative -top-1.5">.{p.price.split('.')[1]}</span>
                    </p>
                    <p className="text-[10px] text-emerald-700 font-bold mb-1 flex items-center gap-1">After £20 off at checkout <span className="h-3 w-3 rounded-full border border-emerald-700 text-[8px] flex items-center justify-center font-bold">i</span></p>
                    <p className="text-[11px] text-zinc-400 line-through mb-4">{p.was}</p>
                    <button className="w-full h-10 border border-zinc-200 rounded-lg font-bold text-[13px] text-zinc-950 hover:border-zinc-950 transition-colors flex items-center justify-center gap-2">
                      <span className="text-lg leading-none">+</span> Add to cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                <span className="text-xl leading-none -mt-1">‹</span>
              </button>
              <button className="h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <span className="text-xl leading-none -mt-1">›</span>
              </button>
            </div>
          </div>
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
function ConditionMeter({ level, barClass }: { level: 0 | 1 | 2; barClass: string }) {
  const bars = 5;
  const filled = level === 0 ? 5 : level === 1 ? 4 : 3;
  return (
    <div className="flex gap-1.5 items-end h-6">
      {[...Array(bars)].map((_, k) => (
        <div
          key={k}
          className={`w-2 rounded-full transition-all ${k < filled ? barClass : "bg-white/10"}`}
          style={{ height: `${40 + k * 12}%` }}
        />
      ))}
    </div>
  );
}

function PhoneSketch({ level }: { level: 0 | 1 | 2 }) {
  return (
    <svg viewBox="0 0 110 190" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-44 w-auto drop-shadow-2xl">
      {/* Phone body */}
      <rect x="8" y="4" width="94" height="182" rx="20" fill="white" fillOpacity="0.13" stroke="white" strokeOpacity="0.45" strokeWidth="2.5"/>
      {/* Dynamic island */}
      <rect x="36" y="12" width="38" height="10" rx="5" fill="white" fillOpacity="0.35"/>
      {/* Screen */}
      <rect x="14" y="28" width="82" height="142" rx="10" fill="white" fillOpacity="0.07" stroke="white" strokeOpacity="0.2" strokeWidth="1"/>
      {/* Home bar */}
      <rect x="38" y="178" width="34" height="5" rx="2.5" fill="white" fillOpacity="0.4"/>
      {/* Side buttons */}
      <rect x="5" y="56" width="3" height="24" rx="1.5" fill="white" fillOpacity="0.3"/>
      <rect x="102" y="50" width="3" height="16" rx="1.5" fill="white" fillOpacity="0.3"/>
      <rect x="102" y="72" width="3" height="16" rx="1.5" fill="white" fillOpacity="0.3"/>

      {/* App icons 3×4 grid */}
      {[0,1,2].map(col => [0,1,2,3].map(row => (
        <rect key={`${col}-${row}`} x={20 + col * 28} y={42 + row * 28} width="18" height="18" rx="5" fill="white" fillOpacity="0.1"/>
      )))}

      {/* Dock bar */}
      <rect x="18" y="158" width="74" height="20" rx="10" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.12" strokeWidth="1"/>
      {[0,1,2,3].map(k => <rect key={k} x={26 + k * 18} y={163} width="12" height="12" rx="3" fill="white" fillOpacity="0.12"/>)}

      {/* ── Pristine: green verified badge ── */}
      {level === 0 && (
        <g>
          <circle cx="88" cy="44" r="14" fill="#10b981" fillOpacity="0.9"/>
          <path d="M81 44 L86 49 L96 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}

      {/* ── Excellent: one faint scratch + magnifier callout ── */}
      {level === 1 && (
        <>
          <line x1="30" y1="52" x2="72" y2="94" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Magnifier circle */}
          <circle cx="94" cy="56" r="13" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1.5"/>
          <line x1="82" y1="66" x2="75" y2="74" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="48" y1="70" x2="82" y2="58" stroke="white" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="3 2"/>
          <circle cx="94" cy="56" r="3" fill="white" fillOpacity="0.5"/>
        </>
      )}

      {/* ── Good: multiple prominent scratches + warning badge ── */}
      {level === 2 && (
        <>
          <line x1="24" y1="60" x2="68" y2="96"  stroke="white" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="40" y1="100" x2="84" y2="130" stroke="white" strokeOpacity="0.4"  strokeWidth="2"   strokeLinecap="round"/>
          <line x1="20" y1="110" x2="50" y2="92"  stroke="white" strokeOpacity="0.3"  strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="60" y1="50" x2="86" y2="76"   stroke="white" strokeOpacity="0.25" strokeWidth="1"   strokeLinecap="round"/>
          {/* Warning triangle */}
          <path d="M88 34 L100 54 L76 54 Z" fill="#f59e0b" fillOpacity="0.85"/>
          <text x="88" y="50" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">!</text>
        </>
      )}
    </svg>
  );
}

function GradeGuide() {
  const grades: {
    num: string; name: string; tagline: string;
    battery: number; saving: number; fromPrice: string;
    rating: number; reviewCount: string;
    conditionLabel: string; sketchLevel: 0 | 1 | 2; featured: boolean;
    img: string; features: string[];
    products: { name: string; price: string }[];
    barClass: string; textClass: string; glowColor: string;
    chipBg: string; featuredRing: string;
  }[] = [
    {
      num: "01", name: "Pristine", tagline: "Zero cosmetic flaws. Like opening a new box.",
      battery: 95, saving: 30, fromPrice: "From £199",
      rating: 4.9, reviewCount: "4,200", conditionLabel: "Zero marks",
      sketchLevel: 0, featured: false,
      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=900&fit=crop&q=75",
      features: ["Flawless screen — zero scratches", "Original or equivalent accessories", "25/25 inspection points passed", "Near-sealed condition packaging"],
      products: [{ name: "iPhone 15 Pro", price: "£739" }, { name: "MacBook Pro M3", price: "£1,699" }, { name: "Galaxy S24 Ultra", price: "£899" }],
      barClass: "bg-emerald-500", textClass: "text-emerald-400",
      glowColor: "#10b981", chipBg: "bg-emerald-500/20", featuredRing: "",
    },
    {
      num: "02", name: "Excellent", tagline: "Micro-marks invisible in everyday light.",
      battery: 85, saving: 45, fromPrice: "From £129",
      rating: 4.8, reviewCount: "12,400", conditionLabel: "Micro-scratches",
      sketchLevel: 1, featured: true,
      img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=900&fit=crop&q=75",
      features: ["Micro-scratches not visible in use", "Battery 85%+ certified by engineers", "All ports, cameras & buttons tested", "Thoroughly cleaned and sanitised"],
      products: [{ name: "iPhone 14 Pro", price: "£549" }, { name: "MacBook Air M2", price: "£849" }, { name: "Samsung S23", price: "£429" }],
      barClass: "bg-sky-400", textClass: "text-sky-400",
      glowColor: "#38bdf8", chipBg: "bg-sky-500/20", featuredRing: "ring-2 ring-accent ring-offset-2 ring-offset-zinc-950",
    },
    {
      num: "03", name: "Good", tagline: "Visible wear — every function 100% working.",
      battery: 80, saving: 60, fromPrice: "From £69",
      rating: 4.7, reviewCount: "8,900", conditionLabel: "Visible wear",
      sketchLevel: 2, featured: false,
      img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=900&fit=crop&q=75",
      features: ["Visible scratches or scuffs on body", "Battery 80%+ certified by engineers", "All features 100% working", "Best price-to-performance on TechStop"],
      products: [{ name: "iPhone 13", price: "£299" }, { name: "MacBook Air M1", price: "£649" }, { name: "Pixel 7 Pro", price: "£349" }],
      barClass: "bg-amber-500", textClass: "text-amber-400",
      glowColor: "#f59e0b", chipBg: "bg-amber-500/20", featuredRing: "",
    },
  ];

  return (
    <section className="py-24 bg-zinc-950 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">How grading works</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-white leading-none">
              What does each <i>grade mean?</i>
            </h2>
          </div>
          <p className="text-zinc-500 text-base max-w-[42ch] leading-relaxed">
            Every device is independently tested before listing. Pick the grade that fits your budget — all are 100% functional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {grades.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative rounded-[2rem] overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300 ${g.featuredRing}`}
            >
              {/* ── Photo panel ── */}
              <div className="relative h-[380px] overflow-hidden flex-shrink-0">
                {/* Product photo */}
                <img src={g.img} alt={g.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                {/* Dark gradient from top + bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-transparent to-zinc-950/95" />

                {/* Watermark number */}
                <div className="absolute -bottom-6 -right-4 text-[160px] font-black leading-none select-none pointer-events-none text-white/[0.04]">
                  {g.num}
                </div>

                {/* Most Popular badge */}
                {g.featured && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-accent text-zinc-950 text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Top-left: number + rating */}
                <div className="absolute top-4 left-5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{g.num}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-accent text-accent" />)}
                    <span className="text-[10px] font-bold text-white/70 ml-1">{g.rating} · {g.reviewCount}</span>
                  </div>
                </div>

                {/* Top-right: savings pill */}
                <div className="absolute top-4 right-5 flex flex-col items-center justify-center h-14 w-14 rounded-full bg-zinc-950/60 border border-white/10 backdrop-blur-md">
                  <span className={`text-sm font-bold leading-none ${g.textClass}`}>-{g.saving}%</span>
                  <span className="text-[8px] text-white/40 uppercase tracking-wide mt-0.5">save</span>
                </div>

                {/* Floating glassmorphism chips (left side) */}
                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <div className={`${g.chipBg} backdrop-blur-md border border-white/10 rounded-xl px-3 py-2`}>
                    <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest mb-0.5">Battery</p>
                    <p className={`text-sm font-bold ${g.textClass}`}>{g.battery}%+</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                    <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest mb-0.5">Condition</p>
                    <p className="text-sm font-bold text-white">{g.conditionLabel}</p>
                  </div>
                </div>

                {/* Phone sketch — centred */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="opacity-90 group-hover:opacity-100 transition-opacity mt-6">
                    <PhoneSketch level={g.sketchLevel} />
                  </div>
                </div>

                {/* Bottom: grade name + price */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-serif text-4xl font-medium text-white leading-none">{g.name}</p>
                      <p className="text-white/50 text-xs font-medium mt-1.5">{g.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${g.textClass}`}>{g.fromPrice}</p>
                      <p className="text-[10px] text-white/40 font-medium mt-0.5 uppercase tracking-widest">certified</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Dark body panel ── */}
              <div className="bg-zinc-900 flex-1 p-6 flex flex-col gap-4 border border-zinc-800 rounded-b-[2rem]">

                {/* Condition meter */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Condition score</p>
                    <ConditionMeter level={g.sketchLevel} barClass={g.barClass} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Inspection</p>
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="h-5 w-5 rounded-md bg-zinc-800 flex items-center justify-center">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                      <span className="text-xs font-bold text-white">25 / 25</span>
                    </div>
                  </div>
                </div>

                {/* Battery segments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Battery health</p>
                    <p className={`text-xs font-bold ${g.textClass}`}>{g.battery}%+</p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, k) => (
                      <motion.div
                        key={k}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + k * 0.04 + 0.3 }}
                        className={`h-2.5 flex-1 rounded-sm origin-bottom ${k < Math.round(g.battery / 10) ? g.barClass : "bg-zinc-800"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Popular devices */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Popular in {g.name}</p>
                  <div className="flex flex-col gap-1.5">
                    {g.products.map((p, j) => (
                      <div key={j} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${g.barClass}`} />
                          <span className="text-xs font-medium text-zinc-300">{p.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${g.textClass}`}>{p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-2 pt-1 border-t border-zinc-800">
                  {g.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5 pt-1">
                      <Check className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${g.textClass}`} />
                      <span className="text-xs text-zinc-400 leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="/shop"
                  className={`mt-auto flex items-center justify-center gap-2 h-11 rounded-2xl bg-zinc-800 hover:bg-accent text-zinc-300 hover:text-zinc-950 font-bold text-sm transition-all duration-200`}
                >
                  Shop {g.name} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Live Activity Feed ───────────────────────────────────────────────────────
function LiveFeed() {
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  const activity = [
    { name: "James K.",  city: "Leicester",   device: "iPhone 14 Pro",       price: "£679", seed: "lf1" },
    { name: "Aisha M.",  city: "London",      device: "MacBook Air M2",      price: "£849", seed: "lf2" },
    { name: "Ben P.",    city: "Manchester",  device: "Samsung S23 Ultra",   price: "£599", seed: "lf3" },
    { name: "Sofia R.",  city: "Birmingham",  device: "iPad Pro M2",         price: "£699", seed: "lf4" },
    { name: "Tom C.",    city: "Bristol",     device: "AirPods Pro 2",       price: "£149", seed: "lf5" },
    { name: "Priya D.",  city: "Edinburgh",   device: "PS5 Digital Edition", price: "£299", seed: "lf6" },
  ];

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setIdx(i => (i + 1) % activity.length), 3500);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;
  const a = activity[idx];

  return (
    <div className="border-b border-zinc-100 bg-zinc-50/80 py-3 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.28 }}
            className="flex items-center gap-3"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <img src={`https://picsum.photos/seed/${a.seed}/28/28`} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            <p className="text-xs font-medium text-zinc-600 truncate">
              <span className="font-bold text-zinc-950">{a.name} from {a.city}</span>
              {" just purchased a "}
              <span className="font-bold text-zinc-950">{a.device}</span>
              {" for "}
              <span className="font-bold text-zinc-950 bg-accent/30 px-1.5 py-0.5 rounded">{a.price}</span>
            </p>
            <span className="ml-auto text-[10px] font-bold text-zinc-400 flex-shrink-0 hidden sm:block">Live</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Savings Comparison ───────────────────────────────────────────────────────
function SavingsComparison() {
  const items = [
    { device: "iPhone 15 Pro 256GB",      newPrice: 1199, ourPrice: 739,  grade: "Excellent", img: "https://picsum.photos/seed/cmp1/120/120" },
    { device: "MacBook Air M2 8GB/256GB", newPrice: 1299, ourPrice: 849,  grade: "Pristine",  img: "https://picsum.photos/seed/cmp2/120/120" },
    { device: "Samsung Galaxy S23 Ultra", newPrice: 1249, ourPrice: 599,  grade: "Excellent", img: "https://picsum.photos/seed/cmp3/120/120" },
    { device: "Sony WH-1000XM5",          newPrice:  379, ourPrice: 199,  grade: "Good",      img: "https://picsum.photos/seed/cmp4/120/120" },
  ];

  const gradeClr: Record<string, string> = {
    Pristine: "text-emerald-700",
    Excellent: "text-sky-700",
    Good: "text-amber-700",
  };

  return (
    <section className="py-24 bg-white border-t border-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Why refurbished?</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
              Refurbished vs <i>retail.</i>
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-zinc-400">
            <span>Retail price</span>
            <span className="text-zinc-950">TechStop price</span>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => {
            const saving = item.newPrice - item.ourPrice;
            const pct = Math.round((saving / item.newPrice) * 100);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer"
              >
                <img src={item.img} alt={item.device} className="h-14 w-14 md:h-16 md:w-16 rounded-2xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-950 text-sm truncate">{item.device}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${gradeClr[item.grade]}`}>{item.grade} · Certified</p>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0 min-w-[80px]">
                  <p className="text-zinc-300 line-through text-sm font-bold">£{item.newPrice.toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase text-zinc-400 mt-0.5">Retail</p>
                </div>
                <div className="text-right flex-shrink-0 min-w-[80px]">
                  <p className="text-xl md:text-2xl font-bold text-zinc-950">£{item.ourPrice.toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase text-zinc-400 mt-0.5">TechStop</p>
                </div>
                <div className="flex-shrink-0 h-14 w-[90px] bg-accent rounded-2xl flex flex-col items-center justify-center">
                  <p className="text-base font-bold text-zinc-950 leading-none">-{pct}%</p>
                  <p className="text-[9px] font-bold text-zinc-700 mt-0.5">Save £{saving}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a href="/shop" className="inline-flex items-center gap-2 h-12 px-8 bg-zinc-950 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors">
            Browse all deals <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Shared product card ──────────────────────────────────────────────────────
interface PCard {
  name: string; type: string; spec: string;
  price: string; was: string; grade: string; img: string; index?: number;
}
const GRADE_STYLE: Record<string, string> = {
  Pristine:  "bg-emerald-50 text-emerald-700",
  Excellent: "bg-sky-50 text-sky-700",
  Good:      "bg-amber-50 text-amber-700",
};
function ProductCard({ name, type, spec, price, was, grade, img, index = 0 }: PCard) {
  const pct = Math.round((1 - parseInt(price.replace(/[^0-9]/g,"")) / parseInt(was.replace(/[^0-9]/g,""))) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group cursor-pointer"
    >
      <div className="relative aspect-square rounded-2xl bg-zinc-50 overflow-hidden mb-3 ring-1 ring-zinc-100 group-hover:ring-transparent group-hover:shadow-xl transition-all duration-300">
        <img src={img} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${GRADE_STYLE[grade] ?? "bg-zinc-100 text-zinc-600"}`}>{grade}</div>
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent text-zinc-950 text-[9px] font-bold">-{pct}%</div>
        <button className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{type}</p>
      <p className="font-bold text-zinc-950 text-sm leading-tight truncate mb-1">{name}</p>
      <p className="text-[11px] text-zinc-400 mb-2 truncate">{spec}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-zinc-950">{price}</span>
        <span className="text-xs text-zinc-400 line-through">{was}</span>
        <span className="text-xs font-bold text-emerald-600">-{pct}%</span>
      </div>
    </motion.div>
  );
}

// ─── Featured Shop (sticky tabs + animated product grid) ──────────────────────
function FeaturedShop() {
  const cats = ["Smartphones", "Laptops", "Tablets", "Audio", "Gaming", "Wearables"];
  const [active, setActive] = useState("Smartphones");

  const products: Record<string, PCard[]> = {
    "Smartphones": [
      { name: "iPhone 15 Pro",       type: "Apple",     spec: "256GB · Natural Titanium",   price: "£799",   was: "£1,199", grade: "Excellent", img: "https://picsum.photos/seed/ip15px/400/400" },
      { name: "Samsung Galaxy S24",  type: "Samsung",   spec: "256GB · Marble Grey",        price: "£599",   was: "£1,099", grade: "Excellent", img: "https://picsum.photos/seed/sgs24x/400/400" },
      { name: "Google Pixel 8 Pro",  type: "Google",    spec: "128GB · Obsidian",           price: "£499",   was: "£899",   grade: "Pristine",  img: "https://picsum.photos/seed/px8x/400/400" },
      { name: "iPhone 14 Pro",       type: "Apple",     spec: "128GB · Deep Purple",        price: "£549",   was: "£849",   grade: "Good",      img: "https://picsum.photos/seed/ip14x/400/400" },
      { name: "OnePlus 12",          type: "OnePlus",   spec: "256GB · Flowy Emerald",      price: "£449",   was: "£799",   grade: "Excellent", img: "https://picsum.photos/seed/op12x/400/400" },
      { name: "iPhone 13",           type: "Apple",     spec: "128GB · Midnight",           price: "£329",   was: "£599",   grade: "Good",      img: "https://picsum.photos/seed/ip13zx/400/400" },
    ],
    "Laptops": [
      { name: "MacBook Air M3",      type: "Apple",   spec: "8GB · 256GB SSD",           price: "£949",   was: "£1,299", grade: "Pristine",  img: "https://picsum.photos/seed/mbm3x/400/400" },
      { name: "Dell XPS 15",         type: "Dell",    spec: "16GB · 512GB SSD",          price: "£749",   was: "£1,199", grade: "Excellent", img: "https://picsum.photos/seed/dxpsx/400/400" },
      { name: "Surface Laptop 5",    type: "Microsoft", spec: "16GB · 256GB · Platinum", price: "£649",   was: "£999",   grade: "Good",      img: "https://picsum.photos/seed/sl5x/400/400" },
      { name: "MacBook Pro 14\"",    type: "Apple",   spec: "M2 Pro · 16GB",             price: "£1,299", was: "£1,899", grade: "Excellent", img: "https://picsum.photos/seed/mbp14cx/400/400" },
      { name: "ThinkPad X1 Carbon",  type: "Lenovo",  spec: "16GB · 512GB",              price: "£699",   was: "£1,399", grade: "Good",      img: "https://picsum.photos/seed/tx1cx/400/400" },
    ],
    "Tablets": [
      { name: "iPad Pro 12.9\"",     type: "Apple",   spec: "M2 · 128GB · WiFi",         price: "£699",   was: "£1,099", grade: "Excellent", img: "https://picsum.photos/seed/ipadpx/400/400" },
      { name: "Samsung Tab S9+",     type: "Samsung", spec: "256GB · WiFi · Pink Gold",  price: "£599",   was: "£899",   grade: "Pristine",  img: "https://picsum.photos/seed/tabs9px/400/400" },
      { name: "iPad 10th Gen",       type: "Apple",   spec: "64GB · WiFi · Blue",        price: "£299",   was: "£499",   grade: "Good",      img: "https://picsum.photos/seed/ip10x/400/400" },
      { name: "iPad Mini 6",         type: "Apple",   spec: "64GB · Space Grey",         price: "£349",   was: "£499",   grade: "Excellent", img: "https://picsum.photos/seed/ipm6x/400/400" },
    ],
    "Audio": [
      { name: "AirPods Pro 2",       type: "Apple",     spec: "USB-C · ANC · White",       price: "£149",   was: "£279",   grade: "Excellent", img: "https://picsum.photos/seed/app2x/400/400" },
      { name: "Sony WH-1000XM5",     type: "Sony",      spec: "Wireless · Noise Cancelling", price: "£199",  was: "£380",   grade: "Good",      img: "https://picsum.photos/seed/xm5x/400/400" },
      { name: "Bose QC45",           type: "Bose",      spec: "Wireless · White Smoke",    price: "£149",   was: "£329",   grade: "Excellent", img: "https://picsum.photos/seed/bqc45x/400/400" },
      { name: "Samsung Buds2 Pro",   type: "Samsung",   spec: "Graphite",                  price: "£89",    was: "£229",   grade: "Good",      img: "https://picsum.photos/seed/sbb2x/400/400" },
    ],
    "Gaming": [
      { name: "PS5 Disc Edition",    type: "Sony",      spec: "825GB SSD · White",         price: "£349",   was: "£479",   grade: "Excellent", img: "https://picsum.photos/seed/ps5cx/400/400" },
      { name: "Xbox Series X",       type: "Microsoft", spec: "1TB · Carbon Black",        price: "£299",   was: "£449",   grade: "Good",      img: "https://picsum.photos/seed/xbxx/400/400" },
      { name: "Nintendo Switch OLED",type: "Nintendo",  spec: "64GB · White",              price: "£219",   was: "£309",   grade: "Good",      img: "https://picsum.photos/seed/nswx/400/400" },
      { name: "Steam Deck",          type: "Valve",     spec: "512GB NVMe",                price: "£379",   was: "£569",   grade: "Excellent", img: "https://picsum.photos/seed/stmdx/400/400" },
    ],
    "Wearables": [
      { name: "Apple Watch S9",      type: "Apple",     spec: "45mm · GPS · Midnight",     price: "£299",   was: "£429",   grade: "Pristine",  img: "https://picsum.photos/seed/aws9x/400/400" },
      { name: "Samsung Watch 6",     type: "Samsung",   spec: "44mm · LTE · Graphite",     price: "£199",   was: "£329",   grade: "Excellent", img: "https://picsum.photos/seed/sw6x/400/400" },
      { name: "Garmin Fenix 7",      type: "Garmin",    spec: "GPS · Solar · Black DLC",   price: "£349",   was: "£679",   grade: "Good",      img: "https://picsum.photos/seed/gf7x/400/400" },
      { name: "Apple Watch Ultra",   type: "Apple",     spec: "Cellular · Titanium",       price: "£499",   was: "£799",   grade: "Excellent", img: "https://picsum.photos/seed/awux/400/400" },
    ],
  };

  const filtered = products[active] || [];

  return (
    <section id="shop" className="py-24 border-t border-zinc-100 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Shop our most wanted</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
              Where the world<br />shops <i>refurbished.</i>
            </h2>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {cats.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex-shrink-0 h-10 px-5 rounded-full font-bold text-sm transition-all duration-200 border ${
                  active === cat 
                    ? "bg-zinc-950 text-white border-zinc-950" 
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Grid */}
      <div className="pl-4 sm:pl-6 lg:pl-8 mx-auto max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex gap-5 overflow-x-auto scrollbar-hide pr-8 pb-8"
          >
            {filtered.map((p, i) => (
              <div key={`${active}-${i}`} className="w-[260px] md:w-[280px] flex-shrink-0">
                <ProductCard {...p} index={i} />
              </div>
            ))}
            
            {/* View all card at the end */}
            <div className="w-[260px] md:w-[280px] flex-shrink-0 flex items-center justify-center p-6 bg-zinc-50 rounded-2xl ring-1 ring-zinc-100">
              <a href="/shop" className="flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-zinc-950 transition-colors group">
                <div className="h-16 w-16 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shadow-sm group-hover:shadow-lg">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <span className="font-bold text-sm uppercase tracking-widest text-center">See all<br/>{active}</span>
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Top Brands Split ─────────────────────────────────────────────────────────
function TopBrandsSplit() {
  const brands = [
    { name: "Sage", logo: "Sage", style: "font-serif text-2xl" },
    { name: "Apple", logo: "Apple", style: "font-sans font-black text-xl" },
    { name: "Dyson", logo: "dyson", style: "font-sans font-normal text-xl" },
    { name: "Ooni", logo: "ooni", style: "font-sans font-bold text-lg bg-zinc-950 text-white px-2 py-0.5 rounded-md" },
    { name: "GoPro", logo: "GoPro", style: "font-sans font-black text-blue-600" },
    { name: "Nintendo", logo: "Nintendo", style: "font-sans font-black text-red-600 border border-red-600 px-2 rounded-full text-xs" },
    { name: "Garmin", logo: "GARMIN", style: "font-sans font-bold text-xl tracking-widest" },
    { name: "Bose", logo: "BOSE", style: "font-sans font-black text-xl italic" },
  ];

  const products = [
    { name: "Coffee maker with grinder", spec: "Without capsule Sage The...", price: "361.99", was: "£599.00 new", rating: "4.5/5 (130)", img: "https://picsum.photos/seed/cm1/400/400" },
    { name: "Espresso machine Without", spec: "capsule Sage The Bambino...", price: "232.99", was: "£399.99 new", rating: "4.4/5 (16)", img: "https://picsum.photos/seed/em2/400/400" },
    { name: "Espresso machine Sage", spec: "Bambino SES450BS...", price: "208.99", was: "£329.95 new", rating: "4.9/5 (13)", img: "https://picsum.photos/seed/em3/400/400" },
  ];

  return (
    <section className="bg-zinc-50 py-16 md:py-24 border-t border-zinc-100 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-zinc-950 mb-6">Top brands, refurbished</h2>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Image */}
          <div className="w-full lg:w-[40%] xl:w-[450px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[500px]">
            <img src="https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&h=1000&fit=crop" alt="Desk with tech" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Brands */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-4 mb-2">
              {brands.map((brand, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20 cursor-pointer group">
                  <div className="h-12 w-20 rounded-xl bg-zinc-50 border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center overflow-hidden group-hover:bg-white group-hover:border-zinc-200 transition-colors">
                    <span className={brand.style}>{brand.logo}</span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 text-center">{brand.name}</span>
                </div>
              ))}
            </div>

            {/* Products */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {products.map((p, i) => (
                <div key={i} className="w-[260px] flex-shrink-0 bg-white rounded-xl p-4 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group cursor-pointer">
                  {i === 0 && (
                    <div className="absolute top-4 left-4 z-10 text-[10px] font-bold text-violet-700 tracking-wide">
                      Don't miss out
                    </div>
                  )}
                  <div className="h-40 w-full rounded-xl mb-3 overflow-hidden flex items-center justify-center p-2">
                    <img src={p.img} alt={p.name} className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="font-normal text-zinc-950 text-[13px] leading-snug mb-2 line-clamp-2">{p.name} {p.spec}</p>
                  <div className="flex items-center gap-1 mb-5">
                    {[...Array(5)].map((_, k) => <Star key={k} className={`h-3 w-3 ${k < 4 ? 'fill-zinc-950 text-zinc-950' : k===4&&p.rating.startsWith('4.9') ? 'fill-zinc-950 text-zinc-950' : 'fill-zinc-300 text-zinc-300'}`} />)}
                    <span className="text-[10px] font-bold text-zinc-500 ml-1">{p.rating}</span>
                  </div>
                  <div className="mt-auto pt-2">
                    <p className="text-2xl font-bold text-zinc-950 mb-0.5">
                      £{p.price.split('.')[0]}
                      <span className="text-sm font-bold relative -top-1.5">.{p.price.split('.')[1]}</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 line-through mb-2">{p.was}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center">
                <span className="text-xl leading-none -mt-1">‹</span>
              </button>
              <button className="h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors">
                <span className="text-xl leading-none -mt-1">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Budget Picks ──────────────────────────────────────────────────────────────
function BudgetPicks() {
  const under200: PCard[] = [
    { name: "AirPods 3rd Gen",    type: "Audio",     spec: "MagSafe · White",            price: "£109", was: "£179", grade: "Good",      img: "https://picsum.photos/seed/airp3b/400/400" },
    { name: "Samsung Galaxy A54", type: "Phone",     spec: "128GB · Awesome Black",      price: "£149", was: "£349", grade: "Good",      img: "https://picsum.photos/seed/a54b/400/400" },
    { name: "Google Pixel 7a",    type: "Phone",     spec: "128GB · Charcoal",           price: "£199", was: "£449", grade: "Good",      img: "https://picsum.photos/seed/px7ab/400/400" },
    { name: "JBL Charge 5",       type: "Audio",     spec: "Portable · Waterproof",      price: "£79",  was: "£179", grade: "Excellent", img: "https://picsum.photos/seed/jblb/400/400" },
    { name: "Apple Watch SE 2",   type: "Wearable",  spec: "GPS · 44mm · Midnight",      price: "£169", was: "£279", grade: "Excellent", img: "https://picsum.photos/seed/awse2b/400/400" },
    { name: "Kindle Paperwhite",  type: "Tablet",    spec: "8GB · WiFi · Black",         price: "£69",  was: "£149", grade: "Excellent", img: "https://picsum.photos/seed/kpwb/400/400" },
    { name: "Nintendo Switch",    type: "Gaming",    spec: "HAC-001 · Neon Blue/Red",    price: "£149", was: "£279", grade: "Good",      img: "https://picsum.photos/seed/nsb/400/400" },
  ];

  const under500: PCard[] = [
    { name: "iPhone 13",          type: "Phone",     spec: "128GB · Starlight",          price: "£379", was: "£699", grade: "Excellent", img: "https://picsum.photos/seed/ip13b/400/400" },
    { name: "MacBook Air M1",     type: "Laptop",    spec: "8GB RAM · 256GB SSD",        price: "£499", was: "£899", grade: "Good",      img: "https://picsum.photos/seed/mba1b/400/400" },
    { name: "iPad 10th Gen",      type: "Tablet",    spec: "64GB · WiFi · Yellow",       price: "£349", was: "£499", grade: "Good",      img: "https://picsum.photos/seed/ip10b/400/400" },
    { name: "Samsung Tab A9+",    type: "Tablet",    spec: "64GB · WiFi · Silver",       price: "£249", was: "£399", grade: "Pristine",  img: "https://picsum.photos/seed/ta9pb/400/400" },
    { name: "Sony WH-1000XM4",   type: "Audio",     spec: "Wireless ANC · Black",       price: "£149", was: "£349", grade: "Good",      img: "https://picsum.photos/seed/xm4b/400/400" },
    { name: "PS5 Digital",        type: "Gaming",    spec: "825GB SSD · White",          price: "£299", was: "£449", grade: "Excellent", img: "https://picsum.photos/seed/ps5db/400/400" },
    { name: "Garmin Venu 3",      type: "Wearable",  spec: "GPS · AMOLED · Slate",       price: "£299", was: "£449", grade: "Excellent", img: "https://picsum.photos/seed/gv3b/400/400" },
  ];

  function PriceRow({ title, badge, items }: { title: string; badge: string; items: PCard[] }) {
    return (
      <div className="mb-16 last:mb-0">
        <div className="flex items-center justify-between mb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h3 className="font-serif text-3xl md:text-4xl font-medium text-zinc-950">{title}</h3>
            <span className="px-3 py-1 bg-accent text-zinc-950 text-[10px] font-bold uppercase tracking-widest rounded-full">{badge}</span>
          </div>
          <a href="/shop" className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2">
          {items.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex-shrink-0 w-[190px] md:w-[210px] group cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl bg-zinc-100 overflow-hidden mb-3 group-hover:shadow-lg transition-shadow duration-300">
                <img src={p.img} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${GRADE_STYLE[p.grade] ?? "bg-zinc-100 text-zinc-600"}`}>{p.grade}</div>
                <button className="absolute bottom-2.5 right-2.5 h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{p.type}</p>
              <p className="font-bold text-zinc-950 text-xs leading-tight truncate mb-1.5">{p.name}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-zinc-950">{p.price}</span>
                <span className="text-[11px] text-zinc-400 line-through">{p.was}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-zinc-50 border-y border-zinc-100 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Budget deals</p>
        <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">More for <i>less.</i></h2>
      </div>
      <PriceRow title="Under £200" badge="Great value" items={under200} />
      <PriceRow title="Under £500" badge="Most popular" items={under500} />
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

// ─── As Seen In ───────────────────────────────────────────────────────────────
function AsSeenIn() {
  const logos = [
    "The Guardian", "TechRadar", "WIRED", "BBC", "The Telegraph", "Forbes", "The Verge", "CNET"
  ];
  return (
    <section className="border-t border-zinc-100 bg-white py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 text-center mb-10">As seen in</p>
        <div className="flex gap-10 md:gap-16 items-center justify-center flex-wrap opacity-40 grayscale">
          {logos.map((logo, i) => (
            <span key={i} className="text-xl md:text-2xl font-serif font-bold text-zinc-950 tracking-tight">
              {logo}
            </span>
          ))}
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
      <PromoCarouselBanner />
      <MarqueeStrip />
      <Hero />
      <BrandsBar />
      <LiveFeed />
      <CategoryBento />
      <FeaturedShop />
      <BestDealsSplit />
      <NewArrivals />
      <TopBrandsSplit />
      <BudgetPicks />
      <ShopByBudget />
      <TrustPillars />
      <TrendingDeals />
      <SavingsComparison />
      <HowItWorks />
      <GradeGuide />
      <AppPreview />
      <Reviews />
      <SustainabilityBanner />
      <SellCTA />
      <AsSeenIn />
      <Newsletter />
      <Footer />
    </main>
  );
}
