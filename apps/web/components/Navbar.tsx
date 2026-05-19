"use client";

import { useState } from "react";
import {
  ShoppingCart, User, Search, Menu, ChevronRight, X, Zap, ArrowRight,
  Smartphone, Tablet, Gamepad2, Laptop, Headphones, RefreshCw, Wrench
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SHOP_CATEGORIES = [
  { label: "Phones", href: "/shop/phones", icon: Smartphone },
  { label: "Tablets", href: "/shop/tablets", icon: Tablet },
  { label: "Consoles", href: "/shop/consoles", icon: Gamepad2 },
  { label: "Laptops", href: "/shop/laptops", icon: Laptop },
  { label: "Audio", href: "/shop/audio", icon: Headphones },
];

export default function Navbar({ itemsCount = 0 }: { itemsCount?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const MOCK_SEARCH_ITEMS = [
    { id: "iphone-15-pro", title: "iPhone 15 Pro", category: "phones", brand: "Apple", price: "739", image: "https://picsum.photos/seed/iphone_wanted/100/100" },
    { id: "iphone-13-pro-max", title: "iPhone 13 Pro Max", category: "phones", brand: "Apple", price: "529", image: "https://picsum.photos/seed/custphone1/100/100" },
    { id: "galaxy-s24-ultra", title: "Galaxy S24 Ultra", category: "phones", brand: "Samsung", price: "819", image: "https://picsum.photos/seed/samsung_wanted/100/100" },
    { id: "google-pixel-7", title: "Google Pixel 7", category: "phones", brand: "Google", price: "349", image: "https://picsum.photos/seed/google_wanted/100/100" },
    { id: "macbook-air-m2", title: "MacBook Air M2", category: "laptops", brand: "Apple", price: "849", image: "https://picsum.photos/seed/macbook_wanted/100/100" },
    { id: "playstation-5", title: "PlayStation 5 Disc Edition", category: "consoles", brand: "Sony", price: "389", image: "https://picsum.photos/seed/ps5_wanted/100/100" },
  ];

  const POPULAR_SEARCHES = [
    "iPhone 15 Pro",
    "Nintendo Switch OLED",
    "MacBook Air M2",
    "Galaxy Watch",
    "PS5 Console",
  ];

  return (
    <>
      {/* Promo bar */}
      <div className="bg-black text-white py-1.5 px-4 overflow-hidden">
        <div className="mx-auto max-w-7xl flex items-center justify-center gap-6 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent animate-pulse" />
            <span>Free delivery on all tech above £50</span>
          </div>
          <span className="hidden md:inline h-1 w-1 rounded-full bg-white/20" />
          <Link href="/trade-in" className="hidden md:flex items-center gap-2 hover:text-accent transition-colors">
            Sell your tech for cash <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-zinc-150 bg-white/95 backdrop-blur-md text-black font-sans">
        {/* Tier 1: Main row (Logo, Search, Actions) */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-zinc-100/80">
          <div className="flex h-14 md:h-16 items-center justify-between gap-4">
            
            {/* Left: Mobile hamburger menu toggle + Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <Link href="/" className="text-xl md:text-2xl font-black tracking-tighter text-black flex items-center gap-1">
                TECHSTOP<span className="text-zinc-400 font-bold tracking-normal text-lg md:text-xl">LEICESTER</span>
              </Link>
            </div>

            {/* Center: Massive Search Bar with interactive preview */}
            <div className="hidden lg:block flex-1 max-w-2xl relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  placeholder="Search for iPhones, MacBooks, iPads, Consoles..."
                  className="h-11 w-full rounded-2xl bg-zinc-100 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-black focus:bg-white border border-transparent"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              </div>

              {/* Search Results Preview Dropdown */}
              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-[24px] shadow-2xl overflow-hidden z-50 p-5"
                  >
                    {searchQuery === "" ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Popular Searches</p>
                          <div className="flex flex-wrap gap-2">
                            {POPULAR_SEARCHES.map((term) => (
                              <button
                                key={term}
                                onClick={() => setSearchQuery(term)}
                                className="px-3.5 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-bold hover:border-black hover:bg-white transition-colors"
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Shop Categories</p>
                          <div className="grid grid-cols-5 gap-3">
                            {SHOP_CATEGORIES.map(({ label, href, icon: Icon }) => (
                              <Link
                                key={label}
                                href={href}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-50 hover:bg-black hover:text-white border border-zinc-150/60 hover:border-black transition-all group"
                              >
                                <Icon className="h-5 w-5 text-zinc-500 group-hover:text-white transition-colors mb-1.5" />
                                <span className="text-[10px] font-extrabold">{label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Matching Products</p>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {MOCK_SEARCH_ITEMS.filter((item) =>
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.brand.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((item) => (
                            <Link
                              key={item.id}
                              href={`/shop/${item.category}`}
                              className="flex items-center gap-4 p-2 rounded-xl hover:bg-zinc-50 transition-colors group"
                            >
                              <div className="h-10 w-10 bg-zinc-100 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                                <img src={item.image} alt={item.title} className="h-full w-full object-contain mix-blend-multiply" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-zinc-950 group-hover:text-black">{item.title}</p>
                                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">{item.brand} • {item.category}</p>
                              </div>
                              <span className="text-xs font-extrabold text-zinc-950">£{item.price}</span>
                            </Link>
                          ))}
                          {MOCK_SEARCH_ITEMS.filter((item) =>
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.brand.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 && (
                            <p className="text-xs font-bold text-zinc-400 py-4 text-center">No matching refurbished items found.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Account + Cart */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              <Link href="/account" className="flex items-center gap-2 h-10 px-4 rounded-xl hover:bg-zinc-100 transition-all font-bold text-xs uppercase tracking-wide">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </Link>

              <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-[14px] bg-accent text-black transition-transform hover:scale-105 active:scale-95 shadow-md shadow-accent/20">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                {itemsCount >= 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white ring-2 ring-white">
                    {itemsCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>

        {/* Tier 2: Category Bar (Desktop only) */}
        <div className="hidden lg:block bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            {/* Category Links */}
            <nav className="flex items-center gap-1.5 text-xs font-bold relative bg-zinc-100/50 p-1 rounded-full border border-zinc-200/40">
              {[
                { label: "All Products", href: "/" },
                ...SHOP_CATEGORIES
              ].map(({ label, href }) => {
                const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`relative px-4 py-2 rounded-full transition-colors duration-250 ${
                      isActive ? "text-white z-10 font-extrabold" : "text-zinc-600 hover:text-black font-semibold"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryTab"
                        className="absolute inset-0 bg-zinc-950 rounded-full -z-10 shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Utility Links */}
            <div className="flex items-center gap-6 text-sm font-bold text-zinc-655">
              <Link href="/trade-in" className="flex items-center gap-1.5 hover:text-black transition-colors text-zinc-500">
                <RefreshCw className="h-4 w-4" />
                Sell Your Device
              </Link>
              <Link href="/repair" className="flex items-center gap-1.5 hover:text-black transition-colors text-zinc-500">
                <Wrench className="h-4 w-4" />
                Book a Repair
              </Link>
              <Link href="/help" className="hover:text-black transition-colors text-zinc-500">
                Help Centre
              </Link>
            </div>
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
                {/* Search bar inside mobile drawer */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="h-11 w-full rounded-xl bg-zinc-100 pl-10 pr-4 text-sm font-bold outline-none"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>
                </div>

                 {/* Category links */}
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 px-3 pb-2 pt-1">Categories</p>
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    pathname === "/" ? "bg-black text-white" : "hover:bg-zinc-50"
                  }`}
                >
                  All Products
                  <ChevronRight className={`h-4 w-4 ml-auto ${pathname === "/" ? "text-white" : "text-zinc-300"}`} />
                </Link>
                {SHOP_CATEGORIES.map(({ label, href, icon: Icon }) => {
                  const isActive = pathname?.startsWith(href);
                  return (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive ? "bg-black text-white" : "hover:bg-zinc-50"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-500"}`} strokeWidth={1.8} />
                      <span className="text-sm font-bold">{label}</span>
                      <ChevronRight className={`h-4 w-4 ml-auto ${isActive ? "text-white" : "text-zinc-300"}`} />
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-zinc-100 space-y-1">
                  <Link href="/trade-in" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 text-sm font-bold">
                    <RefreshCw className="h-4 w-4 text-zinc-400" /> Sell Your Device
                  </Link>
                  <Link href="/repair" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 text-sm font-bold">
                    <Wrench className="h-4 w-4 text-zinc-400" /> Book a Repair
                  </Link>
                  <Link href="/help" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 text-sm font-bold">
                    Help Centre
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
