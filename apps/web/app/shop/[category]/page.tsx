"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Laptop, Tablet, Gamepad2, Headphones,
  Filter, ChevronDown, ShoppingCart, Star, Check,
  ArrowLeft, Shield, Zap, RefreshCw, ArrowRight
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

// ─── Category meta ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, {
  label: string;
  plural: string;
  icon: React.ElementType;
  mood: string;
  description: string;
  filters: string[];
  brands: string[];
}> = {
  phones: {
    label: "Phones",
    plural: "Smartphones",
    icon: Smartphone,
    mood: "bg-mood-sky",
    description: "Certified refurbished smartphones with 2-year warranty. Every handset is unlocked, tested, and backed by our quality guarantee.",
    filters: ["All", "Apple", "Samsung", "Google", "OnePlus"],
    brands: ["Apple", "Samsung", "Google", "OnePlus", "Nothing"],
  },
  tablets: {
    label: "Tablets",
    plural: "Tablets",
    icon: Tablet,
    mood: "bg-mood-rose",
    description: "Refurbished iPads, Samsung Galaxy Tabs and Surface devices. Fully tested, screen checked, and sold with a 2-year warranty.",
    filters: ["All", "Apple", "Samsung", "Microsoft"],
    brands: ["Apple", "Samsung", "Microsoft"],
  },
  consoles: {
    label: "Consoles",
    plural: "Gaming Consoles",
    icon: Gamepad2,
    mood: "bg-mood-violet",
    description: "Certified refurbished PlayStation, Xbox and Nintendo consoles. Disc drives tested, HDMI verified, controllers included.",
    filters: ["All", "Sony", "Microsoft", "Nintendo"],
    brands: ["Sony", "Microsoft", "Nintendo"],
  },
  laptops: {
    label: "Laptops",
    plural: "Laptops & MacBooks",
    icon: Laptop,
    mood: "bg-mood-amber",
    description: "Refurbished MacBooks, ThinkPads, Dell XPS and more. Every laptop is battery-tested, keyboard-checked, and ships with a warranty.",
    filters: ["All", "Apple", "Dell", "Lenovo", "HP"],
    brands: ["Apple", "Dell", "Lenovo", "HP", "ASUS"],
  },
  accessories: {
    label: "Accessories",
    plural: "Accessories",
    icon: Headphones,
    mood: "bg-mood-emerald",
    description: "Genuine refurbished accessories including headphones, chargers, cases and cables. Tested and quality-checked.",
    filters: ["All", "Sony", "Apple", "Bose"],
    brands: ["Sony", "Apple", "Bose", "Samsung"],
  },
};

// ─── Mock product data per category ─────────────────────────────────────────

