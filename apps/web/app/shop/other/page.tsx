"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Watch, Cable, Cpu, HardDrive, Mouse, Camera, PenLine,
  Gamepad2, Film, ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";
import Footer from "../../../components/Footer";
import productsData from "../../../lib/others-data.json";

// ── Types ────────────────────────────────────────────────────────────────────

interface OtherProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  comparePrice: number;
  image: string;
}

// ── Subcategory config ───────────────────────────────────────────────────────

const SUBCATEGORIES = [
  { id: "all",          label: "All",           icon: null },
  { id: "smart_watches",label: "Smart Watches", icon: Watch },
  { id: "chargers",     label: "Chargers",      icon: Zap },
  { id: "cables",       label: "Cables",        icon: Cable },
  { id: "mouse",        label: "Mouse",         icon: Mouse },
  { id: "pen",          label: "Stylus & Pen",  icon: PenLine },
  { id: "graphics",     label: "Graphics Cards",icon: Cpu },
  { id: "memory",       label: "Memory",        icon: Cpu },
  { id: "storage",      label: "Storage",       icon: HardDrive },
  { id: "lens",         label: "Camera Lenses", icon: Camera },
  { id: "games",        label: "Games",         icon: Gamepad2 },
  { id: "films",        label: "Films",         icon: Film },
] as const;

type SubId = typeof SUBCATEGORIES[number]["id"];

// ── Sections config ──────────────────────────────────────────────────────────
// "mixed" = games+films shown together; others = standalone heading + row

const SECTION_ORDER: { id: SubId; label: string; mixed?: SubId[] }[] = [
  { id: "smart_watches", label: "Smart Watches" },
  { id: "chargers",      label: "Chargers" },
  { id: "cables",        label: "Cables" },
  { id: "mouse",         label: "Mouse & Input" },
  { id: "pen",           label: "Stylus & Pen" },
  { id: "graphics",      label: "Graphics Cards" },
  { id: "memory",        label: "Memory" },
  { id: "storage",       label: "Storage" },
  { id: "lens",          label: "Camera Lenses" },
  { id: "games",         label: "Entertainment", mixed: ["games", "films"] },
];

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: OtherProduct }) {
  const [added, setAdded] = useState(false);
  const saving = product.comparePrice - product.price;
  const pct = Math.round((saving / product.comparePrice) * 100);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="shrink-0 w-[200px] sm:w-[220px] group">
      <div className="bg-white rounded-[28px] border border-zinc-200 hover:border-black hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full">
        {/* Image */}
        <div className="relative aspect-square bg-[#f5f5f7] flex items-center justify-center p-5 overflow-hidden">
          {pct > 0 && (
            <span className="absolute top-3 left-3 bg-accent text-white text-[9px] font-bold px-2 py-1 rounded-full z-10 uppercase tracking-wide">
              -{pct}%
            </span>
          )}
          <img
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={handleAdd}
            className={`absolute bottom-3 right-3 h-9 w-9 rounded-full flex items-center justify-center shadow transition-all duration-300 text-xs font-bold ${
              added
                ? "bg-emerald-500 text-white scale-110"
                : "bg-white text-black hover:bg-black hover:text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            }`}
          >
            {added ? "✓" : <ShoppingCart className="h-4 w-4" />}
          </button>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{product.brand}</p>
          <h3 className="font-bold text-sm leading-snug text-zinc-900 mb-3 line-clamp-2">{product.name}</h3>
          <div className="mt-auto flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-zinc-950">£{product.price.toFixed(2)}</span>
            <span className="text-xs text-zinc-400 line-through font-medium">£{product.comparePrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Horizontal scroll row with nav arrows ────────────────────────────────────

function ScrollRow({ products }: { products: OtherProduct[] }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  return (
    <div className="relative group/row">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-10 w-10 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-zinc-50"
      >
        <ChevronLeft className="h-5 w-5 text-zinc-700" />
      </button>

      {/* Scroll track */}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-10 w-10 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-zinc-50"
      >
        <ChevronRight className="h-5 w-5 text-zinc-700" />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OtherPage() {
  const [activeTab, setActiveTab] = useState<SubId>("all");

  const data = productsData as Record<string, OtherProduct[]>;

  const tabRef = useRef<HTMLDivElement>(null);

  function scrollTabIntoView(id: string) {
    if (!tabRef.current) return;
    const btn = tabRef.current.querySelector(`[data-tab="${id}"]`) as HTMLElement | null;
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  function handleTabClick(id: SubId) {
    setActiveTab(id);
    scrollTabIntoView(id);
    if (id !== "all") {
      const el = document.getElementById(`section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Sections to render — filter by activeTab
  const visibleSections = activeTab === "all"
    ? SECTION_ORDER
    : SECTION_ORDER.filter(s =>
        s.id === activeTab || (s.mixed?.includes(activeTab))
      );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="mb-4 flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wide">
            <Link href="/" className="hover:text-black flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <span>/</span>
            <span className="text-black">Other</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2">Other Tech</h1>
          <p className="text-zinc-500 font-medium max-w-2xl text-sm md:text-base leading-relaxed">
            Cables, chargers, memory, storage, smart watches, games, films and more — quality accessories at great prices.
          </p>
        </div>
      </section>

      {/* ── Horizontal Scrollable Category Tabs ─────────────────────────── */}
      <div className="sticky top-[57px] md:top-[113px] z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            ref={tabRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-3"
          >
            {SUBCATEGORIES.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  data-tab={id}
                  onClick={() => handleTabClick(id as SubId)}
                  className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="otherActiveTab"
                      className="absolute inset-0 bg-zinc-950 rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        {visibleSections.map(section => {
          // Gather products — mixed sections combine multiple subcategory arrays
          const products: OtherProduct[] = section.mixed
            ? section.mixed.flatMap(key => data[key] ?? [])
            : (data[section.id] ?? []);

          if (products.length === 0) return null;

          const isEntertainment = !!section.mixed;

          return (
            <motion.div
              key={section.id}
              id={`section-${section.id}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4 }}
            >
              {/* Section heading */}
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">{section.label}</h2>
                  {isEntertainment && (
                    <p className="text-xs font-semibold text-zinc-400 mt-0.5 uppercase tracking-wider">Games &amp; Films</p>
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-400">{products.length} items</span>
              </div>

              {isEntertainment ? (
                /* ── Entertainment: mixed grid layout ─────────────── */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="group">
                      <div className="bg-white rounded-[20px] border border-zinc-200 hover:border-black hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
                        <div className="aspect-[3/4] bg-[#f5f5f7] relative overflow-hidden flex items-center justify-center p-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-3">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{p.brand}</p>
                          <p className="font-bold text-xs text-zinc-900 line-clamp-2 leading-snug mb-2">{p.name}</p>
                          <span className="text-sm font-extrabold text-zinc-950">£{p.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── Standard: horizontal scroll row ──────────────── */
                <ScrollRow products={products} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Trust bar ───────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-10 md:gap-20">
          {[
            { icon: "✓", text: "Quality tested accessories" },
            { icon: "✓", text: "Free delivery over £30" },
            { icon: "✓", text: "30-day hassle-free returns" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm font-bold text-zinc-600">
              <span className="text-emerald-500 font-black text-base">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
