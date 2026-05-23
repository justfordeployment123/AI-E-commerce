"use client";

import {
  Star,
  Globe,
  Mail,
  MessageCircle
} from "lucide-react";

export default function Footer() {

  return (
    <footer className="bg-white pt-24 pb-12 border-t border-zinc-100 text-black font-sans selection:bg-accent selection:text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4 pb-20 border-b border-zinc-100">
          <div className="lg:col-span-1">
            <a href="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-black">
              TECHSTOP<span className="text-zinc-400 font-medium">LEICESTER</span>
            </a>
            <p className="mt-8 text-zinc-500 leading-relaxed font-medium">
              We're on a mission to make world-class technology accessible and sustainable. 
              Join the circular tech revolution.
            </p>
            <div className="mt-8 flex gap-4">
               {[Globe, Mail, MessageCircle].map((Icon, i) => (
                 <a key={i} href="#" className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-black hover:text-white transition-all">
                    <Icon className="h-5 w-5" />
                 </a>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 lg:col-span-2 lg:ml-auto">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8">Shop</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest text-[10px]">
                <li><a href="/shop/phones" className="hover:text-accent transition-colors">Smartphones</a></li>
                <li><a href="/shop/laptops" className="hover:text-accent transition-colors">Laptops</a></li>
                <li><a href="/shop/consoles" className="hover:text-accent transition-colors">Gaming</a></li>
                <li><a href="/shop/audio" className="hover:text-accent transition-colors">Audio</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8">Company</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest text-[10px]">
                <li><a href="/sell" className="hover:text-accent transition-colors">Sell Your Tech</a></li>
                <li><a href="/help" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="/how-it-works" className="hover:text-accent transition-colors">Our Process</a></li>
                <li><a href="/sustainability" className="hover:text-accent transition-colors">Environment</a></li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1 lg:ml-auto">
             <div className="rounded-[2rem] bg-zinc-50 p-8 border border-zinc-100 text-center lg:text-left">
                <div className="flex justify-center lg:justify-start gap-1 mb-4">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                   ))}
                </div>
                <p className="text-xl font-serif font-medium mb-2">Excellent</p>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Based on 12,400 reviews</p>
             </div>
          </div>
        </div>

        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">System Status: All systems optimal</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span className="text-black">© 2024 TechStop Leicester</span>
            <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-black transition-colors">Terms</a>
            <a href="/cookies" className="hover:text-black transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
