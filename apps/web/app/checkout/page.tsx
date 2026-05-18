"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, ChevronRight, Check, CreditCard, Truck,
  Tag, ArrowLeft, X, Zap
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const STEPS = ["Delivery", "Payment", "Review"];

const CART_ITEMS = [
  { id: 1, name: "iPhone 14 Pro", grade: "Excellent", storage: "256 GB", color: "Space Black", price: 579, image: "https://picsum.photos/seed/ip14pro/120/120" },
  { id: 2, name: "Sony WH-1000XM5", grade: "Pristine", storage: "—", color: "Black", price: 219, image: "https://picsum.photos/seed/wh1000/120/120" },
];

const subtotal = CART_ITEMS.reduce((sum, i) => sum + i.price, 0);
const shipping = 0;
const total = subtotal + shipping;

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [payMethod, setPayMethod] = useState<"card" | "paypal">("card");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [delivery, setDelivery] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", postcode: "", country: "United Kingdom",
  });

  const [card, setCard] = useState({
    number: "", name: "", expiry: "", cvv: "",
  });

  function applyPromo() {
    if (promoCode.toUpperCase() === "TECHSTOP10") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid code — try TECHSTOP10");
    }
  }

  if (orderPlaced) {
    return (
      <div className="flex min-h-screen flex-col bg-white font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center px-4 max-w-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="mx-auto h-28 w-28 bg-accent rounded-[2.5rem] flex items-center justify-center mb-8"
            >
              <Check className="h-14 w-14 text-black" strokeWidth={2} />
            </motion.div>
            <h1 className="font-serif text-5xl font-medium mb-4">Order confirmed!</h1>
            <p className="text-zinc-500 text-lg font-medium mb-8 leading-relaxed">
              Your order <strong className="text-black">#TS-28471</strong> is confirmed. A receipt has been sent to <strong className="text-black">{delivery.email || "your email"}</strong>.
            </p>
            <div className="rounded-[2rem] bg-zinc-50 border border-zinc-100 p-6 mb-8 text-sm text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center"><span className="text-white font-bold text-xs">1</span></div>
                <p className="font-medium">Dispatched within <strong>24 hours</strong> via Royal Mail Tracked 24</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center"><span className="font-bold text-xs">2</span></div>
                <p className="font-medium">Tracking number emailed once dispatched</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center"><span className="font-bold text-xs">3</span></div>
                <p className="font-medium">Delivered in <strong>1–2 working days</strong></p>
              </div>
            </div>
            <a href="/" className="inline-flex items-center gap-2 h-14 px-10 bg-black text-white rounded-[1.5rem] font-bold hover:bg-zinc-800 transition-colors">
              Continue shopping
            </a>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl px-4 py-5 flex items-center justify-between">
            <a href="/cart" className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors">
              <ArrowLeft className="h-4 w-4" /> Cart
            </a>
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 ${i <= step ? "text-black" : "text-zinc-300"}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-black text-white" : i === step ? "border-2 border-black" : "border-2 border-zinc-200"}`}>
                      {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className="text-xs font-bold hidden sm:block">{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold">
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Secure checkout</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 lg:py-14">
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 xl:gap-20">

            {/* Left — Form */}
            <div>
              <AnimatePresence mode="wait">
                {/* Step 0: Delivery */}
                {step === 0 && (
                  <motion.div
                    key="delivery"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <h1 className="text-3xl font-bold mb-8">Delivery details</h1>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {[
                        { key: "firstName", label: "First name", col: 1 },
                        { key: "lastName", label: "Last name", col: 1 },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                          <input
                            type="text"
                            placeholder={label}
                            value={delivery[key as keyof typeof delivery]}
                            onChange={e => setDelivery(d => ({ ...d, [key]: e.target.value }))}
                            className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 mb-4">
                      {[
                        { key: "email", label: "Email address", type: "email", placeholder: "you@example.com" },
                        { key: "phone", label: "Phone number", type: "tel", placeholder: "+44 7700 000000" },
                        { key: "address", label: "Street address", type: "text", placeholder: "123 High Street, Apt 4" },
                        { key: "city", label: "City", type: "text", placeholder: "Leicester" },
                        { key: "postcode", label: "Postcode", type: "text", placeholder: "LE1 1AA" },
                      ].map(({ key, label, type, placeholder }) => (
                        <div key={key} className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                          <input
                            type={type}
                            placeholder={placeholder}
                            value={delivery[key as keyof typeof delivery]}
                            onChange={e => setDelivery(d => ({ ...d, [key]: e.target.value }))}
                            className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Shipping method */}
                    <div className="mb-8">
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Shipping method</p>
                      <div className="space-y-3">
                        {[
                          { id: "tracked24", label: "Royal Mail Tracked 24", sub: "1–2 working days", price: "Free" },
                          { id: "express", label: "Royal Mail Special Delivery", sub: "Next working day by 1pm", price: "£7.99" },
                        ].map(opt => (
                          <label key={opt.id} className="flex items-center gap-4 p-5 rounded-[1.5rem] border-2 border-zinc-200 hover:border-zinc-400 cursor-pointer transition-all has-[:checked]:border-black has-[:checked]:bg-zinc-50">
                            <input type="radio" name="shipping" defaultChecked={opt.id === "tracked24"} className="accent-black" />
                            <div className="flex-1">
                              <p className="font-bold text-sm">{opt.label}</p>
                              <p className="text-xs text-zinc-400 mt-0.5">{opt.sub}</p>
                            </div>
                            <span className="font-bold text-sm">{opt.price}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setStep(1)}
                      className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors active:scale-[0.99]"
                    >
                      Continue to payment <ChevronRight className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}

                {/* Step 1: Payment */}
                {step === 1 && (
                  <motion.div
                    key="payment"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <button onClick={() => setStep(0)} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                      <ArrowLeft className="h-4 w-4" /> Delivery
                    </button>
                    <h2 className="text-3xl font-bold mb-8">Payment</h2>

                    {/* Pay method toggle */}
                    <div className="flex gap-3 mb-8">
                      {[
                        { id: "card", label: "Card" },
                        { id: "paypal", label: "PayPal" },
                      ].map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => setPayMethod(id as "card" | "paypal")}
                          className={`flex-1 h-14 rounded-[1rem] border-2 font-bold text-sm transition-all ${payMethod === id ? "border-black bg-black text-white" : "border-zinc-200 hover:border-zinc-400"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {payMethod === "card" && (
                      <div className="space-y-4 mb-8">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Card number</label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={card.number}
                              maxLength={19}
                              onChange={e => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                                setCard(c => ({ ...c, number: v.replace(/(.{4})/g, "$1 ").trim() }));
                              }}
                              className="h-14 w-full rounded-[1rem] border-2 border-zinc-200 pl-5 pr-14 text-sm font-medium outline-none focus:border-black transition-colors font-mono"
                            />
                            <CreditCard className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Name on card</label>
                          <input
                            type="text"
                            placeholder="As it appears on your card"
                            value={card.name}
                            onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                            className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Expiry</label>
                            <input
                              type="text"
                              placeholder="MM / YY"
                              value={card.expiry}
                              maxLength={7}
                              onChange={e => {
                                const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                setCard(c => ({ ...c, expiry: v.length > 2 ? v.slice(0, 2) + " / " + v.slice(2) : v }));
                              }}
                              className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-mono outline-none focus:border-black transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">CVV</label>
                            <input
                              type="text"
                              placeholder="000"
                              maxLength={4}
                              value={card.cvv}
                              onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                              className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-mono outline-none focus:border-black transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {payMethod === "paypal" && (
                      <div className="rounded-[1.5rem] bg-[#003087] p-8 text-white text-center mb-8">
                        <p className="font-bold text-lg mb-2">Continue with PayPal</p>
                        <p className="text-white/70 text-sm">You'll be redirected to PayPal to complete your payment securely.</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-8">
                      <button
                        onClick={() => setSaveInfo(s => !s)}
                        className={`h-6 w-10 rounded-full transition-colors relative ${saveInfo ? "bg-black" : "bg-zinc-200"}`}
                      >
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${saveInfo ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                      <p className="text-sm font-medium">Save payment info for next time</p>
                    </div>

                    <button
                      onClick={() => setStep(2)}
                      className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors active:scale-[0.99]"
                    >
                      Review order <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-zinc-400 font-medium">
                      <Lock className="h-3.5 w-3.5" />
                      256-bit SSL encryption — your data is safe
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Review */}
                {step === 2 && (
                  <motion.div
                    key="review"
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -40, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                      <ArrowLeft className="h-4 w-4" /> Payment
                    </button>
                    <h2 className="text-3xl font-bold mb-8">Review &amp; place order</h2>

                    <div className="space-y-4 mb-8">
                      {[
                        { label: "Delivering to", value: `${delivery.firstName} ${delivery.lastName}, ${delivery.address}, ${delivery.city} ${delivery.postcode}` || "123 High Street, Leicester LE1 1AA" },
                        { label: "Email", value: delivery.email || "customer@example.com" },
                        { label: "Payment", value: payMethod === "card" ? `Card ending ····${card.number.slice(-4) || "3456"}` : "PayPal" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-4 border-b border-zinc-100">
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
                          <span className="text-sm font-medium text-right max-w-xs">{value}</span>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setOrderPlaced(true)}
                      className="w-full h-18 py-5 bg-accent text-black rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accent-dark transition-colors active:scale-[0.99] shadow-xl shadow-accent/20"
                    >
                      <Zap className="h-5 w-5" />
                      Place order — £{promoApplied ? (total * 0.9).toFixed(2) : total.toFixed(2)}
                    </motion.button>
                    <p className="text-center text-[10px] text-zinc-400 font-medium mt-3">
                      By placing your order you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right — Order Summary */}
            <div>
              <div className="lg:sticky lg:top-24 rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8">
                <h2 className="font-bold text-lg mb-6">Order summary</h2>

                <div className="space-y-4 mb-6">
                  {CART_ITEMS.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-16 w-16 rounded-[1rem] bg-white border border-zinc-100 overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.grade} · {item.storage}</p>
                      </div>
                      <p className="font-bold text-sm flex-shrink-0">£{item.price}</p>
                    </div>
                  ))}
                </div>

                {/* Promo code */}
                <div className="mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      disabled={promoApplied}
                      className="flex-1 h-12 rounded-[1rem] border-2 border-zinc-200 px-4 text-sm font-mono outline-none focus:border-black transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={applyPromo}
                      disabled={promoApplied || !promoCode}
                      className="h-12 px-5 rounded-[1rem] bg-black text-white text-sm font-bold disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                  </div>
                  {promoError && <p className="text-xs text-red-500 font-medium mt-2">{promoError}</p>}
                  {promoApplied && (
                    <div className="flex items-center gap-2 mt-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      <p className="text-xs text-emerald-600 font-bold">10% discount applied!</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pb-6 border-b border-zinc-200">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-zinc-500">Subtotal</span>
                    <span>£{subtotal}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm font-medium text-emerald-600">
                      <span>Promo (TECHSTOP10)</span>
                      <span>-£{(subtotal * 0.1).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-emerald-600 font-bold">Free</span>
                  </div>
                </div>

                <div className="flex justify-between pt-5 font-bold text-xl">
                  <span>Total</span>
                  <span>£{promoApplied ? (total * 0.9).toFixed(2) : total}</span>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    { icon: Shield, text: "2-year warranty on every device" },
                    { icon: Truck, text: "Free tracked delivery" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                      <Icon className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      {text}
                    </div>
                  ))}
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
