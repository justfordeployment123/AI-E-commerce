"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/auth-context";
import { authApi } from "../../../lib/api";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await authApi.updateProfile({ name, phone });
      setMsg("Changes saved!");
    } catch {
      setMsg("Failed to save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-8">Account settings</h2>

      <form onSubmit={handleSave} className="space-y-8 max-w-lg">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-5">Personal info</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="h-14 rounded-[1rem] border-2 border-zinc-100 px-5 text-sm font-medium outline-none bg-zinc-50 text-zinc-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-zinc-400 ml-1">Email cannot be changed</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+44 7700 000000"
                className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="h-12 px-8 bg-black text-white rounded-[1rem] font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {msg && (
            <p className={`text-sm font-bold ${msg.includes("Failed") ? "text-red-500" : "text-emerald-600"}`}>
              {msg}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
