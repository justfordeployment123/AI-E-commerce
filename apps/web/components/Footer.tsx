"use client";

import { Star } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 pt-24 pb-12 border-t border-zinc-900 text-white font-sans selection:bg-red-500 selection:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3 pb-20 border-b border-zinc-900">
          <div className="lg:col-span-1">
            <a href="/">
              <img
                src="/Icon/logo_white.png"
                alt="TechStop Leicester"
                className="h-9 w-auto object-contain block"
              />
            </a>
            <p className="mt-8 text-zinc-500 leading-relaxed font-medium">
              We're on a mission to make world-class technology accessible and sustainable. 
              Join the circular tech revolution.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 lg:col-span-2 lg:ml-auto">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8">Shop</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest text-[10px]">
                <li><a href="/shop/phones" className="hover:text-accent transition-colors">Smartphones</a></li>
                <li><a href="/shop/laptops" className="hover:text-accent transition-colors">Laptops</a></li>
                <li><a href="/shop/gaming" className="hover:text-accent transition-colors">Gaming</a></li>
                <li><a href="/shop/audio" className="hover:text-accent transition-colors">Audio</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8">Company</h4>
              <ul className="space-y-4 text-sm font-bold uppercase tracking-widest text-[10px]">
                <li><a href="/trade-in" className="hover:text-accent transition-colors">Sell Your Tech</a></li>
                <li><a href="/help" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="/repair" className="hover:text-accent transition-colors">Repair</a></li>
              </ul>
            </div>
          </div>


        </div>

        <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">System Status: All systems optimal</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span className="text-white">© 2024 TechStop Leicester</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
