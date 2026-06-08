"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "../context/auth-context";
import Sidebar from "./Sidebar";
import GlobalJobsBadge from "./GlobalJobsBadge";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
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
    <>
      <Sidebar />
      <div className="flex-1 overflow-auto">{children}</div>
      <GlobalJobsBadge />
    </>
  );
}