const PRODUCTS: Record<string, {
  id: string; title: string; brand: string; grade: string;
  storage: string; price: number; rating: number; reviews: number;
  image: string;
}[]> = {
  phones: [
    { id: "ip15pm", title: "iPhone 15 Pro Max", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 879, rating: 4.9, reviews: 312, image: "https://picsum.photos/seed/ip15pm/400/400" },
    { id: "ip14p", title: "iPhone 14 Pro", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 579, rating: 4.8, reviews: 1847, image: "https://picsum.photos/seed/ip14pro/400/400" },
    { id: "ip13", title: "iPhone 13", brand: "Apple", grade: "Very Good", storage: "128 GB", price: 299, rating: 4.7, reviews: 924, image: "https://picsum.photos/seed/ip13/400/400" },
    { id: "sgs24u", title: "Galaxy S24 Ultra", brand: "Samsung", grade: "Excellent", storage: "512 GB", price: 829, rating: 4.8, reviews: 541, image: "https://picsum.photos/seed/s24u/400/400" },
    { id: "sgs23", title: "Galaxy S23", brand: "Samsung", grade: "Very Good", storage: "128 GB", price: 349, rating: 4.6, reviews: 428, image: "https://picsum.photos/seed/s23/400/400" },
    { id: "pixel8p", title: "Pixel 8 Pro", brand: "Google", grade: "Excellent", storage: "256 GB", price: 549, rating: 4.7, reviews: 218, image: "https://picsum.photos/seed/pixel8p/400/400" },
  ],
  tablets: [
    { id: "ipadpro13", title: "iPad Pro 13\" M4", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 899, rating: 4.9, reviews: 184, image: "https://picsum.photos/seed/ipadpro13/400/400" },
    { id: "ipada5", title: "iPad Air 5th Gen", brand: "Apple", grade: "Excellent", storage: "64 GB", price: 389, rating: 4.8, reviews: 422, image: "https://picsum.photos/seed/ipadair5/400/400" },
    { id: "ipad10", title: "iPad 10th Gen", brand: "Apple", grade: "Very Good", storage: "64 GB", price: 299, rating: 4.6, reviews: 311, image: "https://picsum.photos/seed/ipad10/400/400" },
    { id: "tabs10p", title: "Galaxy Tab S10+", brand: "Samsung", grade: "Excellent", storage: "256 GB", price: 649, rating: 4.7, reviews: 129, image: "https://picsum.photos/seed/tabs10p/400/400" },
    { id: "surfpro9", title: "Surface Pro 9", brand: "Microsoft", grade: "Very Good", storage: "256 GB", price: 699, rating: 4.5, reviews: 87, image: "https://picsum.photos/seed/surfpro9/400/400" },
  ],
  consoles: [
    { id: "ps5disc", title: "PS5 Disc Edition", brand: "Sony", grade: "Excellent", storage: "825 GB", price: 399, rating: 4.9, reviews: 2104, image: "https://picsum.photos/seed/ps5disc/400/400" },
    { id: "ps5dig", title: "PS5 Digital Edition", brand: "Sony", grade: "Excellent", storage: "825 GB", price: 329, rating: 4.8, reviews: 1622, image: "https://picsum.photos/seed/ps5dig/400/400" },
    { id: "ps4pro", title: "PS4 Pro", brand: "Sony", grade: "Very Good", storage: "1 TB", price: 189, rating: 4.6, reviews: 873, image: "https://picsum.photos/seed/ps4pro/400/400" },
    { id: "xbxsx", title: "Xbox Series X", brand: "Microsoft", grade: "Excellent", storage: "1 TB", price: 369, rating: 4.8, reviews: 1241, image: "https://picsum.photos/seed/xbsx/400/400" },
    { id: "xbss", title: "Xbox Series S", brand: "Microsoft", grade: "Excellent", storage: "512 GB", price: 219, rating: 4.7, reviews: 982, image: "https://picsum.photos/seed/xbss/400/400" },
    { id: "nswoled", title: "Switch OLED", brand: "Nintendo", grade: "Excellent", storage: "64 GB", price: 239, rating: 4.8, reviews: 1580, image: "https://picsum.photos/seed/switcoled/400/400" },
  ],
  laptops: [
    { id: "mbpm3max16", title: "MacBook Pro 16\" M3 Max", brand: "Apple", grade: "Excellent", storage: "512 GB SSD", price: 2199, rating: 4.9, reviews: 241, image: "https://picsum.photos/seed/mbpm3m/400/400" },
    { id: "mbam2", title: "MacBook Air 13\" M2", brand: "Apple", grade: "Excellent", storage: "256 GB SSD", price: 799, rating: 4.9, reviews: 1124, image: "https://picsum.photos/seed/mbam2/400/400" },
    { id: "xps15", title: "Dell XPS 15", brand: "Dell", grade: "Very Good", storage: "512 GB SSD", price: 899, rating: 4.7, reviews: 318, image: "https://picsum.photos/seed/xps15/400/400" },
    { id: "x1c12", title: "ThinkPad X1 Carbon G12", brand: "Lenovo", grade: "Excellent", storage: "512 GB SSD", price: 849, rating: 4.7, reviews: 194, image: "https://picsum.photos/seed/x1cg12/400/400" },
    { id: "spectre", title: "HP Spectre x360 14", brand: "HP", grade: "Very Good", storage: "512 GB SSD", price: 749, rating: 4.6, reviews: 112, image: "https://picsum.photos/seed/spectrex360/400/400" },
  ],
  accessories: [
    { id: "wh1000", title: "Sony WH-1000XM5", brand: "Sony", grade: "Pristine", storage: "—", price: 219, rating: 4.9, reviews: 2841, image: "https://picsum.photos/seed/wh1000/400/400" },
    { id: "airpodspro2", title: "AirPods Pro 2nd Gen", brand: "Apple", grade: "Excellent", storage: "—", price: 159, rating: 4.8, reviews: 1490, image: "https://picsum.photos/seed/airpodspro2/400/400" },
    { id: "boseqc45", title: "Bose QuietComfort 45", brand: "Bose", grade: "Very Good", storage: "—", price: 149, rating: 4.7, reviews: 621, image: "https://picsum.photos/seed/boseqc45/400/400" },
    { id: "galaxybuds2", title: "Galaxy Buds2 Pro", brand: "Samsung", grade: "Excellent", storage: "—", price: 89, rating: 4.6, reviews: 384, image: "https://picsum.photos/seed/buds2pro/400/400" },
  ],
};

