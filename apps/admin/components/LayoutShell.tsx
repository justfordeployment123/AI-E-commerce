"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAdminAuth } from "../context/auth-context";
import Sidebar from "./Sidebar";
import GlobalJobsBadge from "./GlobalJobsBadge";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login");
    }
    if (!loading && user && isLoginPage) {
      router.replace("/");
    }
  }, [loading, user, isLoginPage, router]);

  // Login page — render without sidebar
  if (isLoginPage) return <>{children}</>;

  // Loading / unauthenticated — blank screen while redirecting
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-600 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <img src="/logo_black.png" alt="TechStop" className="h-6 w-auto object-contain" />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
      
      <GlobalJobsBadge />
    </div>
  );
}
