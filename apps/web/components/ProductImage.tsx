"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  hover?: boolean;
  mode?: "product" | "cover";
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export default function ProductImage({
  src,
  alt,
  hover = true,
  mode = "product",
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
  priority = false,
  className = "",
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Reset on src change
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  // Backup for cached images: poll once after a short delay so the <img> is in the DOM
  useEffect(() => {
    if (!src || failed || loaded) return;
    const t = setTimeout(() => {
      const img = wrapperRef.current?.querySelector("img");
      if (img?.complete && img.naturalWidth > 0) setLoaded(true);
    }, 50);
    return () => clearTimeout(t);
  }, [src, failed, loaded]);

  // Only show the placeholder when there is genuinely no image to display.
  // While the image is loading we keep it invisible (opacity-0) so the placeholder
  // never bleeds through via mix-blend-multiply on white product backgrounds.
  const showPlaceholder = !src || failed;

  const baseClass = mode === "cover"
    ? `object-cover transition-all duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`
    : `object-contain mix-blend-multiply dark:mix-blend-normal transition-all duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`;

  return (
    <div ref={wrapperRef} className="contents">
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <Package className="h-8 w-8 text-zinc-200" strokeWidth={1.5} />
        </div>
      )}

      {src && !failed && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`${baseClass} ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
