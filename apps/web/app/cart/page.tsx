"use client";

import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  RefreshCw,
  ArrowRight,
  Leaf,
  Truck,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../context/cart-context";
import RequireAuth from "../../components/RequireAuth";

function CartPageContent() {
  const { items, count, subtotal, loading, updateItem, removeItem } = useCart();

  const shipping = 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center min-h-screen">
          <div className="h-12 w-12 border-4 border-zinc-200 border-t-accent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">
        <div className="min-h-screen">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-32 w-32 bg-white rounded-full flex items-center justify-center mb-8 border border-zinc-200 shadow-sm"
            >
              <ShoppingCart className="h-12 w-12 text-zinc-300" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Your cart is empty</h1>
            <p className="text-zinc-500 mb-10 max-w-md font-medium text-lg">
              Ready to find your next favorite device? Discover our amazing deals on refurbished tech.
            </p>
            <a href="/shop/phones" className="h-14 px-8 bg-black text-white rounded-full font-bold flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]">
              Start shopping
              <ArrowRight className="h-5 w-5" />
            </a>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Left Column: Cart Items */}
          <div className="flex-1">
            <header className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Cart</h1>
              <span className="text-sm font-bold text-zinc-500">{count} {count === 1 ? "item" : "items"}</span>
            </header>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-[32px] p-6 sm:p-8 border border-zinc-200"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                      {/* Image */}
                      <div className="relative aspect-square w-full sm:w-40 shrink-0 overflow-hidden rounded-[24px] bg-[#f5f5f7] p-4 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-contain mix-blend-multiply"
                          />
                        ) : (
                          <ShoppingCart className="h-12 w-12 text-zinc-300" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 sm:gap-4 mb-2">
                          <div>
                            <h3 className="text-xl font-bold mb-1 sm:mb-2">{item.name}</h3>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <div className="text-2xl font-bold tracking-tight">£{(item.price * item.quantity).toFixed(2)}</div>
                            <div className="text-sm font-medium text-zinc-400">£{item.price.toFixed(2)} each</div>
                          </div>
                        </div>

                        {/* In stock badge */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-6">
                          <Check className="h-4 w-4" strokeWidth={3} /> In stock
                        </div>

                        {/* Actions & Quantity */}
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-black underline decoration-zinc-300 hover:decoration-black underline-offset-4"
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>

                          <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 h-12 px-1">
                            <button
                              onClick={() => {
                                const newQty = item.quantity - 1;
                                if (newQty <= 0) removeItem(item.productId);
                                else updateItem(item.productId, newQty);
                              }}
                              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white text-zinc-600 hover:text-black transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateItem(item.productId, item.quantity + 1)}
                              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white text-zinc-600 hover:text-black transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-[380px] shrink-0">
            <div className="sticky top-24 space-y-6">

              <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-sm">
                <h3 className="text-2xl font-bold mb-6">Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Subtotal</span>
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Delivery</span>
                    <span className="text-emerald-600 font-bold">Free</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-lg">Total</span>
                    <span className="text-3xl font-bold tracking-tight">£{total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">Includes VAT</p>
                </div>

                <a
                  href="/checkout"
                  className="w-full h-14 bg-accent hover:bg-accent-dark text-white rounded-full font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                >
                  Checkout securely
                </a>

                <div className="mt-4 flex justify-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Powered by Stripe</span>
                </div>
              </div>

              {/* Eco Impact Card */}
              <div className="rounded-[32px] bg-[#eef8f3] p-8 border border-[#c3eb4e]/30">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-[#c3eb4e]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-tight">Your impact</h4>
                    <p className="text-xs font-bold text-emerald-700/70 uppercase tracking-wide">By choosing refurbished</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/50 p-3 rounded-[16px]">
                    <span className="text-sm font-bold text-emerald-900">CO2 emissions saved</span>
                    <span className="font-bold text-emerald-900">~{Math.round(count * 71)} kg</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 p-3 rounded-[16px]">
                    <span className="text-sm font-bold text-emerald-900">E-waste saved</span>
                    <span className="font-bold text-emerald-900">~{Math.round(count * 210)} g</span>
                  </div>
                </div>
              </div>

              {/* Support Trust Signals */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-[20px] border border-zinc-200 flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-black" strokeWidth={1.5} />
                  <p className="text-xs font-bold">2-Year Warranty</p>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-zinc-200 flex flex-col items-center text-center gap-2">
                  <RefreshCw className="h-6 w-6 text-black" strokeWidth={1.5} />
                  <p className="text-xs font-bold">30-Day Returns</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CartPage() {
  return (
    <RequireAuth>
      <CartPageContent />
    </RequireAuth>
  );
}
