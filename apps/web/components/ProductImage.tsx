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

  // Also catch already-cached images where onLoad fires before React can attach the handler
  useEffect(() => {
    if (!src || failed) return;
    const img = wrapperRef.current?.querySelector("img");
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src, failed]);

  // Reset when src changes
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const showPlaceholder = !src || failed || !loaded;

  const imgClass =
    mode === "cover"
      ? `object-cover transition-transform duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`
      : `object-contain mix-blend-multiply transition-transform duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`;

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
          className={imgClass}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
