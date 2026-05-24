"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, RefreshCw, Wrench, ShoppingBag,
  SlidersHorizontal, BarChart3, LogOut, ChevronRight, ListPlus, MapPin
} from "lucide-react";
import { useAdminAuth } from "../context/auth-context";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package, section: "Catalog" },
  { href: "/catalog", label: "Device Catalog", icon: ListPlus },
  { href: "/trade-ins", label: "Trade-Ins", icon: RefreshCw, section: "Operations" },
  { href: "/repairs", label: "Repairs", icon: Wrench },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/pricing", label: "Pricing Rules", icon: SlidersHorizontal, section: "Settings" },
  { href: "/stores", label: "Store Locations", icon: MapPin },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();
  let lastSection = "";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="w-55 shrink-0 bg-sidebar text-sidebar-fg flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-hide">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0">
            <img src="/icon.png" alt="TechStop" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">TechStop</p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, section }) => {
          const active = pathname === href;
          const showSection = section && section !== lastSection;
          if (section) lastSection = section;

          return (
            <div key={href}>
              {showSection && (
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 px-3 pt-5 pb-2">{section}</p>
              )}
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 text-black/40" />}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{user.name}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
