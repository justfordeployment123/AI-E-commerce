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
  Info
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function HelpPage() {
  const categories = [
    { title: "Orders", icon: Truck, desc: "Track, change, or cancel.", mood: "bg-mood-sky" },
    { title: "Returns", icon: RefreshCw, desc: "30-day policy explained.", mood: "bg-mood-rose" },
    { title: "Payments", icon: CreditCard, desc: "Methods and billing info.", mood: "bg-mood-amber" },
    { title: "Selling", icon: Smartphone, desc: "Trade in and get paid.", mood: "bg-mood-emerald" },
    { title: "Warranty", icon: ShieldCheck, desc: "12-month coverage.", mood: "bg-mood-violet" },
    { title: "Account", icon: Package, desc: "Manage your profile.", mood: "bg-mood-sky" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      <main className="flex-1">
        {/* Search Hero (Back Market Mood Sky) */}
        <section className="bg-mood-sky py-24 md:py-32 overflow-hidden border-b border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 relative z-10 text-center lg:text-left">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest mb-8"
                >
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  24/7 Expert Support
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-serif text-5xl md:text-8xl font-medium mb-8 leading-[0.9] tracking-tighter"
                >
                  How can we <br/>
                  <span className="italic">help you?</span>
                </motion.h1>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative max-w-xl mx-auto lg:mx-0 shadow-2xl"
                >
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Search for answers..."
                      className="w-full h-20 rounded-[1.5rem] bg-white border-2 border-transparent focus:border-black px-16 text-lg outline-none transition-all"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-zinc-300 group-focus-within:text-black transition-colors" />
                    <button className="absolute right-3 top-3 bottom-3 bg-black text-white rounded-[1.25rem] px-8 font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      Search
                    </button>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:block"
              >
                 <div className="aspect-square bg-white rounded-[4rem] p-12 rotate-6 shadow-2xl flex flex-col justify-center text-center">
                    <div className="h-20 w-20 rounded-3xl bg-mood-emerald flex items-center justify-center mx-auto mb-8 -rotate-12">
                       <MessageCircle className="h-10 w-10 text-black" />
                    </div>
                    <h3 className="text-3xl font-serif font-medium mb-4">Average response</h3>
                    <p className="text-6xl font-bold tracking-tighter">4m 32s</p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Our team is live now</p>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories Rail (Back Market Mood style) */}
        <section className="py-32 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <motion.div 
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative cursor-pointer"
              >
                <div className={`aspect-[4/3] rounded-[3rem] ${cat.mood} p-10 flex flex-col justify-between transition-transform group-hover:-translate-y-2`}>
                   <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                     <cat.icon className="h-7 w-7 text-black" strokeWidth={1.5} />
                   </div>
                   <div>
                     <h3 className="text-3xl font-serif font-medium mb-2">{cat.title}</h3>
                     <p className="text-black/60 font-medium">{cat.desc}</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 bg-zinc-50 border-y border-zinc-100">
           <div className="mx-auto max-w-4xl px-4">
              <h2 className="font-serif text-5xl md:text-7xl font-medium mb-16 text-center">Popular answers.</h2>
              <div className="space-y-4">
                {[
                  "Where is my order?",
                  "TechStop Leicester 2-year warranty",
                  "Return policy: 30 days no questions",
                  "How to trade in my old iPhone",
                  "Verified expert certification guide"
                ].map((q) => (
                  <button key={q} className="w-full flex items-center justify-between p-8 rounded-[2.5rem] bg-white border border-zinc-100 hover:border-black transition-all group">
                    <span className="text-xl font-bold group-hover:text-zinc-600 transition-colors">{q}</span>
                    <div className="h-10 w-10 rounded-full bg-zinc-50 flex items-center justify-center transition-transform group-hover:translate-x-2">
                       <ChevronRight className="h-5 w-5 text-zinc-400" />
                    </div>
                  </button>
                ))}
              </div>
           </div>
        </section>

        {/* CTA Contact */}
        <section className="py-32 bg-black text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/20 blur-[100px] rounded-full" />
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-24 items-center">
                 <div>
                    <h2 className="font-serif text-5xl md:text-8xl font-medium mb-8 leading-tight">Human <br/>support.</h2>
                    <p className="text-xl text-zinc-400 mb-12 max-w-md font-medium">Real people, really fast. We're here for you whenever you need a hand.</p>
                    <div className="flex flex-wrap gap-4">
                       <button className="h-18 px-10 bg-accent text-black rounded-2xl font-bold flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                          <MessageCircle className="h-5 w-5" />
                          Chat with us
                       </button>
                       <button className="h-18 px-10 border-2 border-white/20 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">
                          Send an email
                       </button>
                    </div>
                 </div>
                 <div className="relative">
                    <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-12 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8">
                          <Info className="h-6 w-6 text-zinc-700" />
                       </div>
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">Current wait time</p>
                       <div className="flex items-baseline gap-4 mb-4">
                          <span className="text-7xl font-bold text-accent">3m</span>
                          <span className="text-zinc-500 font-medium italic">Wait... that's fast.</span>
                       </div>
                       <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: "30%" }}
                            className="h-full bg-accent"
                          />
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
