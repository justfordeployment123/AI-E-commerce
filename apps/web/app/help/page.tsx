"use client";

import { 
  Search, 
  Package, 
  CreditCard, 
  RefreshCw, 
  ShieldCheck, 
  Truck, 
  Smartphone,
  ChevronRight,
  MessageCircle,
  Mail,
  ArrowRight,
  Zap,
  Info,
  X,
  Send,
  HelpCircle,
  User,
  CheckCircle2,
  Clock,
  ChevronDown,
  ExternalLink,
  Laptop
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
}

interface MockOrder {
  id: string;
  item: string;
  status: string;
  date: string;
  type: "phone" | "console" | "audio";
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

const MOCK_ORDERS: MockOrder[] = [
  { id: "TS-9428", item: "iPhone 15 Pro (128GB, Space Black)", status: "In Transit (Leicester Hub)", date: "18 May 2026", type: "phone" },
  { id: "TS-8511", item: "PlayStation 5 Console (Slim Digital Edition)", status: "Delivered 12 days ago", date: "08 May 2026", type: "console" },
  { id: "TS-7204", item: "AirPods Pro 2nd Gen (USB-C)", status: "Delivered 24 days ago", date: "26 April 2026", type: "audio" }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [drawerType, setDrawerType] = useState<"article" | "chat" | "ticket" | null>(null);
  
  // Modals / Dropdown States
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Chat Simulation State
  const [chatMessages, setChatMessages] = useState<{ sender: "bot" | "user"; text: string }[]>([
    { sender: "bot", text: "Hi there! I'm TechStop's virtual assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ticket Form State
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketOrder, setTicketOrder] = useState("");
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isBotTyping]);

  // Search matches
  const matchedArticles = searchQuery.trim() 
    ? ARTICLES.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        art.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    setDrawerType("article");
    setIsSearchFocused(false);
  };

  const handleOpenChat = () => {
    setDrawerType("chat");
    setChatMessages([
      { sender: "bot", text: "Hi there! I'm TechStop's virtual assistant. How can I help you today?" }
    ]);
  };

  const handleOpenTicket = () => {
    setDrawerType("ticket");
    setTicketSubmitted(false);
    setTicketName("");
    setTicketEmail("");
    setTicketOrder("");
    setTicketMsg("");
  };

  // Trigger Chat with prefilled Order ID context
  const handleSelectOrderForHelp = (order: MockOrder) => {
    setIsOrdersModalOpen(false);
    setDrawerType("chat");
    setChatMessages([
      { sender: "bot", text: `I see you need help with Order ${order.id} (${order.item}).` },
      { sender: "bot", text: `Current Status: ${order.status}. How can I assist you with this shipment?` }
    ]);
  };

  // Bot responses simulator
  const handleSendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      let botText = "I didn't quite catch that. Would you like to log a ticket with our support desk?";
      
      const lower = userMsg.toLowerCase();
      if (lower.includes("track") || lower.includes("where") || lower.includes("order")) {
        botText = "To track your order, please reply with your Order ID (starts with 'TS-'). Our active courier partners are Royal Mail and DPD.";
      } else if (lower.startsWith("ts-")) {
        botText = `Order ${userMsg.toUpperCase()} is currently in transit. It has been processed through our Leicester Hub and is scheduled for delivery tomorrow before 2 PM.`;
      } else if (lower.includes("return") || lower.includes("refund")) {
        botText = "We offer a 30-day hassle-free return window. I can load your prepaid return shipping label request. Would you like me to guide you to the returns page?";
      } else if (lower.includes("warranty")) {
        botText = "All TechStop purchases come with our standard 12-Month Hardware Warranty covering screen defects, battery issues, and electronics components failures.";
      } else if (lower.includes("human") || lower.includes("agent") || lower.includes("live") || lower.includes("chat")) {
        botText = "Connecting you to our Leicester support desk... Our average response is under 3 minutes. Please describe your query, and our agent will jump right in.";
      }
      
