"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  ShoppingCart, Search, Menu, ChevronRight, X, Zap, ArrowRight,
  RefreshCw, Wrench, Package, Settings, LogOut, LogIn, Sun, Moon, MoreHorizontal
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { useCart } from "../context/cart-context";
import { NotificationBell } from "./NotificationBell";
import ProductImage from "./ProductImage";
import { catalogApi, productsApi, otherSubcategoriesApi } from "../lib/api";


export default function Navbar() {
  const { count: itemsCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ slug: string; name: string; brand: string; category: string; price: number | null; image: string | null }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const [theme, setTheme] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shopCategories, setShopCategories] = useState<{ label: string; href: string; slug: string }[]>([]);
  const [categoryBrands, setCategoryBrands] = useState<Record<string, string[]>>({});
  const [categoryDescriptions, setCategoryDescriptions] = useState<Record<string, string>>({});
  const [categoryDisplayNames, setCategoryDisplayNames] = useState<Record<string, string>>({});
  const [otherSubcats, setOtherSubcats] = useState<{ label: string; slug: string }[]>([]);

  function openDropdown(slug: string) {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setHoveredCat(slug);
  }

  function scheduleClose() {
    closeTimeout.current = setTimeout(() => setHoveredCat(null), 120);
  }

  function cancelClose() {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  }

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(currentTheme);
    setMounted(true);

    // Slugs grouped under a single "Others" tab — always rendered last
    const OTHERS_SLUGS = new Set([
      'accessories', 'cables', 'chargers', 'memory', 'storage',
      'mouse', 'pen', 'graphics', 'lens',
      'smartwatches', 'games', 'films',
      'other', 'others',
    ]);

    const loadCategories = (retries = 3) => {
      catalogApi.listCategories()
        .then(cats => {
          const mainCats = cats
            .filter(c => !OTHERS_SLUGS.has(c.name.toLowerCase()))
            .map(c => ({
              label: c.name,
              href: `/shop/${c.name.toLowerCase()}`,
              slug: c.name.toLowerCase(),
            }));
          mainCats.push({ label: "Others", href: `/shop/others`, slug: "other" });
          setShopCategories(mainCats);

          // Store descriptions + displayNames from DB
          const descs: Record<string, string> = {};
          const displayNames: Record<string, string> = {};
          cats.filter(c => !OTHERS_SLUGS.has(c.name.toLowerCase())).forEach(c => {
            const key = c.name.toLowerCase();
            if (c.description) descs[key] = c.description;
            if (c.displayName)  displayNames[key] = c.displayName;
          });
          setCategoryDescriptions(descs);
          setCategoryDisplayNames(displayNames);

          cats
            .filter(c => !OTHERS_SLUGS.has(c.name.toLowerCase()))
            .forEach(c => {
              productsApi.brands(c.name)
                .then(brands => setCategoryBrands(prev => ({ ...prev, [c.name.toLowerCase()]: brands.map(b => b.brand) })))
                .catch(() => {});
            });
        })
        .catch(() => { if (retries > 0) setTimeout(() => loadCategories(retries - 1), 1500); });
    };

    loadCategories();

    otherSubcategoriesApi.list()
      .then(subcats => setOtherSubcats(subcats.map(s => ({ label: s.name, slug: s.id }))))
      .catch(() => {});
  }, []);

  // Live search — fetch real products from API as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      setSearchLoading(true);
      productsApi.list({ search: q, limit: 6 })
        .then(r => setSearchResults(r.items.map(p => ({
          slug: p.slug, name: p.name, brand: p.brand,
          category: p.category, price: p.price ?? null, image: p.images?.[0] ?? null,
        }))))
        .catch(() => {})
        .finally(() => setSearchLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("ts-theme", nextTheme);
  };


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

      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md text-foreground font-sans">
        {/* Tier 1: Main row (Logo, Search, Actions) */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 border-b border-border/40">
          <div className="flex h-14 md:h-16 items-center justify-between gap-4">
            
            {/* Left: Mobile hamburger menu toggle + Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <button className="lg:hidden text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <Link href="/" className="flex items-center select-none">
                <img
                  src="/Icon/logo_black.png"
                  alt="TechStop Leicester"
                  className="h-8 md:h-9 w-auto object-contain block dark:hidden"
                />
                <img
                  src="/Icon/logo_white.png"
                  alt="TechStop Leicester"
                  className="h-8 md:h-9 w-auto object-contain hidden dark:block"
                />
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
                  className="h-11 w-full rounded-2xl bg-muted pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-accent focus:bg-background border border-border/40 text-foreground animate-none"
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
                    className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-[24px] shadow-2xl overflow-hidden z-50 p-5 text-foreground"
                  >
                    {searchQuery === "" ? (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Shop Categories</p>
                        <div className="grid grid-cols-5 gap-3">
                          {shopCategories.map(({ label, href }) => (
                            <Link key={label} href={href} className="flex items-center justify-center p-3 rounded-2xl bg-muted hover:bg-accent hover:text-white border border-border/40 hover:border-accent transition-all text-foreground">
                              <span className="text-[10px] font-extrabold text-center">{label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                          {searchLoading ? "Searching…" : "Matching Products"}
                        </p>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {searchResults.map(item => (
                            <Link key={item.slug} href={`/shop/${item.category.toLowerCase()}/${item.slug}`}
                              className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted transition-colors group text-foreground">
                              <div className="h-10 w-10 bg-image-light rounded-lg p-1.5 flex items-center justify-center shrink-0">
                                <ProductImage src={item.image} alt={item.name} width={28} height={28} iconClassName="h-4 w-4" bg="" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground group-hover:text-accent truncate">{item.name}</p>
                                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">{item.brand} · {item.category}</p>
                              </div>
                              {item.price != null && <span className="text-xs font-extrabold text-foreground shrink-0">£{item.price}</span>}
                            </Link>
                          ))}
                          {!searchLoading && searchResults.length === 0 && (
                            <p className="text-xs font-bold text-zinc-400 py-4 text-center">No results for &quot;{searchQuery}&quot;</p>
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

              {/* Auth button */}
              {loading ? (
                <div className="h-10 w-10 rounded-[14px] bg-muted animate-pulse" />
              ) : user ? (
                /* Logged-in avatar + dropdown */
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-[14px] bg-accent text-white font-black text-sm uppercase tracking-tight transition-transform hover:scale-105 active:scale-95 shadow-md shadow-accent/20 select-none"
                    aria-label="Profile menu"
                  >
                    {user.name.charAt(0)}
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden text-foreground"
                        >
                          {/* User info header */}
                          <div className="px-4 py-3 border-b border-border">
                            <p className="text-xs font-black text-foreground truncate">{user.name}</p>
                            <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">{user.email}</p>
                          </div>

                          {/* Menu items */}
                          <div className="p-1.5 space-y-0.5">
                            <Link
                              href="/account/settings"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Settings className="h-3.5 w-3.5 text-zinc-400" />
                              My Account
                            </Link>
                            <Link
                              href="/account/orders"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Package className="h-3.5 w-3.5 text-zinc-400" />
                              My Orders
                            </Link>
                          </div>

                          {/* Sign out */}
                          <div className="p-1.5 border-t border-border">
                            <button
                              onClick={() => { logout(); setProfileOpen(false); }}
                              className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Not logged in */
                <Link
                  href="/account"
                  className="flex items-center gap-2 h-10 px-4 rounded-xl bg-accent text-white hover:bg-accent-dark transition-all font-bold text-xs uppercase tracking-wide shadow-md shadow-accent/20"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-[14px] bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-800 text-foreground transition-transform hover:scale-105 active:scale-95 border border-border/40 shrink-0 cursor-pointer"
                title="Toggle Theme"
                aria-label="Toggle Theme"
              >
                {!mounted ? (
                  <div className="h-4 w-4 md:h-5 md:w-5" />
                ) : theme === "dark" ? (
                  <Sun className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500/20" />
                ) : (
                  <Moon className="h-4 w-4 md:h-5 md:w-5 text-zinc-750 fill-zinc-750/10" />
                )}
              </button>

              {user && <NotificationBell />}

              <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 md:h-11 md:w-11 rounded-[14px] bg-accent text-white transition-transform hover:scale-105 active:scale-95 shadow-md shadow-accent/20">
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white ring-2 ring-background">
                    {itemsCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>

        {/* Tier 2: Category Bar (Desktop only) */}
        <div className="hidden lg:block bg-muted/30 border-b border-border/20 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            {/* Category Links */}
            <nav
              className="flex items-center gap-1.5 text-xs font-bold relative bg-muted p-1 rounded-full border border-border/40"
              onMouseLeave={scheduleClose}
            >
              {[
                { label: "All Products", href: "/", slug: "" },
                ...shopCategories
              ].map(({ label, href, slug }) => {
                const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    onMouseEnter={() => slug ? openDropdown(slug) : setHoveredCat(null)}
                    className={`relative px-4 py-2 rounded-full transition-colors duration-250 ${
                      isActive ? "text-white z-10 font-extrabold" : "text-zinc-500 dark:text-zinc-400 hover:text-foreground font-semibold"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryTab"
                        className="absolute inset-0 bg-accent rounded-full -z-10 shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Utility Links */}
            <div className="flex items-center gap-2 text-xs font-bold">
              {[
                { label: "Sell Your Device", href: "/trade-in", icon: RefreshCw },
                { label: "Book a Repair", href: "/repair", icon: Wrench },
                { label: "Help Centre", href: "/help", icon: null },
              ].map(({ label, href, icon: Icon }) => {
                const isActive = pathname?.startsWith(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`relative px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors duration-250 ${
                      isActive
                        ? "bg-accent text-white shadow-sm font-extrabold"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-foreground font-semibold hover:bg-muted"
                    }`}
                  >
                    {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-zinc-500"}`} />}
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Mega Menu Dropdown — 100% from DB, no static fallbacks ── */}
          <AnimatePresence>
            {hoveredCat && (() => {
              // navLabel = short (e.g. "Audio"), heading = full display name (e.g. "Audio & Headphones")
              const navLabel = shopCategories.find(c => c.slug === hoveredCat)?.label ?? hoveredCat;
              const catLabel = categoryDisplayNames[hoveredCat] ?? navLabel;
              const desc     = categoryDescriptions[hoveredCat];
              const brands   = categoryBrands[hoveredCat] ?? [];
              const hasContent = hoveredCat === "other"
                ? otherSubcats.length > 0
                : brands.length > 0;

              if (!hasContent && !desc && hoveredCat !== "other") return null;

              return (
                <motion.div
                  key={hoveredCat}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                  className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-xl"
                >
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                      <Link href="/" className="hover:text-zinc-700 transition-colors">Home</Link>
                      <span>/</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{catLabel}</span>
                    </div>

                    <div className="flex items-end justify-between gap-8">
                      <div className="flex-1 min-w-0">
                        {/* Title — from DB name */}
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white mb-1.5">
                          {catLabel}
                        </h2>

                        {/* Description — only shown if set in admin panel */}
                        {desc && (
                          <p className="text-sm font-medium text-zinc-500 max-w-2xl leading-relaxed">
                            {desc}
                          </p>
                        )}

                        {/* Brands / subcategory chips */}
                        {hoveredCat === "other" ? (
                          otherSubcats.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Browse by type:</span>
                              {otherSubcats.map(sub => (
                                <Link key={sub.slug} href="/shop/others"
                                  className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 transition-all">
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          )
                        ) : (
                          brands.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest shrink-0">Shop by brand:</span>
                              {brands.map(brand => (
                                <Link key={brand} href={`/shop/${hoveredCat}`}
                                  className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 transition-all">
                                  {brand}
                                </Link>
                              ))}
                            </div>
                          )
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={hoveredCat === "other" ? "/shop/others" : `/shop/${hoveredCat}`}
                        className="shrink-0 flex items-center gap-2 h-11 px-6 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:opacity-90 transition-opacity"
                      >
                        Shop all {catLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border bg-background overflow-hidden text-foreground"
            >
              <div className="px-4 py-6 space-y-1">
                {/* Search bar inside mobile drawer */}
                <div className="mb-4 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setIsSearchFocused(false), 200);
                      }}
                      placeholder="Search products..."
                      className="h-11 w-full rounded-xl bg-muted pl-10 pr-4 text-sm font-bold outline-none text-foreground border border-border/40"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>

                  {/* Mobile Search Results Dropdown */}
                  <AnimatePresence>
                    {isSearchFocused && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-background border border-border rounded-[24px] shadow-2xl overflow-hidden z-50 p-5 text-foreground max-h-[350px] overflow-y-auto"
                      >
                        {searchQuery === "" ? (
                          <p className="text-xs font-semibold text-zinc-400 py-4 text-center">Type to search products…</p>
                        ) : (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                              {searchLoading ? "Searching…" : "Matching Products"}
                            </p>
                            <div className="space-y-2">
                              {searchResults.map(item => (
                                <Link key={item.slug} href={`/shop/${item.category.toLowerCase()}/${item.slug}`}
                                  onClick={() => { setIsOpen(false); setIsSearchFocused(false); }}
                                  className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted transition-colors group text-foreground">
                                  <div className="h-10 w-10 bg-image-light rounded-lg p-1.5 flex items-center justify-center shrink-0">
                                    <ProductImage src={item.image} alt={item.name} width={28} height={28} iconClassName="h-4 w-4" bg="" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-foreground group-hover:text-accent truncate">{item.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">{item.brand} · {item.category}</p>
                                  </div>
                                  {item.price != null && <span className="text-xs font-extrabold text-foreground shrink-0">£{item.price}</span>}
                                </Link>
                              ))}
                              {!searchLoading && searchResults.length === 0 && (
                                <p className="text-xs font-bold text-zinc-400 py-4 text-center">No results for &quot;{searchQuery}&quot;</p>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                 {/* Category links */}
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400 px-3 pb-2 pt-1">Categories</p>
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    pathname === "/" ? "bg-accent text-white" : "hover:bg-muted text-foreground"
                  }`}
                >
                  All Products
                  <ChevronRight className={`h-4 w-4 ml-auto ${pathname === "/" ? "text-white" : "text-zinc-400"}`} />
                </Link>
                {shopCategories.map(({ label, href }) => {
                  const isActive = pathname?.startsWith(href);
                  return (
                    <Link key={label} href={href} onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "bg-accent text-white" : "hover:bg-muted text-foreground"}`}>
                      <span className="text-sm font-bold">{label}</span>
                      <ChevronRight className={`h-4 w-4 ml-auto ${isActive ? "text-white" : "text-zinc-400"}`} />
                    </Link>
                  );
                })}

                <div className="pt-3 mt-3 border-t border-border space-y-1">
                  {[
                    { label: "Sell Your Device", href: "/trade-in", icon: RefreshCw },
                    { label: "Book a Repair", href: "/repair", icon: Wrench },
                    { label: "Help Centre", href: "/help", icon: null },
                  ].map(({ label, href, icon: Icon }) => {
                    const isActive = pathname?.startsWith(href);
                    return (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                          isActive ? "bg-accent text-white" : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-400"}`} strokeWidth={1.8} />}
                        <span>{label}</span>
                        <ChevronRight className={`h-4 w-4 ml-auto ${isActive ? "text-white" : "text-zinc-400"}`} />
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile account section */}
                <div className="pt-3 mt-3 border-t border-border">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-accent text-white font-black text-sm shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-foreground truncate">{user.name}</p>
                          <p className="text-[10px] text-zinc-400 font-semibold truncate">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/account/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-muted text-foreground transition-all">
                        <Settings className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
                        <span>My Account</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-zinc-400" />
                      </Link>
                      <Link href="/account/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-muted text-foreground transition-all">
                        <Package className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
                        <span>My Orders</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-zinc-400" />
                      </Link>
                      <button
                        onClick={() => { logout(); setIsOpen(false); }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.8} />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-accent text-white transition-all shadow-md shadow-accent/20"
                    >
                      <LogIn className="h-4 w-4" strokeWidth={1.8} />
                      <span>Sign In / Create Account</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
