"use client";

import { useState } from "react";
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  ChevronRight, 
  X,
  Zap,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ itemsCount = 0 }: { itemsCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Top Promo Bar (Back Market Style) */}
      <div className="bg-black text-white py-2 px-4 overflow-hidden relative group">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent animate-pulse" />
            <span>Free delivery on all tech above $50</span>
          </div>
          <span className="hidden md:inline h-1 w-1 rounded-full bg-white/20" />
          <a href="/sell" className="hidden md:flex items-center gap-2 hover:text-accent transition-colors">
            Sell your tech for cash
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md text-black font-sans">
        <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 md:gap-12">
            <button 
              className="lg:hidden" 
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <a href="/" className="text-xl md:text-2xl font-bold tracking-tighter text-black flex items-center gap-1">
              TECHSTOP<span className="text-zinc-400 font-medium tracking-normal text-lg md:text-xl relative top-[1px]">LEICESTER</span>
            </a>
            <div className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
               <a href="/shop" className="hover:text-black transition-colors">Shop</a>
               <a href="/sell" className="hover:text-black transition-colors">Sell</a>
               <a href="/help" className="hover:text-black transition-colors">Help</a>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:block relative group">
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-[200px] lg:w-[300px] rounded-2xl bg-zinc-100 pl-10 pr-4 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-black focus:bg-white border border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black transition-colors" />
            </div>

            <a href="/login" className="flex items-center gap-2 h-10 px-4 rounded-2xl hover:bg-zinc-100 transition-all font-bold text-xs uppercase tracking-wide">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Log in</span>
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-zinc-100 bg-white px-4 py-8"
            >
              <div className="flex flex-col gap-8 font-bold uppercase tracking-[0.2em] text-xs text-black">
                <a href="/shop" className="flex items-center justify-between">Shop All <ChevronRight className="h-4 w-4" /></a>
                <a href="/sell" className="flex items-center justify-between">Sell Your Device <ChevronRight className="h-4 w-4" /></a>
                <a href="/help" className="flex items-center justify-between">Help Center <ChevronRight className="h-4 w-4" /></a>
                
                <div className="pt-8 mt-8 border-t border-zinc-100 space-y-6">
                   <a href="/login" className="flex items-center gap-3">
                      <User className="h-4 w-4" />
                      Log in
                   </a>
                   <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        className="h-14 w-full rounded-2xl bg-zinc-100 pl-10 pr-4 text-sm font-bold outline-none"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
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
