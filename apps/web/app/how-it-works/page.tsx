"use client";

import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Star,
  Smartphone,
  ChevronRight,
  Search,
  Zap,
  Leaf,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import Footer from "../../components/Footer";

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent selection:text-white">

      <main className="flex-1">
        {/* Hero Section (Back Market Mood Violet) */}
        <section className="bg-mood-violet dark:bg-zinc-950/20 py-24 md:py-32 overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
          <div className="mx-auto max-w-7xl px-4 relative z-10 text-center lg:text-left">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 rounded-full bg-black dark:bg-zinc-900 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest mb-8 border border-transparent dark:border-zinc-800"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  The TechStop Standard
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-sans text-5xl md:text-8xl font-extrabold mb-8 leading-[0.9] tracking-tighter"
                >
                  Tech done <br/>
                  <span>the right way.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-black/60 dark:text-zinc-400 mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium"
                >
                  We're making refurbished as reliable as new. Discover the 25-point inspection process that sets us apart.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <a href="/shop/phones" className="h-16 px-10 bg-black dark:bg-accent text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-2xl hover:bg-zinc-850 dark:hover:bg-accent-dark">
                    Shop Refurbished
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
                 <div className="aspect-square bg-white dark:bg-zinc-900 rounded-[4rem] p-12 rotate-6 shadow-2xl flex flex-col justify-center text-center border border-transparent dark:border-zinc-800">
                    <div className="h-20 w-20 rounded-3xl bg-mood-sky dark:bg-sky-950/40 flex items-center justify-center mx-auto mb-8 -rotate-12">
                       <Zap className="h-10 w-10 text-black dark:text-white" />
                    </div>
                    <h3 className="text-3xl font-sans font-extrabold mb-2 text-zinc-950 dark:text-white">25 checkpoints</h3>
                    <p className="text-sm font-bold uppercase tracking-widest text-zinc-450">Every device, every time.</p>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Process Steps (Back Market Playful Cards) */}
        <section className="py-32 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                title: "Expert Inspection",
                text: "From battery health to pixel performance, certified tech experts test everything.",
                icon: Smartphone,
                mood: "bg-mood-sky"
              },
              {
                title: "Quality Grading",
                text: "No jargon. Just clear grades from Pristine to Good. You know what you're getting.",
                icon: Star,
                mood: "bg-mood-rose"
              },
              {
                title: "12-Month Warranty",
                text: "Total peace of mind. If it fails, we fix it, replace it, or refund it fast.",
                icon: ShieldCheck,
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
                <div className={`aspect-[4/5] rounded-[3rem] ${item.mood} dark:bg-zinc-900/40 p-10 flex flex-col justify-between transition-transform group-hover:-translate-y-2 border border-transparent dark:border-zinc-800`}>
                   <div className="h-16 w-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                     <item.icon className="h-8 w-8 text-black dark:text-white" strokeWidth={1.5} />
                   </div>
                   <div>
                     <span className="text-6xl font-sans font-black text-black/10 dark:text-white/10 block mb-4">0{index + 1}</span>
                     <h3 className="text-3xl font-sans font-extrabold mb-4 text-zinc-950 dark:text-white">{item.title}</h3>
                     <p className="text-black/60 dark:text-zinc-400 leading-relaxed font-medium">{item.text}</p>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Grading Deep Dive (High Contrast) */}
        <section className="py-32 bg-zinc-950 text-white rounded-t-[4rem] md:rounded-t-[6rem]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
              <div className="max-w-2xl">
                 <h2 className="font-sans text-5xl md:text-8xl font-extrabold leading-[0.9] tracking-tighter mb-8">What's in <br/><span className="text-accent">the grade?</span></h2>
                 <p className="text-xl text-zinc-500 font-medium leading-relaxed">Regardless of grade, every device is 100% functional, data-wiped, and comes with a 12-month warranty.</p>
              </div>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
               {[
                 { grade: "Pristine", desc: "Like brand new.", details: "No scratches visible from 8 inches away. Screen is perfect.", color: "bg-accent text-white" },
                 { grade: "Excellent", desc: "Minimal wear.", details: "Body may have micro-scratches. Screen is flawless when on.", color: "bg-zinc-800 text-white" },
                 { grade: "Good", desc: "Visible use.", details: "Visible scratches on body. Screen has light micro-scratches.", color: "bg-zinc-900 text-white" }
               ].map((item, i) => (
                 <div key={i} className="flex flex-col gap-6 group">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${item.color}`}>
                       {item.grade[0]}
                    </div>
                    <div>
                       <h3 className="text-3xl font-sans font-extrabold mb-2">{item.grade}</h3>
                       <p className="text-accent font-bold uppercase tracking-widest text-[10px] mb-4">{item.desc}</p>
                       <p className="text-zinc-500 font-medium leading-relaxed">{item.details}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Final Impact CTA */}
        <section className="py-32 bg-mood-emerald dark:bg-zinc-950/20 text-center relative overflow-hidden border-t border-zinc-150 dark:border-zinc-900">
           <div className="absolute top-0 right-0 w-1/3 h-full bg-white/20 blur-[100px] rounded-full" />
           <div className="mx-auto max-w-4xl px-4 relative z-10">
              <div className="h-20 w-20 rounded-[2.5rem] bg-white dark:bg-zinc-900 flex items-center justify-center mx-auto mb-10 rotate-12 shadow-xl border border-transparent dark:border-zinc-800">
                 <Leaf className="h-10 w-10 text-emerald-600 dark:text-emerald-450" />
              </div>
              <h2 className="font-sans text-5xl md:text-8xl font-extrabold mb-12 tracking-tighter leading-[0.9]">Save cash. <br/>Save the Earth.</h2>
              <a href="/shop/phones" className="h-20 px-12 bg-black dark:bg-accent text-white rounded-[2rem] font-bold text-lg transition-transform hover:scale-105 active:scale-95 shadow-2xl hover:bg-zinc-850 dark:hover:bg-accent-dark inline-flex items-center justify-center">
                 Shop with Impact
              </a>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
