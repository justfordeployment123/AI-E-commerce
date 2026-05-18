"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ShoppingCart, Heart, Shield, RefreshCw, Truck,
  Check, ChevronDown, ChevronUp, ArrowLeft, Zap, Package,
  Award, Info
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

const GRADE_COLORS: Record<string, string> = {
  Pristine: "bg-emerald-100 text-emerald-800",
  Excellent: "bg-blue-100 text-blue-800",
  "Very Good": "bg-violet-100 text-violet-800",
  Good: "bg-amber-100 text-amber-800",
  Fair: "bg-red-100 text-red-800",
};

const GRADE_DESC: Record<string, string> = {
  Pristine: "Flawless condition — looks and works like new.",
  Excellent: "Tiny hairline marks only visible under bright light.",
  "Very Good": "Light surface scratches, fully functional.",
  Good: "Visible wear, scratches or minor dents.",
  Fair: "Heavy wear or cosmetic damage, 100% functional.",
};

// Mock product data — will come from API
const PRODUCT = {
  id: "iphone-14-pro-256gb",
  title: "iPhone 14 Pro",
  brand: "Apple",
  category: "Smartphones",
  rating: 4.8,
  reviewCount: 1847,
  images: [
    "https://picsum.photos/seed/iphone14pro-a/600/600",
    "https://picsum.photos/seed/iphone14pro-b/600/600",
    "https://picsum.photos/seed/iphone14pro-c/600/600",
    "https://picsum.photos/seed/iphone14pro-d/600/600",
  ],
  variants: [
    { storage: "128 GB", grade: "Excellent", price: 519, originalPrice: 1099 },
    { storage: "256 GB", grade: "Excellent", price: 579, originalPrice: 1199 },
    { storage: "256 GB", grade: "Very Good", price: 499, originalPrice: 1199 },
    { storage: "512 GB", grade: "Excellent", price: 649, originalPrice: 1299 },
    { storage: "512 GB", grade: "Good", price: 429, originalPrice: 1299 },
    { storage: "1 TB", grade: "Excellent", price: 749, originalPrice: 1429 },
  ],
  colors: ["Space Black", "Silver", "Gold", "Deep Purple"],
  features: ["48MP Main Camera", "Dynamic Island", "A16 Bionic Chip", "Always-On Display", "USB 3 Speed", "Emergency SOS via satellite"],
  description: "The iPhone 14 Pro brings the Dynamic Island and always-on display to the Pro lineup. Powered by the A16 Bionic chip, it features a 48MP main camera system, ProRAW and ProRes video recording, and all-day battery life.",
  specs: [
    ["Display", "6.1\" Super Retina XDR OLED, 2556×1179"],
    ["Processor", "A16 Bionic (4nm)"],
    ["Camera", "48MP Main + 12MP Ultra Wide + 12MP 3x Telephoto"],
    ["Battery", "Up to 23 hours video playback"],
    ["OS", "Ships with iOS 18 (upgradeable)"],
    ["5G", "Sub-6GHz + mmWave"],
  ],
  inBox: ["iPhone 14 Pro (device)", "USB-C to Lightning Cable", "Documentation"],
  reviews: [
    { author: "Priya Nair", rating: 5, date: "3 weeks ago", text: "Arrived in immaculate condition. Camera blows my old phone out of the water. Incredibly fast delivery too." },
    { author: "Marcus Webb", rating: 5, date: "1 month ago", text: "Described as Excellent condition and that's exactly what I got. Dynamic Island is genuinely clever. Great value." },
    { author: "Sienna Park", rating: 4, date: "6 weeks ago", text: "Really pleased with the purchase. Only reason for 4 stars is I'd hoped for the original charger but the device itself is perfect." },
  ],
};

