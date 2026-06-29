"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      router.replace("/login?error=oauth_failed");
      return;
    }
    loginWithToken(token).then(() => {
      const redirect = sessionStorage.getItem("ts_login_redirect");
      if (redirect) {
        sessionStorage.removeItem("ts_login_redirect");
        router.replace(redirect);
      } else if (sessionStorage.getItem("ts_wizard_repair")) {
        router.replace("/repair");
      } else if (sessionStorage.getItem("ts_wizard_tradein")) {
        router.replace("/trade-in");
      } else {
        router.replace("/account");
      }
    });
  }, [params, router, loginWithToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-black" />
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-black" />
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
