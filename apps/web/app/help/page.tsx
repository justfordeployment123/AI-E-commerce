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
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function HelpPage() {
  const categories = [
    { title: "Orders & Shipping", icon: Truck, desc: "Track, change, or cancel your orders." },
    { title: "Returns & Refunds", icon: RefreshCw, desc: "Our 30-day return policy explained." },
    { title: "Payments & Invoices", icon: CreditCard, desc: "Payment methods and billing info." },
    { title: "Selling Your Tech", icon: Smartphone, desc: "How to trade in and get paid." },
    { title: "Warranty & Repair", icon: ShieldCheck, desc: "12-month coverage and claims." },
    { title: "Account & Security", icon: Package, desc: "Manage your profile and data." },
  ];

  const faqs = [
    "How do I track my order?",
    "What is the Markhor Market warranty?",
    "Can I return a device if I don't like it?",
    "How long does it take to get paid for a trade-in?",
    "What comes in the box with my device?",
    "Are the batteries tested?"
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Search Hero */}
        <section className="bg-zinc-950 text-white py-24 md:py-40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-white/5 blur-[100px] rounded-full" />
          
          <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-5xl md:text-7xl font-medium mb-10 tracking-tight"
            >
              How can we <br/>
              <span className="text-zinc-500 italic">help you today?</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <input 
                type="text" 
                placeholder="Search for articles, orders, or topics..."
                className="w-full h-20 rounded-[1.5rem] bg-zinc-900 border border-zinc-800 px-16 text-lg focus:ring-4 focus:ring-accent/20 outline-none transition-all focus:bg-zinc-800"
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-500 group-focus-within:text-accent transition-colors" />
              <button className="absolute right-4 top-4 bottom-4 bg-accent text-black rounded-[1.25rem] px-8 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                Search
              </button>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <motion.div 
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-2xl hover:border-transparent group cursor-pointer"
              >
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  <cat.icon className="h-7 w-7 text-black" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-6">{cat.desc}</p>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors">
                  View Articles
                  <ChevronRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Popular FAQs */}
        <section className="py-24 bg-zinc-50 border-y border-zinc-100">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="font-serif text-4xl font-medium mb-12 text-center">Popular Questions</h2>
            <div className="grid gap-4">
              {faqs.map((faq) => (
                <button key={faq} className="w-full flex items-center justify-between p-8 rounded-[2rem] bg-white border border-zinc-100 hover:border-zinc-200 transition-all text-left group">
                  <span className="text-base font-bold text-zinc-800 group-hover:text-black">{faq}</span>
                  <div className="h-8 w-8 rounded-full bg-zinc-50 flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button className="text-sm font-bold border-b-2 border-accent pb-1 hover:border-black transition-colors">See all FAQ articles</button>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[4rem] bg-black text-white p-12 md:p-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/20 blur-[150px] rounded-full" />
              
              <div className="grid lg:grid-cols-2 gap-16 relative z-10 items-center">
                <div>
                  <h2 className="font-serif text-4xl md:text-6xl font-medium mb-8 leading-tight">Still need help?</h2>
                  <p className="text-xl text-zinc-400 font-medium leading-relaxed mb-12">
                    Our team of tech experts is available 24/7 to assist you with anything you need.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-3 bg-accent text-black px-8 py-5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95">
                      <MessageCircle className="h-5 w-5" />
                      Live Chat
                    </button>
                    <button className="flex items-center gap-3 bg-zinc-800 text-white px-8 py-5 rounded-2xl font-bold transition-all hover:bg-zinc-700">
                      <Mail className="h-5 w-5" />
                      Email Us
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-end gap-2">
                    <div className="text-3xl font-bold">98%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Satisfaction Rate</div>
                  </div>
                  <div className="aspect-square rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-end gap-2">
                    <div className="text-3xl font-bold">&lt; 5m</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Response Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
