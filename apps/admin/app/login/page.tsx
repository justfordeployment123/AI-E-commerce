"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ShieldCheck, BarChart3, Package, RefreshCw } from "lucide-react";
import { useAdminAuth } from "../../context/auth-context";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col gap-2">
            <img src="/logo_white.png" alt="TechStop" className="h-8 w-auto object-contain object-left" />
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] pl-0.5">Admin Panel</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Manage your store<br />from one place.
            </h1>
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-sm">
              Full visibility over orders, trade-ins, repairs, pricing, and analytics — built for the TechStop team.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: BarChart3, label: "Live sales & revenue analytics" },
              { icon: RefreshCw, label: "Trade-in pricing & queue management" },
              { icon: Package, label: "Product catalog & order fulfilment" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                </div>
                <span className="text-sm font-medium text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-[11px] text-white/20 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Restricted access — authorised personnel only
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-950 lg:bg-zinc-900/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex flex-col gap-2 mb-10 lg:hidden">
            <img src="/logo_white.png" alt="TechStop" className="h-8 w-auto object-contain object-left" />
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] pl-0.5">Admin Panel</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-sm text-white/40 font-medium">Sign in to your admin account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@techstop.co.uk"
                className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/10 px-4 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 focus:bg-white/[0.08] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl bg-white/[0.06] border border-white/10 px-4 pr-12 text-sm text-white placeholder-white/20 outline-none focus:border-accent/50 focus:bg-white/[0.08] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
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
              className="w-full h-12 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p suppressHydrationWarning className="text-center text-[11px] text-white/15 font-medium mt-10">
            TechStop Leicester &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
