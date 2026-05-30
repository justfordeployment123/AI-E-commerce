"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { catalogApi } from "../../../lib/api";

export default function CatalogOverviewPage() {
  const [counts, setCounts] = useState({ categories: 0, brands: 0, brandCategories: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      catalogApi.listCategories(true),
      catalogApi.listBrands(true),
      catalogApi.listBrandCategories({ includeInactive: true }),
    ]).then(([cats, brands, bcs]) => {
      setCounts({ categories: cats.length, brands: brands.length, brandCategories: bcs.length });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Categories", count: counts.categories, href: "/admin/catalog/categories", desc: "Phones, Tablets, Laptops…" },
    { label: "Brands", count: counts.brands, href: "/admin/catalog/brands", desc: "Apple, Samsung, Sony…" },
    { label: "Brand–Category links", count: counts.brandCategories, href: "/admin/catalog/brands", desc: "Manage images per link" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Catalog</h1>
      <p className="text-zinc-500 text-sm mb-8">Manage categories, brands, and their image assignments.</p>

      {loading ? (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-zinc-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map(c => (
            <Link key={c.label} href={c.href} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-zinc-400 hover:shadow-sm transition-all">
              <div className="text-3xl font-extrabold mb-1">{c.count}</div>
              <div className="font-bold text-zinc-900 mb-0.5">{c.label}</div>
              <div className="text-xs text-zinc-400">{c.desc}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
