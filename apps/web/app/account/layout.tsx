"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Package, RefreshCw, Wrench, Settings, LogOut } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/auth-context";
import { fmtDate } from "./_utils";

const NAV_ITEMS = [
  { href: "/account/orders",    label: "Orders",           icon: Package },
  { href: "/account/trade-ins", label: "Trade-Ins",        icon: RefreshCw },
  { href: "/account/repairs",   label: "Repairs",          icon: Wrench },
  { href: "/account/settings",  label: "Account settings", icon: Settings },
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
        <Navbar />
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
    <div className="flex min-h-screen flex-col bg-[#f8f8f8] text-black font-sans">
      
      <Navbar />

      {/* User header strip */}
      <div className="bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
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

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-10">

            {/* Sidebar */}
            <aside className="w-full lg:w-[240px] shrink-0 lg:sticky lg:top-8">
              <nav className="bg-white rounded-[1.5rem] border border-zinc-100 p-3 shadow-sm">
                <ul className="space-y-0.5">
                  {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[1rem] text-sm font-bold transition-all ${
                            active
                              ? "bg-black text-white"
                              : "text-zinc-500 hover:bg-zinc-50 hover:text-black"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[1rem] text-sm font-bold text-red-500 hover:bg-red-50 transition-all text-left"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </nav>
            </aside>

            {/* Page content with animation */}
            <div className="flex-1 min-w-0 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="flex-1 flex flex-col"
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
