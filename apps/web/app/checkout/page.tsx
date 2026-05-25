"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, ChevronRight, Check, CreditCard, Truck,
  Tag, ArrowLeft, Zap, ShoppingCart, ArrowRight, AlertCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useCart } from "../../context/cart-context";
import { useAuth } from "../../context/auth-context";
import { ordersApi, paymentsApi } from "../../lib/api";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const STEPS = ["Delivery", "Payment", "Review"];

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner />
    </Elements>
  );
}

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;

function CheckoutInner() {
  const { items, subtotal, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(0);
  const [deliveryError, setDeliveryError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null);
  const [savedPaymentIntentId, setSavedPaymentIntentId] = useState<string | null>(null);
  const [savedClientSecret, setSavedClientSecret] = useState<string | null>(null);
  const [savedDiscount, setSavedDiscount] = useState(0);
  const [cardError, setCardError] = useState("");

  const [delivery, setDelivery] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", postcode: "", country: "United Kingdom",
  });

  // Pre-fill from user profile when user loads
  const [profilePrefilled, setProfilePrefilled] = useState(false);
  useEffect(() => {
    if (user && !profilePrefilled) {
      const nameParts = (user.name ?? "").split(" ");
      setDelivery(d => ({
        ...d,
        firstName: d.firstName || nameParts[0] || "",
        lastName:  d.lastName  || nameParts.slice(1).join(" ") || "",
        email:     d.email     || user.email || "",
        phone:     d.phone     || user.phone || "",
        address:   d.address   || user.address || "",
        city:      d.city      || user.city || "",
        postcode:  d.postcode  || user.postcode || "",
      }));
      setProfilePrefilled(true);
    }
  }, [user]);

  const shipping = 0;
  // Use server-confirmed discount once intent is created; fall back to optimistic calculation before
  const discount = savedDiscount || (promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0);
  const total = subtotal - discount + shipping;

  function applyPromo() {
    if (promoCode.toUpperCase() === "TECHSTOP10") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid code — try TECHSTOP10");
    }
  }

  function validateDelivery(): string {
    if (!delivery.firstName.trim()) return "First name is required.";
    if (!delivery.lastName.trim()) return "Last name is required.";
    if (!delivery.email.trim()) return "Email address is required.";
    if (!delivery.address.trim()) return "Street address is required.";
    if (!delivery.city.trim()) return "City is required.";
    if (!delivery.postcode.trim()) return "Postcode is required.";
    if (!UK_POSTCODE.test(delivery.postcode.trim())) return "Enter a valid UK postcode (e.g. LE1 1AA).";
    return "";
  }

  function handleAdvanceToPayment() {
    const err = validateDelivery();
    if (err) { setDeliveryError(err); return; }
    setDeliveryError("");
    setStep(1);
  }

  async function handleAdvanceToReview() {
    if (stripePromise && stripe && elements) {
      setCardError("");
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { setCardError("Card details missing."); return; }
      const { paymentMethod: pm, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: `${delivery.firstName} ${delivery.lastName}`.trim() || "Customer",
          email: delivery.email || undefined,
        },
      });
      if (error) { setCardError(error.message ?? "Card error"); return; }
      setSavedPaymentMethodId(pm!.id);
    }
    setStep(2);
  }

  async function placeOrder() {
    setPlacing(true);
    setPlaceError("");

    // Track whether payment was confirmed so we can show the right error if order creation fails
    let paymentConfirmed = false;
    let intentId = savedPaymentIntentId;

    try {
      // Reuse the existing payment intent if we already created one (idempotency on retry)
      let clientSecret = savedClientSecret;
      let devMode = !stripePromise;

      if (!clientSecret) {
        const intent = await paymentsApi.createIntent(
          items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          promoApplied ? promoCode : undefined,
        );
        clientSecret = intent.clientSecret;
        intentId = intent.paymentIntentId;
        devMode = intent.devMode;
        setSavedClientSecret(clientSecret);
        setSavedPaymentIntentId(intentId);
        setSavedDiscount(intent.discount);
      }

      if (!devMode) {
        if (!stripe) throw new Error("Stripe not loaded. Please refresh and try again.");
        if (!savedPaymentMethodId) throw new Error("Payment details missing. Please go back to the payment step.");

        const result = await stripe.confirmCardPayment(clientSecret!, {
          payment_method: savedPaymentMethodId,
        });

        if (result.error) {
          // Payment failed — clear the intent so a fresh one is created on retry
          setSavedClientSecret(null);
          setSavedPaymentIntentId(null);
          throw new Error(result.error.message ?? "Payment failed");
        }

        if (result.paymentIntent?.status !== "succeeded") {
          setSavedClientSecret(null);
          setSavedPaymentIntentId(null);
          throw new Error("Payment was not completed. Please try again.");
        }

        paymentConfirmed = true;
      }

      const order = await ordersApi.create({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: {
          name: `${delivery.firstName} ${delivery.lastName}`.trim() || "Customer",
          address: delivery.address,
          city: delivery.city,
          postcode: delivery.postcode,
          country: delivery.country,
        },
        paymentMethod: devMode ? "dev" : "stripe",
        paymentIntentId: intentId ?? undefined,
        discount: savedDiscount || (promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0),
      });

      setOrderId(order.id);
      await clearCart();
      setOrderPlaced(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      if (paymentConfirmed && intentId) {
        // Payment was taken but order creation failed — show recovery info
        setPlaceError(
          `Your payment was processed (ref: ${intentId}) but we couldn't record your order. ` +
          `Please contact us at support@techstopleicester.com with this reference and we will resolve it immediately.`
        );
      } else {
        setPlaceError(msg);
      }
    } finally {
      setPlacing(false);
    }
  }

  if (cartLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-12 w-12 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="flex min-h-screen flex-col bg-white font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="h-32 w-32 bg-zinc-100 rounded-full flex items-center justify-center mb-8">
            <ShoppingCart className="h-12 w-12 text-zinc-300" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <a href="/shop/phones" className="h-14 px-8 bg-black text-white rounded-full font-bold flex items-center justify-center gap-2">
            Start shopping <ArrowRight className="h-5 w-5" />
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="flex min-h-screen flex-col bg-white font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="mx-auto h-24 w-24 bg-accent rounded-[2rem] flex items-center justify-center mb-8"
            >
              <Check className="h-12 w-12 text-black" strokeWidth={2.5} />
            </motion.div>

            <h1 className="text-4xl font-bold tracking-tight text-black mb-3">Order confirmed!</h1>
            <p className="text-zinc-500 font-medium mb-2">
              Your order <span className="font-bold text-black">#{orderId.slice(0, 8).toUpperCase()}</span> is confirmed.
            </p>
            <p className="text-zinc-500 font-medium mb-8">
              A receipt has been sent to <span className="font-bold text-black">{delivery.email || "your email"}</span>.
            </p>

            <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-6 mb-8 text-left space-y-4">
              {[
                { n: 1, text: <>Dispatched within <strong className="text-black">24 hours</strong> via Royal Mail Tracked 24</> },
                { n: 2, text: "Tracking number emailed once dispatched" },
                { n: 3, text: <>Delivered in <strong className="text-black">1–2 working days</strong></> },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-black flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{n}</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-700">{text}</p>
                </div>
              ))}
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-2 h-14 px-10 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-colors"
            >
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
                        { key: "firstName", label: "First name" },
                        { key: "lastName", label: "Last name" },
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

                    {deliveryError && (
                      <div className="flex items-start gap-3 rounded-[1.5rem] bg-red-50 border border-red-100 p-4 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-600">{deliveryError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleAdvanceToPayment}
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

                    {!stripePromise && (
                      <div className="flex items-start gap-3 rounded-[1.5rem] bg-amber-50 border border-amber-200 p-5 mb-6">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-amber-800">Stripe not configured</p>
                          <p className="text-xs text-amber-700 mt-1">Add <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code> file. In dev mode, payment will be skipped.</p>
                        </div>
                      </div>
                    )}

                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Card details</label>
                        <div className="flex items-center gap-1.5">
                          {["visa", "mc", "amex"].map(brand => (
                            <div key={brand} className="h-6 w-9 rounded bg-zinc-100 flex items-center justify-center">
                              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-[1rem] border-2 border-zinc-200 px-5 py-4 focus-within:border-black transition-colors">
                        {stripePromise ? (
                          <CardElement
                            options={{
                              style: {
                                base: {
                                  fontSize: "14px",
                                  color: "#000",
                                  fontFamily: "inherit",
                                  fontWeight: "500",
                                  "::placeholder": { color: "#a1a1aa" },
                                },
                                invalid: { color: "#ef4444" },
                              },
                              hidePostalCode: true,
                            }}
                            onChange={e => setCardComplete(e.complete && !e.error)}
                          />
                        ) : (
                          <p className="text-sm text-zinc-400 py-1">Card entry disabled — Stripe key missing</p>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                        <Lock className="h-3 w-3" /> Secured by Stripe — we never store your card details
                      </p>
                    </div>

                    {cardError && (
                      <div className="flex items-start gap-3 rounded-[1.5rem] bg-red-50 border border-red-100 p-4 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-600">{cardError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleAdvanceToReview}
                      disabled={stripePromise ? !cardComplete : false}
                      className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
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
                        { label: "Delivering to", value: `${delivery.firstName} ${delivery.lastName}, ${delivery.address}, ${delivery.city} ${delivery.postcode}`.trim().replace(/^,\s*/, "") || "—" },
                        { label: "Email", value: delivery.email || "—" },
                        { label: "Payment", value: stripePromise ? "Card (Stripe)" : "Dev mode" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-4 border-b border-zinc-100">
                          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
                          <span className="text-sm font-medium text-right max-w-xs">{value}</span>
                        </div>
                      ))}
                    </div>

                    {placeError && (
                      <div className="flex items-start gap-3 rounded-[1.5rem] bg-red-50 border border-red-100 p-4 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-600">{placeError}</p>
                      </div>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={placeOrder}
                      disabled={placing}
                      className="w-full py-5 bg-accent text-black rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accent-dark transition-colors active:scale-[0.99] shadow-xl shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {placing ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : (
                        <><Zap className="h-5 w-5" /> Place order — £{total.toFixed(2)}</>
                      )}
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
                  {items.map(item => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="h-16 w-16 rounded-[1rem] bg-white border border-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image
                          ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          : <ShoppingCart className="h-6 w-6 text-zinc-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-sm flex-shrink-0">£{(item.price * item.quantity).toFixed(2)}</p>
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
                    <span>£{subtotal.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm font-medium text-emerald-600">
                      <span>Promo (TECHSTOP10)</span>
                      <span>-£{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-zinc-500">Shipping</span>
                    <span className="text-emerald-600 font-bold">Free</span>
                  </div>
                </div>

                <div className="flex justify-between pt-5 font-bold text-xl">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
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
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium pt-2 border-t border-zinc-100 mt-2">
                    <Lock className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    Powered by Stripe
                  </div>
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
