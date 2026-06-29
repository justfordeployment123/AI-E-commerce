"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    if (redirectTo && redirectTo !== "/account") {
      sessionStorage.setItem("ts_login_redirect", redirectTo);
    }
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/auth/google`;
  }

  return (
    <div className="h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-mood-sky/30 dark:bg-mood-sky/10 -skew-x-12 translate-x-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-mood-amber/30 dark:bg-mood-amber/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-6">
          <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-5 group">
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </a>
          <div className="text-center lg:text-left">
            <a href="/" className="inline-block mb-3 select-none">
              <img
                src="/Icon/logo_black.png"
                alt="TechStop Leicester"
                className="h-7 w-auto object-contain block dark:hidden"
              />
              <img
                src="/Icon/logo_white.png"
                alt="TechStop Leicester"
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </a>
            <h1 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-2 text-zinc-950 dark:text-white">Welcome back.</h1>
            <p className="text-zinc-500 font-medium text-sm">Log in to track your tech and manage your sell-ins.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Email address</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-13 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent px-12 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition-all focus:bg-white focus:dark:bg-zinc-900 text-foreground shadow-sm"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 dark:text-zinc-650 group-focus-within:text-accent transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Password</label>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-13 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition-all focus:bg-white focus:dark:bg-zinc-900 text-foreground shadow-sm"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 dark:text-zinc-655 group-focus-within:text-accent transition-colors" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-650 hover:text-black dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-accent text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-black/20 dark:shadow-accent/15 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-accent-dark"
          >
            {loading ? "Logging in…" : "Log in"}
            {!loading && <ArrowRight className="h-4 w-4 text-white" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">or</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-13 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold transition-all hover:scale-[1.02] hover:border-zinc-400 dark:hover:border-zinc-700 active:scale-[0.98] flex items-center justify-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 shadow-sm"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6 font-medium">
          New to TechStop?{" "}
          <a href="/signup" className="text-black dark:text-white font-bold border-b-2 border-accent pb-0.5 hover:border-black dark:hover:border-white transition-all">
            Create an account
          </a>
        </p>
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-20 grayscale dark:invert">
        <Zap className="h-4 w-4" />
        <span className="h-1 w-1 rounded-full bg-black dark:bg-white" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Certified Refurbished Marketplace</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
