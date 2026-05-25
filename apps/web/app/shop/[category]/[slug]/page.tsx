"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../../../context/cart-context";
import { useParams } from "next/navigation";
import { productsApi, type Product } from "../../../../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ShoppingCart, Heart, Shield, RefreshCw, Truck,
  Check, ChevronDown, ChevronUp, ArrowLeft,
  Award, Info
} from "lucide-react";
import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";

const GRADE_COLORS: Record<string, string> = {
  Pristine: "border-black bg-black text-white",
  Excellent: "border-black bg-black text-white",
  "Very Good": "border-black bg-black text-white",
  Good: "border-black bg-black text-white",
  Fair: "border-black bg-black text-white",
};

const GRADE_DESC: Record<string, string> = {
  Pristine: "Flawless condition — looks and works like new.",
  Excellent: "Tiny hairline marks only visible under bright light.",
  "Very Good": "Light surface scratches, fully functional.",
  Good: "Visible wear, scratches or minor dents.",
  Fair: "Heavy wear or cosmetic damage, 100% functional.",
};

export default function ProductDetailPage() {
  const params = useParams();
  const categorySlug = params?.category as string;
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("description");
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoadingProduct(true);
    productsApi.bySlug(slug)
      .then(p => { setProduct(p); })
      .catch(() => {})
      .finally(() => setLoadingProduct(false));
  }, [slug]);

  async function handleAddToCart() {
    if (!product) return;
    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        slug: product.slug,
        image: product.images[0],
      });
    } catch {}
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  if (loadingProduct) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f5f7] font-sans">
        <Navbar />
        <main className="flex-1 mx-auto max-w-7xl px-4 py-12 w-full">
          <div className="grid lg:grid-cols-2 gap-16 animate-pulse">
            <div className="space-y-4">
              <div className="bg-white rounded-[32px] aspect-square" />
              <div className="flex gap-4">
                {[...Array(4)].map((_,i) => <div key={i} className="h-24 w-24 rounded-[20px] bg-white" />)}
              </div>
            </div>
            <div className="space-y-6 pt-4">
              <div className="h-6 bg-zinc-200 rounded-full w-1/4" />
              <div className="h-12 bg-zinc-200 rounded-full w-3/4" />
              <div className="h-8 bg-zinc-200 rounded-full w-1/4" />
              <div className="h-16 bg-zinc-200 rounded-[16px] w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f5f7] font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold mb-4">Product not found</p>
            <a href={`/shop/${categorySlug}`} className="h-12 px-8 bg-black text-white rounded-2xl font-bold inline-flex items-center">
              Back to {categorySlug}
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const savings = product.comparePrice ? product.comparePrice - product.price : 0;
  const images = product.images.length > 0 ? product.images : ["https://picsum.photos/seed/placeholder/600/600"];
  const specs = product.specs as Record<string, unknown>;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f7] text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wide">
          <a href={`/shop/${categorySlug}`} className="hover:text-black flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> {categorySlug}
          </a>
          <span>/</span>
          <span className="text-black line-clamp-1">{product.name}</span>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left — Image Gallery */}
          <div className="lg:sticky lg:top-24 h-max space-y-4">
            <div className="bg-white rounded-[32px] border border-zinc-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <button
                onClick={() => setWishlisted(w => !w)}
                className="absolute top-6 right-6 h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors z-10"
              >
                <Heart className={`h-5 w-5 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-black"}`} />
              </button>
              <div className="w-full max-w-[400px] aspect-square relative flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={images[activeImage]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </AnimatePresence>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative shrink-0 snap-center h-24 w-24 rounded-[20px] overflow-hidden bg-white border-2 flex items-center justify-center p-2 transition-all ${
                      activeImage === i ? "border-black shadow-md" : "border-zinc-200 opacity-60 hover:opacity-100 hover:border-zinc-400"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust signals */}
            <div className="hidden lg:grid grid-cols-1 gap-4 mt-8 bg-white p-6 rounded-[32px] border border-zinc-200">
              {[
                { icon: Shield, title: "2-Year Warranty", desc: "For peace of mind" },
                { icon: RefreshCw, title: "30-Day Returns", desc: "Hassle-free process" },
                { icon: Truck, title: "Free Delivery", desc: "Carbon neutral shipping" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4 p-2">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-black" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{title}</p>
                    <p className="text-xs text-zinc-500 font-medium">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Product Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-zinc-200 p-8 lg:p-10">
              <p className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-2">{product.brand}</p>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(product.rating) ? "fill-black text-black" : "text-zinc-200"}`} />
                  ))}
                </div>
                <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                <span className="text-sm text-zinc-500">({product.reviewCount} reviews)</span>
              </div>

              {/* Condition badge */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Condition</p>
                <span className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm border ${GRADE_COLORS[product.condition] ?? "border-zinc-200 bg-zinc-100 text-zinc-900"}`}>
                  {product.condition}
                </span>
                {GRADE_DESC[product.condition] && (
                  <p className="text-xs text-zinc-500 mt-2 font-medium flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" /> {GRADE_DESC[product.condition]}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-bold tracking-tight">£{product.price.toFixed(2)}</span>
                {product.comparePrice && (
                  <span className="text-xl text-zinc-400 line-through font-medium">£{product.comparePrice.toFixed(2)}</span>
                )}
                {savings > 0 && (
                  <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    Save £{savings.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock */}
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-2 rounded-xl mb-6">
                  Only {product.stock} left in stock — order soon
                </p>
              )}

              {/* Add to cart */}
              <div className="flex gap-3 mb-8">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 h-16 rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                    product.stock === 0
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : added
                      ? "bg-emerald-500 text-white"
                      : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {product.stock === 0 ? (
                    "Out of stock"
                  ) : added ? (
                    <><Check className="h-5 w-5" strokeWidth={3} /> Added to cart</>
                  ) : (
                    <><ShoppingCart className="h-5 w-5" /> Add to cart</>
                  )}
                </motion.button>
              </div>

              {/* Quick features from specs */}
              {Object.keys(specs).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(specs).slice(0, 4).map(([k, v]) => (
                    <span key={k} className="text-xs font-bold bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full text-zinc-700">
                      {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expandable sections */}
            <div className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
              {[
                {
                  id: "description",
                  title: "Description",
                  content: (
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                      {product.description || `${product.name} in ${product.condition} condition. Fully tested and certified by our expert technicians.`}
                    </p>
                  ),
                },
                {
                  id: "specs",
                  title: "Specifications",
                  content: Object.keys(specs).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(specs).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-zinc-50 last:border-0">
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{key}</span>
                          <span className="text-sm font-medium text-right">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">No specifications available.</p>
                  ),
                },
                {
                  id: "warranty",
                  title: "Warranty & Returns",
                  content: (
                    <div className="space-y-4 text-sm text-zinc-600 font-medium">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-black flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p><strong>2-Year Warranty</strong> — All devices come with a full 2-year warranty. If something goes wrong, we fix or replace it, no questions asked.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <RefreshCw className="h-5 w-5 text-black flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p><strong>30-Day Returns</strong> — Changed your mind? Return it within 30 days for a full refund, completely free of charge.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-black flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                        <p><strong>25-Point Inspection</strong> — Certified experts test every device before it ships to you.</p>
                      </div>
                    </div>
                  ),
                },
              ].map(({ id, title, content }) => (
                <div key={id}>
                  <button
                    onClick={() => setExpandedSection(prev => prev === id ? null : id)}
                    className="w-full flex items-center justify-between px-8 py-5 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="font-bold text-base">{title}</span>
                    {expandedSection === id ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
                  </button>
                  <AnimatePresence>
                    {expandedSection === id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-6">{content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Mobile trust signals */}
            <div className="lg:hidden grid grid-cols-3 gap-3">
              {[
                { icon: Shield, title: "2-Year Warranty" },
                { icon: RefreshCw, title: "30-Day Returns" },
                { icon: Truck, title: "Free Delivery" },
              ].map(({ icon: Icon, title }) => (
                <div key={title} className="bg-white rounded-[1.5rem] border border-zinc-200 p-4 flex flex-col items-center gap-2 text-center">
                  <Icon className="h-5 w-5 text-black" strokeWidth={1.5} />
                  <p className="text-[10px] font-bold leading-tight">{title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
