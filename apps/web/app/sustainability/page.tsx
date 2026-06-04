"use client";

import { 
  Leaf, 
  Wind, 
  Droplets, 
  Recycle,
  ArrowRight,
  Zap,
  ShieldCheck,
  CheckCircle2,
  TreeDeciduous,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import Footer from "../../components/Footer";

export default function SustainabilityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">

      <main className="flex-1">
        {/* Hero Section (Back Market Mood Emerald) */}
        <section className="bg-mood-emerald dark:bg-zinc-950/20 py-24 md:py-32 overflow-hidden border-b border-zinc-100 dark:border-zinc-900 relative">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-white/20 blur-[150px] rounded-full translate-x-1/2" />
          
          <div className="mx-auto max-w-7xl px-4 relative z-10 text-center lg:text-left">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-zinc-900 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest mb-8 border border-transparent dark:border-zinc-800"
                >
                  <Leaf className="h-3.5 w-3.5 text-accent" />
                  Eco-Certified Marketplace
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-sans text-5xl md:text-8xl font-extrabold mb-8 leading-[0.9] tracking-tighter"
                >
                  Tech that <br/>
                  <span className="text-emerald-950 dark:text-emerald-450">loves Earth.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-black/60 dark:text-zinc-400 mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium"
                >
                  Buying refurbished isn't just about saving cash—it's about saving the planet. One device at a time.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <a href="/shop/phones" className="h-16 px-10 bg-black dark:bg-accent text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-2xl hover:bg-zinc-850 dark:hover:bg-accent-dark">
                    Shop Sustainably
                    <ArrowRight className="h-5 w-5 text-white" />
                  </a>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative hidden lg:block"
              >
                 <div className="aspect-square bg-white dark:bg-zinc-900 rounded-[4rem] p-12 -rotate-6 shadow-2xl flex flex-col justify-center text-center relative overflow-hidden group border border-transparent dark:border-zinc-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-mood-emerald/20 to-transparent" />
                    <div className="relative z-10">
                       <div className="h-24 w-24 rounded-3xl bg-mood-emerald dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-8 rotate-12 transition-transform group-hover:scale-110 border border-transparent dark:border-emerald-800">
                          <TreeDeciduous className="h-12 w-12 text-black dark:text-white" />
                       </div>
                       <h3 className="text-4xl font-sans font-extrabold mb-2 text-zinc-950 dark:text-white">12,000+</h3>
                       <p className="text-sm font-bold uppercase tracking-widest text-zinc-450">Trees saved this year</p>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* The Impact (Playful Stats) */}
        <section className="py-32 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
              <div className="max-w-xl">
                 <h2 className="font-sans text-5xl md:text-7xl font-extrabold leading-tight">Every device <br/>counts.</h2>
              </div>
              <p className="text-xl text-zinc-400 font-medium">Why buy new? Seriously.</p>
           </div>
          
          <div className="grid gap-12 lg:grid-cols-3">
            {[
              {
                title: "90% Less CO2",
                text: "Refurbished tech prevents up to 90% of the carbon emissions of a new device.",
                icon: Wind,
                mood: "bg-mood-sky"
              },
              {
                title: "Zero e-Waste",
                text: "We keep tech out of landfills by giving it a second, third, and fourth life.",
                icon: Recycle,
                mood: "bg-mood-rose"
              },
              {
                title: "10k Liters Saved",
                text: "Manufacturing one new smartphone uses as much water as 500 average showers.",
                icon: Droplets,
                mood: "bg-mood-violet"
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
                <div className={`aspect-square rounded-[3rem] ${item.mood} dark:bg-zinc-900/40 p-10 flex flex-col justify-between transition-transform group-hover:-translate-y-2 border border-transparent dark:border-zinc-800`}>
                   <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                     <item.icon className="h-8 w-8 text-black dark:text-white" strokeWidth={1.5} />
                   </div>
                   <div>
                     <h3 className="text-3xl font-sans font-extrabold mb-4 text-zinc-950 dark:text-white">{item.title}</h3>
                     <p className="text-black/60 dark:text-zinc-400 leading-relaxed font-medium">{item.text}</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Long Form Mission (High Contrast) */}
        <section className="py-32 bg-zinc-950 text-white overflow-hidden border-y border-zinc-900">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-24 items-center">
                 <div className="relative">
                    <div className="aspect-[4/5] rounded-[4rem] bg-mood-emerald/10 border border-white/5 p-12 relative overflow-hidden group">
                       <img 
                        src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop" 
                        alt="Nature" 
                        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                       />
                       <div className="relative z-10 h-full flex flex-col justify-end">
                          <div className="bg-white dark:bg-zinc-900 text-black dark:text-white p-10 rounded-[3rem] shadow-2xl border border-transparent dark:border-zinc-800">
                             <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mb-6">
                                <Globe className="h-6 w-6 text-white" />
                             </div>
                             <p className="text-2xl font-sans font-extrabold mb-4 text-zinc-950 dark:text-zinc-100">"Buying refurbished is the most impactful thing you can do for the planet."</p>
                             <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">— TechStop Ethics Board</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 <div>
                    <h2 className="font-sans text-5xl md:text-7xl font-extrabold mb-12">The circular <br/><span className="text-accent">revolution.</span></h2>
                    <div className="space-y-10">
                       {[
                         { title: "No New Mining", text: "New tech requires destructive mining for rare minerals. Refurbished uses what's already here." },
                         { title: "Extended Life", text: "We repair and renew devices to double or triple their useful lifespan." },
                         { title: "Recycling is Last", text: "We believe in reuse first. Recycling is our final step for parts that truly can't be saved." }
                       ].map((item, i) => (
                         <div key={i} className="flex gap-8 group">
                            <div className="h-2 w-2 rounded-full bg-accent mt-3 transition-transform group-hover:scale-150" />
                            <div>
                               <h4 className="text-2xl font-bold mb-3">{item.title}</h4>
                               <p className="text-zinc-500 font-medium leading-relaxed">{item.text}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA */}
        <section className="py-32 bg-background text-center">
           <div className="mx-auto max-w-4xl px-4">
              <h2 className="font-sans text-5xl md:text-8xl font-extrabold mb-12 text-zinc-950 dark:text-white">Join the movement.</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/shop/phones" className="h-20 px-16 bg-black dark:bg-accent text-white rounded-[2rem] font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-accent/10 inline-flex items-center justify-center hover:bg-zinc-850 dark:hover:bg-accent-dark">
                     Browse All Tech
                  </a>
                  <a href="/trade-in" className="h-20 px-16 border-2 border-zinc-150 dark:border-zinc-850 text-black dark:text-white bg-transparent rounded-[2rem] font-bold text-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all inline-flex items-center justify-center">
                     Sell Your Device
                  </a>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
