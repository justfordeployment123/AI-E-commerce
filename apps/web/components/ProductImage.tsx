"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  /** Scale up on hover — disable for out-of-stock or non-interactive cards */
  hover?: boolean;
  /**
   * "product"  = object-contain + mix-blend-multiply (transparent product shots on white)
   * "cover"    = object-cover (lifestyle / banner images)
   */
  mode?: "product" | "cover";
  /** Passed to /_next/image — tells it the rendered width so it picks the right srcset entry.
   *  Defaults work for standard product grids; override for hero/large images. */
  sizes?: string;
  className?: string;
}

export default function ProductImage({
  src,
  alt,
  hover = true,
  mode = "product",
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
  className = "",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  const imgClass =
    mode === "cover"
      ? `object-cover transition-transform duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`
      : `object-contain mix-blend-multiply transition-transform duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`;

  return (
    <>
      {/* Placeholder — always sits behind; visible when src is missing or image errors */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Package className="h-8 w-8 text-zinc-200" strokeWidth={1.5} />
      </div>

      {src && !failed && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={imgClass}
          onError={() => setFailed(true)}
        />
      )}
    </>
  );
}
