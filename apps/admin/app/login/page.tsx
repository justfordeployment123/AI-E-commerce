"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (email === "admin@techstop.co.uk" && password === "admin") {
      window.location.href = "/";
    } else {
      setError("Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-[#d7ff5f] flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">TechStop Leicester</p>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
          <p className="text-sm text-white/40 font-medium mb-8">Enter your admin credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@techstop.co.uk"
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-white placeholder-white/20 outline-none focus:border-[#d7ff5f]/60 focus:bg-white/8 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 pr-12 text-sm text-white placeholder-white/20 outline-none focus:border-[#d7ff5f]/60 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#d7ff5f] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-2"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-[11px] text-white/20 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            Restricted access — authorised personnel only
          </div>
        </div>

        <p className="text-center text-[11px] text-white/15 font-medium mt-6">
          TechStop Leicester &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