      setChatMessages(prev => [...prev, { sender: "bot", text: botText }]);
    }, 1200);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
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
    <div className="flex min-h-screen flex-col bg-white text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      <main className="flex-1">
        
        {/* Back Market Clean Search Hero Section */}
        <section className="bg-zinc-50 py-20 border-b border-zinc-200/80">
          <div className="mx-auto max-w-4xl px-4 text-center">
            
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6">
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
                  className="w-full h-16 rounded-2xl bg-white border border-zinc-300 focus:border-zinc-950 px-14 text-sm md:text-base font-bold text-zinc-900 outline-none transition-all"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
                
                {searchQuery.trim() && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400"
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
                      className="absolute left-0 right-0 mt-2 bg-white border border-zinc-250 rounded-2xl shadow-xl p-3 text-left z-45 max-h-[300px] overflow-y-auto"
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
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors text-left"
                            >
                              <div>
                                <p className="font-extrabold text-sm text-zinc-950">{art.title}</p>
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
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between items-start text-left">
              <div>
                <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-900 mb-4">
                  <Package className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-2">I need help with an order</h3>
                <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-6">
                  Track delivery, request return labels, cancel items, or contact the seller regarding an active purchase.
                </p>
              </div>
              <button 
                onClick={() => setIsOrdersModalOpen(true)}
                className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Get help with an order <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Card B: General Support */}
            <div className="bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between items-start text-left">
              <div>
                <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-900 mb-4">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-2">I need help with something else</h3>
                <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-6">
                  Learn about trading in devices, our 12-month hardware warranty, payment financing, and managing your account profile.
                </p>
              </div>
              <button 
                onClick={scrollToCategories}
                className="w-full h-14 border border-zinc-300 hover:border-zinc-950 text-zinc-950 hover:bg-zinc-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center"
              >
                Browse FAQ categories
              </button>
            </div>

          </div>
        </section>

        {/* Minimalist Categories Grid (No Colored Cards) */}
        <section ref={categoriesRef} className="py-28 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-center text-zinc-900 mb-14">
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
                className="bg-white border border-zinc-200/80 rounded-[2rem] p-8 hover:border-zinc-950 transition-all hover:shadow-lg flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-zinc-950">{cat.title}</h3>
                    <cat.icon className="h-5 w-5 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-zinc-400 text-[11px] font-semibold mb-6">{cat.desc}</p>
                  
                  <div className="space-y-3.5 border-t border-zinc-100 pt-4">
                    {cat.links.map((link) => {
                      const linkedArticle = ARTICLES.find(a => a.id === link.articleId);
                      return (
                        <button
                          key={link.label}
                          onClick={() => linkedArticle && handleOpenArticle(linkedArticle)}
                          className="w-full flex items-center justify-between text-left group/link py-1 hover:text-zinc-600 transition-colors"
                        >
                          <span className="text-xs font-bold text-zinc-800 group-hover/link:underline">{link.label}</span>
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
        <section className="py-28 bg-zinc-50 border-y border-zinc-200/80">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-12 text-center text-zinc-900">
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
                <div key={idx} className="border border-zinc-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-sm text-zinc-950 hover:bg-zinc-50 transition-colors"
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
                        <div className="px-6 pb-6 text-xs text-zinc-500 font-semibold leading-relaxed border-t border-zinc-100 pt-4 bg-zinc-50/50">
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
        <section className="py-28 bg-white">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-zinc-950 mb-4">Still need help?</h2>
            <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-10 max-w-md mx-auto">
              If you couldn't find your answer, reach out to our team in Leicester for fast live help.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button 
                onClick={handleOpenChat}
                className="h-16 px-8 bg-black hover:bg-zinc-800 text-white font-bold rounded-2xl flex items-center gap-3 transition-colors text-xs uppercase tracking-wider"
              >
                <MessageCircle className="h-4.5 w-4.5" />
                Start a Live Chat
              </button>
              <button 
                onClick={handleOpenTicket}
                className="h-16 px-8 border-2 border-zinc-200 hover:border-zinc-950 text-zinc-950 hover:bg-zinc-50 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider"
              >
                <Mail className="h-4.5 w-4.5 mr-1" />
                Submit a Support Ticket
              </button>
            </div>
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border border-zinc-200 rounded-[2rem] p-8 shadow-2xl z-55 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Select an order</h3>
                  <p className="text-zinc-500 text-[11px] font-semibold mt-1">Choose which order you need support with.</p>
                </div>
                <button 
                  onClick={() => setIsOrdersModalOpen(false)}
                  className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-950"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {MOCK_ORDERS.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrderForHelp(order)}
                    className="w-full flex items-center justify-between p-4 border border-zinc-200 hover:border-zinc-950 rounded-2xl transition-all text-left bg-white group"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="h-12 w-12 bg-zinc-50 border border-zinc-150 rounded-xl flex items-center justify-center text-zinc-900 shrink-0">
                        {order.type === "phone" && <Smartphone className="h-5 w-5" />}
                        {order.type === "console" && <Laptop className="h-5 w-5" />}
                        {order.type === "audio" && <CreditCard className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-900">{order.item}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Order ID: {order.id} · Purchased {order.date}</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>

              <div className="mt-8 border-t border-zinc-100 pt-6 text-center">
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-zinc-200"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center">
                    {drawerType === "article" && <HelpCircle className="h-4.5 w-4.5 text-accent" />}
                    {drawerType === "chat" && <MessageCircle className="h-4.5 w-4.5 text-accent" />}
                    {drawerType === "ticket" && <Mail className="h-4.5 w-4.5 text-accent" />}
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-zinc-900 leading-tight">
                      {drawerType === "article" && "Help Guide"}
                      {drawerType === "chat" && "Support Chat"}
                      {drawerType === "ticket" && "Send a Ticket"}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                      {drawerType === "article" && selectedArticle?.category}
                      {drawerType === "chat" && "Simulated Assistant"}
                      {drawerType === "ticket" && "Leicester Desk Support"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setDrawerType(null)}
                  className="h-8 w-8 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 text-left">
                
                {/* 1. Article View */}
                {drawerType === "article" && selectedArticle && (
                  <div className="prose prose-zinc max-w-none">
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-zinc-950 mb-6">
                      {selectedArticle.title}
                    </h2>
                    <div className="text-zinc-650 text-xs md:text-sm font-semibold leading-relaxed space-y-4 whitespace-pre-line border-t border-zinc-100 pt-6">
                      {selectedArticle.content.split("\n\n").map((para, i) => {
                        // Bold tags conversion logic
                        if (para.includes("**")) {
                          const parts = para.split("**");
                          return (
                            <p key={i}>
                              {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} className="text-zinc-950 font-black">{p}</strong> : p)}
                            </p>
                          );
                        }
                        return <p key={i}>{para}</p>;
                      })}
                    </div>
                    
                    <div className="mt-12 p-5 rounded-2xl bg-zinc-50 border border-zinc-150/40 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-zinc-900">Was this helpful?</p>
                        <p className="text-[10px] text-zinc-400 font-medium">94% of users found this helpful</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 border border-zinc-200 hover:border-zinc-900 rounded-lg text-xs font-bold transition-all bg-white">Yes</button>
                        <button className="px-4 py-2 border border-zinc-200 hover:border-zinc-900 rounded-lg text-xs font-bold transition-all bg-white">No</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Interactive Chat Simulator */}
                {drawerType === "chat" && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                      {chatMessages.map((msg, i) => (
                        <div 
                          key={i} 
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${msg.sender === "user" ? "bg-zinc-800 text-white" : "bg-mood-emerald text-zinc-950"}`}>
                              {msg.sender === "user" ? <User className="h-4 w-4" /> : "TS"}
                            </div>
                            <div className={`p-4 rounded-2xl text-xs md:text-sm font-semibold leading-relaxed ${msg.sender === "user" ? "bg-black text-white rounded-tr-none" : "bg-zinc-100 text-zinc-900 rounded-tl-none"}`}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isBotTyping && (
                        <div className="flex justify-start">
                          <div className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-mood-emerald text-zinc-950 flex items-center justify-center text-xs font-black">
                              TS
                            </div>
                            <div className="p-4 bg-zinc-100 text-zinc-400 rounded-2xl rounded-tl-none text-xs font-bold flex gap-1 items-center">
                              <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce" />
                              <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat quick pills */}
                    <div className="py-3 flex flex-wrap gap-1.5 border-t border-zinc-100">
                      {[
                        "Track TS-9428",
                        "Warranty cover details",
                        "Connect with live agent"
                      ].map((pill) => (
                        <button
                          key={pill}
                          onClick={() => handleSendChatMessage(pill)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-[10px] font-bold text-zinc-700 rounded-lg transition-colors"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input form */}
                    <div className="pt-3 border-t border-zinc-100 flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage(chatInput)}
                        placeholder="Type a message or order number..."
                        className="flex-1 h-12 bg-zinc-50 border border-zinc-200 px-4 text-xs font-bold text-zinc-800 rounded-xl outline-none focus:bg-white focus:border-black transition-all"
                      />
                      <button 
                        onClick={() => handleSendChatMessage(chatInput)}
                        className="h-12 w-12 bg-black hover:bg-zinc-800 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Slide-out Email Ticket Form */}
                {drawerType === "ticket" && (
                  <div className="h-full">
                    {!ticketSubmitted ? (
                      <form onSubmit={handleTicketSubmit} className="space-y-4">
                        <h2 className="font-serif text-2xl font-bold tracking-tight text-zinc-950 mb-2">
                          Submit Support Request
                        </h2>
                        <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-6">
                          Send us your inquiry and our support representatives in Leicester will respond within 3 minutes.
                        </p>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Your Name</label>
                          <input 
                            type="text"
                            required
                            value={ticketName}
                            onChange={(e) => setTicketName(e.target.value)}
                            placeholder="E.g. Alex Turner"
                            className="h-12 bg-zinc-50 border border-zinc-200 px-4 text-xs font-bold text-zinc-800 rounded-xl outline-none focus:bg-white focus:border-black transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Email Address</label>
                          <input 
                            type="email"
                            required
                            value={ticketEmail}
                            onChange={(e) => setTicketEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="h-12 bg-zinc-50 border border-zinc-200 px-4 text-xs font-bold text-zinc-800 rounded-xl outline-none focus:bg-white focus:border-black transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Order ID (optional)</label>
                          <input 
                            type="text"
                            value={ticketOrder}
                            onChange={(e) => setTicketOrder(e.target.value)}
                            placeholder="E.g. TS-92841"
                            className="h-12 bg-zinc-50 border border-zinc-200 px-4 text-xs font-bold text-zinc-800 rounded-xl outline-none focus:bg-white focus:border-black transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Describe your inquiry</label>
                          <textarea 
                            required
                            value={ticketMsg}
                            onChange={(e) => setTicketMsg(e.target.value)}
                            placeholder="Please provide details about your order, returns request, or warranty fault..."
                            rows={5}
                            className="w-full bg-zinc-50 border border-zinc-200 p-4 text-xs font-bold text-zinc-800 rounded-xl outline-none focus:bg-white focus:border-black transition-all resize-none"
                          />
                        </div>

                        <div className="pt-4">
                          <button 
                            type="submit"
                            className="w-full h-14 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                          >
                            Submit Ticket <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-12 flex flex-col items-center justify-center h-full"
                      >
                        <div className="h-20 w-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center text-emerald-500 mb-6">
                          <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <h2 className="font-serif text-3xl font-bold tracking-tight text-zinc-950 mb-3">
                          Ticket Logged!
                        </h2>
                        <p className="text-zinc-500 text-xs font-semibold max-w-sm mx-auto leading-relaxed mb-8">
                          Thank you, <strong className="text-zinc-950">{ticketName}</strong>. Your support ticket has been registered under ticket number <strong className="text-zinc-950">#TS-94812</strong>.
                        </p>
                        
                        <div className="w-full rounded-2xl bg-zinc-50 border border-zinc-150/40 p-5 mb-8 text-left text-xs font-semibold text-zinc-650 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Receipt Speed</span>
                            <span className="text-zinc-950 font-bold">~3 minutes queue</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">Notification</span>
                            <span className="text-zinc-950 font-bold">SMS & email dispatch alert</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setDrawerType(null)}
                          className="h-14 px-8 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
                        >
                          Close Panel
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}
