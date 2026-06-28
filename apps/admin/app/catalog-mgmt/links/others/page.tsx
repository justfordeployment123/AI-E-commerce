"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  otherBrandsApi, otherSubcategoriesApi, productsApi,
  type OtherBrand, type OtherSubcategory, type Product,
} from "../../../../lib/api";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";

export default function OtherProductsLinksPage() {
  const [subcats, setSubcats]             = useState<OtherSubcategory[]>([]);
  const [brands, setBrands]               = useState<OtherBrand[]>([]);
  const [products, setProducts]           = useState<Product[]>([]);
  const [activeSubcatId, setActiveSubcatId] = useState<string>("");
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      otherSubcategoriesApi.list(),
      otherBrandsApi.list(),
      productsApi.list({ limit: 500 }),
    ]).then(([subcatList, brandList, productRes]) => {
      setSubcats(subcatList);
      setBrands(brandList);
      setProducts(productRes.items.filter(p => !!p.otherBrandId));
      if (subcatList.length > 0) setActiveSubcatId(subcatList[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeSubcat  = subcats.find(s => s.id === activeSubcatId);
  const subcatProducts = products.filter(p => p.otherSubcategoryId === activeSubcatId);

  const brandGroups = brands
    .map(brand => ({ brand, items: subcatProducts.filter(p => p.otherBrandId === brand.id) }))
    .filter(g => g.items.length > 0);

  const countFor = (id: string) => products.filter(p => p.otherSubcategoryId === id).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/catalog-mgmt/links"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-bold mb-2 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to Links
        </Link>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Other Products</h1>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Browse subcategories, brands, and their products in the Others track.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left sidebar: subcategories */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-3 mb-1">
            Subcategories
          </div>
          <div className="bg-white border border-zinc-100 rounded-3xl p-3 shadow-sm space-y-1">
            {subcats.map(s => {
              const active = s.id === activeSubcatId;
              return (
                <button key={s.id}
                  onClick={() => { setActiveSubcatId(s.id); setExpandedBrandId(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                    active ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-50 hover:text-black"
                  }`}>
                  <span className="truncate">{s.name}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                  }`}>{countFor(s.id)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="md:col-span-3 space-y-4">
          {activeSubcat ? (
            <>
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
                <h2 className="text-xl font-extrabold text-zinc-900">{activeSubcat.name}</h2>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">
                  {brandGroups.length} brand{brandGroups.length !== 1 ? "s" : ""} · {subcatProducts.length} product{subcatProducts.length !== 1 ? "s" : ""}
                </p>
              </div>

              {brandGroups.length === 0 ? (
                <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center text-zinc-400 font-bold shadow-sm">
                  <Package className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  No products in this subcategory yet.
                </div>
              ) : (
                brandGroups.map(({ brand, items }) => (
                  <div key={brand.id} className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedBrandId(prev => prev === brand.id ? null : brand.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-500 shrink-0">
                          {brand.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-zinc-900">{brand.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                          {items.length} product{items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${expandedBrandId === brand.id ? "rotate-90" : ""}`} />
                    </button>

                    {expandedBrandId === brand.id && (
                      <div className="border-t border-zinc-100 overflow-x-auto">
                        <table className="w-full text-sm min-w-[500px]">
                          <thead>
                            <tr className="border-b border-zinc-50 bg-zinc-50/50">
                              <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Product</th>
                              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Price</th>
                              <th className="text-right px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            {items.map(p => (
                              <tr key={p.id}
                                onClick={() => window.location.href = `/products/${p.id}`}
                                className="hover:bg-zinc-50/50 transition-colors cursor-pointer">
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-3">
                                    {p.images?.[0] ? (
                                      <img src={p.images[0]} alt={p.name}
                                        className="h-9 w-9 rounded-xl object-cover border border-zinc-100 shrink-0" />
                                    ) : (
                                      <div className="h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                                        <Package className="h-3.5 w-3.5 text-zinc-300" />
                                      </div>
                                    )}
                                    <span className="font-medium text-zinc-800 text-xs">{p.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-bold font-mono text-zinc-900 text-xs">
                                  £{p.price}
                                  {p.comparePrice && (
                                    <span className="text-zinc-300 line-through ml-1.5">£{p.comparePrice}</span>
                                  )}
                                </td>
                                <td className={`px-6 py-3 text-right font-bold font-mono text-xs ${
                                  p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-500" : "text-zinc-600"
                                }`}>{p.stock}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center text-zinc-400 font-bold shadow-sm">
              No subcategories found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
