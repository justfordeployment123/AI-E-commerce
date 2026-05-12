"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Mail,
  Star,
  Zap,
  Leaf,
  Bell,
  Check,
  ChevronRight,
  Menu,
  Heart
} from "lucide-react";

// --- Sub-components for AppPreview ---

function PhoneShopScreen() {
  return (
    <div className="flex h-full flex-col bg-white text-black">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <Menu className="h-5 w-5" />
        <div className="text-[10px] font-bold tracking-tighter uppercase">MARKHOR</div>
        <ShoppingCart className="h-5 w-5" />
      </div>
      <div className="flex-1 px-4 py-2 overflow-y-auto scrollbar-hide">
        <div className="relative mb-6">
          <input type="text" placeholder="Search tech..." className="w-full h-10 rounded-xl bg-zinc-100 pl-10 text-[10px] outline-none" readOnly />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
          {["All", "iPhones", "Macs", "Watch", "Audio"].map((c, i) => (
            <span key={i} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[9px] font-bold ${i === 0 ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>
              {c}
            </span>
          ))}
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl bg-zinc-950 p-4 text-white relative">
          <div className="relative z-10">
            <p className="text-[8px] font-bold uppercase tracking-widest text-accent">Limited Offer</p>
            <p className="mt-1 text-sm font-bold leading-tight">iPhone 15 Pro <br/>from $799</p>
          </div>
          <div className="absolute right-[-20px] bottom-[-10px] w-24 h-24 bg-accent/20 blur-2xl" />
        </div>

        <h4 className="text-[10px] font-bold uppercase mb-3 text-zinc-400">Featured Deals</h4>
        <div className="grid grid-cols-2 gap-3 pb-8">
          {[
            { name: "iPhone 14", price: "$499", img: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=150&h=150&auto=format&fit=crop" },
            { name: "S23 Ultra", price: "$649", img: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=150&h=150&auto=format&fit=crop" },
            { name: "Apple Watch", price: "$299", img: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=200&h=200&auto=format&fit=crop" },
            { name: "AirPods Max", price: "$379", img: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=200&h=200&auto=format&fit=crop" }
          ].map((p, i) => (
            <div key={i} className="rounded-2xl border border-zinc-100 p-2 bg-white shadow-sm">
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-zinc-50 mb-2 p-2">
                <img src={p.img} alt={p.name} className="h-full w-full object-contain" />
              </div>
              <div className="text-[10px] font-bold truncate">{p.name}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[9px] font-bold text-zinc-900">{p.price}</div>
                <div className="h-4 w-4 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-[10px] font-bold">+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneProductScreen() {
  return (
    <div className="flex h-full flex-col bg-white text-black">
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <ChevronRight className="h-5 w-5 rotate-180" />
        <div className="text-[10px] font-bold">Product Details</div>
        <Heart className="h-5 w-5 text-zinc-300" />
      </div>
      <div className="flex-1 px-4 overflow-y-auto scrollbar-hide pb-20">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-3xl bg-zinc-50 mb-6 flex items-center justify-center p-8 relative">
          <img 
            src="https://images.unsplash.com/photo-1661961111184-11317b40adb2?q=80&w=200&h=200&auto=format&fit=crop" 
            className="h-full w-full object-contain" 
            alt="MacBook"
          />
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full border border-zinc-100 shadow-sm flex items-center gap-1">
            <CheckCircle2 className="h-2 w-2 text-emerald-500" />
            <span className="text-[8px] font-bold uppercase">Verified</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[8px] font-bold text-black uppercase">Excellent Condition</div>
            <h3 className="text-lg font-bold leading-tight mt-1">MacBook Air M2 13"</h3>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-xl font-bold">$849</span>
              <span className="text-[10px] text-zinc-400 line-through">$1,099</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Select Color</p>
            <div className="flex gap-2">
              {["#F1E5D1", "#2F3132", "#E3E4E5"].map((c, i) => (
                <div key={i} className={`h-6 w-6 rounded-full border-2 p-0.5 ${i === 0 ? 'border-black' : 'border-transparent'}`}>
                  <div className="h-full w-full rounded-full" style={{ backgroundColor: c }} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-bold text-zinc-400 uppercase">Description</p>
            <p className="text-zinc-600 text-[10px] leading-relaxed">
              Starlight · 256GB SSD · 8GB RAM. Features Apple M2 chip, 8-core CPU, and liquid retina display.
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-zinc-50 bg-white/80 backdrop-blur-xl">
        <button className="h-12 w-full bg-black text-white rounded-2xl text-xs font-bold transition-transform active:scale-95 shadow-lg">
          Add to bag
        </button>
      </div>
    </div>
  );
}

function PhoneCartScreen() {
  return (
    <div className="flex h-full flex-col bg-white text-black">
      <div className="px-4 pt-12 pb-6">
        <h3 className="text-lg font-bold">Your Bag</h3>
        <p className="text-[10px] text-zinc-400">2 items ready for checkout</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-hide">
        {[
          { name: "iPhone 14 Pro", price: "$679", img: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=100&h=100&auto=format&fit=crop" },
          { name: "AirPods Pro", price: "$189", img: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?q=80&w=100&h=100&auto=format&fit=crop" }
        ].map((p, i) => (
          <div key={i} className="flex gap-4 items-center p-2 rounded-2xl border border-zinc-50">
            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-zinc-50 p-2">
              <img src={p.img} alt={p.name} className="h-full w-full object-contain" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold">{p.name}</div>
              <div className="text-[10px] text-zinc-400">Excellent · Certified</div>
            </div>
            <div className="text-xs font-bold">{p.price}</div>
          </div>
        ))}

        {/* Sustainability Impact Card */}
        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 mt-4">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="h-3 w-3 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-800 uppercase">Impact</span>
          </div>
          <p className="text-[10px] text-emerald-700 leading-tight">
            This purchase prevents **2.4kg of e-waste** and saves 140kg of CO2 emissions.
          </p>
        </div>
      </div>
      <div className="p-6 bg-zinc-50 rounded-t-[2.5rem] space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-bold text-zinc-900">$868.00</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-500">Shipping</span>
            <span className="font-bold text-emerald-600 uppercase">Free</span>
          </div>
          <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm">
            <span className="font-bold">Total</span>
            <span className="font-bold">$868.00</span>
          </div>
        </div>
        <button className="h-12 w-full bg-accent text-black rounded-2xl text-xs font-bold transition-transform active:scale-95 shadow-xl shadow-accent/10">
          Complete Purchase
        </button>
      </div>
    </div>
  );
}

function AppPreview() {
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const screenIds = ["shop", "product", "cart"];
  
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setIdx((x) => (x + 1) % screenIds.length), 4000);
    return () => clearInterval(t);
  }, []);

  const screenId = screenIds[idx];

  if (!mounted) {
    return (
      <section className="relative overflow-hidden bg-white py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-[600px] w-full bg-zinc-50 animate-pulse rounded-[3rem]" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-white py-24 lg:py-32">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-zinc-50 skew-x-[-12deg] translate-x-24" />
        <div className="absolute top-[10%] right-[5%] w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 shadow-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Mobile Experience</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl font-medium leading-[1.1] md:text-7xl text-black"
            >
              The world’s tech. <br />
              <i>Right</i> in your pocket.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-8 text-lg text-zinc-600 leading-relaxed"
            >
              Experience the future of refurbished tech. Our upcoming app brings 
              expert certification, instant trade-ins, and lifetime support to 
              a single, beautiful interface.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-12 space-y-6"
            >
              <div className="flex items-center gap-4 group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl transition-transform group-hover:scale-110">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-black">Instant Price Alerts</h4>
                  <p className="text-sm text-zinc-500">Get notified the second your dream tech drops in price.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl transition-transform group-hover:scale-110">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-black">One-Tap Warranties</h4>
                  <p className="text-sm text-zinc-500">Manage all your device protections from one simple dashboard.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex flex-wrap gap-4"
            >
              <button className="flex items-center gap-3 rounded-2xl bg-zinc-950 px-6 py-4 text-white shadow-2xl transition-all hover:scale-105 active:scale-95 group">
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Coming soon to</span>
                  <span className="mt-1 text-sm font-bold">App Store</span>
                </div>
                <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
              </button>
              <button className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-black shadow-lg transition-all hover:scale-105 active:scale-95 group">
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Coming soon to</span>
                  <span className="mt-1 text-sm font-bold">Google Play</span>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-20 bg-accent/20 blur-[100px] rounded-full opacity-50" />
              
              <div className="relative w-[300px] sm:w-[340px] rounded-[3.5rem] bg-zinc-950 p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
                <div className="absolute left-1/2 top-2 z-20 h-7 w-36 -translate-x-1/2 rounded-b-3xl bg-zinc-950" />
                
                <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.5rem] bg-white">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={screenId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                      className="h-full w-full"
                    >
                      {screenId === "shop" && <PhoneShopScreen />}
                      {screenId === "product" && <PhoneProductScreen />}
                      {screenId === "cart" && <PhoneCartScreen />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-zinc-200/20" />
              </div>

              <div className="absolute -left-12 bottom-12 z-30">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                      <Star className="h-5 w-5 text-black fill-black" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-black">4.9/5 Rating</div>
                      <div className="text-[10px] text-zinc-500">Beta Community</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

function BrandTicker() {
  const brands = ["Apple", "Samsung", "Google", "Sony", "Dell", "Microsoft", "Asus", "HP", "Lenovo", "LG"];
  const doubledBrands = [...brands, ...brands];

  return (
    <section className="relative overflow-hidden border-y border-zinc-100 bg-white py-12">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-48 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-48 bg-gradient-to-l from-white to-transparent" />
      
      <div className="flex w-max animate-marquee items-center gap-16 whitespace-nowrap">
        {doubledBrands.map((brand, i) => (
          <div key={i} className="flex items-center gap-16 group">
            <span className="text-3xl font-bold tracking-tighter text-zinc-900 group-hover:text-accent transition-colors duration-300 cursor-default">
              {brand}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 group-hover:bg-accent transition-all duration-300" />
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Modular Homepage Sections ---

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            className="md:hidden" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <Check className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <a href="/" className="text-xl md:text-2xl font-bold tracking-tighter">
            MARKHOR<span className="text-zinc-400">MARKET</span>
          </a>
          <div className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tech..."
                className="h-10 w-[300px] lg:w-[400px] rounded-full bg-zinc-100 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-black/5 focus:bg-white border border-transparent focus:border-zinc-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-6 text-sm font-medium">
          <div className="hidden md:flex items-center gap-6">
            <a href="/sell" className="hover:text-zinc-600 transition-colors">Sell</a>
            <a href="/help" className="hover:text-zinc-600 transition-colors">Help</a>
          </div>
          <a href="/login" className="flex items-center gap-2 hover:text-zinc-600 transition-colors">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Log in</span>
          </a>
          <a href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100 transition-colors">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black">
              0
            </span>
          </a>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-100 bg-white px-4 py-6"
          >
            <div className="flex flex-col gap-6 font-bold uppercase tracking-widest text-xs">
              <a href="/shop" className="flex items-center justify-between">Shop All <ChevronRight className="h-4 w-4" /></a>
              <a href="/sell" className="flex items-center justify-between">Sell Your Device <ChevronRight className="h-4 w-4" /></a>
              <a href="/help" className="flex items-center justify-between">Help Center <ChevronRight className="h-4 w-4" /></a>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="h-12 w-full rounded-2xl bg-zinc-100 pl-10 pr-4 text-sm outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function CategoryRail() {
  const categories = [
    { name: "Smartphones", icon: Smartphone },
    { name: "Laptops", icon: Laptop },
    { name: "Tablets", icon: Tablet },
    { name: "Headphones", icon: Headphones },
    { name: "Gaming", icon: Gamepad2 },
    { name: "Audio", icon: Speaker },
    { name: "Watches", icon: Watch },
    { name: "Cameras", icon: Camera },
  ];

  return (
    <div className="border-b border-zinc-100 overflow-x-auto scrollbar-hide bg-white">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-4 sm:px-6 lg:px-8">
        {categories.map((cat) => (
          <a key={cat.name} href={`/shop?category=${cat.name.toLowerCase()}`} className="flex flex-shrink-0 flex-col items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-xl transition-all group-hover:scale-110 group-hover:bg-accent/20">
              <cat.icon className="h-5 w-5 text-zinc-600 group-hover:text-black" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-black">
              {cat.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-zinc-950 text-white min-h-[500px] md:min-h-[600px] flex flex-col lg:flex-row items-stretch lg:items-center">
        <div className="flex-1 p-8 md:p-16 lg:p-24 relative z-20 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8 inline-flex self-start items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-accent"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Summer Tech Event
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl font-medium leading-[1] md:text-8xl tracking-tight"
          >
            Refurbished. <br />
            <span className="text-zinc-400 italic">Remarkable.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed text-zinc-300 max-w-md font-medium"
          >
            Premium technology, expertly certified for a second life. 
            Better for the planet, exceptional for your wallet.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 md:mt-12 flex flex-col sm:flex-row gap-4"
          >
            <a href="/shop" className="rounded-2xl bg-accent px-8 md:px-10 py-4 md:py-5 text-sm font-bold text-black text-center transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20">
              Shop All Tech
            </a>
            <a href="/sell" className="rounded-2xl border border-white/20 bg-transparent px-8 md:px-10 py-4 md:py-5 text-sm font-bold text-white text-center transition-all hover:bg-white/5 hover:scale-105 active:scale-95">
              Sell Your Device
            </a>
          </motion.div>
        </div>
        <div className="flex-1 relative min-h-[300px] sm:min-h-[400px] lg:h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent z-10" />
          <Image 
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop" 
            alt="Refurbished technology" 
            fill 
            className="object-cover opacity-60 lg:opacity-80"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function TrustSignals() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "12-month warranty", text: "Every device is covered for a full year.", icon: ShieldCheck },
          { title: "30-day returns", text: "Not satisfied? Send it back for free.", icon: RefreshCw },
          { title: "Expert certification", text: "25+ quality checks by professionals.", icon: CheckCircle2 },
        ].map((item) => (
          <div key={item.title} className="group flex items-center gap-5 rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 bg-zinc-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
              <item.icon className="h-6 w-6 text-black" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-bold text-black text-sm md:text-base">{item.title}</h3>
              <p className="text-xs md:text-sm text-zinc-500">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCategories() {
  const categories = [
    { 
      title: "Smartphones", 
      desc: "Latest flagships, expert certified.",
      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
      href: "/shop?category=smartphones",
    },
    { 
      title: "Laptops", 
      desc: "Performance for work and play.",
      img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop",
      href: "/shop?category=laptops",
    },
    { 
      title: "Audio", 
      desc: "Immersive sound experiences.",
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
      href: "/shop?category=audio",
    },
    { 
      title: "Tablets", 
      desc: "Power in a portable form.",
      img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop",
      href: "/shop?category=tablets",
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 sm:px-6 lg:px-8">
      <div className="mb-12 md:mb-16 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl font-medium">Shop by Category</h2>
          <p className="mt-2 text-zinc-500 font-medium text-base md:text-lg">Find exactly what you need.</p>
        </div>
        <a href="/shop" className="text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">Browse All</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {categories.map((cat, i) => (
          <motion.div 
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-zinc-50 aspect-[4/5] sm:aspect-[3/4]"
          >
            <img 
              src={cat.img} 
              alt={cat.title} 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8">
              <h3 className="font-serif text-2xl md:text-3xl text-white mb-2">{cat.title}</h3>
              <p className="text-zinc-300 mb-4 md:mb-6 text-xs md:text-sm font-medium">{cat.desc}</p>
              <a href={cat.href} className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-accent hover:text-white transition-colors">
                Explore Now
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TrendingDeals() {
  const featuredProducts = [
    {
      title: "iPhone 14 Pro",
      grade: "Excellent",
      storage: "256 GB",
      price: "$679.00",
      oldPrice: "$1,099.00",
      rating: 4.8,
      reviews: 1240,
      image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400&h=400&auto=format&fit=crop",
    },
    {
      title: "MacBook Air M2",
      grade: "Very Good",
      storage: "16 GB / 512 GB",
      price: "$899.00",
      oldPrice: "$1,499.00",
      rating: 4.9,
      reviews: 856,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&h=400&auto=format&fit=crop",
    },
    {
      title: "S23 Ultra",
      grade: "Excellent",
      storage: "128 GB",
      price: "$469.00",
      oldPrice: "$859.00",
      rating: 4.7,
      reviews: 420,
      image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=400&h=400&auto=format&fit=crop",
    },
    {
      title: "PlayStation 5",
      grade: "Certified",
      storage: "825 GB",
      price: "$399.00",
      oldPrice: "$629.00",
      rating: 4.8,
      reviews: 2100,
      image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=500&auto=format&fit=crop",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 sm:px-6 lg:px-8">
      <div className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-black">Trending picks</h2>
          <p className="mt-2 md:mt-4 text-zinc-500 text-base md:text-lg font-medium">Top-rated tech from our expert sellers.</p>
        </div>
        <a href="/shop" className="group flex items-center gap-3 text-xs md:text-sm font-bold uppercase tracking-widest text-black">
          View All Products
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 transition-transform group-hover:translate-x-2">
            <ArrowRight className="h-4 w-4" />
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
        {featuredProducts.map((product, i) => (
          <motion.article 
            key={product.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <a href={`/shop/${product.title.toLowerCase().replace(/ /g, '-')}`}>
              <div className="relative aspect-square overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-zinc-50 p-6 md:p-8 transition-all group-hover:bg-zinc-100 group-hover:shadow-2xl">
                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 rounded-full bg-white px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  {product.grade}
                </div>
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-lg font-bold text-black">{product.title}</h3>
                <p className="text-[10px] md:text-xs font-semibold text-zinc-400 uppercase tracking-widest">{product.storage}</p>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className={`h-3 w-3 ${j < 4 ? 'fill-accent text-accent' : 'fill-zinc-200 text-zinc-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-black">{product.rating}</span>
                  <span className="text-xs text-zinc-400">({product.reviews})</span>
                </div>
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-xl md:text-2xl font-bold text-black">{product.price}</span>
                  <span className="text-sm text-zinc-400 line-through">{product.oldPrice}</span>
                </div>
              </div>
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function FlashSale() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] bg-accent p-8 md:p-16 lg:p-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white mb-6 md:mb-8">
            <Bell className="h-3.5 w-3.5 text-accent animate-bounce" />
            Limited time only
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl md:text-8xl font-medium text-black leading-[0.95] mb-6 md:mb-8 tracking-tight">
            The Flash <br/>Sale is live.
          </h2>
          <p className="text-lg md:text-xl text-black/60 mb-8 md:mb-12 max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
            Expertly certified tech at prices you won't believe. Extra 10% off on all accessories today.
          </p>
          <button className="w-full sm:w-auto rounded-2xl bg-black px-12 py-5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-2xl">
            Claim Your Offer
          </button>
        </div>
        <div className="hidden sm:block flex-1 relative w-full max-w-[400px] lg:max-w-none">
          <div className="aspect-square w-full rounded-full border-[20px] md:border-[40px] border-black/5 flex items-center justify-center p-8 md:p-12 relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-[2px] border-dashed border-black/20 rounded-full"
            />
            <div className="text-[120px] md:text-[180px] drop-shadow-2xl select-none">⚡</div>
          </div>
          <div className="absolute top-0 right-0 h-24 w-24 md:h-32 md:w-32 bg-white/40 blur-[40px] md:blur-[60px] rounded-full" />
        </div>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section className="bg-zinc-50 py-16 md:py-32 border-y border-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="text-center lg:text-left">
            <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center mb-8 mx-auto lg:mx-0">
              <Leaf className="h-6 w-6 text-accent" />
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-medium leading-[1.05] text-black tracking-tight">
              Saving the planet, <br/><i className="text-zinc-400">one phone</i> at a time.
            </h2>
            <p className="mt-6 md:mt-8 text-lg md:text-xl leading-relaxed text-zinc-600 font-medium max-w-xl mx-auto lg:mx-0">
              Every refurbished device means one less machine in the landfill. 
              Choosing a refurbished smartphone saves 77kg of CO2 and 243kg of raw materials.
            </p>
            <div className="mt-10 md:mt-12">
              <a href="/sustainability" className="group inline-flex items-center gap-4 rounded-2xl bg-black px-8 md:px-10 py-4 md:py-5 text-sm font-bold text-white transition-all hover:scale-105">
                Our Sustainability Mission
                <ArrowRight className="h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/5] sm:aspect-video lg:aspect-square overflow-hidden rounded-[2rem] md:rounded-[3.5rem] shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop" 
              alt="Nature sustainability"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] text-white">
              <p className="text-xl md:text-2xl font-serif italic mb-2">"Better for the planet, better for you."</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Est. 2024</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-black py-20 md:py-32 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 blur-[100px] md:blur-[150px] rounded-full" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center lg:text-left">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <h2 className="font-serif text-4xl sm:text-5xl md:text-7xl font-medium mb-6 tracking-tight">Stay in the loop.</h2>
          <p className="text-lg md:text-xl text-zinc-400 mb-10 md:mb-12 font-medium leading-relaxed">Get expert tech guides, sustainability tips, and secret drops delivered to your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1" suppressHydrationWarning>
              <input
                type="email"
                placeholder="Enter your email"
                className="h-16 w-full rounded-2xl bg-zinc-900 border border-zinc-800 px-6 text-sm outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
            <button className="h-16 rounded-2xl bg-accent px-12 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20">
              Subscribe
            </button>
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-zinc-600">No spam. Only the good stuff.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white pt-16 md:pt-24 pb-12 border-t border-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:gap-16 md:grid-cols-4 pb-16 md:pb-20">
          <div className="col-span-full lg:col-span-2">
            <a href="/" className="text-2xl md:text-3xl font-bold tracking-tighter">
              MARKHOR<span className="text-zinc-400">MARKET</span>
            </a>
            <p className="mt-6 md:mt-8 max-w-sm text-zinc-500 leading-relaxed font-medium">
              We're on a mission to make world-class technology accessible and sustainable. 
              Join us in reducing e-waste while saving on the tech you love.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Explore</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              <li><a href="/shop" className="hover:text-black transition-colors">Shop All</a></li>
              <li><a href="/sell" className="hover:text-black transition-colors">Sell Your Tech</a></li>
              <li><a href="/how-it-works" className="hover:text-black transition-colors">How it Works</a></li>
              <li><a href="/sustainability" className="hover:text-black transition-colors">Sustainability</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              <li><a href="/help" className="hover:text-black transition-colors">Help Center</a></li>
              <li><a href="/shipping" className="hover:text-black transition-colors">Shipping</a></li>
              <li><a href="/warranty" className="hover:text-black transition-colors">Warranty</a></li>
              <li><a href="/contact" className="hover:text-black transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-10 md:pt-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 text-center md:text-left">© 2024 Markhor Market. Built for the planet.</p>
          <div className="flex gap-6 md:gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-black transition-colors">Terms</a>
            <a href="/cookies" className="hover:text-black transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans scroll-smooth selection:bg-accent selection:text-black">
      <Navbar />
      <CategoryRail />
      <main className="flex-1">
        <Hero />
        <TrustSignals />
        <BrandTicker />
        <FeaturedCategories />
        <TrendingDeals />
        <AppPreview />
        <FlashSale />
        <Mission />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
