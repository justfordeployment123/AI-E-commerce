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
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  grade: string;
  storage?: string;
  quantity: number;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    {
      id: 1,
      name: 'iPhone 14 Pro',
      price: 679,
      image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400&h=400&auto=format&fit=crop',
      grade: 'Excellent',
      storage: '256GB',
      quantity: 1,
    },
    {
      id: 2,
      name: 'Silicone Case with MagSafe',
      price: 49,
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=400&h=400&auto=format&fit=crop',
      grade: 'Brand New',
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
  const shipping = 0;
  const total = subtotal + shipping;

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-black font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="h-32 w-32 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mb-8"
          >
            <ShoppingCart className="h-12 w-12 text-zinc-300" />
          </motion.div>
          <h1 className="font-serif text-5xl md:text-7xl font-medium mb-6">Your bag is empty.</h1>
          <p className="text-zinc-500 mb-12 max-w-sm font-medium text-lg">
            But your tech dreams don't have to be. <br/>Discover the best deals today.
          </p>
          <a href="/shop" className="h-16 px-12 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-black/10">
            Start Shopping
            <ArrowRight className="h-5 w-5" />
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans selection:bg-accent selection:text-black">
      <Navbar itemsCount={items.length} />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* Left Column: Cart Items */}
          <div className="flex-1">
            <header className="mb-16">
              <h1 className="font-serif text-5xl md:text-8xl font-medium tracking-tighter">Your tech bag.</h1>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
                   <Zap className="h-3.5 w-3.5" />
                   {items.length} Items ready
                </div>
                <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Ships within 24 hours</p>
              </div>
            </header>

            <div className="space-y-12">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col sm:flex-row gap-8 items-start group border-b border-zinc-100 pb-12 last:border-0"
                  >
                    <div className="relative aspect-square w-full sm:w-48 overflow-hidden rounded-[2.5rem] bg-zinc-50 p-8 transition-all group-hover:bg-white group-hover:shadow-2xl ring-1 ring-zinc-50 group-hover:ring-transparent">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110" 
                      />
                    </div>

                    <div className="flex-1 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold text-black uppercase tracking-widest mb-3">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            {item.grade}
                          </div>
                          <h3 className="text-2xl font-bold group-hover:text-zinc-600 transition-colors">{item.name}</h3>
                          {item.storage && <p className="text-sm font-bold text-zinc-400 mt-1 uppercase tracking-widest">{item.storage}</p>}
                        </div>
                        <div className="text-2xl font-bold">${item.price * item.quantity}</div>
                      </div>

                      <div className="mt-auto pt-8 flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-1 rounded-2xl bg-zinc-50 p-1 border border-zinc-100">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-zinc-400 hover:text-black"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-all text-zinc-400 hover:text-black"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => saveForLater(item.id)}
                            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors flex items-center gap-2"
                          >
                            <Heart className="h-4 w-4" />
                            Save for later
                          </button>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="h-12 w-12 flex items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Saved for Later Section */}
            {savedItems.length > 0 && (
              <div className="mt-32 pt-16 border-t-2 border-dashed border-zinc-100">
                <h2 className="font-serif text-4xl font-medium mb-10">Saved for later</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {savedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-6 p-6 rounded-[2rem] bg-zinc-50/50 border border-zinc-100">
                      <div className="h-24 w-24 rounded-2xl bg-white p-4">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                        <p className="text-lg font-bold mb-3">${item.price}</p>
                        <button 
                          onClick={() => {
                            setItems([...items, item]);
                            setSavedItems(savedItems.filter(i => i.id !== item.id));
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-accent bg-black px-4 py-2 rounded-full hover:scale-105 transition-transform"
                        >
                          Move to bag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:w-[400px]">
            <div className="sticky top-32 space-y-8">
              <div className="rounded-[3rem] bg-zinc-950 p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <h3 className="text-2xl font-bold mb-10 tracking-tight">Order summary</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Subtotal</span>
                    <span className="font-bold">${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Shipping</span>
                    <span className="text-accent font-bold uppercase tracking-widest">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Eco-Tax</span>
                    <span className="font-bold">$0.00</span>
                  </div>
                  
                  <div className="pt-8 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Total (VAT Incl.)</p>
                      <p className="text-4xl font-bold tracking-tighter">${total}</p>
                    </div>
                  </div>
                </div>

                <button className="w-full h-18 bg-accent text-black rounded-2xl font-bold text-lg mt-12 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl shadow-accent/20">
                  Checkout Now
                  <ArrowRight className="h-6 w-6" />
                </button>
                
                <p className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-8">
                  Secure checkout powered by Stripe
                </p>
              </div>

              {/* Eco Impact Card */}
              <div className="rounded-[2.5rem] bg-emerald-50 p-8 border border-emerald-100 group">
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white transition-transform group-hover:rotate-12">
                      <Leaf className="h-6 w-6" />
                   </div>
                   <div>
                      <h4 className="text-emerald-900 font-bold">Your Impact</h4>
                      <p className="text-emerald-700/60 text-xs font-bold uppercase tracking-widest">Sustainability Report</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-800/70 font-medium">CO2 Emissions Saved</span>
                      <span className="font-bold text-emerald-900">142 kg</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-800/70 font-medium">Electronic Waste Saved</span>
                      <span className="font-bold text-emerald-900">2.4 kg</span>
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-emerald-100 flex items-center gap-2">
                   <Info className="h-3.5 w-3.5 text-emerald-600" />
                   <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-tight">
                     Buying refurbished reduces the environmental impact of tech by up to 90%.
                   </p>
                </div>
              </div>

              {/* Support Trust */}
              <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all py-4">
                 <ShieldCheck className="h-6 w-6" />
                 <RefreshCw className="h-6 w-6" />
                 <Zap className="h-6 w-6" />
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
