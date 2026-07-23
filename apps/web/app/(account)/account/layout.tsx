"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Package, RefreshCw, Wrench, Settings, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { fmtDate } from "./_utils";

const NAV_ITEMS = [
  { href: "/account/settings",  label: "Account settings", icon: Settings },
  { href: "/account/orders",    label: "Orders",           icon: Package },
  { href: "/account/trade-ins", label: "Trade-Ins",        icon: RefreshCw },
  { href: "/account/repairs",   label: "Repairs",          icon: Wrench },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="flex h-[calc(100vh-76px)] flex-col bg-[#f8f8f8] text-black font-sans overflow-hidden">
      
      {/* User header strip */}
      <div className="bg-white border-b border-zinc-100 shrink-0">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.history.length > 1) router.back();
                else router.push("/");
              }}
              aria-label="Go back"
              title="Go back"
              className="h-11 w-11 rounded-full border border-zinc-200 flex items-center justify-center shrink-0 text-zinc-500 hover:text-black hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-14 w-14 rounded-[1.25rem] bg-black flex items-center justify-center shrink-0">
              <span className="text-accent font-bold text-xl">{initial}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">{user.name}</h1>
              <p className="text-sm text-zinc-400 font-medium">
                {user.email} · Member since {fmtDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar relative">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex-1 flex flex-col pt-6 sm:pt-8 lg:pt-10 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 sm:gap-8 lg:gap-10">

            {/* Sidebar — sticky on all screens */}
            <aside className="w-full lg:w-[240px] shrink-0 sticky top-6 sm:top-8 lg:top-10 z-30">
              <nav className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-2xl overflow-hidden">
                <ul className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide p-2 sm:p-3">
                  {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <li key={href} className="shrink-0 flex-1 lg:flex-initial">
                        <Link
                          href={href}
                          title={label}
                          className={`flex items-center justify-center lg:justify-start gap-2.5 px-4 py-3 rounded-[1rem] text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                            active
                              ? "bg-black text-white"
                              : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                          }`}
                        >
                          <Icon className="h-5 w-5 lg:h-4 lg:w-4 shrink-0" />
                          <span className="hidden lg:inline">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* Page content */}
            <div className="flex-1 min-w-0 pt-0 lg:pt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
