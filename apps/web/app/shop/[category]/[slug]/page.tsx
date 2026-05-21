"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../../../context/cart-context";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, ShoppingCart, Heart, Shield, RefreshCw, Truck,
  Check, ChevronDown, ChevronUp, ArrowLeft, Zap, Package,
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

// Mock product data
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
  const params = useParams();
  const categorySlug = params?.category as string;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState("256 GB");
  const [selectedGrade, setSelectedGrade] = useState("Excellent");
  const [selectedColor, setSelectedColor] = useState("Space Black");
  const [added, setAdded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("description");
  const [wishlisted, setWishlisted] = useState(false);
  const { addItem } = useCart();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const currentVariant = PRODUCT.variants.find(
    v => v.storage === selectedStorage && v.grade === selectedGrade
  ) ?? PRODUCT.variants[1];

  const availableGrades = PRODUCT.variants
    .filter(v => v.storage === selectedStorage)
    .map(v => v.grade);

  const storages = [...new Set(PRODUCT.variants.map(v => v.storage))];

  async function handleAddToCart() {
    try {
      await addItem({
        productId: PRODUCT.id,
        quantity: 1,
        price: currentVariant.price,
        name: `${PRODUCT.title} — ${selectedStorage}, ${selectedGrade}`,
        slug: PRODUCT.id,
        image: PRODUCT.images[0],
      });
    } catch { /* cart context handles offline fallback */ }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const savings = currentVariant.originalPrice - currentVariant.price;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f7] text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wide">
          <a href="/shop/phones" className="hover:text-black flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Shop
          </a>
          <span>/</span>
          <a href={`/shop/${categorySlug}`} className="hover:text-black transition-colors capitalize">{categorySlug}</a>
          <span>/</span>
          <span className="text-black line-clamp-1">{PRODUCT.title}</span>
        </div>
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left — Sticky Image Gallery */}
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
                    src={PRODUCT.images[activeImage]}
                    alt={PRODUCT.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-2">
              {PRODUCT.images.map((img, i) => (
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

            {/* Trust signals (Desktop left column) */}
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
              <p className="text-sm font-bold uppercase tracking-wide text-zinc-500 mb-2">{PRODUCT.brand}</p>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">{PRODUCT.title}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-8">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(PRODUCT.rating) ? "fill-black text-black" : "text-zinc-200"}`} />
                  ))}
                </div>
                <span className="font-bold text-sm">{PRODUCT.rating}</span>
                <a href="#reviews" className="text-sm font-bold text-zinc-500 underline hover:text-black">
                  {PRODUCT.reviewCount.toLocaleString()} reviews
                </a>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4 mb-8">
                <span className="text-5xl font-bold tracking-tight">£{currentVariant.price}</span>
                <span className="text-xl font-bold text-zinc-400 line-through">£{currentVariant.originalPrice} new</span>
              </div>

              {/* Condition Selector */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold">Condition</p>
                  <button className="text-xs font-bold text-zinc-500 underline hover:text-black">What does this mean?</button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...new Set(PRODUCT.variants.map(v => v.grade))].map(grade => {
                    const available = availableGrades.includes(grade);
                    const isSelected = selectedGrade === grade;
                    return (
                      <button
                        key={grade}
                        disabled={!available}
                        onClick={() => setSelectedGrade(grade)}
                        className={`p-4 rounded-[20px] border-2 text-left transition-all ${
                          isSelected
                            ? "border-black bg-black text-white"
                            : available
                              ? "border-zinc-200 bg-white hover:border-zinc-400"
                              : "border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <p className="font-bold text-sm mb-1">{grade}</p>
                        <p className={`text-xs font-medium ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                          {GRADE_DESC[grade].split("—")[0]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Storage Selector */}
              <div className="mb-8">
                <p className="text-sm font-bold mb-3">Storage</p>
                <div className="flex flex-wrap gap-3">
                  {storages.map(s => {
                    const isSelected = selectedStorage === s;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setSelectedStorage(s);
                          const gradesForStorage = PRODUCT.variants.filter(v => v.storage === s).map(v => v.grade);
                          if (!gradesForStorage.includes(selectedGrade)) setSelectedGrade(gradesForStorage[0]);
                        }}
                        className={`h-14 px-6 rounded-full border-2 font-bold text-sm transition-all ${
                          isSelected ? "border-black bg-black text-white" : "border-zinc-200 bg-white hover:border-zinc-400"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              <div className="mb-10">
                <p className="text-sm font-bold mb-3">Colour: <span className="font-normal text-zinc-600">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-3">
                  {PRODUCT.colors.map(c => {
                    const isSelected = selectedColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? "border-black bg-black text-white p-1" : "border-zinc-200 bg-white hover:border-zinc-400"
                        }`}
                        title={c}
                      >
                        {isSelected && <Check className="h-5 w-5" />}
                        {!isSelected && <span className="text-xs font-bold">{c.charAt(0)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="space-y-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className={`w-full h-16 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    added ? "bg-emerald-500 text-white" : "bg-black text-white hover:scale-[1.02]"
                  }`}
                >
                  {added ? (
                    <><Check className="h-6 w-6" strokeWidth={3} /> Added to cart</>
                  ) : (
                    <><ShoppingCart className="h-6 w-6" /> Add to cart — £{currentVariant.price}</>
                  )}
                </motion.button>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 py-3 rounded-full">
                  <Zap className="h-4 w-4 fill-emerald-600" /> Save £{savings} vs buying new
                </div>
              </div>
            </div>

            {/* Mobile Trust Signals */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-6 rounded-[32px] border border-zinc-200">
              {[
                { icon: Shield, title: "2-Year Warranty" },
                { icon: RefreshCw, title: "30-Day Returns" },
                { icon: Truck, title: "Free Delivery" },
              ].map(({ icon: Icon, title }) => (
                <div key={title} className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-black" strokeWidth={1.5} />
                  </div>
                  <p className="font-bold text-xs">{title}</p>
                </div>
              ))}
            </div>

            {/* In the box */}
            <div className="bg-white rounded-[32px] border border-zinc-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  <Package className="h-5 w-5 text-black" />
                </div>
                <h3 className="font-bold text-xl">In the box</h3>
              </div>
              <ul className="space-y-3">
                {PRODUCT.inBox.map(item => (
                  <li key={item} className="flex items-center gap-3 font-medium">
                    <Check className="h-5 w-5 text-black shrink-0" strokeWidth={3} />
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-sm text-zinc-500 mt-4 bg-zinc-50 p-4 rounded-2xl">
                  <Info className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>To reduce e-waste, power adapters and EarPods are not included. Please use your existing Apple power adapter and headphones.</p>
                </li>
              </ul>
            </div>

            {/* Expandable Info Accordions */}
            <div className="bg-white rounded-[32px] border border-zinc-200 overflow-hidden">
              {[
                {
                  id: "description",
                  title: "Product details",
                  content: (
                    <div className="space-y-6">
                      <p className="text-zinc-600 font-medium leading-relaxed">{PRODUCT.description}</p>
                      <div>
                        <p className="font-bold mb-3">Key Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {PRODUCT.features.map(f => (
                            <span key={f} className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-bold">{f}</span>
                          ))}
                        </div>
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
                            <td className="py-4 pr-6 font-bold text-zinc-500 whitespace-nowrap w-1/3">{k}</td>
                            <td className="py-4 font-bold">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ),
                },
                {
                  id: "grading",
                  title: "Grading explained",
                  content: (
                    <div className="space-y-6">
                      {Object.entries(GRADE_DESC).map(([grade, desc]) => (
                        <div key={grade} className="flex items-start gap-4">
                          <div className="w-24 shrink-0">
                            <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold">{grade}</span>
                          </div>
                          <p className="text-sm font-medium text-zinc-600 pt-1">{desc}</p>
                        </div>
                      ))}
                    </div>
                  ),
                },
              ].map(({ id, title, content }) => (
                <div key={id} className="border-b border-zinc-200 last:border-0">
                  <button
                    onClick={() => setExpandedSection(expandedSection === id ? null : id)}
                    className="w-full flex items-center justify-between p-6 lg:p-8 text-left hover:bg-zinc-50 transition-colors"
                  >
                    <h3 className="font-bold text-xl">{title}</h3>
                    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                      {expandedSection === id ? <ChevronUp className="h-5 w-5 text-black" /> : <ChevronDown className="h-5 w-5 text-black" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSection === id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-8 lg:px-8 pt-0">{content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Reviews Block */}
            <div id="reviews" className="bg-white rounded-[32px] border border-zinc-200 p-8 lg:p-10 scroll-mt-32">
              <h3 className="font-bold text-2xl mb-8">Customer Reviews</h3>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 mb-12">
                <div className="text-center md:text-left flex flex-col items-center md:items-start shrink-0">
                  <p className="text-7xl font-bold tracking-tighter mb-2">{PRODUCT.rating}</p>
                  <div className="flex mb-2">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-6 w-6 ${i <= Math.round(PRODUCT.rating) ? "fill-black text-black" : "text-zinc-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-zinc-500">Based on {PRODUCT.reviewCount.toLocaleString()} reviews</p>
                </div>
                <div className="flex-1 w-full space-y-3">
                  {[5,4,3,2,1].map(n => (
                    <div key={n} className="flex items-center gap-4">
                      <div className="flex items-center gap-1 w-10 justify-end">
                        <span className="text-sm font-bold">{n}</span>
                        <Star className="h-3 w-3 fill-black text-black" />
                      </div>
                      <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-black rounded-full" style={{ width: `${n === 5 ? 78 : n === 4 ? 14 : n === 3 ? 5 : n === 2 ? 2 : 1}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {PRODUCT.reviews.map((rev, i) => (
                  <div key={i} className="p-6 rounded-[24px] bg-zinc-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center font-bold text-sm">
                          {rev.author.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{rev.author}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                            <Check className="h-3 w-3" strokeWidth={3} /> Verified Buyer
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex justify-end mb-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`h-3 w-3 ${i <= rev.rating ? "fill-black text-black" : "text-zinc-200"}`} />
                          ))}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">{rev.date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{rev.text}</p>
                  </div>
                ))}
                <button className="w-full h-14 rounded-full border-2 border-black font-bold text-sm hover:bg-black hover:text-white transition-colors">
                  Read all reviews
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
