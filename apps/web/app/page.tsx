"use client";

import React, { useState, useEffect, useRef } from "react";

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

// ─── Reusable Scroll Buttons ──────────────────────────────────────────────────
function ScrollButtons({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="h-10 w-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-950 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="h-10 w-10 rounded-full bg-zinc-950 hover:bg-zinc-800 text-white flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, ShieldCheck, RefreshCw, Leaf, ArrowRight,
  Star, Search, Play, Recycle, TrendingUp, Package, BadgeCheck,
  Zap, Check, Smartphone, Laptop, Headphones, Gamepad2, Tablet,
  ChevronLeft, ChevronRight, MapPin, Clock, Phone
} from "lucide-react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { productsApi, reviewsApi, bannersApi, catalogApi, storesApi, type Store } from "../lib/api";
import type { CatalogBrand } from "../lib/api";
import { getGradeConfig } from "../lib/grades";
import { GradeBadge } from "../components/GradeBadge";
import { useCart } from "../context/cart-context";
import ProductImage from "../components/ProductImage";
const Footer = dynamic(() => import("../components/Footer"));

const isOtherProduct = (category?: string, imgUrl?: string) => {
  const cat = (category || '').toLowerCase();
  const url = (imgUrl || '').toLowerCase();
  const otherCats = [
    'other', 'others', 'accessories', 'cables', 'chargers', 'memory', 'storage',
    'mouse', 'pen', 'graphics', 'lens', 'smartwatches', 'games', 'films',
    'camera lenses', 'graphics cards', 'mouse & peripherals', 'stylus & pens'
  ];
  return otherCats.includes(cat) || url.includes('/other/') || url.includes('/others/');
};

// ─── Promo Carousel Banner ───────────────────────────────────────────────────
function PromoCarouselBanner() {
  const [idx, setIdx] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [slides, setSlides] = useState<import('../lib/api').PromoSlide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const tabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bannersApi.promoSlides()
      .then((data) => {
        setSlides(data);
        // Preload images to browser cache immediately
        data.forEach((s) => {
          if (s.imgUrl) {
            const img = new Image();
            img.src = s.imgUrl;
          }
        });
      })
      .catch(() => {})
      .finally(() => setLoadingSlides(false));
  }, []);

  const safeIdx = slides.length > 0 ? idx % slides.length : 0;

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Auto-scroll active tab into view on mobile/horizontal scroll without vertical page scrolling
  useEffect(() => {
    if (!tabContainerRef.current) return;
    const container = tabContainerRef.current;
    const activeTab = container.querySelector('[data-active="true"]') as HTMLElement;
    if (activeTab) {
      const containerWidth = container.clientWidth;
      const tabWidth = activeTab.offsetWidth;
      const tabLeft = activeTab.offsetLeft;
      const targetScrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth"
      });
    }
  }, [safeIdx]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 20, y: -y * 20 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  if (loadingSlides) {
    return (
      <div className="w-full min-h-[60vh] lg:min-h-[65vh] bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-900 animate-pulse" />
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[safeIdx];
  const displayIndex = String(slide.order + 1).padStart(2, "0");

  return (
    <section 
      className="w-full min-h-[60vh] lg:min-h-[65vh] bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-900 relative overflow-hidden flex flex-col justify-between py-8 lg:py-10"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Ambient Radial Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] pointer-events-none transition-all duration-1000 ease-in-out opacity-25"
        style={{ backgroundColor: slide.bgGlow }}
      />
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Showcase Stage */}
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12 flex-1 flex items-center relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* Left Column: Rich Text details */}
          <div className="lg:col-span-6 flex flex-col gap-4 items-start text-left relative">
            
            {/* Giant outlined index number in the background */}
            <div className="absolute -top-8 sm:-top-16 lg:-top-20 -left-4 sm:-left-10 text-[6rem] sm:text-[12rem] lg:text-[18rem] font-serif font-black select-none pointer-events-none leading-none tracking-tighter text-zinc-300/30 dark:text-zinc-800/15">
              {displayIndex}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={safeIdx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4 items-start relative z-10"
              >
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {slide.tag}
                </span>

                <h1 className="font-sans text-[clamp(1.75rem,5vw,3.8rem)] font-black leading-[0.9] tracking-tighter text-zinc-950 dark:text-white uppercase">
                  {slide.titleLine1} <br />
                  {slide.titleLine2}{" "}
                  <span className={`font-serif italic font-light lowercase tracking-normal bg-clip-text text-transparent bg-gradient-to-r ${slide.themeColor}`}>
                    {slide.titleItalic}
                  </span>
                </h1>

                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <Link
                    href={slide.btnLink === "/sell" ? "/trade-in" : slide.btnLink}
                    className="group relative inline-flex h-12 pl-6 pr-10 items-center justify-center bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold text-xs overflow-hidden transition-all hover:bg-zinc-900 dark:hover:bg-zinc-50 shadow-md hover:shadow-lg active:scale-97 cursor-pointer"
                  >
                    <span className="relative z-10">{slide.btnText}</span>
                    <ArrowRight className="absolute right-4.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-white/10 dark:bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/trade-in"
                    className="inline-flex h-12 px-5 items-center justify-center rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 transition-colors font-bold text-xs"
                  >
                    How it Works
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Right Column: 3D Curved Showcase Card */}
          <div className="lg:col-span-6 flex justify-center items-center relative min-h-[300px] lg:min-h-[400px]">
            
            {/* Dynamic Card Glow mesh behind Card */}
            {slides.map((s, i) => {
              const isActive = safeIdx === i;
              return (
                <div
                  key={`glow-${s.id}`}
                  className={`absolute w-72 h-72 rounded-full blur-[80px] bg-gradient-to-tr ${s.themeColor} transition-opacity duration-500`}
                  style={{ opacity: isActive ? 0.2 : 0 }}
                />
              );
            })}

            <div
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

              {/* Service images with floating frame */}
              {slides.map((s, i) => {
                const isActive = safeIdx === i;
                return s.imgUrl ? (
                  <motion.img
                    key={s.id}
                    src={s.imgUrl}
                    alt={s.tabTitle}
                    aria-hidden={!isActive}
                    initial={false}
                    animate={isActive ? {
                      opacity: 1,
                      scale: 1,
                      rotateY: 0,
                      y: [0, -6, 0]
                    } : {
                      opacity: 0,
                      scale: 0.9,
                      rotateY: -15
                    }}
                    transition={isActive ? {
                      opacity: { duration: 0.4 },
                      scale: { duration: 0.4 },
                      rotateY: { duration: 0.4 },
                      y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                    } : {
                      opacity: { duration: 0.3 },
                      scale: { duration: 0.3 },
                      rotateY: { duration: 0.3 }
                    }}
                    className="absolute max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.1)] mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 group-hover:scale-103 [transform:translateZ(40px)] pointer-events-none select-none"
                    style={{
                      display: isActive ? "block" : "none"
                    }}
                  />
                ) : null;
              })}

              {/* Floating Badge A */}
              {slides.map((s, i) => {
                const isActive = safeIdx === i;
                return (
                  <motion.div
                    key={`badgeA-${s.id}`}
                    aria-hidden={!isActive}
                    initial={false}
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="absolute -top-2.5 -right-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl px-3 py-1.5 text-[9px] font-black shadow-md [transform:translateZ(60px)] select-none pointer-events-none border border-zinc-900 dark:border-zinc-100"
                    style={{
                      display: isActive ? "block" : "none"
                    }}
                  >
                    {s.badgeA}
                  </motion.div>
                );
              })}

              {/* Floating Badge B */}
              {slides.map((s, i) => {
                const isActive = safeIdx === i;
                return (
                  <motion.div
                    key={`badgeB-${s.id}`}
                    aria-hidden={!isActive}
                    initial={false}
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="absolute -bottom-2.5 -left-2.5 bg-emerald-500 text-white rounded-xl px-3 py-1.5 text-[9px] font-black shadow-md [transform:translateZ(60px)] select-none pointer-events-none"
                    style={{
                      display: isActive ? "block" : "none"
                    }}
                  >
                    {s.badgeB}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Floating Navigation Dock */}
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12 mt-6 relative z-20">
        <div className="flex justify-center">
          <div ref={tabContainerRef} className="flex items-center gap-1 p-1.5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg overflow-x-auto scrollbar-hide max-w-full">
            {slides.map((s, i) => {
              const isActive = safeIdx === i;
              return (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  data-active={isActive}
                  className={`relative flex items-center gap-2 px-3.5 h-10 rounded-2xl transition-all duration-350 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-md font-bold"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 font-semibold"
                  }`}
                >
                  <span className={`text-[9px] font-black tracking-wider ${isActive ? "opacity-60" : "text-zinc-400"}`}>
                    {String(s.order + 1).padStart(2, "0")}
                  </span>

                  <span className="text-xs tracking-tight">
                    {s.tabTitle}
                  </span>

                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full overflow-hidden bg-white/20 dark:bg-black/10">
                      <motion.div
                        key={safeIdx}
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
const MAIN_BRANDS = new Set([
  "apple", "samsung", "google", "oneplus", "asus", "sony", "microsoft"
]);

function BrandsBar() {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi.listBrands()
      .then(res => {
        const filtered = res.filter(b => MAIN_BRANDS.has(b.slug.toLowerCase()));
        setBrands(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="border-y border-zinc-100 py-6 bg-white h-[76px] animate-pulse" />;
  }
  if (brands.length === 0) return null;

  const formatCount = (n: number) => {
    if (n === 0) return null;
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K+ items`;
    return `${n}+ items`;
  };

  return (
    <section className="border-y border-zinc-100 py-6 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 md:gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex-shrink-0 hidden sm:block whitespace-nowrap">
            Shop by brand
          </p>
          <div className="h-5 w-px bg-zinc-200 flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide w-full pb-0.5">
            {brands.map((b) => {
              const count = formatCount(b.productCount);
              return (
                <a
                  key={b.id}
                  href={`/shop/phones?brand=${encodeURIComponent(b.name)}`}
                  className="group flex-shrink-0 flex flex-col items-center justify-center h-14 px-6 rounded-2xl border border-zinc-100 hover:border-zinc-950 hover:bg-zinc-950 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-sm font-bold text-zinc-700 group-hover:text-white transition-colors leading-none mb-0.5">
                    {b.name}
                  </span>
                  {count && (
                    <span className="text-[9px] font-medium text-zinc-400 group-hover:text-zinc-400 transition-colors">
                      {count}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const HOME_TRADE_IN_MODELS = [
  // Phones
  { name: "iPhone 15 Pro Max", category: "Phone", brand: "Apple" },
  { name: "iPhone 15 Pro", category: "Phone", brand: "Apple" },
  { name: "iPhone 15 Plus", category: "Phone", brand: "Apple" },
  { name: "iPhone 15", category: "Phone", brand: "Apple" },
  { name: "iPhone 14 Pro Max", category: "Phone", brand: "Apple" },
  { name: "iPhone 14 Pro", category: "Phone", brand: "Apple" },
  { name: "iPhone 13 Pro Max", category: "Phone", brand: "Apple" },
  { name: "iPhone 13 Pro", category: "Phone", brand: "Apple" },
  { name: "iPhone 13", category: "Phone", brand: "Apple" },
  { name: "Galaxy S24 Ultra", category: "Phone", brand: "Samsung" },
  { name: "Galaxy S24+", category: "Phone", brand: "Samsung" },
  { name: "Galaxy S24", category: "Phone", brand: "Samsung" },
  { name: "Galaxy S23 Ultra", category: "Phone", brand: "Samsung" },
  { name: "Galaxy S23+", category: "Phone", brand: "Samsung" },
  { name: "Galaxy S23", category: "Phone", brand: "Samsung" },
  { name: "Pixel 8 Pro", category: "Phone", brand: "Google" },
  { name: "Pixel 8", category: "Phone", brand: "Google" },
  { name: "Pixel 7 Pro", category: "Phone", brand: "Google" },
  { name: "Pixel 7", category: "Phone", brand: "Google" },
  // Laptops
  { name: "MacBook Pro 16\" M3 Max", category: "Laptop", brand: "Apple" },
  { name: "MacBook Pro 16\" M3 Pro", category: "Laptop", brand: "Apple" },
  { name: "MacBook Pro 14\" M3 Pro", category: "Laptop", brand: "Apple" },
  { name: "MacBook Air 15\" M3", category: "Laptop", brand: "Apple" },
  { name: "MacBook Air 13\" M3", category: "Laptop", brand: "Apple" },
  { name: "MacBook Air 15\" M2", category: "Laptop", brand: "Apple" },
  { name: "MacBook Air 13\" M2", category: "Laptop", brand: "Apple" },
  { name: "MacBook Air 13\" M1", category: "Laptop", brand: "Apple" },
  { name: "XPS 15 (2024)", category: "Laptop", brand: "Dell" },
  { name: "XPS 13 (2024)", category: "Laptop", brand: "Dell" },
  // Consoles
  { name: "PS5 Disc Edition", category: "Console", brand: "Sony PlayStation" },
  { name: "PS5 Digital Edition", category: "Console", brand: "Sony PlayStation" },
  { name: "Xbox Series X", category: "Console", brand: "Microsoft Xbox" },
  { name: "Xbox Series S", category: "Console", brand: "Microsoft Xbox" },
  { name: "Nintendo Switch OLED", category: "Console", brand: "Nintendo" },
  { name: "Nintendo Switch Lite", category: "Console", brand: "Nintendo" },
  // Tablets
  { name: "iPad Pro 13\" M4", category: "Tablet", brand: "Apple" },
  { name: "iPad Pro 11\" M4", category: "Tablet", brand: "Apple" },
  { name: "iPad Air 13\" M2", category: "Tablet", brand: "Apple" },
  { name: "iPad Air 11\" M2", category: "Tablet", brand: "Apple" },
  { name: "iPad Pro 13\" M2", category: "Tablet", brand: "Apple" },
  { name: "iPad Pro 11\" M2", category: "Tablet", brand: "Apple" },
  { name: "iPad Air 5th Gen", category: "Tablet", brand: "Apple" },
  { name: "iPad 10th Gen", category: "Tablet", brand: "Apple" },
];

// ─── Trade-In CTA Section ──────────────────────────────────────────────────
const getGlowClass = (slug: string) => {
  switch (slug) {
    case "phones":   return "hover:shadow-sky-500/10 hover:border-sky-500/35 dark:hover:shadow-sky-500/5";
    case "laptops":  return "hover:shadow-amber-500/10 hover:border-amber-500/35 dark:hover:shadow-amber-500/5";
    case "consoles": return "hover:shadow-violet-500/10 hover:border-violet-500/35 dark:hover:shadow-violet-500/5";
    case "tablets":  return "hover:shadow-rose-500/10 hover:border-rose-500/35 dark:hover:shadow-rose-500/5";
    default:         return "hover:shadow-zinc-500/10 hover:border-zinc-500/35";
  }
};

function TradeInCTASection() {
  const [searchVal, setSearchVal] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const [categories, setCategories] = useState<import('../lib/api').CatalogCategory[]>([]);
  const [fallbacks, setFallbacks] = useState<Record<string, string>>({});

  useEffect(() => {
    catalogApi.listCategories()
      .then(cats => {
        const mainSlugs = ["phones", "laptops", "consoles", "tablets"];
        const filtered = cats.filter(c => mainSlugs.includes(c.slug));
        filtered.sort((a, b) => mainSlugs.indexOf(a.slug) - mainSlugs.indexOf(b.slug));
        setCategories(filtered);

        filtered.forEach(c => {
          if (!c.image) {
            productsApi.list({ category: c.name, limit: 1 })
              .then(r => {
                const img = r.items[0]?.images?.[0];
                if (img) setFallbacks(prev => ({ ...prev, [c.slug]: img }));
              })
              .catch(() => {});
          }
        });
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/trade-in?search=${encodeURIComponent(searchVal)}`);
    } else {
      router.push(`/trade-in`);
    }
  };

  const getCatBg = (slug: string) => {
    switch (slug) {
      case "phones":   return "bg-sky-50 dark:bg-sky-950/20 text-sky-900 dark:text-sky-400";
      case "laptops":  return "bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-400";
      case "consoles": return "bg-violet-50 dark:bg-violet-950/20 text-violet-900 dark:text-violet-400";
      case "tablets":  return "bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-400";
      default:         return "bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-400";
    }
  };

  const getDisplayLabel = (slug: string) => {
    switch (slug) {
      case "phones":   return "Smartphones";
      case "laptops":  return "Laptops & MacBooks";
      case "consoles": return "Consoles";
      case "tablets":  return "Tablets & iPads";
      default:         return "";
    }
  };

  const suggestions = searchVal.trim() === ""
    ? []
    : HOME_TRADE_IN_MODELS.filter(m => m.name.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 5);

  return (
    <section className="bg-white dark:bg-zinc-950 py-20 border-b border-zinc-100 dark:border-zinc-900 relative overflow-hidden font-sans">
      {/* Ambient decorative orbs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-150/40 dark:bg-zinc-900/30 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-0 right-[-10%] w-[450px] h-[450px] bg-sky-500/5 dark:bg-sky-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Headline and Search */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              TechStop Trade-In
            </span>
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-950 dark:text-white leading-tight mb-4">
              Sell your old tech. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent to-zinc-950 dark:to-white">Get cash in 48 hours.</span>
            </h2>
            
            <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-semibold leading-relaxed mb-8">
              We pay premium market rates for used smartphones, laptops, tablets, and gaming consoles. Trade in online with free insured Royal Mail shipping or drop off in-store.
            </p>
            
            {/* Functional search bar */}
            <form onSubmit={handleSearchSubmit} className="w-full max-w-md mb-8 relative">
              <div className="relative group">
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  placeholder="Search your device (e.g. iPhone 15, PS5...)"
                  className="w-full h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border-2 border-zinc-200 dark:border-zinc-800/85 focus:border-red-500 focus:bg-white dark:focus:bg-zinc-900 pl-12 pr-4 text-sm font-semibold outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-accent transition-colors" />
                <button type="submit" className="absolute right-2 top-2 bottom-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl px-4 font-bold text-xs hover:bg-zinc-850 dark:hover:bg-zinc-50 transition-colors cursor-pointer">
                  Search
                </button>
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {isFocused && searchVal.trim() !== "" && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-30 p-2 text-left"
                  >
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          router.push(`/trade-in?search=${encodeURIComponent(sug.name)}`);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl transition-colors text-left cursor-pointer text-foreground"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                            <Smartphone className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-zinc-950 dark:text-white">{sug.name}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{sug.brand} · {sug.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                          Get Cash <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
            
          </div>
          
          {/* Right Column: Visual peeking category cards */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6 w-full">
            {categories.map((c) => {
              const img = c.image ?? fallbacks[c.slug] ?? "";
              const label = getDisplayLabel(c.slug) || c.name;
              return (
                <Link
                  key={c.slug}
                  href={`/trade-in`}
                  className={`relative group rounded-[2.2rem] border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-950 overflow-hidden h-44 flex flex-col justify-between p-6 text-left hover:-translate-y-1.5 transition-all duration-300 ${getGlowClass(c.slug)}`}
                >
                  {/* Full Card Background Image */}
                  {img && (
                    <>
                      <img
                        src={img}
                        alt={label}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 brightness-[1.08] contrast-[1.03] group-hover:brightness-[1.12] transition-all duration-700"
                      />
                      {/* Smooth modern gradient overlay for readability and contrast */}
                      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/20 to-transparent z-10" />
                    </>
                  )}
                  
                  <div className="relative z-20 flex flex-col h-full justify-between text-white w-full">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/10 dark:bg-black/25 backdrop-blur-md border border-white/10 w-max text-white shadow-sm">
                      {label}
                    </span>
                    
                    <div className="flex items-center justify-between w-full mt-2">
                      <div>
                        <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none">Trade-In</p>
                        <p className="text-sm font-extrabold text-white mt-1 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">Start Quote</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/10 group-hover:bg-white dark:group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all duration-300 shrink-0">
                        <ArrowRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const grades = ["New", "A Grade", "B Grade", "C Grade", "F Grade"];
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
              className="font-sans text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[0.92] tracking-tight text-zinc-950 mb-8"
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
                    className="text-zinc-400"
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
                <a href={getSearchLink()} className="h-9 px-3 sm:px-5 bg-zinc-950 text-white rounded-xl font-bold text-xs flex-shrink-0 flex items-center justify-center gap-1">
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:hidden" />
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
                              <div className="relative h-10 w-10 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                                <ProductImage src={item.images?.[0]} alt={item.name} hover={false} sizes="40px" />
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
                href="/trade-in"
                className="h-14 px-8 border border-zinc-200 text-zinc-950 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
              >
                <Play className="h-4 w-4" /> How it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-4 sm:gap-6 border-t border-zinc-100 pt-10"
            >
              {[
                { val: "47K+", label: "Devices in stock" },
                { val: "4.8", label: "Trustpilot score" },
                { val: "£30M+", label: "Saved by buyers" },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">{s.val}</p>
                  <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{s.label}</p>
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
                const comparePrice = (p.comparePrice && p.comparePrice > p.price) ? p.comparePrice : null;
                const saving = comparePrice ? comparePrice - p.price : 0;
                const gradeConf = getGradeConfig(p.condition ?? '');
                return (
                  <Link href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] mb-4 ring-1 ring-zinc-100 group cursor-pointer hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.12)] transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <div className="relative h-32 w-32 rounded-3xl overflow-hidden bg-image-light flex-shrink-0">
                          <ProductImage
                            src={p.images?.[0]}
                            alt={p.name}
                            mode={isOtherProduct(p.category, p.images?.[0]) ? "product" : "cover"}
                            sizes="128px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <GradeBadge condition={p.condition ?? ''} />
                            {saving > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full">Save £{saving}</span>}
                          </div>
                          <h3 className="font-bold text-xl text-zinc-950 mb-1 truncate">{p.name}</h3>
                          <p className="text-[13px] text-zinc-400 font-medium truncate">{String((p.specs as any)?.storage ?? p.model ?? p.condition)}</p>
                          <div className="flex items-baseline gap-2.5 mt-3">
                            {p.price > 0 ? (
                              <>
                                <span className="text-2xl font-black text-zinc-950">£{p.price}</span>
                                {comparePrice && <span className="text-sm text-zinc-300 line-through font-medium">£{comparePrice}</span>}
                              </>
                            ) : (
                              <span className="text-lg font-bold text-zinc-400 italic">Price on request</span>
                            )}
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
                  const comparePrice = (p.comparePrice && p.comparePrice > p.price) ? p.comparePrice : null;
                  const pct = comparePrice ? Math.round((1 - p.price / comparePrice) * 100) : 0;
                  const gradeConf = getGradeConfig(p.condition ?? '');
                  return (
                    <Link key={i} href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
                      <div className="bg-white rounded-[2rem] p-5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] ring-1 ring-zinc-100 group cursor-pointer hover:shadow-[0_32px_50px_-12px_rgba(0,0,0,0.1)] transition-all duration-500">
                        <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-image-light mb-4">
                          <ProductImage
                            src={p.images?.[0]}
                            alt={p.name}
                            mode={isOtherProduct(p.category, p.images?.[0]) ? "product" : "cover"}
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                        </div>
                        <p className="font-bold text-sm text-zinc-950 truncate mb-1.5">{p.name}</p>
                        <div className="flex items-center justify-between">
                          {p.price > 0 ? (
                            <>
                              <span className="text-lg font-black text-zinc-950">£{p.price}</span>
                              {pct > 0 && <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${gradeConf.badgeClass}`}>-{pct}%</span>}
                            </>
                          ) : (
                            <span className="text-sm font-bold text-zinc-400 italic">Price on request</span>
                          )}
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
                - £{showcase[0]?.comparePrice && showcase[0].comparePrice > showcase[0].price ? showcase[0].comparePrice - showcase[0].price : "—"}
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
const CATEGORY_SLUG_META: Record<string, { Icon: React.ElementType; iconBg: string }> = {
  phones:   { Icon: Smartphone, iconBg: "bg-blue-600" },
  laptops:  { Icon: Laptop,     iconBg: "bg-violet-600" },
  audio:    { Icon: Headphones, iconBg: "bg-pink-600" },
  consoles: { Icon: Gamepad2,   iconBg: "bg-emerald-600" },
  tablets:  { Icon: Tablet,     iconBg: "bg-amber-600" },
};
const CATEGORY_DEFAULT_META = { Icon: Package, iconBg: "bg-zinc-600" };

function CategoryBento() {
  const [categories, setCategories] = useState<import('../lib/api').CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi.listCategories()
      .then(cats => {
        const slugsOrder = Object.keys(CATEGORY_SLUG_META);
        const mainCats = cats
          .filter(cat => cat.slug in CATEGORY_SLUG_META)
          .sort((a, b) => slugsOrder.indexOf(a.slug) - slugsOrder.indexOf(b.slug));
        setCategories(mainCats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-white border-y border-zinc-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-[350px] lg:h-[450px] bg-zinc-100 rounded-[2rem] animate-pulse" />
        </div>
      </section>
    );
  }
  if (categories.length === 0) return null;

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K+ devices`;
    return `${n}+ devices`;
  };

  const firstSlug = categories[0]?.slug ?? 'phones';

  return (
    <section className="bg-white border-y border-zinc-100 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Browse by tech</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 tracking-tight leading-none">
              Pick your category
            </h2>
          </div>
          <a href={`/shop/${firstSlug}`} className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
            All categories <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-5 h-auto lg:h-[450px]">
          {categories.map((cat, i) => {
            const meta = CATEGORY_SLUG_META[cat.slug] ?? CATEGORY_DEFAULT_META;
            const { Icon, iconBg } = meta;
            const sub = cat.minPrice != null ? `From £${Math.floor(cat.minPrice)}` : null;
            const count = formatCount(cat.productCount);
            return (
              <motion.a
                href={`/shop/${cat.slug}`}
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`group relative overflow-hidden rounded-[2rem] bg-zinc-100 cursor-pointer border border-zinc-200/50 hover:border-zinc-300 hover:shadow-2xl transition-all duration-500 ${i === 0 ? "col-span-2 lg:col-span-2 lg:row-span-2 h-[260px] sm:h-[320px] lg:h-auto" : "h-[180px] sm:h-[220px] lg:h-auto"}`}
              >
                {cat.image && (
                  <NextImage
                    fill
                    src={cat.image}
                    alt={cat.name}
                    className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
                {/* Double-sided gradient mask for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-85" />
                
                {/* Inner border glow */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[2rem] z-10" />

                {/* Floating arrow bottom-right */}
                <div className="absolute bottom-6 right-6 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-20">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>

                {/* Text and Glass Badge top-left */}
                <div className="absolute top-6 left-6 z-10 flex flex-col items-start">
                  <span className="text-[9px] font-bold tracking-[0.15em] text-white/60 uppercase mb-1.5">{count}</span>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-none mb-3">
                    {cat.name}
                  </h3>
                  {sub && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white tracking-wider uppercase">
                      {sub}
                    </span>
                  )}
                </div>
              </motion.a>
            );
          })}
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
    <section className="bg-zinc-950 py-12 md:py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10 max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Our promise</p>
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Built on trust, backed by proof
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
              className="bg-zinc-950 p-5 md:p-6 lg:p-7 group hover:bg-zinc-900 transition-colors"
            >
              <div className={`h-9 w-9 rounded-xl ${p.color} flex items-center justify-center mb-4`}>
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-1.5 leading-tight">{p.title}</h3>
              <p className="text-xs text-zinc-400 leading-normal">{p.body}</p>
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

  return (
    <section ref={sectionRef} className="py-24 overflow-hidden min-h-[200px]">
      {featured && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Hot right now</p>
              <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 tracking-tight leading-none">
                Trending deals
              </h2>
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
              className="group relative overflow-hidden rounded-[2.5rem] bg-zinc-100 cursor-pointer block lg:h-full"
            >
              <div className="aspect-[4/3] lg:aspect-auto lg:h-full w-full relative">
                <NextImage
                  fill
                  src={featured.images?.[0] || "https://picsum.photos/seed/featured/800/600"}
                  alt={featured.name}
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

                {/* Grade badge */}
                {(() => {
                  const grade = getGradeConfig(featured.condition ?? '');
                  return (
                    <div className="absolute top-6 left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest shadow-sm">
                      <span className={`h-2 w-2 rounded-full ${grade.dotClass}`} />
                      {grade.label}
                      {grade.forParts && <span className="text-[10px] font-normal opacity-80">· For Parts</span>}
                    </div>
                  );
                })()}

                {/* Save pct badge */}
                {featured.comparePrice && (
                  <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-accent text-[10px] font-bold shadow-sm">
                    -{Math.round((1 - featured.price / featured.comparePrice) * 100)}%
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">{featured.brand}</p>
                  <h3 className="font-sans text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight tracking-tight">{featured.name}</h3>
                  <p className="text-sm text-white/60 font-medium mb-5">{String((featured.specs as any)?.storage ?? featured.model ?? "—")}</p>
                  <div className="flex items-baseline gap-3">
                    {featured.price > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-white tracking-tighter">£{featured.price}</span>
                        {featured.comparePrice && (
                          <span className="text-base text-white/40 line-through">£{featured.comparePrice}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xl font-bold text-white/60 italic">Price on request</span>
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
                    <ProductImage
                      src={deal.images?.[0]}
                      alt={deal.name}
                      mode={isOtherProduct(deal.category, deal.images?.[0]) ? "product" : "cover"}
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw"
                    />
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {(() => {
                      const grade = getGradeConfig(deal.condition ?? '');
                      return (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/90 backdrop-blur-sm text-[8px] sm:text-[9px] font-bold uppercase tracking-widest shadow-sm">
                          <span className={`h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full ${grade.dotClass}`} />
                          {grade.label}
                          {grade.forParts && <span className="text-[10px] font-normal opacity-80">· For Parts</span>}
                        </div>
                      );
                    })()}
                    {deal.comparePrice && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-accent text-[8px] sm:text-[9px] font-bold shadow-sm">
                        -{Math.round((1 - deal.price / deal.comparePrice) * 100)}%
                      </span>
                    )}
                    <div className="absolute bottom-3 right-3 z-20 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="font-bold text-zinc-950 text-sm truncate mb-0.5">{deal.name}</p>
                  <p className="text-[11px] text-zinc-400 font-medium mb-2 truncate">{String((deal.specs as any)?.storage ?? deal.model ?? "—")}</p>
                  <div className="flex items-baseline gap-2">
                    {deal.price > 0 ? (
                      <>
                        <span className="text-lg font-bold text-zinc-950">£{deal.price}</span>
                        {deal.comparePrice && (
                          <span className="text-xs text-zinc-300 line-through">£{deal.comparePrice}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-bold text-zinc-400 italic">Price on request</span>
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">The process</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-tight tracking-tight mb-6">
              Simple as it should be
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
    <section ref={sectionRef} className={reviews.length > 0 ? "py-24 bg-zinc-50 border-y border-zinc-100 overflow-hidden min-h-[200px]" : ""}>
      {reviews.length > 0 && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Social proof</p>
                <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
                  Real buyers, real reviews
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
          <div ref={scrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
            <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
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
                  className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] bg-white rounded-3xl p-5 sm:p-7 border border-zinc-100 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-0.5">
                    {[...Array(r.rating)].map((_: unknown, j: number) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-zinc-700 leading-relaxed text-[15px] flex-1">"{r.body}"</p>
                  {r.images?.length > 0 && (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden">
                      <NextImage src={r.images[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 90vw, 400px" />
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
            <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 flex justify-end">
            <ScrollButtons scrollRef={scrollRef as React.RefObject<HTMLElement | null>} />
          </div>
        </>
      )}
    </section>
  );
}



// ─── App Preview ──────────────────────────────────────────────────────────────
function AppPreview() {
  const features = [
    { Icon: ShieldCheck, title: "Grade-verified listings",  desc: "Every listing shows battery health, cosmetic grade, and a full inspection certificate." },
    { Icon: RefreshCw,   title: "One-tap returns",          desc: "Initiate a return in seconds from your order page — no calls, no forms, no friction." },
    { Icon: BadgeCheck,  title: "Instant price alerts",     desc: "Set a target price on any device and get notified the moment it drops." },
    { Icon: Leaf,        title: "Eco-conscious shopping",   desc: "Every refurbished device means one less device in a landfill — better for the planet." },
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
                        { name: "MacBook Air M2", price: "£849", grade: "A", img: "/products/macbook-air-m2.png" },
                        { name: "AirPods Pro 2",  price: "£149", grade: "C", img: "/products/airpods-pro-2.png" },
                        { name: "iPad Air 5",     price: "£399", grade: "B", img: "/products/ipad-air-5.png" },
                      ].map((p, j) => (
                        <div key={j} className="flex items-center gap-3 bg-zinc-50 rounded-xl p-2">
                          <img
                            src={p.img}
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
                className="absolute hidden sm:block -right-6 top-16 bg-white rounded-2xl p-3.5 shadow-2xl border border-zinc-100 z-20 w-[168px]"
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

              {/* Floating: rating */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute hidden sm:block -right-4 bottom-20 bg-accent text-white rounded-2xl px-3.5 py-2.5 shadow-xl z-20"
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">The TechStop experience</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-tight tracking-tight mb-6">
              Better in every single way
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
              <a href="/trade-in" className="text-sm font-bold text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-1.5">
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
const BUDGET_RANGES = [
  { label: "Under £100",    params: { maxPrice: 100 } as const },
  { label: "£100 – £300",   params: { minPrice: 100, maxPrice: 300 } as const },
  { label: "£300 – £600",   params: { minPrice: 300, maxPrice: 600 } as const },
  { label: "£600 – £1000",  params: { minPrice: 600, maxPrice: 1000 } as const },
  { label: "£1000+",        params: { minPrice: 1000 } as const },
];

function ShopByBudget() {
  const [activeRange, setActiveRange] = useState(0);
  const [cache, setCache] = useState<Record<number, PCard[]>>({});
  const [loading, setLoading] = useState(false);
  const [sectionRef, trigger] = useLazyFetchTrigger();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (trigger > 1) setCache({});
  }, [trigger]);

  useEffect(() => {
    if (trigger === 0) return;
    if (cache[activeRange]) return;
    setLoading(true);
    productsApi.list({ ...BUDGET_RANGES[activeRange].params, limit: 40 })
      .then(r => {
        const mapped: PCard[] = r.items.map(p => ({
          name: p.name,
          type: p.brand,
          spec: String((p.specs as Record<string, unknown>)?.storage ?? p.model ?? "—"),
          price: `£${p.price ?? 0}`,
          was: (p.comparePrice && p.comparePrice > (p.price ?? 0)) ? `£${p.comparePrice}` : null,
          grade: p.condition,
          img: p.images?.[0] ?? "",
          link: `/shop/${p.category.toLowerCase()}/${p.slug}`,
        }));
        setCache(prev => ({ ...prev, [activeRange]: mapped }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeRange, trigger, cache]);

  const products = cache[activeRange] ?? [];

  return (
    <section ref={sectionRef} className="bg-zinc-50 border-y border-zinc-100 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Budget friendly</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
              Shop by price
            </h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {BUDGET_RANGES.map((range, i) => (
              <button
                key={i}
                onClick={() => setActiveRange(i)}
                className={`flex-shrink-0 h-10 px-5 rounded-full font-bold text-sm transition-all duration-200 border ${
                  activeRange === i
                    ? "bg-zinc-950 text-white border-zinc-950"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pl-4 sm:pl-6 lg:pl-8 mx-auto max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRange}
            ref={scrollRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex gap-5 overflow-x-auto scrollbar-hide pr-8 pb-6"
          >
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="w-[220px] md:w-[240px] flex-shrink-0 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-zinc-200 mb-3" />
                  <div className="h-3 bg-zinc-200 rounded-full w-1/3 mb-2" />
                  <div className="h-4 bg-zinc-200 rounded-full w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-200 rounded-full w-1/2 mb-3" />
                  <div className="h-5 bg-zinc-200 rounded-full w-1/3" />
                </div>
              ))
            ) : (
              products.map((p, i) => (
                <div key={i} className="w-[220px] md:w-[240px] flex-shrink-0">
                  <ProductCard {...p} index={i} />
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-2 flex items-center justify-end gap-4">
        <ScrollButtons scrollRef={scrollRef as React.RefObject<HTMLElement | null>} />
        <a
          href="/shop/phones"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-200"
        >
          See all {BUDGET_RANGES[activeRange].label}
          <ArrowRight className="h-4 w-4" />
        </a>
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 80 }).then(r => {
      const filtered = r.items.filter(p => isOtherProduct(p.category, p.images?.[0]));
      setAllProducts(filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)));
    }).catch(() => {});
  }, [trigger]);

  // Category pills sorted by product count descending
  const categoryPills = (() => {
    const countMap = new Map<string, { count: number; img: string }>();
    for (const p of allProducts) {
      const existing = countMap.get(p.category);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(p.category, { count: 1, img: p.images?.[0] ?? "" });
      }
    }
    return Array.from(countMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([cat, { img }]) => ({ name: cat, img, category: cat }));
  })();

  const filtered = selectedCategory === "all"
    ? allProducts
    : allProducts.filter(p => p.category === selectedCategory);

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
    <section ref={sectionRef} className="bg-zinc-50 py-5 md:py-7 overflow-hidden border-t border-zinc-100">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Explore & discover</p>
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
            You might love these
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
          {/* Left Image — static banner for All, product image for categories */}
          <div className={`w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[390px] ${isAllSelected ? "bg-zinc-900" : "bg-[#f5f5f7]"}`}>
            {leftImage && (
              <NextImage
                fill
                src={leftImage}
                alt="Featured product"
                suppressHydrationWarning
                className={isAllSelected ? "object-cover" : "object-contain p-6"}
                sizes="(max-width: 1024px) 100vw, 380px"
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
                <div className={`h-12 w-[64px] rounded-xl border flex items-center justify-center transition-colors ${
                  selectedCategory === "all"
                    ? "bg-zinc-950 border-zinc-950 dark:bg-white dark:border-white"
                    : "bg-image-light border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                }`}>
                  <Zap className={`h-4 w-4 ${selectedCategory === "all" ? "text-accent dark:text-zinc-950" : "text-emerald-600"}`} />
                </div>
                <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 text-center leading-tight">All Deals</span>
              </button>

              {categoryPills.map((pill) => (
                <button
                  key={pill.category}
                  onClick={() => setSelectedCategory(pill.category)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[64px] group"
                >
                  <div className={`h-12 w-[64px] rounded-xl border overflow-hidden flex items-center justify-center transition-colors ${
                    selectedCategory === pill.category
                      ? "border-zinc-950 dark:border-white bg-image-light shadow-sm"
                      : "bg-image-light border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                  }`}>
                    {pill.img
                      ? <NextImage src={pill.img} alt={pill.name} width={36} height={36} className="object-contain mix-blend-multiply" />
                      : <span className="text-[9px] font-bold text-zinc-500 uppercase">{pill.name.slice(0, 3)}</span>
                    }
                  </div>
                  <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 text-center leading-tight truncate w-full">{pill.name}</span>
                </button>
              ))}
            </div>

            {/* Products */}
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 flex-nowrap">
              {filtered.map((p) => {
                const priceStr = (p.price ?? 0).toFixed(2);
                const was = (p.comparePrice && p.comparePrice > (p.price ?? 0)) ? `£${p.comparePrice} new` : null;
                const [pWhole, pDec] = priceStr.split(".");
                const added = addedIds.has(p.id);
                return (
                  <div key={p.id} className="w-[240px] flex-shrink-0 bg-white rounded-xl p-3.5 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col relative group">
                    <Link href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
                      <div className="relative h-32 w-full rounded-xl mb-2 overflow-hidden bg-[#f5f5f7]">
                        {/* Flash Deal Overlay Badge */}
                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-wider shadow-sm">
                          <Zap className="h-2 w-2 fill-white" /> Flash
                        </div>
                        <ProductImage src={p.images?.[0]} alt={p.name} />
                      </div>
                      <p className="font-semibold text-zinc-950 text-[12.5px] leading-snug mb-1 line-clamp-2 hover:underline min-h-[36px]">{p.name}</p>
                    </Link>
                    <div className="flex items-center justify-between mb-2">
                      <GradeBadge condition={p.condition ?? ''} />
                      <div className="flex items-center gap-0.5 text-zinc-950">
                        <Star className="h-3 w-3 fill-zinc-950 text-zinc-950" />
                        <span className="text-[10px] font-bold">{p.rating?.toFixed(1)}</span>
                        <span className="text-[9px] text-zinc-400">({p.reviewCount})</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-2 border-t border-zinc-100 flex items-end justify-between gap-2">
                      <div>
                        {p.price > 0 ? (
                          <>
                            <p className="text-lg font-black text-emerald-700 leading-none">
                              £{pWhole}<span className="text-xs font-bold">.{pDec}</span>
                            </p>
                            <p className="text-[10px] text-zinc-400 line-through mt-0.5">{was}</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-zinc-400 italic">Price on request</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdd(p)}
                        className={`h-8 px-3 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${added ? "bg-emerald-500 text-white border-emerald-500 border" : "border border-zinc-200 text-zinc-950 hover:border-zinc-950 hover:bg-zinc-950 hover:text-white"}`}
                      >
                        {added ? <Check className="h-3 w-3" /> : "+ Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4">
              <ScrollButtons scrollRef={scrollRef as React.RefObject<HTMLElement | null>} />
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 20 }).then(r => setItems(r.items)).catch(() => {});
  }, [trigger]);

  return (
    <section ref={sectionRef} className="py-10 md:py-14 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Just added</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
              New arrivals
            </h2>
          </div>
          <a href="/shop/phones" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors border-b border-zinc-300 pb-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
        <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
        {items.map((item, i) => (
          <Link href={`/shop/${item.category.toLowerCase()}/${item.slug}`} key={i} className="block group flex-shrink-0 w-[220px] md:w-[240px] cursor-pointer">
            <div className="relative aspect-square rounded-3xl bg-image-light overflow-hidden mb-4">
              <ProductImage
                src={item.images?.[0]}
                alt={item.name}
                mode={isOtherProduct(item.category, item.images?.[0]) ? "product" : "cover"}
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 240px"
              />
              <GradeBadge condition={item.condition ?? ''} className="absolute top-3 left-3 z-20" />
              <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-zinc-950 text-white text-[9px] font-bold uppercase tracking-widest">
                New
              </div>
              <button className="absolute bottom-3 right-3 z-20 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                <ShoppingCart className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{item.category}</p>
            <p className="font-bold text-zinc-950 mb-1 truncate">{item.name}</p>
            {item.price > 0 ? (
              <p className="text-lg font-bold text-zinc-950">£{item.price}</p>
            ) : (
              <p className="text-sm font-bold text-zinc-400 italic">Price on request</p>
            )}
          </Link>
        ))}
        <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 flex justify-end">
        <ScrollButtons scrollRef={scrollRef as React.RefObject<HTMLElement | null>} />
      </div>
    </section>
  );
}

// ─── Grade Guide ──────────────────────────────────────────────────────────────
function ConditionMeter({ level, barClass }: { level: 0 | 1 | 2 | 3 | 4; barClass: string }) {
  const bars = 5;
  const filled = [5, 5, 4, 3, 1][level];
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

function PhoneSketch({ level }: { level: 0 | 1 | 2 | 3 }) {
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

      {/* ── NEW / A Grade: verified badge ── */}
      {level === 0 && (
        <g>
          <circle cx="88" cy="44" r="14" fill="#10b981" fillOpacity="0.9"/>
          <path d="M81 44 L86 49 L96 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}

      {/* ── B Grade: one faint scratch + magnifier callout ── */}
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

      {/* ── C Grade: multiple prominent scratches + warning badge ── */}
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

      {/* ── F Grade: large X + red broken circle ── */}
      {level === 3 && (
        <>
          <line x1="22" y1="52" x2="88" y2="138" stroke="white" strokeOpacity="0.6" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="88" y1="52" x2="22" y2="138" stroke="white" strokeOpacity="0.6" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="30" y1="40" x2="52" y2="66"  stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="60" y1="118" x2="82" y2="148" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Red X badge */}
          <circle cx="88" cy="44" r="14" fill="#b91c1c" fillOpacity="0.9"/>
          <line x1="82" y1="38" x2="94" y2="50" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="94" y1="38" x2="82" y2="50" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </>
      )}
    </svg>
  );
}

function GradeGuide() {
  const [gradeImgs, setGradeImgs] = useState<(string | null)[]>([null, null, null, null, null]);
  const [gradeProducts, setGradeProducts] = useState<Record<string, { name: string; price: string; link: string }[]>>({});
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    bannersApi.random(5).then(b => setGradeImgs(b.map(x => x.url ?? null))).catch(() => {});
    for (const condition of ["NEW", "A", "B", "C", "F"]) {
      productsApi.list({ condition, limit: 3 })
        .then(res => {
          if (res.items.length === 0) return;
          setGradeProducts(prev => ({
            ...prev,
            [condition]: res.items.map(p => ({
              name: p.name,
              price: p.price != null ? `£${p.price}` : "POA",
              link: `/shop/${p.category.toLowerCase()}/${p.slug}`,
            })),
          }));
        })
        .catch(() => {});
    }
  }, [trigger]);

  const grades: {
    condition: string;
    num: string; name: string; tagline: string;
    battery: number; saving: number; fromPrice: string;
    rating: number; reviewCount: string;
    conditionLabel: string; sketchLevel: 0 | 1 | 2 | 3; conditionLevel: 0 | 1 | 2 | 3 | 4;
    featured: boolean; partsOnly: boolean;
    img: string | null; features: string[];
    products: { name: string; price: string; link: string }[];
    barClass: string; textClass: string;
    chipBg: string; featuredRing: string;
  }[] = [
    {
      condition: "NEW",
      num: "01", name: "New", tagline: "Brand new, sealed or equivalent.",
      battery: 100, saving: 10, fromPrice: "From £329",
      rating: 5.0, reviewCount: "1,200", conditionLabel: "Sealed box",
      sketchLevel: 0, conditionLevel: 0, featured: false, partsOnly: false,
      img: gradeImgs[0],
      features: ["Brand new in original sealed packaging", "Full manufacturer warranty included", "All original accessories in box", "25/25 inspection points passed"],
      products: [{ name: "iPhone 15", price: "£729", link: "/shop/phones" }, { name: "MacBook Air M3", price: "£1,099", link: "/shop/laptops" }, { name: "Galaxy S24", price: "£799", link: "/shop/phones" }],
      barClass: "bg-zinc-400", textClass: "text-zinc-300",
      chipBg: "bg-white/10", featuredRing: "",
    },
    {
      condition: "A",
      num: "02", name: "A Grade", tagline: "Used but like new — zero visible marks.",
      battery: 95, saving: 20, fromPrice: "From £249",
      rating: 4.9, reviewCount: "4,200", conditionLabel: "Zero marks",
      sketchLevel: 0, conditionLevel: 1, featured: true, partsOnly: false,
      img: gradeImgs[1],
      features: ["No visible marks — like new appearance", "Battery 95%+ certified by engineers", "All ports, cameras & buttons tested", "25/25 inspection points passed"],
      products: [{ name: "iPhone 15 Pro", price: "£739", link: "/shop/phones" }, { name: "MacBook Pro M3", price: "£1,699", link: "/shop/laptops" }, { name: "Galaxy S24 Ultra", price: "£899", link: "/shop/phones" }],
      barClass: "bg-emerald-500", textClass: "text-emerald-400",
      chipBg: "bg-emerald-500/20", featuredRing: "border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20",
    },
    {
      condition: "B",
      num: "03", name: "B Grade", tagline: "Minor signs of usage, small scratches.",
      battery: 85, saving: 35, fromPrice: "From £149",
      rating: 4.7, reviewCount: "12,400", conditionLabel: "Minor scratches",
      sketchLevel: 1, conditionLevel: 2, featured: false, partsOnly: false,
      img: gradeImgs[2],
      features: ["Minor scratches not visible in normal use", "Battery 85%+ certified by engineers", "All ports, cameras & buttons tested", "Thoroughly cleaned and sanitised"],
      products: [{ name: "iPhone 14 Pro", price: "£549", link: "/shop/phones" }, { name: "MacBook Air M2", price: "£849", link: "/shop/laptops" }, { name: "Samsung S23", price: "£429", link: "/shop/phones" }],
      barClass: "bg-blue-500", textClass: "text-blue-400",
      chipBg: "bg-blue-500/20", featuredRing: "",
    },
    {
      condition: "C",
      num: "04", name: "C Grade", tagline: "Heavy scratches or marks, fully working.",
      battery: 75, saving: 50, fromPrice: "From £99",
      rating: 4.5, reviewCount: "8,900", conditionLabel: "Visible marks",
      sketchLevel: 2, conditionLevel: 3, featured: false, partsOnly: false,
      img: gradeImgs[3],
      features: ["Visible scratches or scuffs on body", "Battery 75%+ certified by engineers", "All features 100% working", "Best price-to-performance ratio"],
      products: [{ name: "iPhone 13", price: "£299", link: "/shop/phones" }, { name: "MacBook Air M1", price: "£649", link: "/shop/laptops" }, { name: "Pixel 7 Pro", price: "£349", link: "/shop/phones" }],
      barClass: "bg-amber-500", textClass: "text-amber-400",
      chipBg: "bg-amber-500/20", featuredRing: "",
    },
    {
      condition: "F",
      num: "05", name: "F Grade", tagline: "Non-working — for parts or repair only.",
      battery: 0, saving: 70, fromPrice: "From £29",
      rating: 4.3, reviewCount: "2,100", conditionLabel: "For Parts",
      sketchLevel: 3, conditionLevel: 4, featured: false, partsOnly: true,
      img: gradeImgs[4],
      features: ["Non-functional — sold as-is, no warranty", "Ideal for spares, repairs & DIY", "Heavily discounted for quick resale", "Full description of known faults listed"],
      products: [{ name: "iPhone 12 (Parts)", price: "£59", link: "/shop/phones" }, { name: "Samsung S21 (Parts)", price: "£49", link: "/shop/phones" }, { name: "Pixel 6 (Parts)", price: "£39", link: "/shop/phones" }],
      barClass: "bg-red-700", textClass: "text-red-400",
      chipBg: "bg-red-700/20", featuredRing: "",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-zinc-950 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">How grading works</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-none tracking-tight">
              What does each grade mean?
            </h2>
          </div>
          <p className="text-zinc-500 text-base max-w-[42ch] leading-relaxed">
            Every device is independently tested before listing. Pick the grade that fits your budget — all are 100% functional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
          {grades.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative rounded-[2rem] overflow-hidden flex flex-col group hover:-translate-y-1.5 transition-all duration-300 border bg-zinc-950/40 backdrop-blur-sm ${
                g.featured
                  ? g.featuredRing
                  : g.condition === "NEW"
                  ? "border-zinc-800/80 hover:border-zinc-600/80"
                  : g.condition === "B"
                  ? "border-zinc-800/80 hover:border-blue-500/50"
                  : g.condition === "C"
                  ? "border-zinc-800/80 hover:border-amber-500/50"
                  : g.condition === "F"
                  ? "border-zinc-800/80 hover:border-rose-500/50"
                  : "border-zinc-800/80 hover:border-zinc-700/80"
              }`}
            >
              {/* ── Photo panel ── */}
              <div className="relative h-[380px] overflow-hidden flex-shrink-0">
                {/* Product photo */}
                {g.img && (
                  <NextImage
                    fill
                    src={g.img}
                    alt={g.name}
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  />
                )}
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
                  {!g.partsOnly && (
                    <div className={`${g.chipBg} backdrop-blur-md border border-white/10 rounded-xl px-3 py-2`}>
                      <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest mb-0.5">Battery</p>
                      <p className={`text-sm font-bold ${g.textClass}`}>{g.battery}%+</p>
                    </div>
                  )}
                  <div className={`${g.partsOnly ? g.chipBg : 'bg-white/10'} backdrop-blur-md border border-white/10 rounded-xl px-3 py-2`}>
                    <p className="text-[8px] text-white/50 font-bold uppercase tracking-widest mb-0.5">Condition</p>
                    <p className={`text-sm font-bold ${g.partsOnly ? g.textClass : 'text-white'}`}>{g.conditionLabel}</p>
                  </div>
                </div>

                {/* Phone sketch — centred */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="opacity-90 group-hover:opacity-100 transition-opacity mt-6 block">
                    <PhoneSketch level={g.sketchLevel} />
                  </div>
                </div>

                {/* Bottom: grade name + price */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="mb-2.5">
                        <GradeBadge condition={g.condition} />
                      </div>
                      <p className="font-sans text-3xl font-extrabold text-white leading-none tracking-tight">{g.name}</p>
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
              <div className="bg-zinc-900/60 flex-1 p-6 flex flex-col gap-4 border-t border-zinc-800/60 rounded-b-[2rem]">

                {/* Condition meter */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Condition score</p>
                    <ConditionMeter level={g.conditionLevel} barClass={g.barClass} />
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
                {g.partsOnly ? (
                  <div className="flex items-center gap-2 py-1">
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${g.barClass}`} />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${g.textClass}`}>Non-working — parts &amp; repair only</p>
                  </div>
                ) : (
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
                )}

                {/* Popular devices */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Popular in {g.name}</p>
                  <div className="flex flex-col gap-1.5">
                    {(gradeProducts[g.condition] ?? g.products).map((p, j) => (
                      <Link key={j} href={p.link} className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2 hover:bg-zinc-700/60 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full ${g.barClass}`} />
                          <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">{p.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${g.textClass} flex-shrink-0 ml-2`}>{p.price}</span>
                      </Link>
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


// ─── Savings Comparison ───────────────────────────────────────────────────────
function SavingsComparison() {
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    productsApi.list({ limit: 100 }).then(r => {
      const main = r.items
        .filter(p =>
          !isOtherProduct(p.category, p.images?.[0]) &&
          p.price != null && p.price > 0 &&
          p.comparePrice && p.comparePrice > p.price
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 6);
      setRawProducts(main);
    }).catch(() => {});
  }, [trigger]);

  const items = rawProducts
    .filter(p => p.price != null && p.price > 0 && p.comparePrice && p.comparePrice > p.price)
    .map(p => ({
      device: p.name,
      newPrice: p.comparePrice as number,
      ourPrice: p.price as number,
      grade: p.condition,
      img: p.images?.[0] ?? "",
      slug: p.slug,
      category: p.category,
    }));

  return (
    <section ref={sectionRef} className="py-24 bg-white border-t border-zinc-100 min-h-[200px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Why refurbished?</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
              Refurbished vs retail
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
                      className="group flex items-center gap-3 md:gap-6 p-3 md:p-5 rounded-2xl border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer"
                    >
                      <div className="relative h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-image-light flex-shrink-0 overflow-hidden">
                        <ProductImage src={item.img} alt={item.device} hover={false} sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-950 text-xs sm:text-sm truncate">{item.device}</p>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-0.5 ${getGradeConfig(item.grade ?? '').textClass}`}>{getGradeConfig(item.grade ?? '').label} · Certified</p>
                      </div>
                      <div className="hidden sm:block text-right flex-shrink-0 min-w-[80px]">
                        <p className="text-zinc-300 line-through text-sm font-bold">£{item.newPrice.toLocaleString()}</p>
                        <p className="text-[10px] font-bold uppercase text-zinc-400 mt-0.5">Retail</p>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-[64px] sm:min-w-[80px]">
                        <p className="text-sm sm:text-xl md:text-2xl font-bold text-zinc-950">£{item.ourPrice.toLocaleString()}</p>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase text-zinc-400 mt-0.5">TechStop</p>
                      </div>
                      <div className="flex-shrink-0 h-12 w-[72px] sm:h-14 sm:w-[90px] bg-accent rounded-2xl flex flex-col items-center justify-center text-white">
                        <p className="text-xs sm:text-base font-bold leading-none">-{pct}%</p>
                        <p className="text-[7px] sm:text-[9px] font-bold text-white/90 mt-0.5">Save £{saving}</p>
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
  price: string; was?: string | null; grade: string; img: string; index?: number;
  link?: string;
}
function ProductCard({ name, type, spec, price, was, grade, img, index = 0, link = "/shop/phones" }: PCard) {
  const numericPrice = Number(price.replace(/[^0-9.]/g, ""));
  const isUnpriced = !numericPrice;
  const numericWas = was ? Number(was.replace(/[^0-9.]/g, "")) : 0;
  const pct = isUnpriced || !numericWas ? 0 : Math.round((1 - numericPrice / numericWas) * 100);
  return (
    <Link href={link} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="cursor-pointer"
      >
        <div className="relative aspect-square rounded-2xl bg-image-light overflow-hidden mb-3 ring-1 ring-zinc-200/10 group-hover:ring-transparent group-hover:shadow-xl transition-all duration-300">
          <ProductImage src={img} alt={name} />
          <GradeBadge condition={grade ?? ''} className="absolute top-3 left-3 z-20" />
          {!isUnpriced && pct > 0 && <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded-full bg-accent text-white text-[9px] font-bold">-{pct}%</div>}
          <button className="absolute bottom-3 right-3 z-20 h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{type}</p>
        <p className="font-bold text-zinc-950 text-sm leading-tight truncate mb-1">{name}</p>
        <p className="text-[11px] text-zinc-400 mb-2 truncate">{spec}</p>
        {isUnpriced ? (
          <span className="text-sm font-bold text-zinc-400 italic">Price on request</span>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-zinc-950">{price}</span>
            {was && <span className="text-xs text-zinc-400 line-through">{was}</span>}
            {pct > 0 && <span className="text-xs font-bold text-emerald-600">-{pct}%</span>}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

// ─── Featured Shop (sticky tabs + animated product grid) ──────────────────────
const CAT_SLUG_ORDER = ["phones", "laptops", "tablets", "audio", "consoles"];

function FeaturedShop() {
  const [categories, setCategories] = useState<import('../lib/api').CatalogCategory[]>([]);
  const [active, setActive] = useState("");
  const [cache, setCache] = useState<Record<string, PCard[]>>({});
  const [loading, setLoading] = useState(false);
  const [sectionRef, trigger] = useLazyFetchTrigger();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    catalogApi.listCategories()
      .then(cats => {
        const mainCats = cats
          .filter(c => CAT_SLUG_ORDER.includes(c.slug))
          .sort((a, b) => CAT_SLUG_ORDER.indexOf(a.slug) - CAT_SLUG_ORDER.indexOf(b.slug));
        setCategories(mainCats);
        if (mainCats.length > 0) setActive(mainCats[0].slug);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (trigger > 1) {
      setCache({});
    }
  }, [trigger]);

  useEffect(() => {
    if (trigger === 0 || !active) return;
    if (cache[active]) return;
    const cat = categories.find(c => c.slug === active);
    if (!cat) return;
    setLoading(true);
    productsApi.list({ category: cat.name, limit: 20 })
      .then(r => {
        const mapped: PCard[] = r.items.map(p => ({
          name: p.name,
          type: p.brand,
          spec: String((p.specs as Record<string, unknown>)?.storage ?? p.model ?? "—"),
          price: `£${p.price ?? 0}`,
          was: (p.comparePrice && p.comparePrice > (p.price ?? 0)) ? `£${p.comparePrice}` : null,
          grade: p.condition,
          img: p.images?.[0] ?? "",
          link: `/shop/${active}/${p.slug}`,
        }));
        const shuffled = mapped.sort(() => Math.random() - 0.5);
        setCache(prev => ({ ...prev, [active]: shuffled }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [active, trigger, cache, categories]);

  const filtered = cache[active] ?? [];

  return (
    <section ref={sectionRef} id="shop" className="py-16 border-t border-zinc-100 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Trending favorites</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
              Shop our most wanted
            </h2>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActive(cat.slug)}
                className={`flex-shrink-0 h-10 px-5 rounded-full font-bold text-sm transition-all duration-200 border ${
                  active === cat.slug
                    ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white dark:hover:border-zinc-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Grid */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            ref={scrollRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-6"
          >
            {loading ? (
              <>
                <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-[220px] md:w-[240px] flex-shrink-0 animate-pulse">
                    <div className="aspect-square rounded-2xl bg-zinc-100 mb-3" />
                    <div className="h-3 bg-zinc-100 rounded-full w-1/3 mb-2" />
                    <div className="h-4 bg-zinc-100 rounded-full w-3/4 mb-2" />
                    <div className="h-3 bg-zinc-100 rounded-full w-1/2 mb-3" />
                    <div className="h-5 bg-zinc-100 rounded-full w-1/3" />
                  </div>
                ))}
                <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
              </>
            ) : (
              <>
                <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
                {filtered.map((p, i) => (
                  <div key={`${active}-${i}`} className="w-[220px] md:w-[240px] flex-shrink-0">
                    <ProductCard {...p} index={i} />
                  </div>
                ))}
                <div className="w-[220px] md:w-[240px] flex-shrink-0 flex rounded-2xl border border-zinc-200/60 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-md transition-all duration-300">
                  <Link
                    href={`/shop/${active || "phones"}`}
                    className="flex flex-col items-center justify-center gap-4 w-full p-6 text-zinc-500 hover:text-zinc-950 transition-colors group text-center"
                  >
                    <div className="h-12 w-12 rounded-full border-2 border-zinc-300 group-hover:border-zinc-950 flex items-center justify-center group-hover:bg-zinc-950 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md">
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </div>
                    <span className="font-bold text-xs uppercase tracking-widest leading-relaxed">
                      See all<br />{categories.find(c => c.slug === active)?.name ?? active}
                    </span>
                  </Link>
                </div>
                <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 flex justify-end">
          <ScrollButtons scrollRef={scrollRef as React.RefObject<HTMLElement | null>} />
        </div>
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
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [activeBrand, setActiveBrand] = useState<string>("all");
  const [cache, setCache] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load "All" and brands on mount — no lazy trigger needed for this section
  useEffect(() => {
    bannersApi.random(1).then(b => setDeskImg(b[0]?.url ?? null)).catch(() => {});
    catalogApi.listBrands()
      .then(res => setBrands(res.filter(b => MAIN_BRANDS.has(b.slug.toLowerCase()))))
      .catch(() => {});
    // Fetch "all" — larger limit so filtering out "others" still leaves ~20 main products
    setLoading(true);
    productsApi.list({ limit: 100 })
      .then(r => {
        const filtered = r.items
          .filter(p => !isOtherProduct(p.category, p.images?.[0]))
          .sort(() => Math.random() - 0.5)
          .slice(0, 20);
        setCache({ all: filtered });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch brand-specific (or "all") products when activeBrand changes
  useEffect(() => {
    if (cache[activeBrand]?.length) return;
    setLoading(true);
    if (activeBrand === "all") {
      productsApi.list({ limit: 100 })
        .then(r => {
          const filtered = r.items
            .filter(p => !isOtherProduct(p.category, p.images?.[0]))
            .sort(() => Math.random() - 0.5)
            .slice(0, 20);
          setCache(prev => ({ ...prev, all: filtered }));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      productsApi.list({ brand: activeBrand, limit: 20 })
        .then(r => {
          const shuffled = r.items.sort(() => Math.random() - 0.5);
          setCache(prev => ({ ...prev, [activeBrand]: shuffled }));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [activeBrand]);

  const products = cache[activeBrand] ?? [];

  return (
    <section className="bg-zinc-50 py-8 md:py-12 border-t border-zinc-100 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Direct to consumer</p>
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
            Top brands, refurbished
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
          {/* Left Image */}
          <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[420px]">
            {deskImg && (
              <NextImage
                fill
                src={deskImg}
                alt="Desk with tech"
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 360px"
              />
            )}
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Brand tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* All tab */}
              <button
                onClick={() => setActiveBrand("all")}
                className={`flex-shrink-0 h-10 px-5 rounded-full font-bold text-sm transition-all duration-200 border ${
                  activeBrand === "all"
                    ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white dark:hover:border-zinc-400"
                }`}
              >
                All
              </button>

              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand.name)}
                  className={`flex-shrink-0 h-10 px-4 rounded-full font-bold text-sm transition-all duration-200 border flex items-center gap-2 ${
                    activeBrand === brand.name
                      ? "bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-zinc-950 dark:border-white"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-950 hover:text-zinc-950 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-white dark:hover:border-zinc-400"
                  }`}
                >
                  {brand.logo && (
                    <NextImage
                      src={brand.logo}
                      alt={brand.name}
                      width={20}
                      height={20}
                      className={`object-contain flex-shrink-0 ${
                        activeBrand === brand.name
                          ? "brightness-0 invert dark:brightness-100 dark:invert-0"
                          : "dark:brightness-0 dark:invert"
                      }`}
                    />
                  )}
                  {brand.name}
                </button>
              ))}
            </div>

            {/* Products horizontal scroll */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBrand}
                ref={scrollRef}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
              >
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="w-[220px] flex-shrink-0 animate-pulse">
                      <div className="h-44 rounded-xl bg-zinc-200 mb-3" />
                      <div className="h-3 bg-zinc-200 rounded-full w-3/4 mb-2" />
                      <div className="h-3 bg-zinc-200 rounded-full w-1/2 mb-3" />
                      <div className="h-5 bg-zinc-200 rounded-full w-1/3" />
                    </div>
                  ))
                ) : products.map((p, i) => {
                  const comparePrice = (p.comparePrice && p.comparePrice > p.price) ? p.comparePrice : null;
                  const ratingFilled = Math.round(p.rating ?? 4);
                  return (
                    <Link
                      key={p.id ?? i}
                      href={`/shop/${CAT_SLUG[p.category] ?? p.category.toLowerCase()}/${p.slug}`}
                      className="w-[220px] flex-shrink-0 bg-white rounded-xl p-4 border border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col group cursor-pointer"
                    >
                      <div className="relative h-40 w-full rounded-xl mb-3 overflow-hidden bg-image-light">
                        <ProductImage src={p.images?.[0]} alt={p.name} />
                        <GradeBadge condition={p.condition ?? ''} className="absolute top-2 left-2 z-20" />
                      </div>
                      <p className="font-semibold text-zinc-950 text-[13px] leading-snug mb-2 line-clamp-2">{p.name}</p>
                      <div className="flex items-center gap-1 mb-auto">
                        {[...Array(5)].map((_, k) => <Star key={k} className={`h-3 w-3 ${k < ratingFilled ? "fill-zinc-950 text-zinc-950" : "fill-zinc-200 text-zinc-200"}`} />)}
                        <span className="text-[10px] font-bold text-zinc-400 ml-1">{(p.rating ?? 0).toFixed(1)}/5 ({p.reviewCount ?? 0})</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-zinc-100">
                        {p.price > 0 ? (
                          <>
                            <p className="text-xl font-bold text-zinc-950">£{p.price}</p>
                            <p className="text-[11px] text-zinc-400 line-through">£{comparePrice} new</p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-zinc-400 italic">Price on request</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-end mt-2">
              <ScrollButtons scrollRef={scrollRef as React.RefObject<HTMLElement | null>} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Discover More ────────────────────────────────────────────────────────────
const DISCOVER_ROWS = [
  { eyebrow: "Recommended",       title: "You might",     italic: "love these.",      params: { limit: 20, page: 1 } },
  { eyebrow: "Popular this week", title: "Trending",      italic: "right now.",       params: { limit: 20, page: 2 } },
  { eyebrow: "Great savings",     title: "Big discounts", italic: "on top tech.",     params: { limit: 20, page: 3 } },
  { eyebrow: "Fresh stock",       title: "Just",          italic: "landed.",          params: { limit: 20, page: 4 } },
];

function DiscoverMore() {
  const [rows, setRows] = useState<PCard[][]>(DISCOVER_ROWS.map(() => []));
  const [sectionRef, trigger] = useLazyFetchTrigger();
  const rowScrollRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const toCard = (p: any): PCard => ({
      name: p.name,
      type: p.brand,
      spec: String((p.specs as any)?.storage ?? p.model ?? p.condition),
      price: `£${p.price ?? 0}`,
      was: (p.comparePrice && p.comparePrice > (p.price ?? 0)) ? `£${p.comparePrice}` : null,
      grade: p.condition,
      img: p.images?.[0] ?? "",
      link: `/shop/${p.category.toLowerCase()}/${p.slug}`,
    });
    Promise.all(
      DISCOVER_ROWS.map(r =>
        productsApi.list(r.params)
          .then(res => res.items
            .filter(p => !isOtherProduct(p.category, p.images?.[0]))
            .sort(() => Math.random() - 0.5)
            .map(toCard)
          )
          .catch(() => [] as PCard[])
      )
    ).then(setRows);
  }, [trigger]);

  const hasData = rows.some(r => r.length > 0);
  if (!hasData) return <section ref={sectionRef} className="min-h-[1px]" />;

  return (
    <section ref={sectionRef} className="py-10 bg-white overflow-hidden">
      {DISCOVER_ROWS.map((row, i) => {
        const items = rows[i];
        if (items.length === 0) return null;
        return (
          <div key={i} className="mb-14 last:mb-0">
            <div className="flex items-end justify-between mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">{row.eyebrow}</p>
                <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-zinc-950 leading-none tracking-tight">
                  {row.title} {row.italic}
                </h2>
              </div>
              <a href="/shop/phones" className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div
              ref={el => { rowScrollRefs.current[i] = el; }}
              className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 sm:pl-6 lg:pl-8 pr-8 pb-2"
            >
              {items.map((p, j) => (
                <Link href={p.link ?? "/shop/phones"} key={j} className="block flex-shrink-0 w-[190px] md:w-[210px] group cursor-pointer">
                  <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: j * 0.05 }}
                    className="w-full"
                  >
                    <div className="relative aspect-square rounded-2xl bg-zinc-100 overflow-hidden mb-3 group-hover:shadow-lg transition-shadow duration-300">
                      <ProductImage
                        src={p.img}
                        alt={p.name}
                        mode={isOtherProduct(p.type, p.img) ? "product" : "cover"}
                        sizes="(max-width: 640px) 50vw, 210px"
                      />
                      <GradeBadge condition={p.grade ?? ''} className="absolute top-2.5 left-2.5 z-20" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{p.type}</p>
                    <p className="font-bold text-zinc-950 text-xs leading-tight truncate mb-1.5">{p.name}</p>
                    {Number(p.price.replace(/[^0-9.]/g, "")) > 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-zinc-950">{p.price}</span>
                        {p.was && <span className="text-[11px] text-zinc-400 line-through">{p.was}</span>}
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-zinc-400 italic">Price on request</span>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-3 flex justify-end">
              <ScrollButtons scrollRef={{ get current() { return rowScrollRefs.current[i]; } } as React.RefObject<HTMLElement | null>} />
            </div>
          </div>
        );
      })}
    </section>
  );
}

// ─── Budget Picks ──────────────────────────────────────────────────────────────
const BUDGET_ROWS = [
  { title: "Under £100",   badge: "Great Value",      params: { maxPrice: 100 } },
  { title: "£100 – £300",  badge: "Best Sellers",     params: { minPrice: 100, maxPrice: 300 } },
  { title: "£300 – £600",  badge: "Most Popular",     params: { minPrice: 300, maxPrice: 600 } },
  { title: "£600 – £1000", badge: "Premium Picks",    params: { minPrice: 600, maxPrice: 1000 } },
  { title: "£1000+",       badge: "Top of the Range", params: { minPrice: 1000 } },
];

function BudgetPicks() {
  const [rows, setRows] = useState<PCard[][]>(BUDGET_ROWS.map(() => []));
  const [sectionRef, trigger] = useLazyFetchTrigger();

  useEffect(() => {
    if (trigger === 0) return;
    const toCard = (p: any): PCard => ({
      name: p.name,
      type: p.brand,
      spec: String((p.specs as any)?.storage ?? p.model ?? p.condition),
      price: `£${p.price ?? 0}`,
      was: (p.comparePrice && p.comparePrice > (p.price ?? 0)) ? `£${p.comparePrice}` : null,
      grade: p.condition,
      img: p.images?.[0] ?? "",
      link: `/shop/${p.category.toLowerCase()}/${p.slug}`,
    });
    Promise.all(
      BUDGET_ROWS.map(r =>
        productsApi.list({ ...r.params, limit: 40 })
          .then(res => res.items.map(toCard))
          .catch(() => [] as PCard[])
      )
    ).then(setRows);
  }, [trigger]);

  function PriceRow({ title, badge, items }: { title: string; badge: string; items: PCard[] }) {
    const priceRowScrollRef = useRef<HTMLDivElement | null>(null);
    if (items.length === 0) return null;
    return (
      <div className="mb-12 last:mb-0">
        <div className="flex items-center justify-between mb-6 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-950">{title}</h3>
            <span className="px-3 py-1 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{badge}</span>
          </div>
          <a href="/shop/phones" className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div ref={priceRowScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
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
                  <ProductImage
                    src={p.img}
                    alt={p.name}
                    mode={isOtherProduct(p.type, p.img) ? "product" : "cover"}
                    sizes="(max-width: 640px) 50vw, 210px"
                  />
                  <GradeBadge condition={p.grade ?? ''} className="absolute top-2.5 left-2.5 z-20" />
                  <button className="absolute bottom-2.5 right-2.5 z-20 h-9 w-9 rounded-full bg-zinc-950 text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
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
          <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-3 flex justify-end">
          <ScrollButtons scrollRef={priceRowScrollRef as React.RefObject<HTMLElement | null>} />
        </div>
      </div>
    );
  }

  const hasData = rows.some(r => r.length > 0);

  return (
    <section ref={sectionRef} className="py-20 bg-zinc-50 border-y border-zinc-100 overflow-hidden min-h-[200px]">
      {hasData && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Pocket friendly</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 leading-none tracking-tight">
              Budget deals
            </h2>
          </div>
          {BUDGET_ROWS.map((r, i) => (
            <PriceRow key={i} title={r.title} badge={r.badge} items={rows[i]} />
          ))}
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
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Sell with TechStop</p>
            <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
              Your old tech is worth more than you think
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Get an instant quote, free collection, and same-week payment. No hassle, no lowball offers.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 lg:justify-end">
            <a href="/trade-in" className="h-14 px-8 bg-accent text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-dark transition-colors">
              Get instant quote <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/trade-in" className="h-14 px-8 border border-zinc-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center hover:border-zinc-400 transition-colors">
              How it works
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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => setMounted(true), []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setStatus("error");
      setErrorMsg("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      if (typeof window !== "undefined") {
        localStorage.setItem("ts_newsletter_subscribed", "true");
      }
    }, 1000);
  };

  return (
    <section className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/20 py-20 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2.5">Stay in the loop</p>
          <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-zinc-950 dark:text-white leading-tight tracking-tight mb-4">
            Deals before they sell out
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-10">Weekly drops, exclusive discounts, and e-waste reports. No spam.</p>
          
          {mounted ? (
            <div className="max-w-md mx-auto">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl text-left flex items-start gap-4"
                  >
                    <div className="h-10 w-10 bg-emerald-500/10 dark:bg-emerald-500/25 rounded-full flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">Successfully Subscribed!</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">Thank you! We've sent a welcome code with 10% discount to your email.</p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === "error") setStatus("idle");
                        }}
                        disabled={status === "loading"}
                        placeholder="you@example.com"
                        className={`h-14 flex-1 px-6 rounded-2xl bg-white dark:bg-zinc-900 border ${
                          status === "error" 
                            ? "border-red-500 focus:ring-red-500" 
                            : "border-zinc-200 dark:border-zinc-800 focus:ring-accent"
                        } text-sm font-medium outline-none focus:ring-2 transition-all text-foreground` }
                      />
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="h-14 px-7 bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-2xl font-bold text-sm transition-colors flex-shrink-0 flex items-center justify-center min-w-[120px]"
                      >
                        {status === "loading" ? (
                          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          "Subscribe"
                        )}
                      </button>
                    </div>
                    {status === "error" && (
                      <p className="text-left text-xs font-bold text-red-500 px-2 mt-1">{errorMsg}</p>
                    )}
                  </form>
                )}
              </AnimatePresence>
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

// ─── Store Location Section ──────────────────────────────────────────────────
function StoreLocationSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  useEffect(() => {
    storesApi.list()
      .then(data => {
        setStores(data);
        if (data.length > 0) {
          setSelectedStoreId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const storeName = activeStore?.name || "TechStop Leicester";
  const storeAddress = activeStore ? `${activeStore.address}, ${activeStore.city} ${activeStore.postcode}` : "104 High St, Leicester LE1 5YP";
  const storeHours = activeStore?.openingHours || "Mon–Sat, 9:00 AM – 6:00 PM";
  const storePhone = activeStore?.phone || "07343055398";
  const mapsLink = activeStore ? `https://maps.google.com/?q=${encodeURIComponent(`${activeStore.name}, ${activeStore.address}, ${activeStore.city} ${activeStore.postcode}`)}` : "https://maps.google.com/?q=104+High+St,+Leicester+LE1+5YP";

  return (
    <section className="relative py-24 bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans border-t border-b border-zinc-200/60 dark:border-zinc-900/80">
      
      {/* Premium Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-zinc-400/10 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left info column */}
          <div className="lg:col-span-5 flex flex-col items-start text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm shadow-red-500/5">
              <MapPin className="h-3.5 w-3.5" />
              Our Retail Outlets
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.05] mb-6">
              Visit us in store.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-zinc-900 dark:from-red-500 dark:via-red-400 dark:to-white">Express trade-in &amp; repairs.</span>
            </h2>
            
            <p className="text-zinc-600 dark:text-zinc-400 font-semibold text-base md:text-lg mb-8 leading-relaxed max-w-lg">
              Drop by our retail outlet for instant diagnostics, same-day screen/battery repairs in under 45 minutes, or get cash on the spot for your old hardware. No appointment necessary.
            </p>

            {stores.length > 1 && (
              <div className="w-full mb-8 relative z-20">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">Select Store Location</label>
                <div className="relative">
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="appearance-none h-14 w-full max-w-md rounded-xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 px-5 pr-10 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-red-500 dark:focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all shadow-sm"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id} className="text-zinc-900 dark:text-zinc-900">{s.name} ({s.city})</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            )}

            <div className="relative w-full max-w-md bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] border border-white/50 dark:border-zinc-800/80 p-6 sm:p-8 space-y-6 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              
              <div className="flex gap-4 items-start group">
                <div className="h-11 w-11 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 text-red-600 dark:text-red-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none mb-1.5">Store Address</span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{storeAddress}</span>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="h-11 w-11 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 text-red-600 dark:text-red-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none mb-1.5">Opening Hours</span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{storeHours}</span>
                </div>
              </div>

              <div className="flex gap-4 items-start group">
                <div className="h-11 w-11 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300 text-red-600 dark:text-red-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block leading-none mb-1.5">Store Contact</span>
                  <a href={`tel:${storePhone}`} className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 hover:text-red-500 dark:hover:text-red-400 transition-colors">{storePhone}</a>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-8 py-4.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 text-center overflow-hidden hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2 group-hover:text-white">Get Directions <MapPin className="h-4 w-4" /></span>
              </a>
              <Link
                href="/repair"
                className="px-8 py-4.5 bg-white/50 hover:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white backdrop-blur-md rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 text-center border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95"
              >
                Book a Repair
              </Link>
            </div>
          </div>

          {/* Right map column */}
          <div className="lg:col-span-7 w-full h-[450px] lg:h-[600px] rounded-[2.5rem] overflow-hidden border-[6px] border-white/50 dark:border-zinc-800/30 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative group bg-zinc-100 dark:bg-zinc-950 backdrop-blur-sm z-10">
            <div className="absolute inset-0 bg-red-500/5 pointer-events-none z-10 mix-blend-overlay"></div>
            <iframe
              title="TechStop Store Locations Map"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
              className="w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      <PromoCarouselBanner />
      <MarqueeStrip />
      {/* <Hero /> */}
      <BrandsBar />
      <TradeInCTASection />

      {/* <CategoryBento /> */}
      <FeaturedShop />
      <TopBrandsSplit />
      <NewArrivals />
      <BestDealsSplit />
      <DiscoverMore />
      <BudgetPicks />
      <TrustPillars />
      <SavingsComparison />
      <HowItWorks />
      <GradeGuide />
      <AppPreview />
      <Reviews />

      <SellCTA />
      <StoreLocationSection />
      <Footer />
    </main>
  );
}
