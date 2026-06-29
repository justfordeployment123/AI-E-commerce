"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronLeft, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
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
      await register(name, email, password);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1/2 h-full bg-mood-rose/30 dark:bg-mood-rose/10 skew-x-12 -translate-x-32 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/2 bg-mood-emerald/30 dark:bg-mood-emerald/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
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
            <h1 className="font-sans text-4xl md:text-5xl font-extrabold leading-[1.1] mb-2 text-zinc-950 dark:text-white">Start your journey.</h1>
            <p className="text-zinc-500 font-medium text-sm">Join 2M+ users saving the planet with premium tech.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Full Name</label>
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full h-13 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent px-12 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition-all focus:bg-white focus:dark:bg-zinc-900 text-foreground shadow-sm"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 dark:text-zinc-660 group-focus-within:text-accent transition-colors" />
            </div>
          </div>

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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 dark:text-zinc-660 group-focus-within:text-accent transition-colors" />
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
                minLength={8}
                className="w-full h-13 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent pl-12 pr-12 text-sm font-bold focus:ring-2 focus:ring-accent outline-none transition-all focus:bg-white focus:dark:bg-zinc-900 text-foreground shadow-sm"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 dark:text-zinc-660 group-focus-within:text-accent transition-colors" />
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
            {loading ? "Creating account…" : "Create Account"}
            {!loading && <ArrowRight className="h-4 w-4 text-white" />}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6 font-medium">
          Already a user?{" "}
          <a href="/login" className="text-black dark:text-white font-bold border-b-2 border-accent pb-0.5 hover:border-black dark:hover:border-white transition-all">
            Log in here
          </a>
        </p>
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-20 grayscale dark:invert">
        <CheckCircle2 className="h-4 w-4" />
        <span className="h-1 w-1 rounded-full bg-black dark:bg-white" />
        <span className="text-[9px] font-bold uppercase tracking-widest">Secure 256-bit Encryption</span>
      </div>
    </div>
  );
}
