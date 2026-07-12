"use client";

import { useState } from "react";
import { KeyRound, Save, Check, XCircle, User } from "lucide-react";
import { authApi } from "../../lib/api";
import { useAdminAuth } from "../../context/auth-context";

export default function AccountPage() {
  const { user } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (newPassword.length < 8) {
      setResult({ ok: false, message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResult({ ok: false, message: "New password and confirmation don't match." });
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setResult({ ok: true, message: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setResult({ ok: false, message: err?.message ?? "Failed to update password" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your admin login details.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 max-w-lg mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{user?.name ?? "—"}</p>
            <p className="text-xs text-zinc-500 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="h-4 w-4 text-zinc-400" />
          <p className="text-sm font-bold">Change Password</p>
        </div>

        {result && (
          <div className={`mb-5 flex items-center gap-3 p-3 rounded-xl border text-xs font-medium ${result.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {result.ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Current Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1.5">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            {saving
              ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="h-4 w-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
