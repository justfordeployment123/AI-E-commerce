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
  Search
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-zinc-950 text-white py-24 md:py-32 overflow-hidden">
          {/* Decor */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/10 blur-[150px] rounded-full translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-zinc-900/50 blur-[100px] rounded-full -translate-x-1/2" />
          
          <div className="mx-auto max-w-7xl px-4 relative z-10">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-8"
              >
                <Zap className="h-3.5 w-3.5" />
                Instant Trade-In
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-serif text-5xl md:text-8xl font-medium mb-8 leading-[0.9] tracking-tighter"
              >
                Sell your tech. <br/>
                <span className="text-zinc-500 italic">Get paid in 48h.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-zinc-400 mb-12 max-w-2xl leading-relaxed font-medium"
              >
                Trade in your smartphone, laptop, or tablet. Get an instant quote, 
                ship it for free, and help the planet while getting paid.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-2xl"
              >
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search your device (e.g. iPhone 15 Pro Max)"
                    className="w-full h-20 rounded-[1.5rem] bg-zinc-900 border border-zinc-800 px-8 text-lg focus:ring-4 focus:ring-accent/20 outline-none transition-all focus:bg-zinc-800"
                  />
                  <button className="absolute right-3 top-3 bottom-3 bg-accent text-black rounded-[1.25rem] px-8 font-bold flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-accent/10">
                    Get Quote
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 flex gap-4 overflow-x-auto scrollbar-hide py-2">
                  {["iPhone 15", "MacBook Pro", "iPad Air", "S24 Ultra"].map((item) => (
                    <button key={item} className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-32 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">Three simple steps</h2>
            <p className="text-zinc-500 font-medium">Selling your tech has never been this effortless.</p>
          </div>
          
          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                title: "Get an instant quote",
                text: "Answer a few quick questions about your device's model and condition to see your offer.",
                icon: DollarSign,
                color: "bg-emerald-50 text-emerald-600"
              },
              {
                title: "Ship it for free",
                text: "We'll send you a prepaid shipping label and a secure box. Just pack it and drop it off.",
                icon: Package,
                color: "bg-blue-50 text-blue-600"
              },
              {
                title: "Get paid fast",
                text: "Once we verify the condition, you'll receive payment directly to your account within 2 days.",
                icon: CreditCard,
                color: "bg-accent/20 text-black"
              }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative group p-8 rounded-[2.5rem] bg-zinc-50 border border-zinc-100 transition-all hover:bg-white hover:shadow-2xl hover:border-transparent"
              >
                <div className="absolute top-8 right-8 text-5xl font-serif text-zinc-200 group-hover:text-accent/20 transition-colors leading-none">
                  0{index + 1}
                </div>
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] mb-8 transition-transform group-hover:scale-110 ${item.color}`}>
                  <item.icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed font-medium">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why sell with us */}
        <section className="py-24 bg-zinc-50 border-y border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-serif text-4xl md:text-5xl font-medium mb-8">The smarter way to upgrade.</h2>
                <div className="space-y-8">
                  {[
                    { title: "Best Price Guarantee", text: "We compare top refurbishers to ensure you get the most money for your tech.", icon: ShieldCheck },
                    { title: "Eco-Friendly Impact", text: "Every device sold prevents e-waste and reduces CO2 emissions. Do good, get paid.", icon: RefreshCw },
                    { title: "Secure Data Wipe", text: "Our partners use military-grade software to ensure your personal data is permanently erased.", icon: Zap }
                  ].map((benefit) => (
                    <div key={benefit.title} className="flex gap-6">
                      <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-black" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{benefit.title}</h4>
                        <p className="text-zinc-500 font-medium text-sm">{benefit.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-[3rem] overflow-hidden bg-zinc-200">
                  <img src="https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=800&auto=format&fit=crop" alt="iPhone collection" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -bottom-10 -left-10 rounded-[2rem] bg-white p-8 shadow-2xl border border-zinc-100 max-w-[280px]">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">$1,240,000+</div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Paid to sellers this month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-32 mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-serif text-4xl font-medium mb-12">Common questions</h2>
          <div className="space-y-4 text-left">
            {[
              "When do I get paid?",
              "How should I pack my device?",
              "What if my device is broken?",
              "Do I need to include the charger?"
            ].map((q) => (
              <button key={q} className="w-full flex items-center justify-between p-6 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-white hover:border-zinc-200 transition-all font-bold text-sm">
                {q}
                <ArrowRight className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
          <div className="mt-12">
            <a href="/help" className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors">Visit Help Center for more</a>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 bg-accent text-black relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-white/20 blur-[100px] rounded-full" />
          <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
            <h2 className="font-serif text-4xl md:text-6xl font-medium mb-8">Ready to turn your old tech into cash?</h2>
            <p className="text-lg md:text-xl text-black/60 mb-12 font-medium">It takes less than 2 minutes to get your instant quote.</p>
            <button className="bg-black text-white rounded-[1.5rem] px-12 py-6 text-sm font-bold transition-transform hover:scale-105 active:scale-95 shadow-2xl">
              Start Selling Now
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
