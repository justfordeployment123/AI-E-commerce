"use client";

import { useEffect, useState } from "react";
import { bannersApi } from "../lib/api";
import { imageRegistry, pick } from "../lib/localImages";

// Local fallback images when API has no banners seeded yet
const LOCAL_FALLBACK = [
  ...imageRegistry.banners.gaming,
  ...imageRegistry.banners.desk,
];

export function useBanners(count = 4): string[] {
  const [urls, setUrls] = useState<string[]>(() =>
    LOCAL_FALLBACK.slice(0, count).map(p => p)
  );

  useEffect(() => {
    bannersApi.random(count)
      .then(banners => {
        const resolved = banners.map(b => b.url).filter((u): u is string => !!u);
        if (resolved.length > 0) setUrls(resolved);
        // else keep local fallback
      })
      .catch(() => {/* keep local fallback */});
  }, [count]);

  return urls;
}

// Pick a single random banner URL (API → fallback)
export function useRandomBanner(): string {
  const banners = useBanners(6);
  return pick(banners);
}
