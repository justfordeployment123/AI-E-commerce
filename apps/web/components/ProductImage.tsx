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
  /** Background shown behind/around the image and under the fallback icon.
   *  Accepts any Tailwind background class. Defaults to the site's standard
   *  light product-image backdrop (`#f5f5f7`, same color `.bg-image-light`
   *  resolves to in globals.css). Pass e.g. `"bg-zinc-900"` or `"bg-white/5"`
   *  for images placed on dark or translucent cards. */
  bg?: string;
  /** Extra classes for the component's own sizing wrapper, e.g.
   *  `"aspect-square rounded-2xl"` or `"inset-0"` when `position="absolute"`.
   *  Don't put position utilities here — use the `position` prop instead,
   *  since Tailwind's generated stylesheet order (not className string order)
   *  decides which `position` utility wins when two are both present. */
  wrapperClassName?: string;
  /** Position of the component's own sizing wrapper. Defaults to `"relative"`
   *  so callers no longer need to remember to add it themselves on a
   *  surrounding element for `fill` mode to work. Use `"absolute"` for
   *  full-bleed backgrounds (paired with `wrapperClassName="inset-0"`) inside
   *  an already-positioned card. */
  position?: "relative" | "absolute";
  /** Classes for the fallback Package icon — defaults to a size that suits
   *  typical product-card thumbnails. Override for smaller contexts (e.g.
   *  search-dropdown or review-photo thumbnails). */
  iconClassName?: string;
  /** Explicit width/height switches the component to non-`fill` mode, for
   *  fixed-size thumbnails (logos, review photos, search results) instead of
   *  a `fill`-and-size-via-parent layout. */
  width?: number;
  height?: number;
}

export default function ProductImage({
  src,
  alt,
  hover = true,
  mode = "product",
  sizes = "(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw",
  priority = false,
  className = "",
  bg = "bg-image-light",
  wrapperClassName = "",
  position = "relative",
  iconClassName = "h-8 w-8",
  width,
  height,
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isFill = width === undefined || height === undefined;

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
    : `object-contain pt-5 pb-2 px-3 sm:pt-6 sm:pb-3 sm:px-4 mix-blend-multiply dark:mix-blend-normal transition-all duration-500 z-10 ${hover ? "group-hover:scale-105" : ""} ${className}`;

  return (
    <div
      ref={wrapperRef}
      className={`${position} overflow-hidden ${bg} ${isFill ? "w-full h-full" : "inline-block"} ${wrapperClassName}`}
      style={!isFill ? { width, height } : undefined}
    >
      {showPlaceholder && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <Package className={`${iconClassName} text-zinc-200`} strokeWidth={1.5} />
        </div>
      )}

      {src && !failed && (
        isFill ? (
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
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className={`${baseClass} ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )
      )}
    </div>
  );
}