const GRADES = ["Pristine", "Excellent", "Very Good", "Good"];
const PRICE_RANGES = ["Under £200", "£200–£500", "£500–£1000", "£1000+"];

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = (params?.category as string)?.toLowerCase();
  const meta = CATEGORY_META[categorySlug];

  const [activeBrand, setActiveBrand] = useState("All");
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [showSort, setShowSort] = useState(false);

  if (!meta) {
    notFound();
    return null;
  }

  const CategoryIcon = meta.icon;
  const allProducts = PRODUCTS[categorySlug] ?? [];

  let filtered = allProducts.filter(p => {
    const matchBrand = activeBrand === "All" || p.brand === activeBrand;
    const matchGrade = activeGrades.length === 0 || activeGrades.includes(p.grade);
    return matchBrand && matchGrade;
  });

  if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  function toggleGrade(grade: string) {
    setActiveGrades(gs => gs.includes(grade) ? gs.filter(g => g !== grade) : [...gs, grade]);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Category Hero */}
        <section className={`${meta.mood} border-b border-zinc-100`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
            <a href="/shop" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors mb-6">
              <ArrowLeft className="h-3.5 w-3.5" /> All categories
            </a>
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 bg-white/60 rounded-2xl flex items-center justify-center">
                    <CategoryIcon className="h-7 w-7 text-black/70" strokeWidth={1.5} />
                  </div>
                  <h1 className="font-serif text-5xl md:text-7xl font-medium leading-none">{meta.plural}</h1>
                </div>
                <p className="text-black/60 font-medium max-w-xl text-lg leading-relaxed">{meta.description}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-3xl font-bold">{filtered.length}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-black/40">results</p>
              </div>
            </div>
          </div>
        </section>

        {/* Brand filter pills */}
        <div className="border-b border-zinc-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {meta.filters.map(brand => (
              <button
                key={brand}
                onClick={() => setActiveBrand(brand)}
                className={`shrink-0 h-10 px-5 rounded-2xl text-xs font-bold transition-all ${
                  activeBrand === brand ? "bg-black text-white" : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Sidebar */}
            <aside className="w-full lg:w-56 shrink-0">
              <div className="lg:sticky lg:top-24 space-y-10">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">Condition</h3>
                  <div className="space-y-3">
                    {GRADES.map(g => (
                      <label key={g} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => toggleGrade(g)}
                          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            activeGrades.includes(g) ? "border-black bg-black" : "border-zinc-200 group-hover:border-black"
                          }`}
                        >
                          {activeGrades.includes(g) && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                        </div>
                        <span className={`text-sm font-bold transition-colors ${activeGrades.includes(g) ? "text-black" : "text-zinc-500 group-hover:text-black"}`}>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Trade-in CTA */}
                <div className="rounded-3xl bg-zinc-950 p-5 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-accent/20 blur-xl rounded-full" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-accent mb-3">Trade-in</p>
                  <p className="font-bold text-sm mb-3 leading-tight">Upgrade and get cash for your old {meta.label.toLowerCase()}.</p>
                  <a href="/trade-in" className="inline-flex items-center gap-1.5 text-[10px] font-bold border-b border-white/30 pb-0.5 hover:text-accent transition-colors">
                    Get a quote <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </aside>

            {/* Products */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-zinc-500 font-medium">
                  <strong className="text-black">{filtered.length}</strong> certified results
                </p>
                <div className="relative">
                  <button
                    onClick={() => setShowSort(s => !s)}
                    className="flex items-center gap-2 h-10 px-5 rounded-2xl bg-zinc-100 text-xs font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Sort: {sort === "featured" ? "Featured" : sort === "price-asc" ? "Price: Low–High" : sort === "price-desc" ? "Price: High–Low" : "Top rated"}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <AnimatePresence>
                    {showSort && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute right-0 top-full mt-2 w-44 bg-white border border-zinc-100 rounded-2xl shadow-xl overflow-hidden z-10"
                      >
                        {[
                          { id: "featured", label: "Featured" },
                          { id: "price-asc", label: "Price: Low–High" },
                          { id: "price-desc", label: "Price: High–Low" },
                          { id: "rating", label: "Top rated" },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => { setSort(opt.id); setShowSort(false); }}
                            className={`w-full text-left px-5 py-3.5 text-sm font-bold hover:bg-zinc-50 transition-colors ${sort === opt.id ? "text-black" : "text-zinc-500"}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-24 text-zinc-400">
                  <CategoryIcon className="h-12 w-12 mx-auto mb-4 opacity-20" strokeWidth={1} />
                  <p className="font-bold">No products match your filters</p>
                  <button onClick={() => { setActiveBrand("All"); setActiveGrades([]); }} className="mt-4 text-sm font-bold text-black underline">
                    Clear filters
                  </button>
                </div>
              ) : (
                <motion.div layout className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((product, i) => (
                    <motion.article
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group cursor-pointer"
                    >
                      <a href={`/shop/${categorySlug}/${product.id}`}>
                        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-zinc-50 p-8 ring-1 ring-zinc-100 group-hover:ring-transparent group-hover:shadow-2xl group-hover:bg-white transition-all duration-300">
                          <span className="absolute top-5 left-5 z-10 rounded-full bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                            <Check className="h-2.5 w-2.5 text-emerald-500" strokeWidth={2.5} />
                            {product.grade}
                          </span>
                          <img
                            src={product.image}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <button className="absolute bottom-5 right-5 h-12 w-12 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg">
                            <ShoppingCart className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold truncate pr-2">{product.title}</h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                              <span className="text-xs font-bold">{product.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{product.brand} · {product.storage}</p>
                          <div className="flex items-baseline gap-3 pt-1">
                            <span className="text-2xl font-bold">£{product.price}</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Free delivery</span>
                          </div>
                        </div>
                      </a>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="bg-zinc-50 py-10 border-t border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 hover:opacity-100 transition-opacity">
            {[
              { icon: Shield, text: "2-Year Warranty" },
              { icon: Zap, text: "Free Express Shipping" },
              { icon: RefreshCw, text: "30-Day Returns" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
