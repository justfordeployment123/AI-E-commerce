"use client";

import { 
  Mail, 
  Lock, 
  ArrowRight,
  ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-100 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-black transition-colors text-sm font-bold mb-8 group">
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </a>
          <div className="text-center">
            <a href="/" className="text-3xl font-bold tracking-tighter inline-block mb-8">
              TECHSTOP<span className="text-zinc-400">LEICESTER</span>
            </a>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-zinc-500 mt-3 font-medium">Log in to your account to track orders and manage your sell-ins.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Email address</label>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="you@example.com"
                className="w-full h-14 rounded-2xl bg-zinc-50 px-12 text-sm focus:ring-2 focus:ring-accent outline-none border border-zinc-100 transition-all focus:bg-white"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-black transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Password</label>
              <a href="#" className="text-xs font-bold text-zinc-400 hover:text-black transition-colors">Forgot password?</a>
            </div>
            <div className="relative group">
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full h-14 rounded-2xl bg-zinc-50 px-12 text-sm focus:ring-2 focus:ring-accent outline-none border border-zinc-100 transition-all focus:bg-white"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-black transition-colors" />
            </div>
          </div>

          <button className="w-full h-14 bg-black text-white rounded-2xl font-bold mt-4 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-black/5">
            Log in
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-100"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
            <span className="bg-white px-6 text-zinc-300">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 h-14 border border-zinc-100 bg-white rounded-2xl hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-bold">Google</span>
          </button>
          <button className="flex items-center justify-center gap-3 h-14 border border-zinc-100 bg-white rounded-2xl hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            <span className="text-sm font-bold">GitHub</span>
          </button>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-12 font-medium">
          Don't have an account? <a href="/signup" className="text-black font-bold underline underline-offset-4 decoration-accent decoration-4 hover:decoration-black transition-all">Sign up</a>
        </p>
      </motion.div>
    </div>
  );
}
