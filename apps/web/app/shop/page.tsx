"use client";

import { useState } from "react";
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Headphones, 
  Gamepad2, 
  Speaker, 
  Watch, 
  Camera,
  Search,
  ShoppingCart,
  User,
  Star,
  ChevronDown,
  Filter,
  ArrowRight,
  Zap,
  ShieldCheck,
  RefreshCw,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All Products");

  const categories = [
    { name: "Smartphones", icon: Smartphone, mood: "var(--mood-sky)" },
    { name: "Laptops", icon: Laptop, mood: "var(--mood-rose)" },
    { name: "Tablets", icon: Tablet, mood: "var(--mood-amber)" },
    { name: "Audio", icon: Headphones, mood: "var(--mood-emerald)" },
    { name: "Gaming", icon: Gamepad2, mood: "var(--mood-violet)" },
    { name: "Watches", icon: Watch, mood: "var(--mood-sky)" },
  ];

  const products = [
    {
      title: "iPhone 14 Pro",
      grade: "Excellent",
      storage: "256 GB",
      price: "$679.00",
      rating: 4.8,
      reviews: 1240,
      image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400&h=400&auto=format&fit=crop",
    },
    {
      title: "MacBook Air M2",
      grade: "Pristine",
      storage: "16 GB / 512 GB",
      price: "$899.00",
      rating: 4.9,
      reviews: 856,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&h=400&auto=format&fit=crop",
    },
    {
      title: "Samsung Galaxy S23",
      grade: "Very Good",
      storage: "128 GB",
      price: "$469.00",
      rating: 4.7,
      reviews: 420,
      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400&h=400&auto=format&fit=crop",
    },
    {
      title: "PlayStation 5",
      grade: "Certified",
      storage: "825 GB",
      price: "$399.00",
      rating: 4.8,
      reviews: 2100,
      image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=500&auto=format&fit=crop",
    },
    {
      title: "iPad Air 5",
      grade: "Excellent",
      storage: "64 GB",
      price: "$429.00",
      rating: 4.9,
      reviews: 320,
      image: "https://images.unsplash.com/photo-1544244015-c24b59b8102e?q=80&w=500&auto=format&fit=crop",
    },
    {
      title: "Sony WH-1000XM5",
      grade: "Pristine",
      storage: "N/A",
      price: "$279.00",
      rating: 4.6,
      reviews: 580,
      image: "https://images.unsplash.com/photo-1618366712214-8c075189d0ad?q=80&w=400&h=400&auto=format&fit=crop",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      <main className="flex-1">
        {/* Category Rails (Back Market Style) */}
        <div className="bg-zinc-50/50 border-b border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl md:text-6xl font-medium mb-10 text-center lg:text-left"
            >
              Shop by <i>mood</i>.
            </motion.h1>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
              {categories.map((cat, i) => (
                <motion.button
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveCategory(cat.name)}
                  className="group flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all hover:shadow-xl hover:bg-white"
                >
                  <div 
                    className="h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: cat.mood }}
                  >
                    <cat.icon className="h-6 w-6 md:h-8 md:w-8 text-black/70" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black">
                    {cat.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl w-full px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-12">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Conditions</h3>
                  <div className="space-y-4">
                    {["Pristine", "Excellent", "Very Good", "Good", "Fair"].map((grade) => (
                      <label key={grade} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex h-5 w-5 items-center justify-center rounded-md border-2 border-zinc-200 group-hover:border-black transition-colors">
                          <input type="checkbox" className="peer absolute h-full w-full opacity-0 cursor-pointer" />
                          <Check className="h-3.5 w-3.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm font-bold text-zinc-500 group-hover:text-black transition-colors">{grade}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Price Range</h3>
                  <div className="space-y-4">
                    {["Under $200", "$200 - $500", "$500 - $1000", "$1000+"].map((range) => (
                      <label key={range} className="flex items-center gap-3 cursor-pointer group">
                        <div className="h-5 w-5 rounded-full border-2 border-zinc-200 group-hover:border-black transition-colors flex items-center justify-center">
                           <div className="h-2 w-2 rounded-full bg-black opacity-0 peer-checked:opacity-100" />
                           <input type="radio" name="price" className="peer absolute h-5 w-5 opacity-0 cursor-pointer" />
                        </div>
                        <span className="text-sm font-bold text-zinc-500 group-hover:text-black transition-colors">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Promo Card */}
                <div className="rounded-[2rem] bg-zinc-950 p-6 text-white overflow-hidden relative group cursor-pointer">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/20 blur-2xl rounded-full" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-accent mb-4">Trade-in</p>
                  <h4 className="text-lg font-bold mb-4 leading-tight">Get up to $500 for your old tech.</h4>
                  <button className="flex items-center gap-2 text-xs font-bold border-b border-white/30 pb-0.5 group-hover:text-accent transition-colors">
                    Start trade-in <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">{activeCategory}</h2>
                  <p className="text-sm text-zinc-500 mt-1 font-medium">Showing {products.length} expertly certified results</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-3 h-12 px-6 rounded-2xl bg-zinc-50 text-xs font-bold transition-all hover:bg-zinc-100">
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                  <button className="flex items-center gap-3 h-12 px-6 rounded-2xl bg-zinc-50 text-xs font-bold transition-all hover:bg-zinc-100">
                    Sort: Featured
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, i) => (
                  <motion.article 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-zinc-50 p-8 md:p-10 transition-all group-hover:bg-white group-hover:shadow-2xl ring-1 ring-zinc-100 group-hover:ring-transparent">
                      <div className="absolute top-6 left-6 z-10 rounded-full bg-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-accent" />
                        {product.grade}
                      </div>
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
                      />
                      <button className="absolute bottom-6 right-6 h-12 w-12 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{product.title}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          <span className="text-xs font-bold">{product.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{product.storage}</p>
                      <div className="flex items-baseline gap-3 pt-2">
                        <span className="text-2xl font-bold">{product.price}</span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Free Shipping</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-24 flex items-center justify-center gap-4">
                 <button className="h-12 px-8 rounded-2xl border-2 border-zinc-100 font-bold text-xs hover:bg-zinc-50 transition-colors">Load more products</button>
              </div>
            </div>
          </div>
        </div>

        {/* trust bar bottom */}
        <div className="bg-zinc-50 py-12 border-t border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
             <div className="flex items-center gap-3">
               <ShieldCheck className="h-6 w-6" />
               <span className="text-xs font-bold uppercase tracking-widest">2-Year Warranty</span>
             </div>
             <div className="flex items-center gap-3">
               <Zap className="h-6 w-6" />
               <span className="text-xs font-bold uppercase tracking-widest">Free Express Shipping</span>
             </div>
             <div className="flex items-center gap-3">
               <RefreshCw className="h-6 w-6" />
               <span className="text-xs font-bold uppercase tracking-widest">30-Day Money Back</span>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
