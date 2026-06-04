"use client";

import {
  Search, Package, RefreshCw, ShieldCheck, Truck,
  Smartphone, ChevronRight, MessageCircle, ArrowRight,
  X, Send, HelpCircle, User,
  ChevronDown, Phone, Circle, CreditCard
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { authApi, ordersApi, type Order } from "../../lib/api";
import { useAuth } from "../../context/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
const WS_URL  = API_URL.replace(/^http/, "ws");

interface Helpline { id: string; label: string; number: string; }
interface ChatMsg   { id?: string; sender: "customer" | "admin" | "bot"; body?: string; text?: string; createdAt?: string; }

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
}

const ARTICLES: Article[] = [
  {
    id: "track-order",
    title: "How to track my order",
    category: "Orders",
    content: "To track your shipment:\n\n1. Go to your **Account Dashboard**.\n2. Select **Orders** to view your active shipments.\n3. Click on the tracking link provided (e.g. Royal Mail or DPD tracking number).\n\nYou will also receive a dispatch email with your tracking link as soon as the courier collects the parcel from our warehouse. Standard delivery takes 1-3 working days across the UK."
  },
  {
    id: "change-order",
    title: "Can I modify or cancel my order?",
    category: "Orders",
    content: "Because we process orders rapidly (often within 30 minutes of purchase), cancellation and modification requests are highly time-sensitive:\n\n- **Within 15 minutes of ordering**: You can cancel or edit shipping details directly from your Account page.\n- **After 15 minutes**: Please contact our live support or email team immediately. If the parcel has already left our Leicester warehouse, you can reject the delivery or return it for free within 30 days of receipt."
  },
  {
    id: "order-delayed",
    title: "What to do if my order is delayed",
    category: "Orders",
    content: "If your order has not arrived within the estimated delivery window:\n\n1. Check the tracking page for any courier delay notifications (e.g. weather or route exceptions).\n2. If it is delayed by more than **48 hours**, please reach out to our support team and we will open an investigation with the carrier immediately.\n3. In cases where the carrier confirms the parcel is lost, we will ship a replacement unit or issue a full refund immediately."
  },
  {
    id: "return-policy",
    title: "Our 30-day return policy",
    category: "Returns",
    content: "We want you to love your purchase. If you change your mind, you can return any item for a full refund within **30 days** of delivery:\n\n- **Condition**: The item must be returned in the same cosmetic condition it was received, along with any included charging cables and accessories.\n- **Free Shipping**: We provide a prepaid postage label. Pack the device securely, attach the label, and drop it at any Post Office."
  },
  {
    id: "return-label",
    title: "How to generate a return label",
    category: "Returns",
    content: "To print your prepaid return shipping label:\n\n1. Log into your account and navigate to **Returns & Refunds**.\n2. Select the order and device you wish to return.\n3. Choose your reason for return and click **Generate Label**.\n4. Download and print the PDF label, then attach it securely to your shipping box."
  },
  {
    id: "payment-methods",
    title: "Supported payment methods",
    category: "Payments",
    content: "We accept a wide range of safe and secure payment methods:\n\n- **Credit/Debit Cards**: Visa, Mastercard, American Express.\n- **Digital Wallets**: Apple Pay, Google Pay, PayPal.\n- **Financing**: Klarna and Clearpay are available at checkout, letting you pay in 3 interest-free installments or pay later in 30 days."
  },
  {
    id: "invoice",
    title: "How to download my invoice",
    category: "Payments",
    content: "VAT invoices are generated automatically at the time of purchase:\n\n1. Go to **Orders** inside your account profile.\n2. Click on the order in question to open its detail page.\n3. Click **Download VAT Invoice** (PDF) at the top right of the order summary."
  },
  {
    id: "trade-in-payment",
    title: "How and when do I get paid for trade-ins?",
    category: "Selling",
    content: "Our trade-in payout process is fast and transparent:\n\n1. **Send device**: Use the free prepaid shipping label we send you.\n2. **Inspection**: Our technicians inspect the device within **24 hours** of receipt.\n3. **Payment**: Once approved, bank transfer payments are initiated instantly. Funds typically clear in your account within 2 hours, depending on your bank's faster payment processing."
  },
  {
    id: "shipping-trade-in",
    title: "How to package my trade-in device safely",
    category: "Selling",
    content: "To prevent transit damage and guarantee your full payout valuation:\n\n- Use a sturdy cardboard box (not a bubble mailer for laptops or tablets).\n- Wrap the device in bubble wrap or crumpled packing paper so it doesn't move.\n- Perform a factory reset and remove any iCloud/Google accounts and SIM cards before dispatch."
  },
  {
    id: "warranty-coverage",
    title: "What does our 12-month warranty cover?",
    category: "Warranty",
    content: "Every device bought from TechStop comes with a comprehensive **12-month hardware warranty**:\n\n- **What's Covered**: Technical faults, manufacturing defects, and hardware failures (e.g. touch screen failing, charging port disconnecting, battery degradation below 80% capacity).\n- **What's Not Covered**: Accidental physical damage (e.g. cracked screens, drop impact dents) and liquid immersion/water exposure."
  },
  {
    id: "claim-warranty",
    title: "How to file a warranty claim",
    category: "Warranty",
    content: "If your device develops a hardware fault:\n\n1. Navigate to **Warranty & Repairs** inside your account.\n2. Click **File Warranty Claim** next to the specific device.\n3. Describe the issue and select your preferred method: **Drop-off** in Leicester or **Prepaid Post**.\n4. We will repair the device or ship a certified replacement within 3 working days."
  },
  {
    id: "reset-password",
    title: "How to reset my password",
    category: "Account",
    content: "If you've forgotten your password or want to change it:\n\n1. Go to the **Login Page**.\n2. Click **Forgot Password?** under the input field.\n3. Enter your registered email address and click **Send Reset Link**.\n4. Click the link in your email to choose a new secure password."
  },
  {
    id: "delete-account",
    title: "How to delete my account",
    category: "Account",
    content: "We take your data privacy seriously. To delete your account and remove all personal information:\n\n1. Visit **Settings** within your Account page.\n2. Scroll down to the **Privacy & Data** section.\n3. Click **Delete My Account & Personal Data**.\n4. Confirm your identity by entering your password or verification code."
  }
];

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Processing",
  CONFIRMED: "Confirmed",
  SHIPPED:   "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function HelpPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [drawerType, setDrawerType] = useState<"article" | "chat" | null>(null);

  // Modals / Dropdown States
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [missingDetailsOpen, setMissingDetailsOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Real orders
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Helplines
  const [helplines, setHelplines] = useState<Helpline[]>([]);

  // Real chat state
  const [chatStep, setChatStep] = useState<"form" | "chat">("form");
  const [chatName, setChatName] = useState("");
  const [chatEmail, setChatEmail] = useState("");
  const [chatOrderRef, setChatOrderRef] = useState<string | undefined>(undefined);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatConnected, setChatConnected] = useState(false);
  const [chatStarting, setChatStarting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const categoriesRef = useRef<HTMLDivElement>(null);

  const guardedOpen = (action: () => void) => {
    if (authLoading) return;
    if (!user) {
      sessionStorage.setItem("ts_login_redirect", "/help");
      router.push("/login?redirect=%2Fhelp");
      return;
    }
    const missing: string[] = [];
    if (!user.phone)    missing.push("Phone number");
    if (!user.address)  missing.push("Street address");
    if (!user.city)     missing.push("City");
    if (!user.postcode) missing.push("Postcode");
    if (missing.length > 0) {
      setMissingFields(missing);
      setMissingDetailsOpen(true);
      return;
    }
    action();
  };

  // Load helplines on mount
  useEffect(() => {
    fetch(`${API_URL}/support/helplines`)
      .then(r => r.json()).then(setHelplines).catch(() => {});
  }, []);

  // Sync user profile name/email when user is loaded
  useEffect(() => {
    if (user) {
      setChatName(user.name ?? "");
      setChatEmail(user.email ?? "");
    }
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Cleanup socket on unmount
  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  const connectSocket = useCallback((id: string) => {
    const socket = io(`${WS_URL}/support`, { transports: ["websocket"] });
    socketRef.current = socket;
    socket.on("connect", () => { setChatConnected(true); socket.emit("joinChat", id); });
    socket.on("disconnect", () => setChatConnected(false));
    socket.on("chatHistory", (chat: { messages: ChatMsg[] }) => {
      setChatMessages(chat.messages ?? []);
    });
    socket.on("newMessage", (msg: ChatMsg) => {
      setChatMessages(prev => [...prev, msg]);
    });
    socket.on("chatClosed", () => {
      setChatMessages(prev => [...prev, { sender: "bot", body: "This chat has been closed by our team. Thank you for contacting TechStop!" } as ChatMsg]);
    });
  }, []);

  async function startChatSession(name: string, email: string, orderRef?: string) {
    setChatStarting(true);
    try {
      const res = await fetch(`${API_URL}/support/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: name.trim(), guestEmail: email.trim() || undefined, orderRef: orderRef || undefined }),
      });
      const chat = await res.json();
      setChatId(chat.id);
      setChatStep("chat");
      setChatMessages([{ sender: "bot", body: `Hi ${name}! You're now connected to our support team. Please describe your issue and an agent will be with you shortly.` } as ChatMsg]);
      connectSocket(chat.id);
    } catch {
      alert("Could not start chat. Please try again.");
    } finally {
      setChatStarting(false);
    }
  }

  async function handleStartChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatName.trim()) return;
    await startChatSession(chatName, chatEmail, chatOrderRef);
  }

  function handleSendChat() {
    if (!chatInput.trim() || !chatId) return;
    socketRef.current?.emit("sendMessage", { chatId, sender: "customer", body: chatInput.trim() });
    setChatInput("");
  }

  // Search matches
  const matchedArticles = searchQuery.trim() 
    ? ARTICLES.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  function openOrdersModal() {
    setIsOrdersModalOpen(true);
    if (typeof window !== "undefined" && localStorage.getItem("ts_token")) {
      setLoadingOrders(true);
      ordersApi.myOrders()
        .then(setUserOrders)
        .catch(() => setUserOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  }

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    setDrawerType("article");
    setIsSearchFocused(false);
  };

  const handleOpenChat = () => {
    guardedOpen(() => {
      setChatMessages([]);
      setChatId(null);
      setChatOrderRef(undefined);
      socketRef.current?.disconnect();
      if (chatName.trim()) {
        setChatStep("chat");
        setDrawerType("chat");
        startChatSession(chatName, chatEmail, undefined);
      } else {
        setChatStep("form");
        setDrawerType("chat");
      }
    });
  };

  // Trigger Chat with prefilled Order ID context
  const handleSelectOrderForHelp = (order: Order) => {
    guardedOpen(() => {
      const ref = `#${order.id.slice(0, 8).toUpperCase()}`;
      setIsOrdersModalOpen(false);
      setChatMessages([]);
      setChatId(null);
      setChatOrderRef(ref);
      socketRef.current?.disconnect();
      if (chatName.trim()) {
        setChatStep("chat");
        setDrawerType("chat");
        startChatSession(chatName, chatEmail, ref);
      } else {
        setChatStep("form");
        setDrawerType("chat");
      }
    });
  };

  const scrollToCategories = () => {
    categoriesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const categories = [
    { 
      title: "Orders & Shipping", 
      icon: Truck, 
      desc: "Track delivery, edit address, check delays.", 
      links: [
        { label: "Track my active shipment", articleId: "track-order" },
        { label: "Modify or cancel an order", articleId: "change-order" },
        { label: "What to do if order is delayed", articleId: "order-delayed" }
      ]
    },
    { 
      title: "Returns & Refunds", 
      icon: RefreshCw, 
      desc: "Free 30-day return policy and label generation.", 
      links: [
        { label: "Our 30-day return policy", articleId: "return-policy" },
        { label: "Generate prepaid return label", articleId: "return-label" }
      ]
    },
    { 
      title: "Payments & Invoices", 
      icon: CreditCard, 
      desc: "Klarna, payment methods, VAT invoices.", 
      links: [
        { label: "Supported payment methods", articleId: "payment-methods" },
        { label: "How to download VAT invoice", articleId: "invoice" }
      ]
    },
    { 
      title: "Trade-In & Selling", 
      icon: Smartphone, 
      desc: "Get valuations, package safely, and get paid.", 
      links: [
        { label: "How and when do I get paid?", articleId: "trade-in-payment" },
        { label: "Package trade-in device safely", articleId: "shipping-trade-in" }
      ]
    },
    { 
      title: "Warranty & Coverage", 
      icon: ShieldCheck, 
      desc: "12-month hardware guarantee claims.", 
      links: [
        { label: "What does our warranty cover?", articleId: "warranty-coverage" },
        { label: "File a warranty repair claim", articleId: "claim-warranty" }
      ]
    },
    { 
      title: "Account & Privacy", 
      icon: Package, 
      desc: "Reset passwords, credentials, profile removal.", 
      links: [
        { label: "Reset my password", articleId: "reset-password" },
        { label: "Delete account & data", articleId: "delete-account" }
      ]
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-1">
        
        {/* Back Market Clean Search Hero Section */}
        <section className="bg-zinc-50 dark:bg-zinc-950/50 py-20 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            
            <h1 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6">
              How can we help?
            </h1>
            
            {/* Search Box */}
            <div className="relative max-w-2xl mx-auto shadow-sm z-30">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search our help center articles..."
                  className="w-full h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-accent dark:focus:border-accent px-14 text-sm md:text-base font-bold text-zinc-900 dark:text-white outline-none transition-all"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-accent transition-colors" />
                
                {searchQuery.trim() && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim() && (
                  <>
                    <div 
                      className="fixed inset-0 z-30 bg-transparent" 
                      onClick={() => setIsSearchFocused(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-3 text-left z-45 max-h-[300px] overflow-y-auto"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-3">
                        Matched Articles ({matchedArticles.length})
                      </p>
                      {matchedArticles.length > 0 ? (
                        <div className="space-y-1">
                          {matchedArticles.map((art) => (
                            <button
                              key={art.id}
                              onClick={() => handleOpenArticle(art)}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                            >
                              <div>
                                <p className="font-extrabold text-sm text-zinc-950 dark:text-white">{art.title}</p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{art.category}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-400" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-zinc-500 font-medium text-xs">
                          No matches found. Try searching "warranty" or "order".
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* Back Market Split Action Section (Help with order vs other) */}
        <section className="max-w-4xl mx-auto px-4 -mt-6 relative z-20">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Card A: Order Specific Support */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between items-start text-left">
              <div>
                <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white mb-4">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">I need help with an order</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
                  Track delivery, request return labels, cancel items, or contact the seller regarding an active purchase.
                </p>
              </div>
              <button
                onClick={openOrdersModal}
                className="w-full h-14 bg-black dark:bg-accent hover:bg-zinc-800 dark:hover:bg-accent-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Get help with an order <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Card B: General Support */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between items-start text-left">
              <div>
                <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white mb-4">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 dark:text-white mb-2">I need help with something else</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
                  Learn about trading in devices, our 12-month hardware warranty, payment financing, and managing your account profile.
                </p>
              </div>
              <button 
                onClick={scrollToCategories}
                className="w-full h-14 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-950 dark:hover:border-white text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center"
              >
                Browse FAQ categories
              </button>
            </div>

          </div>
        </section>

        {/* Minimalist Categories Grid (No Colored Cards) */}
        <section ref={categoriesRef} className="py-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-center text-zinc-900 dark:text-white mb-14">
            Browse all topics
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <motion.div 
                key={cat.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[2rem] p-8 hover:border-zinc-950 dark:hover:border-white transition-all hover:shadow-lg flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-white">{cat.title}</h3>
                    <cat.icon className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-zinc-400 dark:text-zinc-400 text-[11px] font-semibold mb-6">{cat.desc}</p>
                  
                  <div className="space-y-3.5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    {cat.links.map((link) => {
                      const linkedArticle = ARTICLES.find(a => a.id === link.articleId);
                      return (
                        <button
                          key={link.label}
                          onClick={() => linkedArticle && handleOpenArticle(linkedArticle)}
                          className="w-full flex items-center justify-between text-left group/link py-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover/link:underline">{link.label}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-400 group-hover/link:translate-x-0.5 transition-transform" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Popular Answers Accordion */}
        <section className="py-28 bg-zinc-50 dark:bg-zinc-950/50 border-y border-zinc-200/80 dark:border-zinc-800/80">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight mb-12 text-center text-zinc-900 dark:text-white">
              Popular Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "How does the standard 12-month hardware warranty work?",
                  a: "All TechStop purchases come with a 12-month hardware warranty. This covers display failures, motherboard issues, battery degradation under 80%, and port connection drops. Physical cracks or liquid immersion are excluded."
                },
                {
                  q: "What is your return process and timeline?",
                  a: "You can return any unit for a 100% refund within 30 days of receiving your package. We provide a prepaid postage label. Simply pack the item securely, print and attach the label, and drop it off at any Post Office."
                },
                {
                  q: "When and how do I receive trade-in payments?",
                  a: "After you ship your device and our technicians check it (within 24 hours of receipt), we release your funds immediately. Bank transfers typically clear in your account within 2 hours."
                }
              ].map((faq, idx) => (
                <div key={idx} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-sm text-zinc-950 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4 bg-zinc-50/50 dark:bg-zinc-950/30">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Call-to-Action Section */}
        <section className="py-28 bg-background">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-4">Still need help?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-10 max-w-md mx-auto">
              Reach out to our team in Leicester for fast live help.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <button
                onClick={handleOpenChat}
                className="h-16 px-8 bg-black dark:bg-accent hover:bg-zinc-800 dark:hover:bg-accent-dark text-white font-bold rounded-2xl flex items-center gap-3 transition-colors text-xs uppercase tracking-wider shadow-lg shadow-accent/15"
              >
                <MessageCircle className="h-4 w-4" />
                Start a Live Chat
              </button>
            </div>

            {/* Helpline Numbers */}
            {helplines.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-5">Or call us directly</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {helplines.map(h => (
                    <a
                      key={h.id}
                      href={`tel:${h.number.replace(/\s/g, "")}`}
                      className="flex items-center gap-3 h-14 px-6 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white bg-white dark:bg-zinc-900 transition-all group"
                    >
                      <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/35 transition-colors">
                        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h.label}</p>
                        <p className="text-sm font-bold text-zinc-950 dark:text-white font-mono">{h.number}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* 1. Active Orders Modal (Back Market Style) */}
      <AnimatePresence>
        {isOrdersModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrdersModalOpen(false)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl z-55 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Select an order</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold mt-1">Choose which order you need support with.</p>
                </div>
                <button 
                  onClick={() => setIsOrdersModalOpen(false)}
                  className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {loadingOrders ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ))}
                  </div>
                ) : !localStorage.getItem("ts_token") ? (
                  <div className="py-10 text-center">
                    <Package className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Sign in to see your orders</p>
                    <p className="text-xs text-zinc-400 mt-1">Log in to your account to get order-specific support.</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="py-10 text-center">
                    <Package className="h-10 w-10 text-zinc-200 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">No orders found</p>
                    <p className="text-xs text-zinc-400 mt-1">You haven't placed any orders yet.</p>
                  </div>
                ) : (
                  userOrders.map((order) => {
                    const firstName = order.items[0]?.product.name ?? "Order";
                    const displayName = order.items.length > 1
                      ? `${firstName} + ${order.items.length - 1} more`
                      : firstName;
                    const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
                    const statusLabel = STATUS_LABELS[order.status] ?? order.status;
                    const purchaseDate = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                    const isActive = ["PENDING", "CONFIRMED", "SHIPPED"].includes(order.status);
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrderForHelp(order)}
                        className="w-full flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white rounded-2xl transition-all text-left bg-white dark:bg-zinc-900 group"
                      >
                        <div className="flex gap-4 items-center min-w-0">
                          <div className="h-12 w-12 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
                            <Package className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{displayName}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                              Order {shortId} · {purchaseDate}
                            </p>
                            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              isActive ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                            }`}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-5 text-center">
                <p className="text-[10px] font-semibold text-zinc-400">
                  Don't see your order here? Make sure you are logged into the correct account.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Slide-Out Support Drawer Panel */}
      <AnimatePresence>
        {drawerType && (
          <>
            {/* Backdrop filter overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerType(null)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />

            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-zinc-900 shadow-2xl z-55 flex flex-col border-l border-zinc-200 dark:border-zinc-800"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-black dark:bg-accent text-white rounded-xl flex items-center justify-center">
                    {drawerType === "article" && <HelpCircle className="h-4.5 w-4.5 text-white" />}
                    {drawerType === "chat" && <MessageCircle className="h-4.5 w-4.5 text-white" />}
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                      {drawerType === "article" && "Help Guide"}
                      {drawerType === "chat" && "Support Chat"}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                      {drawerType === "article" && selectedArticle?.category}
                      {drawerType === "chat" && "Live Support"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setDrawerType(null)}
                  className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 text-left">
                
                {/* 1. Article View */}
                {drawerType === "article" && selectedArticle && (
                  <div className="prose prose-zinc max-w-none">
                    <h2 className="font-sans text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-6">
                      {selectedArticle.title}
                    </h2>
                    <div className="text-zinc-650 dark:text-zinc-300 text-xs md:text-sm font-semibold leading-relaxed space-y-4 whitespace-pre-line border-t border-zinc-100 dark:border-zinc-800 pt-6">
                      {selectedArticle.content.split("\n\n").map((para, i) => {
                        // Bold tags conversion logic
                        if (para.includes("**")) {
                           const parts = para.split("**");
                           return (
                             <p key={i}>
                               {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="text-zinc-950 dark:text-white font-black">{p}</strong> : p)}
                             </p>
                           );
                        }
                        return <p key={i}>{para}</p>;
                      })}
                    </div>
                    
                    <div className="mt-12 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150/40 dark:border-zinc-800/40 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-zinc-900 dark:text-white">Was this helpful?</p>
                        <p className="text-[10px] text-zinc-400 font-medium">94% of users found this helpful</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white rounded-lg text-xs font-bold transition-all bg-white dark:bg-zinc-800 text-foreground">Yes</button>
                        <button className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white rounded-lg text-xs font-bold transition-all bg-white dark:bg-zinc-800 text-foreground">No</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Real Live Chat */}
                {drawerType === "chat" && (
                  <div className="flex flex-col h-full">

                    {/* Step 1: Name/Email form */}
                    {chatStep === "form" && (
                      <form onSubmit={handleStartChat} className="space-y-4 max-w-sm mx-auto pt-4">
                        <div className="text-center mb-6">
                          <div className="h-14 w-14 rounded-2xl bg-zinc-950 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                            <MessageCircle className="h-6 w-6 text-accent" />
                          </div>
                          <h3 className="font-bold text-zinc-950 dark:text-white text-lg">Start a live chat</h3>
                          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Our team typically responds within 3 minutes.</p>
                        </div>
                        {chatOrderRef && (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-705">
                            <Package className="h-4 w-4 text-zinc-500 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Order Reference</p>
                              <p className="text-sm font-bold text-zinc-900 dark:text-white">{chatOrderRef}</p>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">Your name *</label>
                          <input
                            value={chatName}
                            onChange={e => setChatName(e.target.value)}
                            placeholder="e.g. Sarah"
                            required
                            className="w-full h-11 px-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 focus:border-accent dark:focus:border-accent bg-white dark:bg-zinc-800 text-foreground outline-none text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">Email <span className="text-zinc-400 font-normal">(optional)</span></label>
                          <input
                            value={chatEmail}
                            onChange={e => setChatEmail(e.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            className="w-full h-11 px-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 focus:border-accent dark:focus:border-accent bg-white dark:bg-zinc-800 text-foreground outline-none text-sm transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={chatStarting || !chatName.trim()}
                          className="w-full h-12 bg-accent text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-dark transition-colors disabled:opacity-50"
                        >
                          {chatStarting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Connecting…</> : <>Start Chat <ArrowRight className="h-4 w-4" /></>}
                        </button>
                      </form>
                    )}

                    {/* Step 2: Live chat messages */}
                    {chatStep === "chat" && (
                      <>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                          <Circle className={`h-2 w-2 ${chatConnected ? "fill-emerald-500 text-emerald-500" : "fill-zinc-300 text-zinc-350"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {chatConnected ? "Connected · Agent will respond shortly" : "Connecting…"}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                          {chatMessages.map((msg, i) => {
                            const isCustomer = msg.sender === "customer";
                            const body = msg.body ?? msg.text ?? "";
                            return (
                              <div key={msg.id ?? i} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                                <div className={`flex gap-3 max-w-[85%] ${isCustomer ? "flex-row-reverse" : "flex-row"}`}>
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${isCustomer ? "bg-zinc-850 dark:bg-zinc-700 text-white" : "bg-accent text-white"}`}>
                                    {isCustomer ? <User className="h-4 w-4" /> : "TS"}
                                  </div>
                                  <div className={`p-4 rounded-2xl text-xs md:text-sm font-semibold leading-relaxed ${isCustomer ? "bg-black dark:bg-zinc-800 text-white rounded-tr-none" : "bg-zinc-100 dark:bg-zinc-950/60 text-zinc-900 dark:text-zinc-150 rounded-tl-none border border-transparent dark:border-zinc-850/50"}`}>
                                    {body}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSendChat()}
                            placeholder="Type a message…"
                            className="flex-1 h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-4 text-xs font-bold text-zinc-800 dark:text-zinc-200 rounded-xl outline-none focus:bg-white focus:dark:bg-zinc-900 focus:border-accent focus:dark:border-accent transition-all"
                          />
                          <button
                            onClick={handleSendChat}
                            disabled={!chatInput.trim()}
                            className="h-12 w-12 bg-accent hover:bg-accent-dark text-white rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Missing profile details modal */}
      {missingDetailsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMissingDetailsOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 text-left">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-950 dark:text-white">Complete your profile first</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">We need a few more details before you can start a chat.</p>
              </div>
              <button onClick={() => setMissingDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors ml-4 mt-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {missingFields.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {f} is missing
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setMissingDetailsOpen(false);
                router.push("/account/settings");
              }}
              className="w-full h-11 bg-black dark:bg-accent text-white rounded-xl text-sm font-black hover:bg-zinc-800 dark:hover:bg-accent-dark transition-colors"
            >
              Go to Account Settings →
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
