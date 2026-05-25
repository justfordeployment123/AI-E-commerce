"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Phone, Plus, Trash2, Edit2, Check, X,
  PhoneCall, Save, ToggleLeft, ToggleRight, GripVertical
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

interface Helpline {
  id: string; label: string; number: string;
  isActive: boolean; order: number;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ts_admin_token") : null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

export default function HelplinesPage() {
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<Helpline[]>("/admin/support/helplines")
      .then(data => setHelplines(data.sort((a, b) => a.order - b.order)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!newLabel.trim() || !newNumber.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/admin/support/helplines", {
        method: "POST",
        body: JSON.stringify({ label: newLabel.trim(), number: newNumber.trim(), order: helplines.length }),
      });
      setNewLabel(""); setNewNumber(""); setShowAdd(false);
      load();
    } finally { setSaving(false); }
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    try {
      await apiFetch(`/admin/support/helplines/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: editLabel.trim(), number: editNumber.trim() }),
      });
      setEditId(null); load();
    } finally { setSaving(false); }
  }

  async function handleToggle(h: Helpline) {
    await apiFetch(`/admin/support/helplines/${h.id}`, {
      method: "PATCH", body: JSON.stringify({ isActive: !h.isActive }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this helpline number? This cannot be undone.")) return;
    await apiFetch(`/admin/support/helplines/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(h: Helpline) {
    setEditId(h.id);
    setEditLabel(h.label);
    setEditNumber(h.number);
    setShowAdd(false);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Helpline Numbers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            These numbers appear on the customer Help page so customers can call TechStop directly.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          className="flex items-center gap-2 h-11 px-5 rounded-2xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Number
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-base text-zinc-900 mb-5">New Helpline Number</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">Label *</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Sales, Support, Repairs"
                className="w-full h-11 px-4 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">Phone Number *</label>
              <input
                value={newNumber}
                onChange={e => setNewNumber(e.target.value)}
                placeholder="e.g. 0116 123 4567"
                className="w-full h-11 px-4 rounded-2xl border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={saving || !newLabel.trim() || !newNumber.trim()}
              className="h-10 px-5 rounded-2xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewLabel(""); setNewNumber(""); }}
              className="h-10 px-5 rounded-2xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-3xl border border-zinc-200 animate-pulse" />)}
        </div>
      ) : helplines.length === 0 && !showAdd ? (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
          <Phone className="h-12 w-12 text-zinc-200" strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-bold text-base text-zinc-500">No helpline numbers yet</p>
            <p className="text-sm mt-1">Add your first number so customers can reach you.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 flex items-center gap-2 h-10 px-5 rounded-2xl bg-black text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Number
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-3 border-b border-zinc-100 bg-zinc-50">
            <div className="w-5" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Label</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Number</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</p>
            <div className="w-8" />
            <div className="w-8" />
          </div>

          {helplines.map((h, i) => (
            <div
              key={h.id}
              className={`grid grid-cols-[auto_1fr_1fr_auto_auto_auto] items-center gap-4 px-6 py-4 transition-colors ${i !== helplines.length - 1 ? "border-b border-zinc-100" : ""} ${editId === h.id ? "bg-zinc-50" : "hover:bg-zinc-50/60"}`}
            >
              {/* Drag handle (visual only) */}
              <GripVertical className="h-4 w-4 text-zinc-300" />

              {/* Label */}
              {editId === h.id ? (
                <input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 outline-none w-full"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <PhoneCall className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="font-bold text-sm text-zinc-900">{h.label}</p>
                </div>
              )}

              {/* Number */}
              {editId === h.id ? (
                <input
                  value={editNumber}
                  onChange={e => setEditNumber(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-zinc-300 text-sm text-zinc-900 font-mono placeholder-zinc-400 focus:border-zinc-500 outline-none w-full"
                />
              ) : (
                <p className="text-sm font-mono text-zinc-600">{h.number}</p>
              )}

              {/* Toggle */}
              <button onClick={() => handleToggle(h)} className="flex items-center gap-2 transition-colors group">
                {h.isActive
                  ? <><ToggleRight className="h-5 w-5 text-emerald-500" /><span className="text-xs font-bold text-emerald-600">Active</span></>
                  : <><ToggleLeft className="h-5 w-5 text-zinc-300" /><span className="text-xs font-bold text-zinc-400">Inactive</span></>}
              </button>

              {/* Edit / Save actions */}
              {editId === h.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSaveEdit(h.id)} disabled={saving} className="h-8 w-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditId(null)} className="h-8 w-8 rounded-xl border border-zinc-200 text-zinc-500 flex items-center justify-center hover:border-zinc-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => startEdit(h)} className="h-8 w-8 rounded-xl border border-zinc-200 text-zinc-500 flex items-center justify-center hover:border-zinc-400 hover:text-zinc-700 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Delete */}
              {editId !== h.id && (
                <button onClick={() => handleDelete(h.id)} className="h-8 w-8 rounded-xl border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {editId === h.id && <div className="w-8" />}
            </div>
          ))}
        </div>
      )}

      {/* Info footer */}
      {helplines.length > 0 && (
        <p className="text-xs text-zinc-400 mt-4 text-center">
          {helplines.filter(h => h.isActive).length} of {helplines.length} numbers are currently visible to customers.
        </p>
      )}
    </div>
  );
}
