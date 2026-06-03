"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, SlidersHorizontal, ArrowRight, Play, Eye, Sparkles } from "lucide-react";
import { bannerImagesApi, promoSlidesApi, type BannerItem, type PromoSlideItem } from "../../lib/api";

export default function BannersHubPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [promoSlides, setPromoSlides] = useState<PromoSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      bannerImagesApi.list(),
      promoSlidesApi.list(),
    ])
      .then(([bannerList, slideList]) => {
        setBanners(bannerList);
        setPromoSlides(slideList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-zinc-200 rounded-lg" />
        <div className="h-4 w-96 bg-zinc-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="h-48 bg-white border border-zinc-100 rounded-3xl animate-pulse" />
          <div className="h-48 bg-white border border-zinc-100 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  const activeBannersCount = banners.filter(b => b.isActive).length;
  const activeSlidesCount = promoSlides.filter(s => s.isActive).length;
  
  // Find current preview slide
  const currentSlide = promoSlides[activeSlideIdx] || promoSlides[0];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          Banners & Promotions
          <Sparkles className="h-6 w-6 text-accent animate-pulse" />
        </h1>
        <p className="text-sm text-zinc-400 font-medium mt-1">
          Manage all promotional graphics and interactive homepage hero banners.
        </p>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Banner Images Card */}
        <Link 
          href="/banners/images"
          className="group relative bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-accent/10 transition-colors">
                <ImageIcon className="h-5 w-5 text-zinc-400 group-hover:text-accent transition-colors" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="text-4xl font-black text-zinc-900">{banners.length}</div>
              <div className="font-bold text-zinc-700 text-sm mt-1">Banner Images</div>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {activeBannersCount} active banners shown in categories & details
              </p>
            </div>
          </div>

          {/* Image Previews */}
          <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-zinc-50 overflow-hidden">
            {banners.slice(0, 4).map(b => (
              <div 
                key={b.id} 
                className="h-10 w-16 rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 relative group/img"
              >
                {b.url ? (
                  <img src={b.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[8px] text-zinc-400 font-bold bg-zinc-100">
                    No image
                  </div>
                )}
                {!b.isActive && (
                  <div className="absolute inset-0 bg-zinc-950/30 flex items-center justify-center">
                    <span className="text-[7px] text-white font-extrabold uppercase bg-zinc-900/60 px-1 rounded-sm">
                      Off
                    </span>
                  </div>
                )}
              </div>
            ))}
            {banners.length > 4 && (
              <span className="text-xs text-zinc-400 font-extrabold ml-1 shrink-0">
                +{banners.length - 4}
              </span>
            )}
          </div>
        </Link>

        {/* Promo Banners Card */}
        <Link 
          href="/banners/promo-banners"
          className="group relative bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-zinc-50 rounded-2xl group-hover:bg-accent/10 transition-colors">
                <SlidersHorizontal className="h-5 w-5 text-zinc-400 group-hover:text-accent transition-colors" />
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <div className="text-4xl font-black text-zinc-900">{promoSlides.length}</div>
              <div className="font-bold text-zinc-700 text-sm mt-1">Homepage Promo Slides</div>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {activeSlidesCount} active slides rotating on storefront hero
              </p>
            </div>
          </div>

          {/* Swatches preview */}
          <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-zinc-50">
            {promoSlides.slice(0, 4).map(slide => (
              <span 
                key={slide.id} 
                className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-100 flex items-center gap-1 bg-zinc-50 text-zinc-600"
              >
                <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-tr ${slide.themeColor.split(' ')[0]} shrink-0`} />
                {slide.tabTitle}
              </span>
            ))}
            {promoSlides.length > 4 && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-400 border border-zinc-100">
                +{promoSlides.length - 4} more
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Interactive Mockup Preview of Homepage Hero Slider */}
      {promoSlides.length > 0 && currentSlide && (
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> Live Hero Carousel Preview
              </h2>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Interact with the mock slider to preview slide branding, CTAs, specs, and glow settings.
              </p>
            </div>
            <Link 
              href="/banners/promo-banners" 
              className="text-xs font-bold text-zinc-500 hover:text-black transition-colors flex items-center gap-1"
            >
              Configure Slides <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Carousel Slider Mockup */}
          <div className="relative rounded-2xl bg-zinc-950 overflow-hidden text-white p-6 md:p-10 min-h-[300px] flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Custom Glow Effect background */}
            <div 
              className="absolute inset-0 transition-all duration-700 pointer-events-none" 
              style={{
                background: `radial-gradient(circle at 75% 50%, ${currentSlide.bgGlow || 'rgba(59,130,246,0.1)'} 0%, transparent 60%)`
              }}
            />

            {/* Left side texts */}
            <div className="relative space-y-4 max-w-md z-10 text-left">
              <span className="text-[10px] font-black tracking-widest bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-white/90 uppercase">
                {currentSlide.tag || "Featured Promotion"}
              </span>
              
              <div className="space-y-1">
                <h3 className="text-xl md:text-3xl font-light leading-tight tracking-tight text-white/80">
                  {currentSlide.titleLine1 || currentSlide.title} 
                </h3>
                <h3 className="text-2xl md:text-4xl font-extrabold leading-none tracking-tight">
                  {currentSlide.titleItalic ? (
                    <span className="italic font-light text-zinc-300">{currentSlide.titleItalic} </span>
                  ) : null}
                  {currentSlide.titleLine2}
                </h3>
              </div>

              <p className="text-xs md:text-sm text-white/60 font-medium">
                {currentSlide.subtitle}
              </p>

              {/* Specs bullets */}
              {currentSlide.specs && currentSlide.specs.length > 0 && (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                  {currentSlide.specs.slice(0, 4).map((spec, sIdx) => (
                    <li key={sIdx} className="text-[11px] font-bold text-white/75 flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-white/40 shrink-0" />
                      {spec}
                    </li>
                  ))}
                </ul>
              )}

              {/* Button Action preview */}
              <div className="pt-4 flex items-center gap-3">
                <div 
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-zinc-950 flex items-center gap-1.5 transition-all shadow-md cursor-default select-none"
                >
                  <Play className="h-3 w-3 fill-zinc-950" /> {currentSlide.btnText || "Shop Now"}
                </div>
                {currentSlide.badgeA && (
                  <span className="text-[10px] font-bold text-white/40 px-2 py-1 rounded-md border border-white/10">
                    {currentSlide.badgeA}
                  </span>
                )}
                {currentSlide.badgeB && (
                  <span className="text-[10px] font-bold text-white/40 px-2 py-1 rounded-md border border-white/10">
                    {currentSlide.badgeB}
                  </span>
                )}
              </div>
            </div>

            {/* Right side image representation */}
            <div className="relative h-48 w-48 md:h-64 md:w-64 flex items-center justify-center shrink-0 z-10 animate-float">
              {currentSlide.imgUrl ? (
                <img 
                  src={currentSlide.imgUrl} 
                  alt="" 
                  className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_50px_rgba(255,255,255,0.15)]"
                />
              ) : (
                <div className="h-32 w-32 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1.5 text-white/30">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-[10px] font-bold">No product image</span>
                </div>
              )}
            </div>
          </div>

          {/* Slider controller tabs */}
          <div className="flex flex-wrap gap-2 pt-2 justify-center border-t border-zinc-50">
            {promoSlides.map((slide, sIdx) => {
              const active = sIdx === activeSlideIdx;
              return (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlideIdx(sIdx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    active 
                      ? "bg-zinc-950 border-zinc-950 text-white shadow-sm" 
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-black"
                  }`}
                >
                  {slide.tabTitle}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
