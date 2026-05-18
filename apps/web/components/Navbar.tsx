"use client";

import { useState } from "react";
import {
  ShoppingCart, User, Search, Menu, ChevronRight, X, Zap, ArrowRight,
  Smartphone, Tablet, Gamepad2, Laptop, Headphones, RefreshCw, Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SHOP_CATEGORIES = [
  { label: "Phones", href: "/shop/phones", icon: Smartphone, desc: "iPhones, Galaxy, Pixel", mood: "bg-blue-50 text-blue-600" },
  { label: "Tablets", href: "/shop/tablets", icon: Tablet, desc: "iPad, Galaxy Tab, Surface", mood: "bg-rose-50 text-rose-600" },
  { label: "Consoles", href: "/shop/consoles", icon: Gamepad2, desc: "PS5, Xbox, Nintendo", mood: "bg-violet-50 text-violet-600" },
  { label: "Laptops", href: "/shop/laptops", icon: Laptop, desc: "MacBook, ThinkPad, XPS", mood: "bg-amber-50 text-amber-600" },
  { label: "Accessories", href: "/shop/accessories", icon: Headphones, desc: "Headphones, cables & more", mood: "bg-emerald-50 text-emerald-600" },
];

export default function Navbar({ itemsCount = 0 }: { itemsCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <>
      {/* Promo bar */}
      <div className="bg-black text-white py-2 px-4 overflow-hidden">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent animate-pulse" />
            <span>Free delivery on all tech above £50</span>
          </div>
          <span className="hidden md:inline h-1 w-1 rounded-full bg-white/20" />
          <a href="/trade-in" className="hidden md:flex items-center gap-2 hover:text-accent transition-colors">
            Sell your tech for cash <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-md text-black font-sans">
        <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left: logo + nav */}
          <div className="flex items-center gap-4 md:gap-10">
            <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <a href="/" className="text-xl md:text-2xl font-bold tracking-tighter text-black flex items-center gap-1">
              TECHSTOP<span className="text-zinc-400 font-medium tracking-normal text-lg md:text-xl relative top-px">LEICESTER</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
              {/* Shop mega-trigger */}
              <div
                className="relative"
                onMouseEnter={() => setShopOpen(true)}
                onMouseLeave={() => setShopOpen(false)}
              >
                <button className={`flex items-center gap-1.5 h-10 px-4 rounded-xl transition-colors ${shopOpen ? "bg-zinc-100 text-black" : "text-zinc-500 hover:text-black hover:bg-zinc-50"}`}>
                  Shop
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${shopOpen ? "rotate-90" : ""}`} />
                </button>

                {/* Mega dropdown */}
                <AnimatePresence>
                  {shopOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full pt-3 w-120 z-50"
                    >
                      <div className="bg-white rounded-3xl border border-zinc-100 shadow-2xl shadow-black/10 p-5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 px-2 mb-3">Browse by category</p>
                        <div className="grid grid-cols-1 gap-1">
                          {SHOP_CATEGORIES.map(({ label, href, icon: Icon, desc, mood }) => (
                            <a
                              key={label}
                              href={href}
                              className="flex items-center gap-4 px-3 py-3 rounded-2xl hover:bg-zinc-50 transition-colors group"
                            >
                              <div className={`h-10 w-10 rounded-xl ${mood.split(" ")[0]} flex items-center justify-center shrink-0`}>
                                <Icon className={`h-5 w-5 ${mood.split(" ")[1]}`} strokeWidth={1.5} />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm text-black">{label}</p>
                                <p className="text-xs text-zinc-400 font-medium normal-case tracking-normal">{desc}</p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                            </a>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-zinc-100 flex gap-2">
                          <a href="/shop" className="flex-1 flex items-center justify-center gap-2 h-10 rounded-2xl bg-zinc-950 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
                            View all products <ArrowRight className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a href="/trade-in" className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />
                Sell
              </a>
              <a href="/repair" className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors">
                <Wrench className="h-3.5 w-3.5" />
                Repairs
              </a>
              <a href="/help" className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors">
                Help
              </a>
            </nav>
          </div>

          {/* Right: search + account + cart */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden md:block relative group">
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-50 lg:w-75 rounded-2xl bg-zinc-100 pl-10 pr-4 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-black focus:bg-white border border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black transition-colors" />
            </div>

            <a href="/account" className="flex items-center gap-2 h-10 px-4 rounded-2xl hover:bg-zinc-100 transition-all font-bold text-xs uppercase tracking-wide">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </a>

            <a href="/cart" className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-accent text-black transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-accent/20">
              <ShoppingCart className="h-5 w-5" />
              {itemsCount >= 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white ring-2 ring-white">
                  {itemsCount}
                </span>
              )}
            </a>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-zinc-100 bg-white overflow-hidden"
            >
              <div className="px-4 py-6 space-y-1">
                {/* Category links */}
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 px-3 pb-2 pt-1">Shop</p>
                {SHOP_CATEGORIES.map(({ label, href, icon: Icon, mood }) => (
                  <a
                    key={label}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 transition-colors"
                  >
                    <div className={`h-8 w-8 rounded-lg ${mood.split(" ")[0]} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${mood.split(" ")[1]}`} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-bold">{label}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-300 ml-auto" />
                  </a>
                ))}

                <div className="pt-3 mt-3 border-t border-zinc-100 space-y-1">
                  <a href="/trade-in" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 text-sm font-bold">
                    <RefreshCw className="h-4 w-4 text-zinc-400" /> Sell Your Device
                  </a>
                  <a href="/repair" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 text-sm font-bold">
                    <Wrench className="h-4 w-4 text-zinc-400" /> Book a Repair
                  </a>
                  <a href="/help" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-zinc-50 text-sm font-bold">
                    Help Centre
                  </a>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="h-12 w-full rounded-2xl bg-zinc-100 pl-10 pr-4 text-sm font-bold outline-none"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
