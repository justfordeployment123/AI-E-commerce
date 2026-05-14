"use client";

import { useState } from "react";
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  ChevronRight, 
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ itemsCount = 0 }: { itemsCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md text-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            className="md:hidden" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <a href="/" className="text-xl md:text-2xl font-bold tracking-tighter text-black">
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
            <a href="/shop" className="hover:text-zinc-600 transition-colors">Shop</a>
            <a href="/sell" className="hover:text-zinc-600 transition-colors">Sell</a>
            <a href="/help" className="hover:text-zinc-600 transition-colors">Help</a>
          </div>
          <a href="/login" className="flex items-center gap-2 hover:text-zinc-600 transition-colors">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Log in</span>
          </a>
          <a href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100 transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black">
                {itemsCount}
              </span>
            )}
          </a>
        </nav>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-zinc-100 bg-white px-4 py-6"
          >
            <div className="flex flex-col gap-6 font-bold uppercase tracking-widest text-xs text-black">
              <a href="/shop" className="flex items-center justify-between">Shop All <ChevronRight className="h-4 w-4" /></a>
              <a href="/sell" className="flex items-center justify-between">Sell Your Device <ChevronRight className="h-4 w-4" /></a>
              <a href="/help" className="flex items-center justify-between">Help Center <ChevronRight className="h-4 w-4" /></a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