export default function ProductDetailPage() {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState("256 GB");
  const [selectedGrade, setSelectedGrade] = useState("Excellent");
  const [selectedColor, setSelectedColor] = useState("Space Black");
  const [added, setAdded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("description");
  const [wishlisted, setWishlisted] = useState(false);

  const currentVariant = PRODUCT.variants.find(
    v => v.storage === selectedStorage && v.grade === selectedGrade
  ) ?? PRODUCT.variants[1];

  const availableGrades = PRODUCT.variants
    .filter(v => v.storage === selectedStorage)
    .map(v => v.grade);

  const storages = [...new Set(PRODUCT.variants.map(v => v.storage))];

  function handleAddToCart() {
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const savings = currentVariant.originalPrice - currentVariant.price;
  const savingsPct = Math.round((savings / currentVariant.originalPrice) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-2 text-xs font-bold text-zinc-400">
            <a href="/shop" className="hover:text-black transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Shop
            </a>
            <span>/</span>
            <span>{PRODUCT.category}</span>
            <span>/</span>
            <span className="text-black">{PRODUCT.title}</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">

            {/* Left — Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-zinc-50">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={PRODUCT.images[activeImage]}
                    alt={PRODUCT.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>
                <button
                  onClick={() => setWishlisted(w => !w)}
                  className="absolute top-5 right-5 h-11 w-11 rounded-2xl bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Heart className={`h-5 w-5 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {PRODUCT.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 flex-shrink-0 rounded-[1rem] overflow-hidden border-2 transition-all ${activeImage === i ? "border-black" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Product Info */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{PRODUCT.brand}</p>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{PRODUCT.title}</h1>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(PRODUCT.rating) ? "fill-accent text-accent" : "text-zinc-200"}`} />
                  ))}
                </div>
                <span className="font-bold text-sm">{PRODUCT.rating}</span>
                <span className="text-sm text-zinc-400">({PRODUCT.reviewCount.toLocaleString()} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-zinc-100">
                <span className="text-5xl font-bold tracking-tighter">£{currentVariant.price}</span>
                <span className="text-xl text-zinc-400 line-through">£{currentVariant.originalPrice}</span>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold">Save {savingsPct}%</span>
              </div>

              {/* Grade Selector */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</p>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${GRADE_COLORS[selectedGrade] ?? ""}`}>
                    {selectedGrade}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(PRODUCT.variants.map(v => v.grade))].map(grade => {
                    const available = availableGrades.includes(grade);
                    return (
                      <button
                        key={grade}
                        disabled={!available}
                        onClick={() => setSelectedGrade(grade)}
                        className={`px-4 py-2.5 rounded-[1rem] border-2 text-sm font-bold transition-all ${
                          selectedGrade === grade
                            ? "border-black bg-black text-white"
                            : available
                              ? "border-zinc-200 hover:border-zinc-400"
                              : "border-zinc-100 text-zinc-300 cursor-not-allowed"
                        }`}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-zinc-500 mt-2 font-medium">{GRADE_DESC[selectedGrade]}</p>
              </div>

              {/* Storage Selector */}
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Storage</p>
                <div className="flex flex-wrap gap-2">
                  {storages.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedStorage(s);
                        const gradesForStorage = PRODUCT.variants.filter(v => v.storage === s).map(v => v.grade);
                        if (!gradesForStorage.includes(selectedGrade)) setSelectedGrade(gradesForStorage[0]);
                      }}
                      className={`px-4 py-2.5 rounded-[1rem] border-2 text-sm font-bold transition-all ${
                        selectedStorage === s ? "border-black bg-black text-white" : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Colour — {selectedColor}</p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT.colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2.5 rounded-[1rem] border-2 text-sm font-bold transition-all ${
                        selectedColor === c ? "border-black bg-black text-white" : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3 mb-6">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className={`flex-1 h-16 rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 transition-all ${
                    added ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {added ? (
                    <><Check className="h-5 w-5" /> Added to cart</>
                  ) : (
                    <><ShoppingCart className="h-5 w-5" /> Add to cart</>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="h-16 w-16 rounded-[1.5rem] border-2 border-zinc-200 flex items-center justify-center hover:border-black transition-colors"
                >
                  <Heart className="h-5 w-5 text-zinc-400" />
                </motion.button>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: Shield, text: "2-Year Warranty" },
                  { icon: RefreshCw, text: "30-Day Returns" },
                  { icon: Truck, text: "Free Delivery" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-2 rounded-[1.5rem] bg-zinc-50 p-4 text-center">
                    <Icon className="h-5 w-5 text-black/40" strokeWidth={1.5} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 leading-tight">{text}</p>
                  </div>
                ))}
              </div>

              {/* In the box */}
              <div className="rounded-[1.5rem] bg-zinc-50 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-zinc-400" strokeWidth={1.5} />
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">In the box</p>
                </div>
                <ul className="space-y-2">
                  {PRODUCT.inBox.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="mt-16 max-w-3xl">
            {[
              {
                id: "description",
                title: "About this device",
                content: (
                  <div className="space-y-4">
                    <p className="text-zinc-600 leading-relaxed">{PRODUCT.description}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {PRODUCT.features.map(f => (
                        <span key={f} className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold">{f}</span>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                id: "specs",
                title: "Technical specs",
                content: (
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-zinc-100">
                      {PRODUCT.specs.map(([k, v]) => (
                        <tr key={k}>
                          <td className="py-3 pr-6 font-bold text-zinc-400 whitespace-nowrap">{k}</td>
                          <td className="py-3 font-medium">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ),
              },
              {
                id: "grading",
                title: "Our grading system",
                content: (
                  <div className="space-y-3">
                    {Object.entries(GRADE_DESC).map(([grade, desc]) => (
                      <div key={grade} className="flex items-start gap-3">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex-shrink-0 mt-0.5 ${GRADE_COLORS[grade]}`}>{grade}</span>
                        <p className="text-sm text-zinc-600">{desc}</p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: "reviews",
                title: `Reviews (${PRODUCT.reviewCount.toLocaleString()})`,
                content: (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-5xl font-bold tracking-tighter">{PRODUCT.rating}</p>
                        <div className="flex mt-2">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-4 w-4 ${i <= Math.round(PRODUCT.rating) ? "fill-accent text-accent" : "text-zinc-200"}`} />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5,4,3,2,1].map(n => (
                          <div key={n} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-zinc-400 w-4">{n}</span>
                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-accent rounded-full" style={{ width: `${n === 5 ? 78 : n === 4 ? 14 : n === 3 ? 5 : 2 : 1}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-5 pt-4 border-t border-zinc-100">
                      {PRODUCT.reviews.map((rev, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-sm text-zinc-600">
                              {rev.author.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{rev.author}</p>
                              <p className="text-xs text-zinc-400">{rev.date}</p>
                            </div>
                            <div className="ml-auto flex">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} className={`h-3.5 w-3.5 ${i <= rev.rating ? "fill-accent text-accent" : "text-zinc-200"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-zinc-600 leading-relaxed">{rev.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ].map(({ id, title, content }) => (
              <div key={id} className="border-b border-zinc-100">
                <button
                  onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                  className="w-full flex items-center justify-between py-6 text-left"
                >
                  <h3 className="font-bold text-lg">{title}</h3>
                  {expandedSection === id ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8">{content}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
