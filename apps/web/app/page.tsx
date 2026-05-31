"use client";

import { useState, useEffect, useRef } from "react";

// Custom hook to trigger lazy fetching and auto-refetching on browser back-button navigation (bfcache)
function useLazyFetchTrigger() {
  const ref = useRef<HTMLElement | null>(null);
  const [trigger, setTrigger] = useState(0);
  const isIntersected = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isIntersected.current) {
          isIntersected.current = true;
          setTrigger(prev => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && isIntersected.current) {
        setTrigger(prev => prev + 1);
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return [ref, trigger] as const;
}

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShoppingCart, ShieldCheck, RefreshCw, Leaf, ArrowRight,
  Star, Search, Play, Recycle, TrendingUp, Package, BadgeCheck,
  Zap, Check, Smartphone, Laptop, Headphones, Gamepad2, Tablet,
  ChevronLeft, ChevronRight
} from "lucide-react";
import dynamic from "next/dynamic";
import Navbar from "../components/Navbar";
import { productsApi, reviewsApi, bannersApi } from "../lib/api";
import { useCart } from "../context/cart-context";
const Footer = dynamic(() => import("../components/Footer"));

// ─── Promo Carousel Banner ───────────────────────────────────────────────────
function PromoCarouselBanner() {
  const [idx, setIdx] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  // Slide images keyed by order index — fetched from API (Garage/S3)
  const [slideImgs, setSlideImgs] = useState<(string | null)[]>([]);

  useEffect(() => {
    bannersApi.promoSlides()
      .then(apiSlides => {
        const imgs: (string | null)[] = [];
        apiSlides.forEach(s => { imgs[s.order] = s.imgUrl; });
        setSlideImgs(imgs);
      })
      .catch(() => {});
  }, []);

  const SLIDE_META = [
    {
      index: "01", tabTitle: "Upgrade iPhone", tag: "Featured Promotion",
      titleLine1: "UPGRADE YOUR", titleLine2: "IPHONE", titleItalic: "for less.",
      desc: "Get pristine, certified refurbished iPhones with a full 12-month warranty. Rigorously tested by in-house technicians, graded honestly.",
      themeColor: "from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400",
      bgGlow: "rgba(59, 130, 246, 0.15)",
      specs: ["12-Month Warranty", "Pristine Condition", "Save up to 40%"],
      badgeA: "Pristine Grade", badgeB: "Save up to 40%",
      btnText: "Shop Refurbished", btnLink: "/shop/phones",
    },
    {
      index: "02", tabTitle: "Sell & Trade-In", tag: "Instant Valuation",
      titleLine1: "WE BUY TECH", titleLine2: "FOR CASH", titleItalic: "instantly.",
      desc: "Trade in your old smartphones, MacBooks, or gaming consoles for instant cash. Best price match guaranteed with free insured shipping.",
      themeColor: "from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400",
      bgGlow: "rgba(245, 158, 11, 0.15)",
      specs: ["Instant Quote", "Free Insured Shipping", "Best Price Match"],
      badgeA: "Instant Payout", badgeB: "Best Price Match",
      btnText: "Get Cash Quote", btnLink: "/sell",
    },
    {
      index: "03", tabTitle: "Expert Repairs", tag: "Certified Technicians",
      titleLine1: "BOOK A DEVICE", titleLine2: "REPAIR", titleItalic: "today.",
      desc: "Professional screen, battery, and diagnostic replacements. Express turnaround times using OEM-grade parts with warranty included.",
      themeColor: "from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-400",
      bgGlow: "rgba(16, 185, 129, 0.15)",
      specs: ["Express Screen Fix", "OEM Grade Parts", "Repair Warranty"],
      badgeA: "OEM Grade Parts", badgeB: "Same-Day Fix",
      btnText: "Book Repair", btnLink: "/repair",
    },
    {
      index: "04", tabTitle: "Sustainability", tag: "Green Technology",
      titleLine1: "HELP US SAVE", titleLine2: "THE PLANET", titleItalic: "together.",
      desc: "Refurbished tech prevents harmful electronic waste and cuts carbon footprint. Every device saved counts towards a cleaner earth.",
      themeColor: "from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-400",
      bgGlow: "rgba(34, 197, 94, 0.15)",
      specs: ["Carbon Neutral Shipping", "Offset E-Waste", "-14kg CO2e Avg"],
      badgeA: "100% Carbon Offset", badgeB: "-14kg CO2e Avg",
      btnText: "Our Sustainability", btnLink: "/sustainability",
    },
    {
      index: "05", tabTitle: "Fast Shipping", tag: "Express Shipping",
      titleLine1: "FREE NEXT-DAY", titleLine2: "DELIVERY", titleItalic: "as standard.",
      desc: "Get your tech delivered straight to your door. Free next-day secure courier shipping on all orders. Dispatch before 2pm business days.",
      themeColor: "from-purple-500 to-fuchsia-600 dark:from-purple-400 dark:to-fuchsia-400",
      bgGlow: "rgba(168, 85, 247, 0.15)",
      specs: ["Free Secure Courier", "Next-Day Delivery", "Dispatched by 2pm"],
      badgeA: "Free Next-Day", badgeB: "Secure Dispatch",
      btnText: "Shop All Tech", btnLink: "/shop",
    },
    {
      index: "06", tabTitle: "Expert Support", tag: "Here to Help",
      titleLine1: "PREMIUM CUSTOMER", titleLine2: "SUPPORT", titleItalic: "for life.",
      desc: "Direct access to our dedicated customer support desk via live chat, email, or store visits. Your satisfaction is fully guaranteed.",
      themeColor: "from-teal-500 to-cyan-600 dark:from-teal-400 dark:to-cyan-400",
      bgGlow: "rgba(20, 184, 166, 0.15)",
      specs: ["Direct Support Desk", "12-Month Coverage", "In-Store & Online"],
      badgeA: "Direct Call/Chat", badgeB: "12-Month Covered",
      btnText: "Help Center", btnLink: "/help",
    },
  ];

  // Merge API image URLs into slide metadata
  const slides = SLIDE_META.map((meta, i) => ({ ...meta, img: slideImgs[i] ?? null }));

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 20, y: -y * 20 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section 
      className="w-full min-h-[60vh] lg:min-h-[65vh] bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-900 relative overflow-hidden flex flex-col justify-between py-8 lg:py-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Ambient Radial Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] pointer-events-none transition-all duration-1000 ease-in-out opacity-25"
        style={{ backgroundColor: slides[idx].bgGlow }}
      />
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Showcase Stage */}
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12 flex-1 flex items-center relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Rich Text details */}
          <div className="lg:col-span-6 flex flex-col gap-4 items-start text-left relative">
            
            {/* Giant outlined index number in the background */}
            <div className="absolute -top-16 lg:-top-20 -left-10 text-[12rem] lg:text-[18rem] font-serif font-black select-none pointer-events-none leading-none tracking-tighter text-zinc-300/30 dark:text-zinc-800/15">
              {slides[idx].index}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4 items-start relative z-10"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {slides[idx].tag}
                </span>

                <h1 className="font-sans text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[0.9] tracking-tighter text-zinc-950 dark:text-white uppercase">
                  {slides[idx].titleLine1} <br />
                  {slides[idx].titleLine2}{" "}
                  <span className={`font-serif italic font-light lowercase tracking-normal bg-clip-text text-transparent bg-gradient-to-r ${slides[idx].themeColor}`}>
                    {slides[idx].titleItalic}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <a
                    href={slides[idx].btnLink}
                    className="group relative inline-flex h-12 pl-6 pr-10 items-center justify-center bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-xs overflow-hidden transition-all hover:bg-zinc-900 dark:hover:bg-zinc-50 shadow-md hover:shadow-lg active:scale-97 cursor-pointer"
                  >
                    <span className="relative z-10">{slides[idx].btnText}</span>
                    <ArrowRight className="absolute right-4.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </a>
                  
                  <a
                    href="/how-it-works"
                    className="inline-flex h-12 px-5 items-center justify-center rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 transition-colors font-bold text-xs"
                  >
                    How it Works
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Right Column: 3D Curved Showcase Card */}
          <div className="lg:col-span-6 flex justify-center items-center relative min-h-[300px] lg:min-h-[400px]">
            
            {/* Dynamic Card Glow mesh behind Card */}
            <div className={`absolute w-72 h-72 rounded-full blur-[80px] bg-gradient-to-tr ${slides[idx].themeColor} opacity-20`} />

            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.96, rotateY: 10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.96, rotateY: -10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-[260px] h-[260px] sm:w-[340px] sm:h-[340px] lg:w-[380px] lg:h-[380px] rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/85 dark:border-zinc-800/85 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] flex items-center justify-center p-6 group duration-200 ease-out cursor-grab active:cursor-grabbing"
                style={{ 
                  transformStyle: "preserve-3d", 
                  transform: `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)` 
                }}
              >
                {/* Surface Reflection layer */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/0 via-white/5 to-white/10 dark:from-white/0 dark:via-white/2 dark:to-white/5 pointer-events-none" />

                {/* Floating Shadow Under Image */}
                <div className="absolute bottom-6 w-[80%] h-4 bg-black/5 dark:bg-black/20 blur-lg rounded-full scale-y-20 transition-transform duration-700 group-hover:scale-95 [transform:translateZ(10px)]" />

                {/* Service image with floating frame */}
                {slides[idx].img && (
                  <motion.img
                    src={slides[idx].img!}
                    alt={slides[idx].tabTitle}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-103 [transform:translateZ(40px)] pointer-events-none select-none"
                  />
                )}

                {/* Floating Badge A */}
                <div className="absolute -top-2.5 -right-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl px-3 py-1.5 text-[9px] font-black shadow-md [transform:translateZ(60px)] select-none pointer-events-none border border-zinc-900 dark:border-zinc-100">
                  {slides[idx].badgeA}
                </div>

                {/* Floating Badge B */}
                <div className="absolute -bottom-2.5 -left-2.5 bg-emerald-500 text-white rounded-xl px-3 py-1.5 text-[9px] font-black shadow-md [transform:translateZ(60px)] select-none pointer-events-none">
                  {slides[idx].badgeB}
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Bottom Floating Navigation Dock */}
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12 mt-6 relative z-20">
        <div className="flex justify-center">
          <div className="flex items-center gap-1 p-1.5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg overflow-x-auto scrollbar-hide max-w-full">
            {slides.map((s, i) => {
              const isActive = idx === i;
              return (
                <button
                  key={s.index}
                  onClick={() => setIdx(i)}
                  className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl transition-all duration-350 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-bold" 
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 font-semibold"
                  }`}
                >
                  <span className={`text-[9px] font-black tracking-wider ${isActive ? "opacity-60" : "text-zinc-400"}`}>
                    {s.index}
                  </span>
                  
                  <span className="text-xs tracking-tight">
                    {s.tabTitle}
                  </span>

                  {/* Autoplay loading indicator on the active button */}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full overflow-hidden bg-white/20 dark:bg-black/10">
                      <motion.div 
                        key={idx}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-white dark:bg-zinc-950"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
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
    { name: "Apple",     count: "12,400+ items", link: "/shop/phones" },
    { name: "Samsung",   count: "8,900+ items", link: "/shop/phones" },
    { name: "Sony",      count: "4,200+ items", link: "/shop/audio" },
    { name: "Google",    count: "2,100+ items", link: "/shop/phones" },
    { name: "Microsoft", count: "1,800+ items", link: "/shop/tablets" },
    { name: "OnePlus",   count: "1,400+ items", link: "/shop/phones" },
    { name: "Nintendo",  count: "3,600+ items", link: "/shop/consoles" },
    { name: "Dyson",     count: "900+ items", link: "/shop/audio" },
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
                href={b.link}
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
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [isHeroSearchFocused, setIsHeroSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showcase, setShowcase] = useState<any[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 3 }).then(r => setShowcase(r.items)).catch(() => {});
  }, [trigger]);

  useEffect(() => {
    if (!heroSearchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      productsApi.list({ search: heroSearchQuery, limit: 6 })
        .then(r => setSearchResults(r.items))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [heroSearchQuery]);

  const POPULAR_HERO_SEARCHES = [
    "iPhone 15 Pro",
    "Nintendo Switch OLED",
    "MacBook Air M2",
    "Galaxy Watch",
    "PS5 Console",
  ];

  useEffect(() => {
    const t = setInterval(() => setGradeIdx(i => (i + 1) % grades.length), 2000);
    return () => clearInterval(t);
  }, []);

  const getSearchLink = () => {
    if (!heroSearchQuery) return "/shop/phones";
    const match = searchResults[0];
    return match ? `/shop/${match.category.toLowerCase()}/${match.slug}` : `/shop/phones`;
  };

  return (
    <section ref={sectionRef} className="relative bg-white overflow-hidden">
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

            {/* Search bar with dynamic dropdown preview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mb-8 max-w-[520px] relative"
            >
              <div className="flex items-center gap-3 h-14 px-5 rounded-2xl bg-zinc-50 border border-zinc-200 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent focus-within:bg-background transition-all">
                <Search className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  onFocus={() => setIsHeroSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsHeroSearchFocused(false), 200);
                  }}
                  placeholder='Try "iPhone 15 Pro" or "MacBook Air"'
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-zinc-400"
                />
                <a href={getSearchLink()} className="h-9 px-5 bg-zinc-950 text-white rounded-xl font-bold text-xs flex-shrink-0 flex items-center">
                  Search
                </a>
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {isHeroSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-[24px] shadow-2xl overflow-hidden z-30 p-5"
                  >
                    {heroSearchQuery === "" ? (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Popular Searches</p>
                        <div className="flex flex-wrap gap-2">
                          {POPULAR_HERO_SEARCHES.map((term) => (
                            <button
                              key={term}
                              onClick={() => setHeroSearchQuery(term)}
                              className="px-3.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold hover:border-black hover:bg-white transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Refurbished Matching Items</p>
                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                          {searchResults.map((item) => (
                            <a
                              key={item.id}
                              href={`/shop/${item.category.toLowerCase()}/${item.slug}`}
                              className="flex items-center gap-4 p-2 rounded-xl hover:bg-zinc-50 transition-colors group"
                            >
                              <div className="h-10 w-10 bg-zinc-100 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                                <img src={item.images?.[0] || undefined} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-zinc-950 group-hover:text-black">{item.name}</p>
                                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">{item.brand} • {item.category}</p>
                              </div>
                              <span className="text-xs font-extrabold text-zinc-950">£{item.price}</span>
                            </a>
                          ))}
                          {searchResults.length === 0 && (
                            <p className="text-xs font-bold text-zinc-400 py-4 text-center">No matching refurbished items found.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-3 mt-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quick Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "iPhones", icon: Smartphone, slug: "phones" },
                    { name: "MacBooks", icon: Laptop, slug: "laptops" },
                    { name: "Tablets", icon: Tablet, slug: "tablets" },
                    { name: "Audio", icon: Headphones, slug: "audio" },
                    { name: "Gaming", icon: Gamepad2, slug: "consoles" }
                  ].map((cat) => (
                    <a key={cat.name} href={`/shop/${cat.slug}`} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-950 text-zinc-600 hover:text-white transition-colors border border-zinc-200 hover:border-zinc-950">
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
                href="/shop/phones"
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
              {showcase[0] && (() => {
                const p = showcase[0];
                const comparePrice = p.comparePrice ?? Math.round(p.price * 1.4);
                const saving = comparePrice - p.price;
                const gradeClr = p.condition === "Pristine" ? "text-emerald-700 bg-emerald-50" : p.condition === "Good" ? "text-amber-700 bg-amber-50" : "text-sky-700 bg-sky-50";
                return (
                  <Link href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] mb-4 ring-1 ring-zinc-100 group cursor-pointer hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)] transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <div className="h-32 w-32 rounded-3xl overflow-hidden bg-zinc-50 flex-shrink-0">
                          <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${gradeClr}`}>{p.condition} Grade</span>
                            {saving > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full">Save £{saving}</span>}
                          </div>
                          <h3 className="font-bold text-xl text-zinc-950 mb-1 truncate">{p.name}</h3>
                          <p className="text-[13px] text-zinc-400 font-medium truncate">{String((p.specs as any)?.storage ?? p.model ?? p.condition)}</p>
                          <div className="flex items-baseline gap-2.5 mt-3">
                            <span className="text-2xl font-black text-zinc-950">£{p.price}</span>
                            <span className="text-sm text-zinc-300 line-through font-medium">£{comparePrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })()}

              {/* Two smaller cards */}
              <div className="grid grid-cols-2 gap-4">
                {showcase.slice(1, 3).map((p, i) => {
                  const comparePrice = p.comparePrice ?? Math.round(p.price * 1.4);
                  const pct = Math.round((1 - p.price / comparePrice) * 100);
                  const gradeClr = p.condition === "Pristine" ? "text-emerald-700 bg-emerald-50" : p.condition === "Good" ? "text-amber-700 bg-amber-50" : "text-sky-700 bg-sky-50";
                  return (
                    <Link key={i} href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
                      <div className="bg-white rounded-[2rem] p-5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] ring-1 ring-zinc-100 group cursor-pointer hover:shadow-[0_32px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                        <div className="h-28 w-full rounded-2xl overflow-hidden bg-zinc-50 mb-4">
                          <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <p className="font-bold text-sm text-zinc-950 truncate mb-1.5">{p.name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black text-zinc-950">£{p.price}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${gradeClr}`}>-{pct}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
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
              <p className="text-xl font-black text-white tracking-tight">
                - £{showcase[0] ? (showcase[0].comparePrice ?? Math.round(showcase[0].price * 1.4)) - showcase[0].price : 340}
              </p>
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
  const [catImgs, setCatImgs] = useState<(string | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    bannersApi.random(5)
      .then(banners => setCatImgs(banners.map(b => b.url ?? null)))
      .catch(() => {});
  }, []);

  const cats = [
    { name: "Smartphones", sub: "From £149", count: "12,400+ devices", Icon: Smartphone, iconBg: "bg-blue-600", img: catImgs[0], slug: "phones" },
    { name: "Laptops",     sub: "From £249", count: "4,200+ devices",  Icon: Laptop,     iconBg: "bg-violet-600", img: catImgs[1], slug: "laptops" },
    { name: "Audio",       sub: "From £39",  count: "3,600+ devices",  Icon: Headphones, iconBg: "bg-pink-600",   img: catImgs[2], slug: "audio" },
    { name: "Gaming",      sub: "From £89",  count: "6,100+ devices",  Icon: Gamepad2,   iconBg: "bg-emerald-600",img: catImgs[3], slug: "consoles" },
    { name: "Tablets",     sub: "From £129", count: "2,800+ devices",  Icon: Tablet,     iconBg: "bg-amber-600",  img: catImgs[4], slug: "tablets" },
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
          <a href="/shop/phones" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
            All categories <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-5 h-auto lg:h-[600px]">
          {cats.map((cat, i) => (
            <motion.a
              href={`/shop/${cat.slug}`}
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-[2rem] bg-zinc-100 cursor-pointer ${i === 0 ? "col-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
            >
              {cat.img && (
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                />
              )}
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
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 8 }).then(r => setApiProducts(r.items)).catch(() => {});
  }, [trigger]);

  const featured = apiProducts[0] ?? null;
  const secondary = apiProducts.slice(1, 5);

  const gradeDot: Record<string, string> = {
    Pristine:   "bg-emerald-500",
    Excellent:  "bg-blue-500",
    "Very Good":"bg-violet-500",
    Good:       "bg-amber-500",
  };

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden min-h-[200px]">
      {featured && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Hot right now</p>
              <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">Trending deals</h2>
            </div>
            <a href="/shop/phones" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Asymmetric layout: large featured + right scroll-track */}
          <div className="grid lg:grid-cols-[1fr_1fr] gap-5">

            {/* Featured — large portrait card */}
            <motion.a
              href={`/shop/${featured.category.toLowerCase()}/${featured.slug}`}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
              className="group relative overflow-hidden rounded-[2.5rem] bg-zinc-100 cursor-pointer block"
            >
              <div className="aspect-4/3 lg:aspect-auto lg:h-[520px] w-full relative">
                <img src={featured.images?.[0] || undefined} alt={featured.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

                {/* Grade badge */}
                <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  <span className={`h-2 w-2 rounded-full ${gradeDot[featured.condition]}`} />
                  {featured.condition}
                </div>

                {/* Save pct badge */}
                {featured.comparePrice && (
                  <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-accent text-[10px] font-bold shadow-sm">
                    -{Math.round((1 - featured.price / featured.comparePrice) * 100)}%
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">{featured.brand}</p>
                  <h3 className="font-serif text-3xl font-medium text-white mb-1 leading-tight">{featured.name}</h3>
                  <p className="text-sm text-white/60 font-medium mb-5">{String((featured.specs as any)?.storage ?? featured.model ?? "—")}</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-white tracking-tighter">£{featured.price}</span>
                    {featured.comparePrice && (
                      <span className="text-base text-white/40 line-through">£{featured.comparePrice}</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.a>

            {/* Right: 2×2 grid */}
            <div className="grid grid-cols-2 gap-5">
              {secondary.map((deal, i) => (
                <motion.a
                  key={deal.id}
                  href={`/shop/${deal.category.toLowerCase()}/${deal.slug}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 240, damping: 24 }}
                  className="group cursor-pointer block"
                >
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-100 mb-3">
                    <img src={deal.images?.[0] || undefined} alt={deal.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest shadow-sm">
                      <span className={`h-1.5 w-1.5 rounded-full ${gradeDot[deal.condition]}`} />
                      {deal.condition}
                    </div>
                    {deal.comparePrice && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent text-[9px] font-bold shadow-sm">
                        -{Math.round((1 - deal.price / deal.comparePrice) * 100)}%
                      </span>
                    )}
                    <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="font-bold text-zinc-950 text-sm truncate mb-0.5">{deal.name}</p>
                  <p className="text-[11px] text-zinc-400 font-medium mb-2 truncate">{String((deal.specs as any)?.storage ?? deal.model ?? "—")}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-zinc-950">£{deal.price}</span>
                    {deal.comparePrice && (
                      <span className="text-xs text-zinc-300 line-through">£{deal.comparePrice}</span>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      )}
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
                  <step.icon className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors" />
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    reviewsApi.recent(8)
      .then(data => {
        setReviews(data);
        if (data.length > 0) {
          const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
          setAvgRating(Math.round(avg * 10) / 10);
        }
      })
      .catch(() => {});
  }, [trigger]);

  const displayRating = avgRating || 4.8;
  const displayCount = reviews.length;

  return (
    <section ref={sectionRef} className="py-24 bg-zinc-50 border-y border-zinc-100 overflow-hidden min-h-[200px]">
      {reviews.length > 0 && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Social proof</p>
                <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
                  Real buyers,<br />real reviews.
                </h2>
              </div>
              <div className="flex items-center gap-6 bg-white rounded-3xl px-7 py-5 border border-zinc-100 shadow-sm self-start md:self-auto">
                <div>
                  <div className="flex gap-0.5 mb-1.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-3xl font-bold text-zinc-950 leading-none">{displayRating}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">out of 5</p>
                </div>
                <div className="h-12 w-px bg-zinc-100" />
                <div>
                  <p className="text-2xl font-bold text-zinc-950 leading-none">{displayCount.toLocaleString()}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">Verified reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2">
            {reviews.map((r: any, i: number) => {
              const displayName = r.user?.name ?? r.guestName ?? "Verified Buyer";
              const initials = displayName.charAt(0).toUpperCase();
              const productLabel = r.product ? `${r.product.name} · ${r.product.condition}` : "";
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{
                    once: true
                  }}
                  transition={{ delay: i * 0.07 }}
                  className="flex-shrink-0 w-[320px] md:w-[360px] bg-white rounded-3xl p-7 border border-zinc-100 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-0.5">
                    {[...Array(r.rating)].map((_: unknown, j: number) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-zinc-700 leading-relaxed text-[15px] flex-1">"{r.body}"</p>
                  {r.images?.length > 0 && (
                    <div className="w-full h-44 rounded-2xl overflow-hidden">
                      <img src={r.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="pt-4 border-t border-zinc-100 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 font-bold text-sm text-zinc-600">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-950">{displayName}</p>
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{productLabel}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
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
    <section className="relative overflow-hidden bg-zinc-950 text-white py-24 border-y border-zinc-900">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-4">Our impact</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-white leading-tight mb-6">
              Good for your wallet.<br /><i>Great for the planet.</i>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-[44ch] mb-8 font-semibold">
              Every refurbished device sold is one less product in a landfill. Together, our customers have made a measurable difference.
            </p>
            <a href="/sustainability" className="inline-flex items-center gap-2 h-12 px-6 bg-accent hover:bg-accent-dark text-white rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-accent/20">
              See our full impact report <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-col gap-px bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-900">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-950/60 backdrop-blur-sm px-8 py-7 flex items-center gap-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <s.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white tracking-tight">{s.val}</p>
                  <p className="text-sm font-medium text-zinc-400">{s.label}</p>
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
              <div className="relative w-[272px] rounded-[3rem] bg-zinc-950 p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                {/* Dynamic Island / Camera Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full z-30 flex items-center justify-between px-1.5 pointer-events-none">
                  <div className="h-1 w-1 rounded-full bg-blue-900/40" />
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                </div>
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
                    <div className="mx-4 mb-3 rounded-2xl bg-accent p-3 text-white">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Flash Deal · 2h left</p>
                      <p className="text-[11px] font-bold">iPhone 15 Pro</p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-sm font-bold">£679</span>
                        <span className="text-[9px] text-white/70 line-through">£1,199</span>
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
                className="absolute -right-4 bottom-20 bg-accent text-white rounded-2xl px-3.5 py-2.5 shadow-xl z-20"
              >
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-white text-white" />)}
                </div>
                <p className="text-[9px] font-bold text-white/90">Verified purchase</p>
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
                    <f.Icon className="h-5 w-5 text-zinc-950 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-950 mb-1">{f.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-5">
              <a href="/shop/phones" className="h-12 px-7 bg-zinc-950 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
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
  const [budgetImgs, setBudgetImgs] = useState<(string | null)[]>([null, null, null, null]);
  useEffect(() => {
    bannersApi.random(4).then(b => setBudgetImgs(b.map(x => x.url ?? null))).catch(() => {});
  }, []);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    const bands: [number | undefined, number | undefined][] = [
      [undefined, 100],
      [100, 300],
      [300, 600],
      [600, undefined],
    ];
    Promise.all(
      bands.map(([min, max]) =>
        productsApi.list({ limit: 1, minPrice: min, maxPrice: max }).then(r => r.total).catch(() => 0)
      )
    ).then(setCounts);
  }, [trigger]);

  const fmt = (n: number) => n > 0 ? `${n.toLocaleString()}+` : "—";

  const ranges = [
    {
      label: "Under £100",
      sub: "Audio, accessories & basics",
      count: fmt(counts[0]),
      tags: ["Earbuds", "Cables", "Smart Speakers", "Mice"],
      img: budgetImgs[0],
      accent: "bg-emerald-400",
      link: "/shop/audio",
    },
    {
      label: "£100 – £300",
      sub: "Tablets, gaming & wearables",
      count: fmt(counts[1]),
      tags: ["Nintendo Switch", "Tablets", "Smartwatches", "Cameras"],
      img: budgetImgs[1],
      accent: "bg-sky-400",
      link: "/shop/tablets",
    },
    {
      label: "£300 – £600",
      sub: "Flagship phones & cameras",
      count: fmt(counts[2]),
      tags: ["iPhone 14", "Pixel 8 Pro", "Galaxy S23", "iPad Pro"],
      img: budgetImgs[2],
      accent: "bg-violet-400",
      link: "/shop/phones",
    },
    {
      label: "£600 and over",
      sub: "Pro laptops, no compromise",
      count: fmt(counts[3]),
      tags: ["MacBook Pro M3", "iPhone 15 Pro", "Surface Pro", "Dell XPS"],
      img: budgetImgs[3],
      accent: "bg-amber-400",
      link: "/shop/laptops",
    },
  ];

  return (
    <section ref={sectionRef} className="bg-zinc-50 border-y border-zinc-100 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Budget friendly</p>
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">
            Shop by <i>price.</i>
          </h2>
        </div>
        <a href="/shop/phones" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
          All deals <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {ranges.map((r, i) => (
          <motion.a
            key={i}
            href={r.link}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-3xl cursor-pointer h-[280px] md:h-[320px]"
          >
            {r.img && <img
              src={r.img}
              alt={r.label}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />}
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
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { addItem } = useCart();
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 24 }).then(r => setAllProducts(r.items)).catch(() => {});
  }, [trigger]);

  // Unique category pills from real DB products
  const categoryPills = (() => {
    const seen = new Set<string>();
    const pills: { name: string; img: string; category: string }[] = [];
    for (const p of allProducts) {
      if (!seen.has(p.category)) {
        seen.add(p.category);
        pills.push({ name: p.category, img: p.images?.[0] ?? "", category: p.category });
      }
    }
    return pills.slice(0, 6);
  })();

  const filtered = selectedCategory === "all"
    ? allProducts.slice(0, 3)
    : allProducts.filter(p => p.category === selectedCategory).slice(0, 3);

  const [WARZONE_IMG, setWARZONE_IMG] = useState<string | null>(null);
  useEffect(() => {
    bannersApi.random(1).then(b => setWARZONE_IMG(b[0]?.url ?? null)).catch(() => {});
  }, []);
  const isAllSelected = selectedCategory === "all";
  const leftImage = isAllSelected
    ? WARZONE_IMG
    : (filtered[0]?.images?.[0] ?? allProducts[0]?.images?.[0] ?? WARZONE_IMG);

  async function handleAdd(p: any) {
    try {
      await addItem({ productId: p.id, quantity: 1, price: p.price, name: p.name, slug: p.slug, image: p.images?.[0] });
    } catch {}
    setAddedIds(prev => new Set(prev).add(p.id));
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(p.id); return s; }), 2000);
  }

  return (
    <section ref={sectionRef} className="bg-zinc-50 py-16 md:py-24 overflow-hidden border-t border-zinc-100">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-zinc-950 mb-6">Shop our best deals</h2>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Image — static banner for All, product image for categories */}
          <div className={`w-full lg:w-[40%] xl:w-[450px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[500px] ${isAllSelected ? "bg-zinc-900" : "bg-[#f5f5f7]"}`}>
            {leftImage && (
              <img
                src={leftImage}
                alt="Featured product"
                suppressHydrationWarning
                className={`absolute inset-0 w-full h-full ${isAllSelected ? "object-cover" : "object-contain p-8"}`}
              />
            )}
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Category Pills from DB */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-4 mb-2">
              {/* All pill */}
              <button
                onClick={() => setSelectedCategory("all")}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px] group"
              >
                <div className={`h-12 w-[64px] rounded-xl border flex items-center justify-center transition-colors ${selectedCategory === "all" ? "bg-zinc-950 border-zinc-950" : "bg-zinc-50 border-transparent hover:bg-white hover:border-zinc-200"}`}>
                  <Zap className={`h-4 w-4 ${selectedCategory === "all" ? "text-accent" : "text-emerald-600"}`} />
                </div>
                <span className="text-[10px] font-medium text-zinc-600 text-center leading-tight">All Deals</span>
              </button>

              {categoryPills.map((pill) => (
                <button
                  key={pill.category}
                  onClick={() => setSelectedCategory(pill.category)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px] group"
                >
                  <div className={`h-12 w-[64px] rounded-xl border overflow-hidden flex items-center justify-center transition-colors ${selectedCategory === pill.category ? "border-zinc-950 bg-white shadow-sm" : "bg-zinc-50 border-transparent hover:bg-white hover:border-zinc-200"}`}>
                    {pill.img
                      ? <img src={pill.img} alt={pill.name} className="h-9 w-9 object-contain mix-blend-multiply" />
                      : <span className="text-[9px] font-bold text-zinc-500 uppercase">{pill.name.slice(0, 3)}</span>
                    }
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 text-center leading-tight truncate w-full">{pill.name}</span>
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {filtered.map((p) => {
                const priceStr = p.price.toFixed(2);
                const was = "£" + (p.comparePrice ?? p.price * 1.3).toFixed(2) + " new";
                const [pWhole, pDec] = priceStr.split(".");
                const added = addedIds.has(p.id);
                return (
                  <div key={p.id} className="w-[260px] flex-shrink-0 bg-white rounded-xl p-4 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-widest w-fit mb-3">
                      <Zap className="h-3 w-3" /> Flash deal
                    </div>
                    <Link href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
                      <div className="h-40 w-full rounded-xl mb-3 overflow-hidden flex items-center justify-center bg-[#f5f5f7]">
                        {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />}
                      </div>
                      <p className="font-normal text-zinc-950 text-[13px] leading-snug mb-1 line-clamp-2 hover:underline">{p.name}</p>
                    </Link>
                    <p className="text-[11px] text-zinc-500 mb-2">{p.condition}</p>
                    <div className="flex items-center gap-1 mb-5">
                      {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-zinc-950 text-zinc-950" />)}
                      <span className="text-[10px] font-bold text-zinc-500 ml-1">{p.rating?.toFixed(1)}/5 ({p.reviewCount})</span>
                    </div>
                    <div className="mt-auto pt-4 border-t border-zinc-100">
                      <p className="text-2xl font-bold text-emerald-700 mb-0.5">
                        £{pWhole}<span className="text-sm font-bold relative -top-1.5">.{pDec}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 line-through mb-4">{was}</p>
                      <button
                        onClick={() => handleAdd(p)}
                        className={`w-full h-10 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-colors ${added ? "bg-emerald-500 text-white border-emerald-500 border" : "border border-zinc-200 text-zinc-950 hover:border-zinc-950"}`}
                      >
                        {added ? <><Check className="h-4 w-4" /> Added!</> : <><span className="text-lg leading-none">+</span> Add to cart</>}
                      </button>
                    </div>
                  </div>
                );
              })}
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
  const [items, setItems] = useState<any[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 6 }).then(r => setItems(r.items)).catch(() => {});
  }, [trigger]);

  const gradeColor: Record<string, string> = {
    Pristine:  "bg-emerald-50 text-emerald-700",
    Excellent: "bg-sky-50 text-sky-700",
    Good:      "bg-amber-50 text-amber-700",
  };

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Just added</span>
            </div>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">New arrivals</h2>
          </div>
          <a href="/shop/phones" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2">
        {items.map((item, i) => (
          <Link href={`/shop/${item.category.toLowerCase()}/${item.slug}`} key={i} className="block group flex-shrink-0 w-[220px] md:w-[240px] cursor-pointer">
            <div className="relative aspect-square rounded-3xl bg-zinc-50 overflow-hidden mb-4">
              <img
                src={item.images?.[0] || undefined}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${gradeColor[item.condition]}`}>
                {item.condition}
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-zinc-950 text-white text-[9px] font-bold uppercase tracking-widest">
                New
              </div>
              <button className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{item.category}</p>
            <p className="font-bold text-zinc-950 mb-1 truncate">{item.name}</p>
            <p className="text-lg font-bold text-zinc-950">£{item.price}</p>
          </Link>
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
  const [gradeImgs, setGradeImgs] = useState<(string | null)[]>([null, null, null]);
  useEffect(() => {
    bannersApi.random(3).then(b => setGradeImgs(b.map(x => x.url ?? null))).catch(() => {});
  }, []);

  const grades: {
    num: string; name: string; tagline: string;
    battery: number; saving: number; fromPrice: string;
    rating: number; reviewCount: string;
    conditionLabel: string; sketchLevel: 0 | 1 | 2; featured: boolean;
    img: string | null; features: string[];
    products: { name: string; price: string }[];
    barClass: string; textClass: string; glowColor: string;
    chipBg: string; featuredRing: string;
  }[] = [
    {
      num: "01", name: "Pristine", tagline: "Zero cosmetic flaws. Like opening a new box.",
      battery: 95, saving: 30, fromPrice: "From £199",
      rating: 4.9, reviewCount: "4,200", conditionLabel: "Zero marks",
      sketchLevel: 0, featured: false,
      img: gradeImgs[0],
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
      img: gradeImgs[1],
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
      img: gradeImgs[2],
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
                {g.img && <img src={g.img} alt={g.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                {/* Dark gradient from top + bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-transparent to-zinc-950/95" />

                {/* Watermark number */}
                <div className="absolute -bottom-6 -right-4 text-[160px] font-black leading-none select-none pointer-events-none text-white/[0.04]">
                  {g.num}
                </div>

                {/* Most Popular badge */}
                {g.featured && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-accent text-white text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                    Most Popular
                  </div>
                )}

                {/* Top-left: number + rating */}
                <div className="absolute top-4 left-5 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{g.num}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, k) => <Star key={k} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
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
                  href="/shop/phones"
                  className={`mt-auto flex items-center justify-center gap-2 h-11 rounded-2xl bg-zinc-800 hover:bg-accent text-zinc-300 hover:text-white font-bold text-sm transition-all duration-200`}
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
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 4 }).then(r => setRawProducts(r.items)).catch(() => {});
  }, [trigger]);

  const items = rawProducts.map(p => ({
    device: p.name,
    newPrice: p.comparePrice ?? Math.round(p.price * 1.4),
    ourPrice: p.price,
    grade: p.condition,
    img: p.images?.[0] ?? "",
    slug: p.slug,
    category: p.category,
  }));

  const gradeClr: Record<string, string> = {
    Pristine: "text-emerald-700",
    Excellent: "text-sky-700",
    Good: "text-amber-700",
  };

  return (
    <section ref={sectionRef} className="py-24 bg-white border-t border-zinc-100 min-h-[200px]">
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
          {items.length === 0
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="h-[76px] rounded-2xl bg-zinc-100 animate-pulse" />
              ))
            : items.map((item, i) => {
                const saving = item.newPrice - item.ourPrice;
                const pct = Math.round((saving / item.newPrice) * 100);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Link
                      href={`/shop/${item.category?.toLowerCase() ?? "phones"}/${item.slug}`}
                      className="group flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-2xl border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer"
                    >
                      <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-zinc-50 flex-shrink-0 overflow-hidden">
                        <img src={item.img} alt={item.device} className="h-full w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-950 text-sm truncate">{item.device}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${gradeClr[item.grade] ?? "text-zinc-500"}`}>{item.grade} · Certified</p>
                      </div>
                      <div className="hidden sm:block text-right flex-shrink-0 min-w-[80px]">
                        <p className="text-zinc-300 line-through text-sm font-bold">£{item.newPrice.toLocaleString()}</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-400 mt-0.5">Retail</p>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-[80px]">
                        <p className="text-xl md:text-2xl font-bold text-zinc-950">£{item.ourPrice.toLocaleString()}</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-400 mt-0.5">TechStop</p>
                      </div>
                      <div className="flex-shrink-0 h-14 w-[90px] bg-accent rounded-2xl flex flex-col items-center justify-center text-white">
                        <p className="text-base font-bold leading-none">-{pct}%</p>
                        <p className="text-[9px] font-bold text-white/90 mt-0.5">Save £{saving}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
        </div>

        <div className="mt-10 text-center">
          <a href="/shop/phones" className="inline-flex items-center gap-2 h-12 px-8 bg-zinc-950 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors">
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
  link?: string;
}
const GRADE_STYLE: Record<string, string> = {
  Pristine:  "bg-emerald-50 text-emerald-700",
  Excellent: "bg-sky-50 text-sky-700",
  Good:      "bg-amber-50 text-amber-700",
};
function ProductCard({ name, type, spec, price, was, grade, img, index = 0, link = "/shop/phones" }: PCard) {
  const pct = Math.round((1 - parseInt(price.replace(/[^0-9]/g,"")) / parseInt(was.replace(/[^0-9]/g,""))) * 100);
  return (
    <Link href={link} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="cursor-pointer"
      >
        <div className="relative aspect-square rounded-2xl bg-zinc-50 overflow-hidden mb-3 ring-1 ring-zinc-100 group-hover:ring-transparent group-hover:shadow-xl transition-all duration-300">
          <img src={img} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${GRADE_STYLE[grade] ?? "bg-zinc-100 text-zinc-600"}`}>{grade}</div>
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-accent text-white text-[9px] font-bold">-{pct}%</div>
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
    </Link>
  );
}

// ─── Featured Shop (sticky tabs + animated product grid) ──────────────────────
function FeaturedShop() {
  const cats = ["Smartphones", "Laptops", "Tablets", "Audio", "Gaming"];
  const [active, setActive] = useState("Smartphones");
  const [cache, setCache] = useState<Record<string, PCard[]>>({});
  const [loading, setLoading] = useState(false);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  const catApiMap: Record<string, string> = {
    "Smartphones": "Phones",
    "Laptops": "Laptops",
    "Tablets": "Tablets",
    "Audio": "Accessories",
    "Gaming": "Consoles",
  };

  const catSlugMap: Record<string, string> = {
    "Smartphones": "phones",
    "Laptops": "laptops",
    "Tablets": "tablets",
    "Audio": "audio",
    "Gaming": "consoles",
  };

  useEffect(() => {
    if (trigger > 1) {
      setCache({});
    }
  }, [trigger]);

  useEffect(() => {
    if (trigger === 0) return;
    if (cache[active]) return;
    setLoading(true);
    productsApi.list({ category: catApiMap[active], limit: 6 })
      .then(r => {
        const mapped: PCard[] = r.items.map(p => ({
          name: p.name,
          type: p.brand,
          spec: String((p.specs as Record<string, unknown>)?.storage ?? p.model ?? "—"),
          price: `£${p.price}`,
          was: `£${p.comparePrice ?? Math.round(p.price * 1.4)}`,
          grade: p.condition,
          img: p.images?.[0] ?? "",
          link: `/shop/${catSlugMap[active]}/${p.slug}`,
        }));
        setCache(prev => ({ ...prev, [active]: mapped }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [active, trigger, cache]);

  const filtered = cache[active] ?? [];

  return (
    <section ref={sectionRef} id="shop" className="py-24 border-t border-zinc-100 bg-white overflow-hidden">
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
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="w-[260px] md:w-[280px] flex-shrink-0 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-zinc-100 mb-3" />
                  <div className="h-3 bg-zinc-100 rounded-full w-1/3 mb-2" />
                  <div className="h-4 bg-zinc-100 rounded-full w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-100 rounded-full w-1/2 mb-3" />
                  <div className="h-5 bg-zinc-100 rounded-full w-1/3" />
                </div>
              ))
            ) : (
              <>
                {filtered.map((p, i) => (
                  <div key={`${active}-${i}`} className="w-[260px] md:w-[280px] flex-shrink-0">
                    <ProductCard {...p} index={i} />
                  </div>
                ))}

                {/* View all card at the end */}
                <div className="w-[260px] md:w-[280px] flex-shrink-0 flex items-center justify-center p-6 bg-zinc-50 rounded-2xl ring-1 ring-zinc-100">
                  <a href={`/shop/${catSlugMap[active] ?? "phones"}`} className="flex flex-col items-center justify-center gap-4 text-zinc-500 hover:text-zinc-950 transition-colors group">
                    <div className="h-16 w-16 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all shadow-sm group-hover:shadow-lg">
                      <ArrowRight className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest text-center">See all<br/>{active}</span>
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── Top Brands Split ─────────────────────────────────────────────────────────
const BRAND_STYLE: Record<string, string> = {
  Apple:   "font-sans font-black text-xl",
  Samsung: "font-sans font-bold text-base tracking-tight",
  Sony:    "font-sans font-black text-xl tracking-widest",
  Google:  "font-sans font-bold text-xl text-blue-600",
  Microsoft: "font-sans font-bold text-base",
  OnePlus: "font-sans font-black text-base text-red-600",
  Nintendo:"font-sans font-black text-red-600 border border-red-600 px-2 rounded-full text-xs",
  Dyson:   "font-sans font-normal text-xl",
  Bose:    "font-sans font-black text-xl italic",
  Garmin:  "font-sans font-bold text-xl tracking-widest",
  LG:      "font-sans font-black text-xl text-red-600",
  Huawei:  "font-sans font-bold text-base",
  Lenovo:  "font-sans font-bold text-base",
  Dell:    "font-sans font-bold text-xl text-blue-700",
  HP:      "font-sans font-black text-xl text-blue-600",
  Asus:    "font-sans font-bold text-base",
  Acer:    "font-sans font-bold text-base",
};
const CAT_SLUG: Record<string, string> = {
  Phones: "phones", Laptops: "laptops", Tablets: "tablets",
  Accessories: "audio", Consoles: "consoles",
};

function TopBrandsSplit() {
  const [deskImg, setDeskImg] = useState<string | null>(null);
  useEffect(() => {
    bannersApi.random(1).then(b => setDeskImg(b[0]?.url ?? null)).catch(() => {});
  }, []);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 30 }).then(r => setAllProducts(r.items)).catch(() => {});
  }, [trigger]);

  const products = allProducts.slice(0, 3);

  const brands = (() => {
    const seen = new Set<string>();
    const result: { name: string; logo: string; style: string; link: string }[] = [];
    for (const p of allProducts) {
      if (!seen.has(p.brand)) {
        seen.add(p.brand);
        const slug = CAT_SLUG[p.category] ?? "phones";
        result.push({
          name: p.brand,
          logo: p.brand,
          style: BRAND_STYLE[p.brand] ?? "font-sans font-bold text-base",
          link: `/shop/${slug}`,
        });
      }
      if (result.length >= 8) break;
    }
    return result;
  })();

  return (
    <section ref={sectionRef} className="bg-zinc-50 py-16 md:py-24 border-t border-zinc-100 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-normal tracking-tight text-zinc-950 mb-6">Top brands, refurbished</h2>
        
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Image */}
          <div className="w-full lg:w-[40%] xl:w-[450px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[500px]">
            {deskImg && <img src={deskImg} alt="Desk with tech" className="absolute inset-0 w-full h-full object-cover" />}
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Brands */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-4 mb-2">
              {brands.map((brand, i) => (
                <Link key={i} href={brand.link} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20 cursor-pointer group">
                  <div className="h-12 w-20 rounded-xl bg-zinc-50 border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center overflow-hidden group-hover:bg-white group-hover:border-zinc-200 transition-colors">
                    <span className={brand.style}>{brand.logo}</span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 text-center">{brand.name}</span>
                </Link>
              ))}
            </div>

            {/* Products */}
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {products.map((p, i) => {
                const comparePrice = p.comparePrice ?? Math.round(p.price * 1.4);
                const ratingFilled = Math.round(p.rating ?? 4);
                return (
                  <Link key={i} href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="w-[260px] flex-shrink-0 bg-white rounded-xl p-4 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group cursor-pointer">
                    {i === 0 && (
                      <div className="absolute top-4 left-4 z-10 text-[10px] font-bold text-violet-700 tracking-wide">
                        Don't miss out
                      </div>
                    )}
                    <div className="h-40 w-full rounded-xl mb-3 overflow-hidden flex items-center justify-center bg-zinc-50 p-2">
                      <img src={p.images?.[0]} alt={p.name} className="h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <p className="font-normal text-zinc-950 text-[13px] leading-snug mb-2 line-clamp-2">{p.name}</p>
                    <div className="flex items-center gap-1 mb-5">
                      {[...Array(5)].map((_, k) => <Star key={k} className={`h-3 w-3 ${k < ratingFilled ? 'fill-zinc-950 text-zinc-950' : 'fill-zinc-300 text-zinc-300'}`} />)}
                      <span className="text-[10px] font-bold text-zinc-500 ml-1">{(p.rating ?? 0).toFixed(1)}/5 ({p.reviewCount ?? 0})</span>
                    </div>
                    <div className="mt-auto pt-2">
                      <p className="text-2xl font-bold text-zinc-950 mb-0.5">£{p.price}</p>
                      <p className="text-[11px] text-zinc-400 line-through mb-2">£{comparePrice} new</p>
                    </div>
                  </Link>
                );
              })}
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
  const [under200, setUnder200] = useState<PCard[]>([]);
  const [under500, setUnder500] = useState<PCard[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 60 }).then(r => {
      const toCard = (p: any): PCard => ({
        name: p.name,
        type: p.category,
        spec: String((p.specs as any)?.storage ?? p.model ?? p.condition),
        price: `£${p.price}`,
        was: `£${p.comparePrice ?? Math.round(p.price * 1.4)}`,
        grade: p.condition,
        img: p.images?.[0] ?? "",
        link: `/shop/${p.category.toLowerCase()}/${p.slug}`,
      });
      setUnder200(r.items.filter((p: any) => p.price < 200).slice(0, 10).map(toCard));
      setUnder500(r.items.filter((p: any) => p.price >= 200 && p.price < 500).slice(0, 10).map(toCard));
    }).catch(() => {});
  }, [trigger]);

  function PriceRow({ title, badge, items }: { title: string; badge: string; items: PCard[] }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-16 last:mb-0">
        <div className="flex items-center justify-between mb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h3 className="font-serif text-3xl md:text-4xl font-medium text-zinc-950">{title}</h3>
            <span className="px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{badge}</span>
          </div>
          <a href="/shop/phones" className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2">
          {items.map((p, i) => (
            <Link href={p.link ?? "/shop/phones"} key={i} className="block flex-shrink-0 w-[190px] md:w-[210px] group cursor-pointer">
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="w-full"
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
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const hasData = under200.length > 0 || under500.length > 0;

  return (
    <section ref={sectionRef} className="py-20 bg-zinc-50 border-y border-zinc-100 overflow-hidden min-h-[200px]">
      {hasData && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-14">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-3">Budget deals</p>
            <h2 className="font-serif text-5xl md:text-6xl font-medium text-zinc-950 leading-none">More for <i>less.</i></h2>
          </div>
          <PriceRow title="Under £200" badge="Great value" items={under200} />
          <PriceRow title="Under £500" badge="Most popular" items={under500} />
        </>
      )}
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
            <a href="/sell" className="h-14 px-8 bg-accent text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-dark transition-colors">
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
                className="h-14 flex-1 px-6 rounded-2xl bg-white border border-zinc-200 text-sm font-medium outline-none focus:ring-2 focus:ring-accent transition-shadow"
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
    <main className="flex min-h-screen flex-col bg-background text-foreground font-sans">
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
