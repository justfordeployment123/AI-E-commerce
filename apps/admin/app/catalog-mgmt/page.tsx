"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { catalogCategoriesApi, catalogBrandsApi, catalogBrandCategoryApi } from "../../lib/api";
import { Tag, Layers, Grid3X3 } from "lucide-react";

export default function CatalogMgmtPage() {
  const [counts, setCounts] = useState({ categories: 0, brands: 0, links: 0 });

  useEffect(() => {
    Promise.all([
      catalogCategoriesApi.list(true),
      catalogBrandsApi.list(true),
      catalogBrandCategoryApi.list({ includeInactive: true }),
    ]).then(([cats, brands, bcs]) =>
      setCounts({ categories: cats.length, brands: brands.length, links: bcs.length })
    ).catch(() => {});
  }, []);

  const cards = [
    { label: "Categories", count: counts.categories, href: "/catalog-mgmt/categories", icon: Tag, desc: "Phones, Tablets, Laptops…" },
    { label: "Brands", count: counts.brands, href: "/catalog-mgmt/brands", icon: Layers, desc: "Apple, Samsung, Sony…" },
    { label: "Brand–Category links", count: counts.links, href: "/catalog-mgmt/brands", icon: Grid3X3, desc: "Images per assignment" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Catalog Management</h1>
      <p className="text-sm text-zinc-400 mb-8">Manage categories, brands, and their image assignments for the shop.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <Link key={c.label} href={c.href}
            className="bg-white border border-zinc-100 rounded-2xl p-6 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col gap-3">
            <c.icon className="h-5 w-5 text-zinc-400" />
            <div>
              <div className="text-3xl font-extrabold text-zinc-900">{c.count}</div>
              <div className="font-bold text-zinc-700 text-sm mt-0.5">{c.label}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{c.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
