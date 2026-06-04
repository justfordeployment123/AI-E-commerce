"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatalogOthersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/products/others"); }, [router]);
  return null;
}
