import { CheckCircle2, Star, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white pt-16 md:pt-24 pb-12 border-t border-zinc-100 text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:gap-16 md:grid-cols-4 pb-16 md:pb-20 border-b border-zinc-50">
          <div className="col-span-full lg:col-span-2">
            <a href="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-black">
              MARKHOR<span className="text-zinc-400">MARKET</span>
            </a>
            <p className="mt-6 md:mt-8 max-w-sm text-zinc-500 leading-relaxed font-medium">
              We're on a mission to make world-class technology accessible and sustainable. 
              Join us in reducing e-waste while saving on the tech you love.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Explore</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              <li><a href="/shop" className="hover:text-black transition-colors">Shop All</a></li>
              <li><a href="/sell" className="hover:text-black transition-colors">Sell Your Tech</a></li>
              <li><a href="/how-it-works" className="hover:text-black transition-colors">How it Works</a></li>
              <li><a href="/sustainability" className="hover:text-black transition-colors">Sustainability</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-black mb-6 uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4 text-sm text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              <li><a href="/help" className="hover:text-black transition-colors">Help Center</a></li>
              <li><a href="/shipping" className="hover:text-black transition-colors">Shipping</a></li>
              <li><a href="/warranty" className="hover:text-black transition-colors">Warranty</a></li>
              <li><a href="/contact" className="hover:text-black transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="py-12 border-b border-zinc-50">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center">
            <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Expert Certified</span>
            </div>
            <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
              <Star className="h-5 w-5 text-[#d7ff5f] fill-[#d7ff5f]" />
              <span className="text-xs font-bold uppercase tracking-widest">4.9/5 TrustScore</span>
            </div>
            <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Secure Payments</span>
            </div>
          </div>
        </div>

        <div className="pt-10 md:pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 text-center md:text-left">© 2024 Markhor Market. Built for the planet.</p>
          <div className="flex gap-6 md:gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <a href="/privacy" className="hover:text-black transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-black transition-colors">Terms</a>
            <a href="/cookies" className="hover:text-black transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
