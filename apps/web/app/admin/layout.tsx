"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../lib/api";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authApi.me()
      .then((user) => {
        if (user.role !== "ADMIN") router.replace("/");
        else setChecking(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-56 bg-white border-r border-zinc-200 flex flex-col py-6 shrink-0">
        <div className="px-5 mb-8">
          <span className="font-extrabold text-lg tracking-tight">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 px-3 text-sm font-semibold">
          <Link href="/admin/catalog" className="px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700">Catalog</Link>
          <Link href="/admin/catalog/categories" className="px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 pl-7">Categories</Link>
          <Link href="/admin/catalog/brands" className="px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 pl-7">Brands</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
