"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, Search, Package } from "lucide-react";
import Footer from "../../../components/Footer";
import { productsApi } from "../../../lib/api";
import { useCart } from "../../../context/cart-context";


interface Product {
  id: string; name: string; slug: string; brand: string;
  category: string; price: number; comparePrice?: number;
  images: string[]; condition: string; stock: number;
  otherBrandId?: string;
}

export default function OthersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shuffledAll, setShuffledAll] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    productsApi.list({ limit: 500 })
      .then(res => {
        const others = res.items.filter(p => !!p.otherBrandId) as Product[];
        setProducts(others);
        
        // Count products per category
        const categoryCounts = others.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Sort categories by product count descending, with alphabetical tie-breaker
        const cats = Array.from(new Set(others.map(p => p.category)))
          .sort((a, b) => {
            const countDiff = (categoryCounts[b] || 0) - (categoryCounts[a] || 0);
            if (countDiff !== 0) return countDiff;
            return a.localeCompare(b);
          });
        setCategories(cats);
        
        // Create a shuffled copy of all products for the "All" section
        const shuffled = [...others].sort(() => Math.random() - 0.5);
        setShuffledAll(shuffled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAddToCart(p: Product) {
    addItem({ productId: p.id, quantity: 1, price: p.price, name: p.name, slug: p.slug, image: p.images?.[0] });
    setAddedIds(prev => new Set(prev).add(p.id));
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(p.id); return s; }), 1500);
  }

  const filterProduct = (p: Product) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) || 
      p.brand.toLowerCase().includes(s) || 
      p.category.toLowerCase().includes(s)
    );
  };

  const allFiltered = shuffledAll.filter(filterProduct).slice(0, 15);

  const hasAnyMatches = allFiltered.length > 0 || categories.some(cat => 
    products.filter(p => p.category === cat && filterProduct(p)).length > 0
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Search bar */}
          <div className="mb-10 max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search other tech & accessories…"
                className="w-full h-11 rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 text-sm font-medium outline-none focus:border-zinc-950 transition-colors shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
            </div>
          ) : !hasAnyMatches ? (
            <div className="text-center py-24 text-zinc-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No products found</p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* ALL SECTION */}
              {allFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-950">ALL</h2>
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-zinc-200/50">Mixed picks</span>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 sm:-mx-6 lg:-mx-8">
                    <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
                    {allFiltered.map((p, i) => (
                      <ProductGridCard key={`all-${p.id}`} p={p} i={i} handleAddToCart={handleAddToCart} addedIds={addedIds} />
                    ))}
                    <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
                  </div>
                </div>
              )}

              {/* CATEGORIES SECTIONS */}
              {categories.map(cat => {
                const catProducts = products.filter(p => p.category === cat && filterProduct(p));
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-3">
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-950">{cat}</h2>
                      <span className="px-2.5 py-0.5 bg-accent text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{catProducts.length} items</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 sm:-mx-6 lg:-mx-8">
                      <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
                      {catProducts.map((p, i) => (
                        <ProductGridCard key={`${cat}-${p.id}`} p={p} i={i} handleAddToCart={handleAddToCart} addedIds={addedIds} />
                      ))}
                      <div className="w-4 sm:w-6 lg:w-8 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ProductGridCard({ p, i, handleAddToCart, addedIds }: { p: Product; i: number; handleAddToCart: (p: Product) => void; addedIds: Set<string> }) {
  const saving = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.3) }}
      className="group bg-white rounded-3xl border border-zinc-100 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col w-[210px] md:w-[230px] flex-shrink-0"
    >
      <Link href={`/shop/${p.category.toLowerCase()}/${p.slug}`} className="block">
        <div className="aspect-square bg-image-light flex items-center justify-center p-4 relative overflow-hidden">
          {p.images?.[0] ? (
            <img
              src={p.images[0]}
              alt={p.name}
              className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
            />
          ) : (
            <Package className="h-10 w-10 text-zinc-200" />
          )}
          {saving > 0 && (
            <span className="absolute top-2 right-2 bg-accent text-white text-[9px] font-black px-2 py-0.5 rounded-full">
              -{saving}%
            </span>
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{p.brand}</p>
        <Link href={`/shop/${p.category.toLowerCase()}/${p.slug}`}>
          <p className="text-xs font-bold text-zinc-900 leading-tight mb-2 group-hover:text-black line-clamp-2">{p.name}</p>
        </Link>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-sm font-black text-zinc-950">£{p.price}</span>
            {p.comparePrice && (
              <span className="text-[10px] text-zinc-300 line-through ml-1">£{p.comparePrice}</span>
            )}
          </div>
          <button
            onClick={() => handleAddToCart(p)}
            disabled={p.stock === 0}
            className={`h-7 w-7 rounded-xl flex items-center justify-center transition-all ${
              addedIds.has(p.id)
                ? "bg-emerald-500 text-white"
                : "bg-zinc-100 hover:bg-zinc-950 hover:text-white text-zinc-600"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
