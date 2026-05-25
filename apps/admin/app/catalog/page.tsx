"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, X, Check,
  Smartphone, Tablet, Gamepad2, Laptop, Headphones, ChevronDown, ToggleLeft, ToggleRight
} from "lucide-react";
import { deviceCatalogApi, type DeviceCatalogItem } from "../../lib/api";

type Category = "phones" | "tablets" | "consoles" | "laptops" | "accessories";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  phones:      { label: "Phones",      icon: Smartphone, color: "bg-blue-500/10 text-blue-400" },
  tablets:     { label: "Tablets",     icon: Tablet,     color: "bg-rose-500/10 text-rose-400" },
  consoles:    { label: "Consoles",    icon: Gamepad2,   color: "bg-violet-500/10 text-violet-400" },
  laptops:     { label: "Laptops",     icon: Laptop,     color: "bg-amber-500/10 text-amber-400" },
  accessories: { label: "Accessories", icon: Headphones, color: "bg-emerald-500/10 text-emerald-400" },
};

const CATEGORIES: Category[] = ["phones", "tablets", "consoles", "laptops", "accessories"];

const EMPTY_FORM = { brand: "", model: "", category: "phones" as Category, storageOptions: [""], isActive: true };

export default function CatalogPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<DeviceCatalogItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const items = await deviceCatalogApi.list();
      setDevices(items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = devices.filter(d => {
    const matchesCat = filterCat === "all" || d.category.toLowerCase() === filterCat;
    const q = search.toLowerCase();
    const matchesSearch = !q || d.brand.toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(d: DeviceCatalogItem) {
    setEditItem(d);
    setForm({ brand: d.brand, model: d.model, category: d.category as Category, storageOptions: [...d.storageOptions], isActive: d.isActive });
    setModalOpen(true);
  }

  function closeModal() { setModalOpen(false); setEditItem(null); }

  async function saveModal() {
    const storageClean = form.storageOptions.map(s => s.trim()).filter(Boolean);
    if (!form.brand.trim() || !form.model.trim() || !storageClean.length) return;
    setSaving(true);
    try {
      if (editItem) {
        const updated = await deviceCatalogApi.update(editItem.id, { ...form, storageOptions: storageClean });
        setDevices(ds => ds.map(d => d.id === editItem.id ? updated : d));
      } else {
        const created = await deviceCatalogApi.create({ ...form, storageOptions: storageClean });
        setDevices(ds => [...ds, created]);
      }
      closeModal();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const updated = await deviceCatalogApi.update(id, { isActive: !current });
      setDevices(ds => ds.map(d => d.id === id ? updated : d));
    } catch { /* ignore */ }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deviceCatalogApi.remove(deleteId);
      setDevices(ds => ds.filter(d => d.id !== deleteId));
      setDeleteId(null);
    } catch { /* ignore */ }
    finally { setDeleting(false); }
  }

  function updateStorage(idx: number, val: string) {
    setForm(f => { const s = [...f.storageOptions]; s[idx] = val; return { ...f, storageOptions: s }; });
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Device Catalog</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">Manage which device models appear in the trade-in wizard.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Device
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search brand or model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl bg-white border border-zinc-200 pl-9 pr-4 text-sm outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat("all")}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors ${filterCat === "all" ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}
          >
            All ({devices.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors ${filterCat === cat ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}
            >
              {CATEGORY_META[cat].label} ({devices.filter(d => d.category.toLowerCase() === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const active = devices.filter(d => d.category.toLowerCase() === cat && d.isActive).length;
          const total = devices.filter(d => d.category.toLowerCase() === cat).length;
          return (
            <div key={cat} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-400 truncate">{meta.label}</p>
                <p className="font-bold text-lg text-zinc-900 leading-none">{active}<span className="text-xs font-medium text-zinc-300">/{total}</span></p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="grid grid-cols-[2fr_3fr_1.5fr_2fr_auto_auto] text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-6 py-3 border-b border-zinc-100 bg-zinc-50">
          <span>Brand</span><span>Model</span><span>Category</span><span>Storage Options</span><span>Status</span><span>Actions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            <AnimatePresence initial={false}>
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-zinc-400 font-medium">
                  {devices.length === 0 ? "No devices yet. Add your first device." : "No devices match your filters."}
                </div>
              ) : filtered.map(device => {
                const meta = CATEGORY_META[device.category] ?? CATEGORY_META.phones;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={device.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => router.push(`/catalog/${device.id}`)}
                    className="grid grid-cols-[2fr_3fr_1.5fr_2fr_auto_auto] items-center px-6 py-4 hover:bg-zinc-50/60 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-zinc-900">{device.brand}</span>
                    <span className="text-sm font-medium text-zinc-700">{device.model}</span>
                    <span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${meta.color}`}>
                        <Icon className="h-3 w-3" />{meta.label}
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {device.storageOptions.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md text-[11px] font-medium">{s}</span>
                      ))}
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleActive(device.id, device.isActive); }} title={device.isActive ? "Disable" : "Enable"}>
                      {device.isActive
                        ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                        : <ToggleLeft className="h-6 w-6 text-zinc-300" />}
                    </button>
                    <div className="flex items-center gap-2 pl-4">
                      <button onClick={e => { e.stopPropagation(); openEdit(device); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteId(device.id); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7"
            >
              <div className="flex items-center justify-between mb-7">
                <h2 className="font-bold text-lg">{editItem ? "Edit Device" : "Add Device"}</h2>
                <button onClick={closeModal} className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Brand</label>
                    <input
                      type="text" value={form.brand}
                      onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                      placeholder="e.g. Apple"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Category</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black appearance-none transition-colors"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Model Name</label>
                  <input
                    type="text" value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. iPhone 15 Pro"
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Storage Options</label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, storageOptions: [...f.storageOptions, ""] }))} className="text-[11px] font-bold text-zinc-500 hover:text-black flex items-center gap-1 transition-colors">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.storageOptions.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text" value={s}
                          onChange={e => updateStorage(idx, e.target.value)}
                          placeholder="e.g. 256 GB"
                          className="flex-1 h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black transition-colors"
                        />
                        {form.storageOptions.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, storageOptions: f.storageOptions.filter((_, i) => i !== idx) }))} className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400">Use "—" for devices without storage variants.</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                  <div>
                    <p className="text-sm font-bold">Active in trade-in wizard</p>
                    <p className="text-xs text-zinc-400">Inactive devices are hidden from customers.</p>
                  </div>
                  <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                    {form.isActive ? <ToggleRight className="h-8 w-8 text-emerald-500" /> : <ToggleLeft className="h-8 w-8 text-zinc-300" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <button onClick={closeModal} className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors">
                  Cancel
                </button>
                <button onClick={saveModal} disabled={saving} className="flex-1 h-11 rounded-2xl bg-zinc-950 text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                  {editItem ? "Save changes" : "Add device"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Remove device?</h3>
              <p className="text-sm text-zinc-400 mb-7">This device will be removed from the trade-in wizard immediately.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting} className="flex-1 h-11 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
                  {deleting ? "Removing..." : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
