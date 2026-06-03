"use client";

import { 
  Smartphone, 
  DollarSign, 
  ArrowRight,
  Package,
  CreditCard,
  Zap,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  Leaf
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section (Back Market Mood Amber) */}
        <section className="relative bg-mood-amber py-24 md:py-32 overflow-hidden border-b border-zinc-100">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/40 blur-[150px] rounded-full translate-x-1/2" />
          
          <div className="mx-auto max-w-7xl px-4 relative z-10 text-center lg:text-left">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest mb-8"
                >
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  Instant Cash Offer
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-sans text-5xl md:text-8xl font-extrabold mb-8 leading-[0.9] tracking-tighter"
                >
                  Old tech? <br/>
                  <span>New money.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-zinc-500 dark:text-zinc-400 mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed font-semibold"
                >
                  Trade in your device in 2 minutes. Get a prepaid shipping label and get paid directly to your bank account.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative max-w-xl mx-auto lg:mx-0"
                >
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Search your device..."
                      className="w-full h-20 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-accent px-8 text-lg outline-none transition-all shadow-xl"
                    />
                    <button className="absolute right-3 top-3 bottom-3 bg-accent text-white rounded-[1.25rem] px-8 font-bold flex items-center gap-2 transition-all hover:scale-[1.02] hover:bg-accent-dark active:scale-[0.98]">
                      Search
                      <ArrowRight className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative hidden lg:block"
              >
                 <div className="relative aspect-square w-full max-w-md mx-auto">
                    <div className="absolute inset-0 bg-background dark:bg-zinc-900 rounded-[4rem] rotate-6 shadow-2xl border border-border/40" />
                    <div className="relative h-full w-full p-12 flex flex-col justify-center items-center text-center">
                       <div className="h-24 w-24 bg-accent text-white rounded-3xl flex items-center justify-center mb-8 rotate-12 shadow-lg shadow-accent/20">
                         <DollarSign className="h-12 w-12" />
                       </div>
                       <h4 className="text-2xl font-sans font-extrabold mb-4 text-foreground">Paid to sellers</h4>
                       <p className="text-5xl font-bold tracking-tighter text-foreground">£1.2M+</p>
                       <p className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-400">This month alone</p>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* The Steps (Back Market playful style) */}
        <section className="py-32 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
            <div className="max-w-xl">
              <h2 className="font-sans text-5xl md:text-7xl font-extrabold leading-tight">Three steps. <br/>That's it.</h2>
            </div>
            <p className="text-xl text-zinc-400 font-medium">No hidden fees. No stress.</p>
          </div>
          
          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                title: "Get your price",
                text: "Tell us about your device. We'll give you the best market offer instantly.",
                icon: Search,
                mood: "bg-mood-sky"
              },
              {
                title: "Ship for free",
                text: "Pack it up with our free kit and drop it off. We handle the rest.",
                icon: Package,
                mood: "bg-mood-rose"
              },
              {
                title: "Get paid",
                text: "Money hits your account within 48 hours of verification. Simple.",
                icon: CreditCard,
                mood: "bg-mood-emerald"
              }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className={`aspect-[4/5] rounded-[3rem] ${item.mood} text-zinc-950 dark:text-white dark:bg-zinc-900/40 p-10 flex flex-col justify-between transition-transform group-hover:-translate-y-2 border border-transparent dark:border-border/30`}>
                   <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                     <item.icon className="h-8 w-8 text-zinc-950 dark:text-white" strokeWidth={1.5} />
                   </div>
                   <div>
                     <span className="text-6xl font-sans font-black text-black/10 dark:text-white/10 block mb-4">0{index + 1}</span>
                     <h3 className="text-3xl font-sans font-extrabold mb-4">{item.title}</h3>
                     <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">{item.text}</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison Section (Back Market quirkiness) */}
        <section className="py-32 bg-zinc-950 text-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
               <div>
                  <h2 className="font-sans text-5xl md:text-7xl font-extrabold mb-12">Better for you. <br/><span className="text-accent">Better for Earth.</span></h2>
                  <div className="space-y-8">
                     {[
                       { title: "Top Dollar Guaranteed", text: "We compare prices so you don't have to.", icon: ShieldCheck },
                       { title: "Circular Economy", text: "Prevent e-waste by giving tech a second life.", icon: Leaf },
                       { title: "Secure & Fast", text: "Encrypted data wipes and 48h payments.", icon: Zap }
                     ].map((item, i) => (
                       <div key={i} className="flex gap-6 group">
                          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-white transition-all">
                             <item.icon className="h-6 w-6" />
                          </div>
                          <div>
                             <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                             <p className="text-zinc-400 font-medium">{item.text}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="relative">
                  <div className="aspect-square rounded-[4rem] bg-accent/10 border border-white/5 p-12 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
                     <div className="relative z-10 h-full flex flex-col justify-center">
                        <div className="bg-background text-foreground p-8 rounded-[2.5rem] shadow-2xl rotate-3 border border-border">
                           <div className="flex items-center gap-4 mb-6">
                              <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                 <CheckCircle2 className="h-6 w-6" />
                              </div>
                              <span className="font-bold uppercase tracking-widest text-[10px] text-zinc-400 font-sans">Payment Confirmed</span>
                           </div>
                           <p className="text-4xl font-sans font-extrabold mb-2 text-foreground">£429.00</p>
                           <p className="text-sm font-medium text-zinc-500">Sent to bank account ****4242</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 bg-background text-center">
           <div className="mx-auto max-w-4xl px-4">
              <h2 className="font-sans text-5xl md:text-8xl font-extrabold mb-12">Ready to cash in?</h2>
              <a href="/trade-in" className="inline-flex items-center h-20 px-16 bg-accent text-white rounded-[2rem] font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/20">
                 Start Trade-In Now
              </a>
              <p className="mt-8 text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px]">Over 100,000 devices traded this year</p>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
