"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { catalogApi, CatalogBrand, CatalogBrandCategory } from "../../../lib/api";
import Footer from "../../../components/Footer";
import { ArrowRight, ShoppingCart, Star } from "lucide-react";
import { useCart } from "../../../context/cart-context";
import NextImage from "next/image";
import ProductImage from "../../../components/ProductImage";

type BrandWithCategories = CatalogBrand & {
  brandCategories: (CatalogBrandCategory & {
    deviceCatalogs?: {
      id: string;
      model: string;
      products: {
        id: string; name: string; slug: string; price: number;
        comparePrice?: number; images: string[]; rating: number;
        reviewCount: number; stock: number; condition: string;
      }[];
    }[];
  })[];
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<BrandWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [addedSlugs, setAddedSlugs] = useState<Set<string>>(new Set());
  const { addItem } = useCart();

  useEffect(() => {
    catalogApi.listBrands()
      .then(brands => {
        const brand = brands.find(b => b.slug === slug);
        if (!brand) { setNotFoundFlag(true); setLoading(false); return; }
        return fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/catalog/brands/${slug}/products`
        ).then(r => r.json()).then((d: BrandWithCategories) => {
          setData(d);
        });
      })
      .catch(() => setNotFoundFlag(true))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleAdd(product: { slug: string; price: number; name: string; images: string[] }) {
    try {
      await addItem({ productId: product.slug, quantity: 1, price: product.price, name: product.name, slug: product.slug, image: product.images[0] });
    } catch { /* offline fallback */ }
    setAddedSlugs(prev => new Set(prev).add(product.slug));
    setTimeout(() => setAddedSlugs(prev => { const s = new Set(prev); s.delete(product.slug); return s; }), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFoundFlag || !data) {
    notFound();
    return null;
  }

  // Pick a hero image from the first brand-category that has images
  const heroImage = data.brandCategories
    .flatMap(bc => bc.images as string[])
    .find(Boolean) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative bg-zinc-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {heroImage && (
            <NextImage
              fill
              src={heroImage}
              alt=""
              className="object-cover"
              sizes="100vw"
            />
          )}
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            {data.logo && (
              <div className="inline-flex bg-white rounded-2xl p-3 mb-6">
                <NextImage src={data.logo} alt={data.name} width={96} height={48} className="object-contain" />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Refurbished {data.name}
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl">
              Certified pre-owned {data.name} devices — tested, warranted, and ready to use.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {data.brandCategories.map(bc => (
                <a key={bc.id} href={`#${bc.category.slug}`}
                  className="h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-bold transition-colors">
                  {bc.category.name}
                </a>
              ))}
            </div>
          </div>
          {heroImage && (
            <div className="relative w-64 h-64 rounded-3xl overflow-hidden shrink-0 bg-white/5">
              <NextImage
                fill
                src={heroImage}
                alt={data.name}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Category sections ─────────────────────────────────────────────────── */}
      {data.brandCategories.map(bc => {
        const allProducts = (bc.deviceCatalogs ?? []).flatMap(dc => dc.products ?? []);
        if (allProducts.length === 0) return null;

        // Pick a featured image for this section from bc.images or first product
        const sectionImage = (bc.images as string[])[0] ?? allProducts[0]?.images?.[0] ?? null;

        return (
          <section key={bc.id} id={bc.category.slug} className="py-16 border-b border-zinc-100 last:border-0">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

              {/* Section header */}
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="text-xs font-bold text-accent uppercase tracking-widest mb-1 block">
                    {data.name} · {bc.category.name}
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight">
                    Refurbished {data.name} {bc.category.name}
                  </h2>
                </div>
                <Link
                  href={`/shop/${bc.category.slug}`}
                  className="hidden md:flex items-center gap-1 text-sm font-bold text-zinc-500 hover:text-black"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Images strip + product grid */}
              <div className="flex gap-8">

                {/* Left: brand-category images (random pick shown as featured) */}
                {(bc.images as string[]).length > 0 && (
                  <div className="hidden lg:block w-52 shrink-0">
                    <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden bg-zinc-100">
                      <NextImage
                        fill
                        src={pickRandom(bc.images as string[])}
                        alt={`${data.name} ${bc.category.name}`}
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </div>
                )}

                {/* Right: product grid */}
                <div className="flex-1 min-w-0 overflow-x-auto">
                  <div className="flex gap-4 pb-4" style={{ minWidth: "max-content" }}>
                    {allProducts.slice(0, 8).map(product => (
                      <Link
                        key={product.slug}
                        href={`/shop/${bc.category.slug}/${product.slug}`}
                        className="w-[220px] shrink-0 group block"
                      >
                        <div className="bg-white rounded-[24px] p-3 border border-zinc-200 hover:border-black hover:shadow-lg transition-all h-full flex flex-col">
                          <div className="relative aspect-square rounded-[18px] bg-[#f5f5f7] mb-3 overflow-hidden">
                            <span className="absolute top-3 left-3 z-20 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-zinc-200 uppercase tracking-wider">
                              {product.condition}
                            </span>
                            <ProductImage src={product.images[0]} alt={product.name} />
                            {product.stock > 0 && (
                              <button
                                onClick={e => { e.preventDefault(); handleAdd(product); }}
                                className="absolute bottom-3 right-3 z-20 h-9 w-9 rounded-full bg-white flex items-center justify-center shadow translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="px-1 flex flex-col flex-1">
                            <h3 className="font-bold text-xs leading-tight mb-1 text-zinc-900">{product.name}</h3>
                            <div className="flex items-center gap-1 mb-2">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-bold">{product.rating}</span>
                              <span className="text-[10px] text-zinc-400">({product.reviewCount})</span>
                            </div>
                            <div className="mt-auto flex items-baseline gap-1.5">
                              <span className="text-sm font-extrabold">£{product.price}</span>
                              {product.comparePrice && (
                                <span className="text-[10px] text-zinc-400 line-through">£{product.comparePrice}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 md:hidden">
                <Link href={`/shop/${bc.category.slug}`} className="flex items-center gap-1 text-sm font-bold text-zinc-500">
                  View all {bc.category.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      <Footer />
    </div>
  );
}
