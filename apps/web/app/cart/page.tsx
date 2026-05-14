"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShieldCheck, 
  RefreshCw, 
  Leaf, 
  ArrowRight,
  Heart,
  Truck,
  Zap,
  Info,
  ShoppingCart
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface CartItem {
  id: number;
  name: string;
  grade: string;
  storage: string;
  color: string;
  price: number;
  image: string;
  quantity: number;
}

const INITIAL_ITEMS: CartItem[] = [
  {
    id: 1,
    name: "iPhone 14 Pro",
    grade: "Excellent",
    storage: "256 GB",
    color: "Deep Purple",
    price: 679.00,
    image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=400&h=400&auto=format&fit=crop",
    quantity: 1,
  },
  {
    id: 2,
    name: "AirPods Pro (2nd Gen)",
    grade: "Certified",
    storage: "N/A",
    color: "White",
    price: 189.00,
    image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?q=80&w=400&h=400&auto=format&fit=crop",
    quantity: 1,
  }
];

const RECOMMENDATIONS = [
  { id: 101, name: "20W USB-C Power Adapter", price: 19.00, img: "/power-adapter.png" },
  { id: 102, name: "Silicone Case with MagSafe", price: 49.00, img: "/silicone-case.png" },
  { id: 103, name: "Screen Protector (2-Pack)", price: 15.00, img: "/screen-protector.png" },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);
  const shippingThreshold = 1000;
  const progressPercent = Math.min((subtotal / shippingThreshold) * 100, 100);
  const remainsForFreeShipping = Math.max(shippingThreshold - subtotal, 0);

  const updateQuantity = (id: number, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const saveForLater = (id: number) => {
    const itemToSave = items.find(i => i.id === id);
    if (itemToSave) {
      setSavedItems(prev => [...prev, itemToSave]);
      removeItem(id);
    }
  };

  const moveToCart = (id: number) => {
    const itemToMove = savedItems.find(i => i.id === id);
    if (itemToMove) {
      setItems(prev => [...prev, itemToMove]);
      setSavedItems(prev => prev.filter(i => i.id !== id));
    }
  };

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-black">
        <Navbar itemsCount={0} />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-8">
            <ShoppingCart className="h-10 w-10 text-zinc-300" />
          </motion.div>
          <h1 className="font-serif text-4xl font-medium mb-4 text-black">Your bag is empty</h1>
          <p className="text-zinc-500 mb-10 max-w-sm font-medium">Looks like you haven't added anything to your bag yet. Discover the latest tech deals today.</p>
          <a href="/shop" className="rounded-2xl bg-black px-10 py-4 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10">Start Shopping</a>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar itemsCount={items.length} />

      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Column: Cart Items */}
          <div className="flex-1">
            <header className="mb-12 flex items-end justify-between border-b border-zinc-100 pb-8">
              <div>
                <h1 className="font-serif text-4xl md:text-6xl font-medium text-black tracking-tight">TechStop Bag</h1>
                <p className="text-zinc-500 mt-3 font-medium text-lg">{items.length} items ready for checkout</p>
              </div>
            </header>

            {items.length > 0 ? (
              <div className="space-y-10">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col sm:flex-row gap-8 items-start sm:items-center group border-b border-zinc-50 pb-10 last:border-0"
                    >
                      <div className="relative aspect-square w-full sm:w-40 overflow-hidden rounded-[2rem] bg-zinc-50 p-6 transition-all group-hover:bg-zinc-100/80">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
                      </div>

                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-[9px] font-bold text-black uppercase tracking-wider">
                            <Zap className="h-3 w-3" />
                            {item.grade} Condition
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => saveForLater(item.id)}
                              className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
                              title="Save for later"
                            >
                              <Heart className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => removeItem(item.id)}
                              className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-black group-hover:text-accent-dark transition-colors">{item.name}</h3>
                        <p className="text-sm text-zinc-400 font-medium">{item.color} · {item.storage}</p>
                        
                        <div className="mt-6 flex items-center gap-8">
                          <div className="flex items-center gap-1 bg-zinc-50 rounded-full p-1.5 border border-zinc-100 shadow-sm">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white transition-all active:scale-90 hover:shadow-sm"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white transition-all active:scale-90 hover:shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-right sm:hidden ml-auto">
                            <div className="text-xl font-bold text-black">${(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:block text-right min-w-[120px]">
                        <div className="text-2xl font-bold text-black tracking-tight">${item.price.toFixed(2)}</div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-zinc-400 font-bold mt-1">
                            ${(item.price * item.quantity).toFixed(2)} total
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-20 text-center bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
                <p className="text-zinc-500 font-medium">Your current bag is empty.</p>
              </div>
            )}

            {/* Saved Items */}
            {savedItems.length > 0 && (
              <section className="mt-24 pt-20 border-t border-zinc-100">
                <h2 className="font-serif text-3xl font-medium mb-10">Saved for later</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 group">
                      <div className="h-24 w-24 rounded-2xl bg-white p-3 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                          <p className="text-xs font-bold text-black">${item.price.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => moveToCart(item.id)}
                          className="text-[10px] font-bold uppercase tracking-widest text-accent hover:text-black transition-colors text-left"
                        >
                          Move back to bag
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recommendations */}
            <section className="mt-24 pt-20 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-serif text-3xl font-medium">You might also like</h2>
                <a href="/shop" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">See all accessories</a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {RECOMMENDATIONS.map((rec) => (
                  <div key={rec.id} className="p-6 rounded-[2.5rem] bg-white border border-zinc-100 hover:shadow-2xl hover:border-transparent transition-all group cursor-pointer">
                    <div className="aspect-square rounded-3xl bg-zinc-50 mb-6 p-6 overflow-hidden">
                      <img src={rec.img} alt={rec.name} className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                    </div>
                    <h3 className="font-bold text-sm mb-2 group-hover:text-accent transition-colors">{rec.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${rec.price.toFixed(2)}</span>
                      <button className="h-10 w-10 rounded-full bg-zinc-950 text-white flex items-center justify-center transition-transform hover:scale-110 active:scale-90">
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="w-full lg:w-[420px]">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-[3rem] bg-zinc-50 p-10 border border-zinc-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full" />
                
                <h2 className="text-2xl font-bold mb-10 text-black">Order Summary</h2>
                
                {/* Shipping Progress */}
                <div className="mb-10 p-5 rounded-3xl bg-white border border-zinc-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${progressPercent >= 100 ? 'text-emerald-500' : 'text-zinc-400'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {progressPercent >= 100 ? 'Free Express Shipping Unlocked' : 'Free Express Shipping'}
                      </span>
                    </div>
                    {progressPercent < 100 && (
                      <span className="text-[10px] font-bold text-accent">${remainsForFreeShipping.toFixed(0)} remains</span>
                    )}
                  </div>
                  <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-black'}`}
                    />
                  </div>
                  {progressPercent < 100 && (
                    <p className="mt-3 text-[9px] text-zinc-400 font-medium italic">Add more tech to unlock free premium delivery.</p>
                  )}
                </div>

                <div className="space-y-5 mb-10">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Subtotal ({items.length} items)</span>
                    <span className="font-bold text-black">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500 font-medium">Estimated Shipping</span>
                    <span className="font-bold text-emerald-600 uppercase tracking-widest text-[10px]">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 font-medium">Eco-Tax Contribution</span>
                      <Info className="h-3 w-3 text-zinc-300" />
                    </div>
                    <span className="font-bold text-emerald-600 uppercase tracking-widest text-[10px]">Covered by us</span>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-200 flex justify-between items-baseline mb-12">
                  <span className="text-xl font-bold text-black">Total</span>
                  <div className="text-right">
                    <span className="text-4xl font-bold text-black tracking-tight">${subtotal.toFixed(2)}</span>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">VAT included where applicable</p>
                  </div>
                </div>

                <button className="group w-full h-18 py-6 bg-accent text-black rounded-[1.5rem] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-accent/20 flex items-center justify-center gap-4">
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>

                {/* Trust Ticker */}
                <div className="mt-10 flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    100% Secure SSL Payment
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                    <RefreshCw className="h-4 w-4 text-emerald-500" />
                    30-Day Money Back Guarantee
                  </div>
                </div>

                <div className="mt-10 flex justify-center gap-5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple Pay" className="h-5" />
                </div>
              </div>

              {/* Sustainability Impact Card */}
              <div className="rounded-[2.5rem] bg-emerald-950 p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
                <div className="relative z-10">
                  <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <Leaf className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="font-serif text-xl mb-3">Eco Impact of this order</h3>
                  <p className="text-emerald-200/60 text-xs leading-relaxed font-medium mb-6">
                    Choosing refurbished tech saves an average of 140kg of raw materials and 80% less water than buying new.
                  </p>
                  <button className="text-xs font-bold text-emerald-400 border-b border-emerald-400/30 pb-0.5 hover:text-emerald-300 transition-colors">Learn more about our mission</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
