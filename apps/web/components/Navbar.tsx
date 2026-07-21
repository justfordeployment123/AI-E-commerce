"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
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
import { searchProducts, type SearchableItem } from "../lib/search";

// Shown in the search dropdown when it's focused but empty. Recent searches
// + trending products are more useful here than repeating the category
// pills already visible in the navbar itself.
function SearchEmptyState({
  recentSearches, trending, onPickRecent, onNavigate,
}: {
  recentSearches: string[];
  trending: SearchableItem[];
  onPickRecent: (q: string) => void;
  onNavigate: () => void;
}) {
  if (recentSearches.length === 0 && trending.length === 0) {
    return <p className="text-xs font-semibold text-zinc-400 py-4 text-center">Start typing to search products…</p>;
  }
  return (
    <div className="space-y-5">
      {recentSearches.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Recent Searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(q => (
              <button
                key={q}
                type="button"
                onClick={() => onPickRecent(q)}
                className="px-3 py-1.5 rounded-full bg-muted hover:bg-accent hover:text-white border border-border/40 hover:border-accent transition-all text-xs font-bold text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      {trending.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2.5">Trending Now</p>
          <div className="space-y-2">
            {trending.map(item => (
              <Link
                key={item.slug}
                href={`/shop/${item.category.toLowerCase()}/${item.slug}`}
                onClick={onNavigate}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted transition-colors group text-foreground"
              >
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
          </div>
        </div>
      )}
    </div>
  );
}


export default function Navbar() {
  const { count: itemsCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showCategoryBar, setShowCategoryBar] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productIndex, setProductIndex] = useState<SearchableItem[]>([]);
  const [indexLoading, setIndexLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const [theme, setTheme] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shopCategories, setShopCategories] = useState<{ label: string; href: string; slug: string }[]>([]);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setShowCategoryBar(true); // Always show at top
      } else if (currentScrollY > lastScrollY.current) {
        setShowCategoryBar(false); // Scrolling down
      } else if (currentScrollY < lastScrollY.current) {
        setShowCategoryBar(true); // Scrolling up
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
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

  // Smart search: fetch the (small) catalog once, then score/rank matches
  // entirely client-side — instant per keystroke, and tolerant of reordered
  // words, extra words, and typos (see lib/search.ts for the algorithm).
  useEffect(() => {
    productsApi.list({ limit: 300 })
      .then(r => setProductIndex(r.items.map(p => ({
        id: p.id, slug: p.slug, name: p.name, brand: p.brand,
        category: p.category, price: p.price ?? null, image: p.images?.[0] ?? null,
        stock: p.stock, rating: p.rating, reviewCount: p.reviewCount,
      }))))
      .catch(() => {})
      .finally(() => setIndexLoading(false));
  }, []);

  const searchResults = useMemo(
    () => searchProducts(productIndex, searchQuery, 10),
    [productIndex, searchQuery],
  );
  const searchLoading = indexLoading && searchQuery.trim().length > 0;

  // Shown instead of the search results once the box is focused but empty —
  // recent searches (so re-finding something you searched before is one
  // click) plus a few trending items, rather than repeating the category
  // pills that are already visible in the navbar itself.
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ts_recent_searches");
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch { /* ignore corrupt/blocked storage */ }
  }, []);

  function recordSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      try { localStorage.setItem("ts_recent_searches", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const trendingProducts = useMemo(() => {
    return [...productIndex]
      .filter(p => (p.stock ?? 0) > 0)
      .sort((a, b) => {
        const scoreA = (a.rating ?? 0) * Math.log((a.reviewCount ?? 0) + 2);
        const scoreB = (b.rating ?? 0) * Math.log((b.reviewCount ?? 0) + 2);
        return scoreB - scoreA;
      })
      .slice(0, 10);
  }, [productIndex]);

  // Measure where the sticky header's bottom edge actually sits on screen
  // (its own height alone misses the promo bar stacked above it) so the
  // mobile drawer can be positioned as a fixed overlay flush underneath it,
  // instead of expanding the header's box (which used to push page content
  // down when opened) or leaving a gap that peeks through to the header.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.getBoundingClientRect().bottom);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Toggling the mobile menu: measure the header's current bottom edge and
  // reset the drawer's own scroll position synchronously, in the same
  // event, so there's no stale-measurement or leftover-scroll flash on open.
  function toggleMobileMenu() {
    const opening = !isOpen;
    if (opening && headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().bottom);
    }
    if (drawerRef.current) drawerRef.current.scrollTop = 0;
    setIsOpen(opening);
  }

  // Lock background scroll while the mobile drawer overlay is open. Plain
  // `overflow: hidden` on body doesn't reliably block touch-scrolling on
  // mobile browsers, so pin the body in place with position: fixed and
  // restore the exact scroll position on close.
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    const body = document.body.style;
    const prev = { position: body.position, top: body.top, left: body.left, right: body.right, width: body.width };
    body.position = "fixed";
    body.top = `-${scrollY}px`;
    body.left = "0";
    body.right = "0";
    body.width = "100%";
    return () => {
      body.position = prev.position;
      body.top = prev.top;
      body.left = prev.left;
      body.right = prev.right;
      body.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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
      <div className="sticky top-0 inset-x-0 z-50 flex flex-col items-center pointer-events-none">
        
        {/* Promo bar removed as per user request */}

        {/* Navbar Container */}
        <div className="w-full flex justify-center bg-zinc-950 pointer-events-auto shadow-2xl relative">
          <div className="flex w-full max-w-7xl h-[76px] relative shrink-0 px-4 sm:px-6 md:px-8 items-center justify-between gap-2 md:gap-4 lg:gap-8">
            
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center shrink-0 min-w-fit gap-2 sm:gap-4">
              <button className="lg:hidden text-white shrink-0 hover:text-accent transition-colors" onClick={toggleMobileMenu} aria-label="Toggle menu">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link href="/" className="flex items-center select-none shrink-0">
                <img
                  src="/Icon/logo_white.png"
                  alt="TechStop Leicester"
                  className="h-9 sm:h-10 md:h-11 w-auto object-contain hover:scale-105 transition-transform shrink-0"
                />
              </Link>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden sm:block w-full max-w-[600px] xl:max-w-[800px] relative mx-2 lg:mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSearchFocused(false), 200);
                  }}
                  placeholder="Search for iPhones, MacBooks, iPads, Gaming..."
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
                    className="absolute left-0 right-0 top-full mt-2 max-h-[78vh] overflow-y-auto bg-background border border-border rounded-[24px] shadow-2xl z-50 p-5 text-foreground"
                  >
                    {searchQuery === "" ? (
                      <SearchEmptyState
                        recentSearches={recentSearches}
                        trending={trendingProducts}
                        onPickRecent={q => setSearchQuery(q)}
                        onNavigate={() => setIsSearchFocused(false)}
                      />
                    ) : (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                          {searchLoading ? "Searching…" : "Matching Products"}
                        </p>
                        <div className="space-y-2 pr-1">
                          {searchResults.map(item => (
                            <Link key={item.slug} href={`/shop/${item.category.toLowerCase()}/${item.slug}`}
                              onClick={() => recordSearch(searchQuery)}
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

              {/* Trade In Button (Icon on mobile/tablet, full text on desktop) */}
              <Link
                href="/trade-in"
                className="flex items-center justify-center gap-2 h-10 w-10 md:h-11 md:w-11 lg:w-auto lg:px-4 rounded-[14px] bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-800 text-foreground transition-all font-bold text-xs uppercase tracking-wide shrink-0 border border-border/40"
              >
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                <span className="hidden lg:inline">Trade In</span>
              </Link>

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
                            <Link
                              href="/trade-in"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                              Trade-In
                            </Link>
                            <Link
                              href="/repairs"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                              Repairs
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
                  className="flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-accent text-white hover:bg-accent-dark transition-all font-bold text-xs uppercase tracking-wide shadow-md shadow-accent/20 shrink-0"
                >
                  <LogIn className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Theme Toggle Button removed as per user request */}
              
              {/* Category Toggle Button Removed as per user request */}

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
        </div> {/* End Navbar Container */}

        {/* Tier 2: Category Bar (Floating below notch) */}
        <AnimatePresence>
          {showCategoryBar && !pathname?.startsWith("/account") && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, pointerEvents: 'none' }}
              transition={{ duration: 0.2 }}
              className="hidden lg:flex w-full justify-center absolute top-full mt-2 z-0 pointer-events-auto"
            >
              <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full p-1.5 flex items-center gap-6">
                
                {/* Category Links */}
                <nav
                  className="flex items-center gap-1 text-xs font-bold relative"
                  onMouseLeave={scheduleClose}
                >
                  {[
                    { label: "All Products", href: "/", slug: "all-products" },
                    ...shopCategories
                  ].map(({ label, href, slug }) => {
                    const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href);
                    let catLabel = slug ? (categoryDisplayNames[slug] ?? shopCategories.find(c => c.slug === slug)?.label ?? slug) : "";
                    let desc = slug ? categoryDescriptions[slug] : "";
                    const brands = slug ? (categoryBrands[slug] ?? []) : [];
                    let hasContent = slug === "other" ? otherSubcats.length > 0 : brands.length > 0;

                    if (slug === "all-products") {
                      catLabel = "All Products";
                      desc = "Browse our complete catalog of certified refurbished tech and new devices.";
                      hasContent = true;
                    }

                    return (
                      <div
                        key={label}
                        className="relative"
                        onMouseEnter={() => slug ? openDropdown(slug) : setHoveredCat(null)}
                      >
                        <Link
                          href={href}
                          className={`relative px-4 py-2 rounded-full transition-colors duration-250 flex items-center ${
                            isActive ? "text-white z-10 font-extrabold" : "text-zinc-400 hover:text-white font-semibold"
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

                        {/* Dropdown Card */}
                        <AnimatePresence>
                          {slug && hoveredCat === slug && (hasContent || desc || slug === "other") && (
                            <motion.div
                              key={slug}
                              initial={{ opacity: 0, y: -20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-50 w-[400px] md:w-[420px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden pointer-events-auto cursor-default"
                            >
                              <div className="p-6 text-left">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                                  <Link href="/" className="hover:text-zinc-700 transition-colors cursor-pointer">Home</Link>
                                  <span>/</span>
                                  <span className="text-zinc-800 dark:text-zinc-200">{catLabel}</span>
                                </div>

                                <div className="flex flex-col gap-5">
                                  <div>
                                    <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white mb-2">
                                      {catLabel}
                                    </h2>

                                    {desc && (
                                      <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                                        {desc}
                                      </p>
                                    )}

                                    {slug === "other" ? (
                                      otherSubcats.length > 0 && (
                                        <div className="flex items-center gap-2 mt-5 flex-wrap">
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-full">Types</span>
                                          {otherSubcats.map(sub => (
                                            <Link key={sub.slug} href="/shop/others"
                                              className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 transition-all cursor-pointer">
                                              {sub.label}
                                            </Link>
                                          ))}
                                        </div>
                                      )
                                    ) : (
                                      brands.length > 0 && (
                                        <div className="flex items-center gap-2 mt-5 flex-wrap">
                                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-full">Brands</span>
                                          {brands.map(brand => (
                                            <Link key={brand} href={`/shop/${slug}`}
                                              className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 transition-all cursor-pointer">
                                              {brand}
                                            </Link>
                                          ))}
                                        </div>
                                      )
                                    )}
                                  </div>

                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>

                <div className="w-px h-5 bg-white/10" />

                {/* Right: Utility Links */}
                <div className="flex items-center gap-1 text-xs font-bold pr-2" onMouseLeave={scheduleClose}>
                  {[
                    { label: "Sell Your Device", href: "/trade-in", icon: RefreshCw, slug: "trade-in" },
                    { label: "Book a Repair", href: "/repair", icon: Wrench, slug: "repair" },
                    { label: "Help Centre", href: "/help", icon: null, slug: "help" },
                  ].map(({ label, href, icon: Icon, slug }) => {
                    const isActive = pathname?.startsWith(href);
                    let desc = "";
                    let catLabel = label;
                    if (slug === "trade-in") {
                      desc = "Get instant cash for your old devices. Fast, easy, and secure.";
                    } else if (slug === "repair") {
                      desc = "Professional repair services for all your devices with warranty.";
                    } else if (slug === "help") {
                      desc = "Get support, track your orders, and find answers to your questions.";
                    }
                    const hasDropdown = slug === "trade-in" || slug === "repair" || slug === "help";

                    return (
                      <div
                        key={label}
                        className="relative"
                        onMouseEnter={() => hasDropdown ? openDropdown(slug) : setHoveredCat(null)}
                      >
                        <Link
                          href={href}
                          className={`relative px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors duration-250 ${
                            isActive
                              ? "bg-accent text-white shadow-sm font-extrabold"
                              : "text-zinc-400 hover:text-white font-semibold hover:bg-white/5"
                          }`}
                        >
                          {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-zinc-500"}`} />}
                          <span>{label}</span>
                        </Link>

                        {/* Static Dropdown Card */}
                        <AnimatePresence>
                          {hasDropdown && hoveredCat === slug && (
                            <motion.div
                              key={slug}
                              initial={{ opacity: 0, y: -20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-50 w-[300px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden pointer-events-auto cursor-default"
                            >
                              <div className="p-6 text-left">
                                <div className="flex flex-col gap-4">
                                  <div>
                                    <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white mb-2">
                                      {catLabel}
                                    </h2>
                                    <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                                      {desc}
                                    </p>
                                  </div>

                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        </div>
      {/* Mobile drawer — a fixed off-canvas panel sliding in from the left.
          Rendered as a SIBLING of <header>, not a descendant: <header> has
          backdrop-blur (backdrop-filter), and per spec backdrop-filter on an
          ancestor creates a new containing block for position:fixed
          descendants — same family as transform/filter/perspective. With
          the drawer nested inside header, its "top" was being resolved
          against header's own box (which starts below the promo bar)
          instead of the viewport, producing a persistent gap under the
          header. Being a sibling keeps it positioned against the viewport,
          and it still opens/closes based on the same isOpen state. */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-x-0 z-40 bg-black/40"
              style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              ref={drawerRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="lg:hidden fixed left-0 z-50 w-[82%] max-w-xs border-r border-border bg-background overflow-y-auto text-foreground shadow-2xl"
              style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}
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
                      className="absolute left-0 right-0 top-full mt-2 max-h-[70vh] overflow-y-auto bg-background border border-border rounded-[24px] shadow-2xl z-50 p-5 text-foreground"
                    >
                      {searchQuery === "" ? (
                        <SearchEmptyState
                          recentSearches={recentSearches}
                          trending={trendingProducts}
                          onPickRecent={q => setSearchQuery(q)}
                          onNavigate={() => { setIsOpen(false); setIsSearchFocused(false); }}
                        />
                      ) : (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                            {searchLoading ? "Searching…" : "Matching Products"}
                          </p>
                          <div className="space-y-2">
                            {searchResults.map(item => (
                              <Link key={item.slug} href={`/shop/${item.category.toLowerCase()}/${item.slug}`}
                                onClick={() => { recordSearch(searchQuery); setIsOpen(false); setIsSearchFocused(false); }}
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}
