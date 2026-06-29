"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  hover?: boolean;
  mode?: "product" | "cover";
  sizes?: string;
  /** Set on the first few above-the-fold images so they load immediately, not lazily */
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

  const imgClass =
    mode === "cover"
      ? `object-cover transition-transform duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`
      : `object-contain mix-blend-multiply transition-transform duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`;

  // Show placeholder only while loading or when there is no image / image errored.
  // Must be removed from the DOM once loaded — mix-blend-multiply makes white
  // areas of product images transparent, so anything behind bleeds through.
  const showPlaceholder = !src || failed || !loaded;

  return (
    <>
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center">
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
    </>
  );
}
