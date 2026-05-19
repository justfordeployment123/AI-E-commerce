"use client";

import { useState } from "react";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronLeft, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  Heart,
  ArrowRight,
  Leaf,
  Info,
  Truck,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  grade: string;
  storage?: string;
  color?: string;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    {
      id: 1,
      name: 'iPhone 14 Pro',
      price: 579,
      originalPrice: 1099,
      image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400&h=400&auto=format&fit=crop',
      grade: 'Excellent',
      storage: '256 GB',
      color: 'Space Black',
      quantity: 1,
    },
    {
      id: 2,
      name: 'Silicone Case with MagSafe',
      price: 29,
      originalPrice: 49,
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=400&h=400&auto=format&fit=crop',
      grade: 'Pristine',
      color: 'Midnight',
      quantity: 1,
    }
  ]);

  const [savedItems, setSavedItems] = useState<CartItem[]>([]);

  const updateQuantity = (id: number, delta: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const saveForLater = (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSavedItems([...savedItems, item]);
      removeItem(id);
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalSavings = items.reduce((acc, item) => acc + ((item.originalPrice - item.price) * item.quantity), 0);
  const shipping = 0;
  const total = subtotal + shipping;

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f5f7] text-black font-sans">
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
          <a href="/shop" className="h-14 px-8 bg-black text-white rounded-full font-bold flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]">
            Start shopping
            <ArrowRight className="h-5 w-5" />
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f7] text-black font-sans selection:bg-accent selection:text-black">
      <Navbar itemsCount={items.length} />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left Column: Cart Items */}
          <div className="flex-1">
            <header className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Cart</h1>
              <span className="text-sm font-bold text-zinc-500">{items.length} items</span>
            </header>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-[32px] p-6 sm:p-8 border border-zinc-200"
                  >
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                      {/* Image */}
                      <div className="relative aspect-square w-full sm:w-40 shrink-0 overflow-hidden rounded-[24px] bg-[#f5f5f7] p-4 flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="h-full w-full object-contain mix-blend-multiply" 
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <div>
                            <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                            <p className="text-sm text-zinc-600 font-medium flex flex-wrap gap-x-3 gap-y-1">
                              <span>Condition: <strong>{item.grade}</strong></span>
                              {item.storage && <span>Storage: <strong>{item.storage}</strong></span>}
                              {item.color && <span>Colour: <strong>{item.color}</strong></span>}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold tracking-tight">£{item.price * item.quantity}</div>
                            <div className="text-sm font-bold text-zinc-400 line-through">£{item.originalPrice * item.quantity} new</div>
                          </div>
                        </div>

                        {/* In stock badge */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-6">
                          <Check className="h-4 w-4" strokeWidth={3} /> In stock
                        </div>

                        {/* Actions & Quantity */}
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="text-sm font-bold text-zinc-500 hover:text-black underline decoration-zinc-300 hover:decoration-black underline-offset-4"
                            >
                              Remove
                            </button>
                            <button 
                              onClick={() => saveForLater(item.id)}
                              className="text-sm font-bold text-zinc-500 hover:text-black flex items-center gap-1.5"
                            >
                              <Heart className="h-4 w-4" /> Save
                            </button>
                          </div>

                          <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 h-12 px-1">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white text-zinc-600 hover:text-black transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
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

            {/* Saved for Later Section */}
            {savedItems.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Saved for later ({savedItems.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {savedItems.map(item => (
                    <div key={item.id} className="flex gap-4 p-5 rounded-[24px] bg-white border border-zinc-200">
                      <div className="h-24 w-24 rounded-[16px] bg-[#f5f5f7] p-2 shrink-0">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm leading-tight mb-1">{item.name}</h4>
                          <p className="font-bold">£{item.price}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setItems([...items, item]);
                            setSavedItems(savedItems.filter(i => i.id !== item.id));
                          }}
                          className="text-xs font-bold w-full h-9 rounded-full border border-zinc-200 hover:border-black transition-colors mt-3"
                        >
                          Move to cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-[380px] shrink-0">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white rounded-[32px] border border-zinc-200 p-8 shadow-sm">
                <h3 className="text-2xl font-bold mb-6">Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Subtotal</span>
                    <span>£{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600 font-medium">
                    <span>Delivery</span>
                    <span className="text-emerald-600 font-bold">Free</span>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-zinc-100 mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-lg">Total</span>
                    <span className="text-3xl font-bold tracking-tight">£{total}</span>
                  </div>
                  <p className="text-xs text-zinc-500 text-right">Includes VAT</p>
                </div>

                <div className="flex items-center gap-2 mb-6 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-[16px]">
                  <Zap className="h-4 w-4 fill-emerald-600" /> You're saving £{totalSavings} vs buying new
                </div>

                <button className="w-full h-14 bg-black text-white rounded-full font-bold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                  Checkout securely
                </button>
                
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
                    <span className="font-bold text-emerald-900">~142 kg</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/50 p-3 rounded-[16px]">
                    <span className="text-sm font-bold text-emerald-900">E-waste saved</span>
                    <span className="font-bold text-emerald-900">~420 g</span>
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
