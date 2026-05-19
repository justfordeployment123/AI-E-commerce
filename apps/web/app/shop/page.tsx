"use client";

import React, { useState } from "react";
import {
  Smartphone, Laptop, Tablet, Headphones, Gamepad2,
  ShoppingCart, Star, Check, ArrowRight, ArrowLeft, SlidersHorizontal,
  ChevronDown, X, ShieldCheck, RefreshCw, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const CATEGORIES = [
  { id: "all",        label: "All Products",    icon: Zap,         count: 2847 },
  { id: "phones",     label: "Smartphones",     icon: Smartphone,  count: 1240 },
  { id: "laptops",    label: "Laptops",         icon: Laptop,      count: 384  },
  { id: "tablets",    label: "Tablets",         icon: Tablet,      count: 291  },
  { id: "consoles",   label: "Consoles",        icon: Gamepad2,    count: 417  },
  { id: "audio",      label: "Audio",           icon: Headphones,  count: 515  },
];

const PRODUCTS = [
  { id: "ip15pro",   title: "iPhone 15 Pro",          brand: "Apple",    category: "phones",   grade: "Excellent", storage: "256 GB",     price: 739,  was: 1199, rating: 4.9, reviews: 2847, img: "https://picsum.photos/seed/ip15pro/400/400" },
  { id: "mbam3",     title: "MacBook Air 13\" M3",    brand: "Apple",    category: "laptops",  grade: "Pristine",  storage: "512 GB SSD", price: 1049, was: 1499, rating: 4.9, reviews: 1102, img: "https://picsum.photos/seed/mbairm3/400/400" },
  { id: "s24u",      title: "Galaxy S24 Ultra",       brand: "Samsung",  category: "phones",   grade: "Excellent", storage: "256 GB",     price: 819,  was: 1249, rating: 4.8, reviews: 963,  img: "https://picsum.photos/seed/s24ult/400/400" },
  { id: "ps5",       title: "PlayStation 5",          brand: "Sony",     category: "consoles", grade: "Excellent", storage: "825 GB",     price: 389,  was: 479,  rating: 4.8, reviews: 3412, img: "https://picsum.photos/seed/ps5disc/400/400" },
  { id: "ipadpro",   title: "iPad Pro 13\" M4",       brand: "Apple",    category: "tablets",  grade: "Excellent", storage: "256 GB",     price: 899,  was: 1299, rating: 4.9, reviews: 711,  img: "https://picsum.photos/seed/ipadpro13/400/400" },
  { id: "wh1000",    title: "Sony WH-1000XM5",        brand: "Sony",     category: "audio",    grade: "Pristine",  storage: "—",          price: 219,  was: 379,  rating: 4.9, reviews: 2841, img: "https://picsum.photos/seed/wh1000xm5/400/400" },
  { id: "ip14",      title: "iPhone 14",              brand: "Apple",    category: "phones",   grade: "Very Good", storage: "128 GB",     price: 379,  was: 829,  rating: 4.7, reviews: 1584, img: "https://picsum.photos/seed/ip14std/400/400" },
  { id: "xboxsx",    title: "Xbox Series X",          brand: "Microsoft",category: "consoles", grade: "Excellent", storage: "1 TB",       price: 349,  was: 449,  rating: 4.7, reviews: 892,  img: "https://picsum.photos/seed/xboxserx/400/400" },
  { id: "mbpro14",   title: "MacBook Pro 14\" M3",    brand: "Apple",    category: "laptops",  grade: "Excellent", storage: "512 GB SSD", price: 1589, was: 1999, rating: 4.9, reviews: 447,  img: "https://picsum.photos/seed/mbpro14m3/400/400" },
  { id: "s23",       title: "Galaxy S23",             brand: "Samsung",  category: "phones",   grade: "Good",      storage: "128 GB",     price: 329,  was: 749,  rating: 4.6, reviews: 724,  img: "https://picsum.photos/seed/s23base/400/400" },
  { id: "airpodspro","title": "AirPods Pro 2nd Gen",  brand: "Apple",    category: "audio",    grade: "Excellent", storage: "—",          price: 159,  was: 279,  rating: 4.8, reviews: 1947, img: "https://picsum.photos/seed/app2gen/400/400" },
  { id: "switcholed","title": "Switch OLED",          brand: "Nintendo", category: "consoles", grade: "Excellent", storage: "64 GB",      price: 239,  was: 309,  rating: 4.8, reviews: 1583, img: "https://picsum.photos/seed/switcholed/400/400" },
];

const GRADES = ["Pristine", "Excellent", "Very Good", "Good"];
const BRANDS = ["Apple", "Samsung", "Sony", "Microsoft", "Nintendo"];

const SORT_OPTIONS = [
  { id: "featured",   label: "Featured" },
  { id: "price-asc",  label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating",     label: "Top Rated" },
];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function toggleFilter(item: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  function handleAdd(id: string) {
    setAddedIds(prev => new Set(prev).add(id));
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 2000);
  }

  let filtered = PRODUCTS.filter(p => {
    const catMatch = activeCategory === "all" || p.category === activeCategory;
    const gradeMatch = activeGrades.length === 0 || activeGrades.includes(p.grade);
    const brandMatch = activeBrands.length === 0 || activeBrands.includes(p.brand);
    return catMatch && gradeMatch && brandMatch;
  });

  if (sort === "price-asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "rating")     filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  const currentCatMeta = CATEGORIES.find(c => c.id === activeCategory)!;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200 sticky top-[72px] z-30 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {activeCategory === "all" ? "All refurbished tech" : currentCatMeta.label}
          </h1>

          {/* Category Rail - Back Market style pills */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/shop" : `/shop/${cat.id}`}
                  className={`shrink-0 flex items-center gap-2 h-12 px-5 rounded-full text-sm font-bold transition-all border-2 ${
                    active
                      ? "bg-black border-black text-white"
                      : "bg-white border-zinc-200 text-zinc-700 hover:border-black"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Quick Links ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-zinc-200 py-4 mb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex gap-3 overflow-x-auto scrollbar-hide">
          <button onClick={() => { setActiveBrands(["Apple"]); setActiveGrades([]); }} className="shrink-0 h-10 px-6 rounded-full bg-zinc-100 font-bold text-sm hover:bg-zinc-200 transition-colors">Shop Apple</button>
          <button onClick={() => { setActiveBrands(["Samsung"]); setActiveGrades([]); }} className="shrink-0 h-10 px-6 rounded-full bg-zinc-100 font-bold text-sm hover:bg-zinc-200 transition-colors">Shop Samsung</button>
          <button onClick={() => { setSort("price-asc"); setActiveBrands([]); setActiveGrades([]); }} className="shrink-0 h-10 px-6 rounded-full bg-zinc-100 font-bold text-sm hover:bg-zinc-200 transition-colors">Budget Friendly</button>
          <button onClick={() => { setActiveGrades(["Pristine", "Excellent"]); setActiveBrands([]); }} className="shrink-0 h-10 px-6 rounded-full bg-zinc-100 font-bold text-sm hover:bg-zinc-200 transition-colors">Like New</button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        
        {/* Vibrant Promo Banner */}
        {activeCategory === "all" && (
          <div className="mb-12 rounded-[32px] bg-gradient-to-r from-[#c3eb4e] to-[#a8d32d] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between border border-[#b2db3c] shadow-sm">
             <div className="relative z-10 max-w-lg mb-6 md:mb-0 text-center md:text-left">
               <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full mb-4">Limited Time</span>
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Spring Tech Event</h2>
               <p className="text-lg font-medium text-black/80">Get up to 40% off pristine refurbished devices. Fully tested, 2-year warranty included.</p>
             </div>
             <div className="relative z-10 shrink-0">
               <button className="h-14 px-8 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
                 Shop the sale <ArrowRight className="h-5 w-5" />
               </button>
             </div>
             {/* Decorative element */}
             <div className="absolute right-0 top-0 w-1/2 h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at right, white, transparent 70%)' }}></div>
          </div>
        )}

        <div className="flex flex-col">

          {/* ── Top Picks Carousel ────────────────────────────────────────────────── */}
          {activeCategory === "all" && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Trending Tech</h2>
                <div className="flex gap-2 hidden md:flex">
                  <button className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"><ArrowLeft className="h-5 w-5" /></button>
                  <button className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"><ArrowRight className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {PRODUCTS.slice(4, 8).map(product => (
                  <a href={`/shop/${product.category}/${product.id}`} key={`top-${product.id}`} className="shrink-0 w-[240px] md:w-[280px] group block">
                    <div className="bg-white rounded-[32px] p-3 border border-zinc-200 hover:border-black hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-square rounded-[24px] bg-[#f5f5f7] mb-5 p-6 flex items-center justify-center">
                        <span className="absolute top-4 left-4 inline-flex px-2.5 py-1 rounded-full bg-black text-[10px] font-bold text-white shadow-sm uppercase tracking-wider">
                          Trending
                        </span>
                        <img src={product.img} alt={product.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="px-2 flex flex-col flex-1 pb-2">
                        <h3 className="font-bold text-lg leading-tight mb-1">{product.title}</h3>
                        <div className="flex items-baseline gap-2 mt-auto pt-4">
                          <span className="text-xl md:text-2xl font-bold tracking-tight">£{product.price}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── Main Grid ───────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar & Horizontal Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-600">
                  {filtered.length} products
                </p>
                
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-zinc-200 text-sm font-bold"
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                    {(activeGrades.length > 0 || activeBrands.length > 0) && (
                      <span className="h-5 w-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center ml-1">
                        {activeGrades.length + activeBrands.length}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative z-20">
                    <button
                      onClick={() => setShowSort(s => !s)}
                      className="flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-zinc-200 text-sm font-bold hover:border-black transition-colors"
                    >
                      Sort: {SORT_OPTIONS.find(o => o.id === sort)?.label}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {showSort && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-[24px] shadow-xl overflow-hidden"
                        >
                          {SORT_OPTIONS.map(opt => (
                            <button
                             key={opt.id}
                             onClick={() => { setSort(opt.id); setShowSort(false); }}
                             className={`w-full text-left px-5 py-4 text-sm font-bold hover:bg-zinc-50 transition-colors ${sort === opt.id ? "text-black bg-zinc-50" : "text-zinc-600"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Desktop Horizontal Filters */}
              <div className="hidden lg:flex flex-wrap items-center gap-6 bg-white p-3 px-5 rounded-full border border-zinc-200">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-zinc-400 uppercase tracking-widest">Brand</span>
                  <div className="flex gap-2">
                    {BRANDS.map(brand => {
                      const isActive = activeBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => toggleFilter(brand, activeBrands, setActiveBrands)}
                          className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                            isActive ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="w-px h-6 bg-zinc-200"></div>
                
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-zinc-400 uppercase tracking-widest">Condition</span>
                  <div className="flex gap-2">
                    {GRADES.map(g => {
                      const isActive = activeGrades.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => toggleFilter(g, activeGrades, setActiveGrades)}
                          className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                            isActive ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>


            {/* Active Filters Display (Mobile Only) */}
            {(activeGrades.length > 0 || activeBrands.length > 0) && (
              <div className="flex lg:hidden flex-wrap gap-2 mb-6">
                {[...activeBrands, ...activeGrades].map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      if (activeBrands.includes(f)) setActiveBrands(prev => prev.filter(x => x !== f));
                      if (activeGrades.includes(f)) setActiveGrades(prev => prev.filter(x => x !== f));
                    }}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-zinc-200 text-xs font-bold hover:border-zinc-400"
                  >
                    {f} <X className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={() => { setActiveBrands([]); setActiveGrades([]); }}
                  className="h-8 px-3 text-xs font-bold text-zinc-500 hover:text-black underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product Grid */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[32px] border border-zinc-200">
                <p className="font-bold text-xl mb-3">No products found</p>
                <p className="text-zinc-500 mb-6">Try adjusting your filters or category.</p>
                <button
                  onClick={() => { setActiveCategory("all"); setActiveBrands([]); setActiveGrades([]); }}
                  className="h-12 px-8 rounded-full bg-black text-white font-bold"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((product, index) => {
                  const added = addedIds.has(product.id);
                  const isPromoSpot = index === 4; // Inject promo after 5th item
                  
                  return (
                    <React.Fragment key={product.id}>
                      {isPromoSpot && (
                        <div className="bg-emerald-950 text-white rounded-[32px] p-8 flex flex-col justify-center items-start group relative overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1">
                           <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
                           <h3 className="font-bold text-2xl mb-3 relative z-10">Student Discount</h3>
                           <p className="text-zinc-300 font-medium mb-8 relative z-10">Verify your student status and get an extra 5% off everything.</p>
                           <Link href="/students" className="h-12 px-6 rounded-full bg-white text-emerald-950 font-bold flex items-center gap-2 hover:scale-105 transition-transform relative z-10">
                             Verify now <ArrowRight className="h-4 w-4" />
                           </Link>
                        </div>
                      )}
                      <Link href={`/shop/${product.category}/${product.id}`} className="group block">
                      <div className="bg-white rounded-[32px] p-3 border border-zinc-200 hover:border-black hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        
                        {/* Image Container */}
                        <div className="relative aspect-square rounded-[24px] bg-[#f5f5f7] mb-5 overflow-hidden flex items-center justify-center p-6">
                          {/* Tags */}
                          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-black border border-zinc-200 shadow-sm uppercase tracking-wider">
                              {product.grade}
                            </span>
                          </div>
                          
                          <img
                            src={product.img}
                            alt={product.title}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Quick Add Button */}
                          <button
                            onClick={e => { e.preventDefault(); handleAdd(product.id); }}
                            className={`absolute bottom-4 right-4 h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                              added ? "bg-emerald-500 text-white scale-110" : "bg-white text-black hover:bg-black hover:text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                            }`}
                          >
                            {added ? <Check className="h-5 w-5" strokeWidth={3} /> : <ShoppingCart className="h-5 w-5" />}
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="px-2 flex flex-col flex-1 pb-2">
                          <h3 className="font-bold text-lg leading-tight mb-1">{product.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{product.storage}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-black text-black" />
                              <span className="text-xs font-bold">{product.rating}</span>
                              <span className="text-xs text-zinc-400 font-medium">({product.reviews})</span>
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-4 flex items-end justify-between">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight">£{product.price}</span>
                              </div>
                              <div className="text-sm font-bold text-zinc-400 line-through">
                                £{product.was} new
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {filtered.length > 0 && (
              <div className="mt-12 flex justify-center">
                <button className="h-12 px-10 rounded-full border-2 border-zinc-200 font-bold text-sm hover:border-black transition-colors bg-white">
                  Load more products
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FAQ / SEO Block ──────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-zinc-200 py-16 mt-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why shop with TechStop?</h2>
            <p className="text-zinc-500 font-medium text-lg">We're on a mission to bring you the best tech at the best prices, without costing the earth.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: `What is refurbished tech?`, a: `Refurbished tech is pre-owned equipment that has been rigorously tested, repaired, and cleaned by experts to work like new.` },
              { q: "Do you offer a warranty?", a: "Yes! Every single device comes with a comprehensive 2-year warranty that covers all technical defects." },
              { q: "What is your return policy?", a: "We offer a 30-day no-questions-asked return policy. If you're not entirely satisfied, just send it back for a full refund." }
            ].map((faq, i) => (
              <div key={i} className="border border-zinc-200 rounded-[24px] overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors"
                >
                  <span className="font-bold text-lg text-left">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-zinc-50"
                    >
                      <div className="p-6 pt-0 text-zinc-600 font-medium">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-12 md:gap-24">
          {[
            { icon: ShieldCheck, text: "2-Year Warranty" },
            { icon: Zap,         text: "Free Express Shipping" },
            { icon: RefreshCw,   text: "30-Day Returns" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                 <Icon className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-bold">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
