"use client";

import { useEffect, useState } from "react";
import { bannersApi } from "../lib/api";

export function useBanners(count = 4): string[] {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    bannersApi.random(count)
      .then(banners => {
        const resolved = banners.map(b => b.url).filter((u): u is string => !!u);
        setUrls(resolved);
      })
      .catch(() => {});
  }, [count]);

  return urls;
}

export function useRandomBanner(): string | null {
  const banners = useBanners(6);
  if (!banners.length) return null;
  return banners[Math.floor(Math.random() * banners.length)] ?? null;
}
