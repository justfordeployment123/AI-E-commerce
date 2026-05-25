"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/auth-context";
import { authApi } from "../../../lib/api";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
  const [pendingReturn, setPendingReturn] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
      setAddress(user.address ?? "");
      setCity(user.city ?? "");
      setPostcode(user.postcode ?? "");
    }
    setPendingReturn(
      !!sessionStorage.getItem("ts_wizard_tradein") ||
      !!sessionStorage.getItem("ts_wizard_repair")
    );
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = postcode.trim().toUpperCase();
    if (trimmed && !UK_POSTCODE.test(trimmed)) {
      setPostcodeError("Enter a valid UK postcode (e.g. LE1 1AA)");
      return;
    }
    setPostcodeError("");
    setSaving(true);
    setMsg("");
    try {
      await authApi.updateProfile({ name, phone, address, city, postcode: trimmed || undefined });
      await refreshUser();
      if (sessionStorage.getItem("ts_wizard_tradein")) {
        router.push("/trade-in");
        return;
      }
      if (sessionStorage.getItem("ts_wizard_repair")) {
        router.push("/repair");
        return;
      }
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

      {pendingReturn && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
          Save your details below and you&apos;ll be taken straight back to your trade-in.
        </div>
      )}

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

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-5">Address</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Street address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 High Street"
                className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Leicester"
                className="h-14 rounded-2xl border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Postcode</label>
              <input
                type="text"
                value={postcode}
                onChange={e => { setPostcode(e.target.value); setPostcodeError(""); }}
                placeholder="LE1 1AA"
                className={`h-14 rounded-2xl border-2 px-5 text-sm font-medium outline-none transition-colors ${postcodeError ? "border-red-400 focus:border-red-500" : "border-zinc-200 focus:border-black"}`}
              />
              {postcodeError && (
                <p className="text-[11px] text-red-500 font-medium ml-1">{postcodeError}</p>
              )}
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
