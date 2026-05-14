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
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-zinc-50 py-24 md:py-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-accent/5 blur-[100px] rounded-full" />
          <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 border border-zinc-100 mb-8"
            >
              The TechStop Standard
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-5xl md:text-8xl font-medium mb-8 leading-[0.9] tracking-tighter"
            >
              How it works. <br/>
              <span className="text-zinc-400 italic">For you & the planet.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-600 leading-relaxed max-w-2xl mx-auto font-medium"
            >
              We're on a mission to make refurbished tech as reliable as new. 
              Discover our expert certification process and quality standards.
            </motion.p>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-32 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {[
              {
                title: "Expert Testing & Certification",
                text: "Every device that enters our marketplace undergoes a rigorous 25-point inspection by certified technicians. From battery health to pixel performance, we leave no stone unturned.",
                icon: Smartphone,
                img: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop",
                tag: "Step 01"
              },
              {
                title: "Transparent Quality Grading",
                text: "We don't hide behind jargon. Our clear grading system—Excellent, Very Good, and Fair—tells you exactly what to expect from your device's cosmetic condition.",
                icon: Star,
                img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
                tag: "Step 02",
                reversed: true
              },
              {
                title: "12-Month Peace of Mind",
                text: "Every single product is backed by a full 12-month warranty. If a technical fault occurs, we'll repair, replace, or refund your purchase within 5 business days.",
                icon: ShieldCheck,
                img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop",
                tag: "Step 03"
              }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col lg:flex-row items-center gap-16 lg:gap-24 ${item.reversed ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-widest text-[10px] mb-6">
                    <span className="h-1 w-8 bg-accent rounded-full" />
                    {item.tag}
                  </div>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-8">{item.title}</h2>
                  <p className="text-lg text-zinc-500 leading-relaxed font-medium mb-10">{item.text}</p>
                  <div className="flex items-center gap-4 text-sm font-bold group cursor-pointer">
                    <span className="border-b-2 border-accent pb-1 group-hover:border-black transition-colors">Learn more about our standards</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-zinc-100 shadow-2xl relative group">
                    <img src={item.img} alt={item.title} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Grading Deep Dive */}
        <section className="bg-black text-white py-32 rounded-t-[4rem] md:rounded-t-[6rem]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-24">
              <h2 className="font-serif text-4xl md:text-6xl font-medium mb-8 leading-tight">Our Grading System</h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                No matter the grade, every device is 100% functional, data-wiped, and comes with a 12-month warranty.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { 
                  grade: "Excellent", 
                  desc: "Like new condition.", 
                  details: "The screen is perfect. The body may have micro-scratches invisible from 8 inches away.",
                  icon: Zap,
                  color: "bg-accent text-black"
                },
                { 
                  grade: "Very Good", 
                  desc: "Minimal signs of wear.", 
                  details: "The screen has no scratches when on. The body may have light micro-scratches visible from 8 inches.",
                  icon: CheckCircle2,
                  color: "bg-zinc-800 text-white"
                },
                { 
                  grade: "Fair", 
                  desc: "Visible signs of use.", 
                  details: "The screen has light scratches (invisible when on). The body has visible scratches or dents.",
                  icon: ShieldAlert,
                  color: "bg-zinc-900 text-white"
                }
              ].map((item) => (
                <div key={item.grade} className="p-10 rounded-[2.5rem] bg-zinc-950 border border-zinc-900 transition-all hover:bg-zinc-900 hover:border-zinc-800 group">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${item.color}`}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">{item.grade}</h3>
                  <p className="text-zinc-300 font-bold text-sm uppercase tracking-widest mb-6">{item.desc}</p>
                  <p className="text-zinc-500 leading-relaxed text-sm font-medium">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sustainability Impact */}
        <section className="py-32 bg-emerald-50 text-emerald-900">
          <div className="mx-auto max-w-5xl px-4 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-[2rem] bg-emerald-100 flex items-center justify-center mb-10">
              <Leaf className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="font-serif text-4xl md:text-6xl font-medium mb-8 leading-tight">Sustainability is standard.</h2>
            <p className="text-xl text-emerald-800/70 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
              Buying refurbished isn't just about saving money. It's about saving the planet. 
              Each device prevents e-waste and saves an average of 140kg of CO2 emissions.
            </p>
            <a href="/sustainability" className="rounded-2xl bg-emerald-600 px-10 py-5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20">
              View Our Impact
            </a>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-white text-center">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="font-serif text-4xl md:text-6xl font-medium mb-8">Ready to start?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/shop" className="rounded-2xl bg-black px-12 py-6 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-2xl">
                Browse Tech
              </a>
              <a href="/sell" className="rounded-2xl border border-zinc-200 bg-white px-12 py-6 text-sm font-bold text-black transition-all hover:bg-zinc-50 hover:scale-105 active:scale-95">
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
