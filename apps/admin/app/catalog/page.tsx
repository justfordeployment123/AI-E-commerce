"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, X, Check,
  Smartphone, Tablet, Gamepad2, Laptop, Headphones,
  ChevronDown, ToggleLeft, ToggleRight
} from "lucide-react";

type Category = "phones" | "tablets" | "consoles" | "laptops" | "accessories";

const CATEGORY_META: Record<Category, { label: string; icon: React.ElementType; color: string }> = {
  phones:      { label: "Phones",      icon: Smartphone, color: "bg-blue-500/10 text-blue-400" },
  tablets:     { label: "Tablets",     icon: Tablet,     color: "bg-rose-500/10 text-rose-400" },
  consoles:    { label: "Consoles",    icon: Gamepad2,   color: "bg-violet-500/10 text-violet-400" },
  laptops:     { label: "Laptops",     icon: Laptop,     color: "bg-amber-500/10 text-amber-400" },
  accessories: { label: "Accessories", icon: Headphones, color: "bg-emerald-500/10 text-emerald-400" },
};

interface Device {
  id: number;
  brand: string;
  model: string;
  category: Category;
  storageOptions: string[];
  active: boolean;
}

const INITIAL_DEVICES: Device[] = [
  { id: 1,  brand: "Apple",   model: "iPhone 15 Pro",     category: "phones",      storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"], active: true },
  { id: 2,  brand: "Apple",   model: "iPhone 15",         category: "phones",      storageOptions: ["128 GB", "256 GB", "512 GB"], active: true },
  { id: 3,  brand: "Apple",   model: "iPhone 14 Pro",     category: "phones",      storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB"], active: true },
  { id: 4,  brand: "Apple",   model: "iPhone 14",         category: "phones",      storageOptions: ["128 GB", "256 GB", "512 GB"], active: true },
  { id: 5,  brand: "Apple",   model: "iPhone 13",         category: "phones",      storageOptions: ["128 GB", "256 GB", "512 GB"], active: true },
  { id: 6,  brand: "Samsung", model: "Galaxy S24 Ultra",  category: "phones",      storageOptions: ["256 GB", "512 GB", "1 TB"], active: true },
  { id: 7,  brand: "Samsung", model: "Galaxy S24",        category: "phones",      storageOptions: ["128 GB", "256 GB"], active: true },
  { id: 8,  brand: "Google",  model: "Pixel 8 Pro",       category: "phones",      storageOptions: ["128 GB", "256 GB"], active: true },
  { id: 9,  brand: "Apple",   model: "iPad Pro 12.9\" M2",category: "tablets",     storageOptions: ["128 GB", "256 GB", "512 GB", "1 TB", "2 TB"], active: true },
  { id: 10, brand: "Apple",   model: "iPad Air M1",       category: "tablets",     storageOptions: ["64 GB", "256 GB"], active: true },
  { id: 11, brand: "Samsung", model: "Galaxy Tab S9 Ultra",category: "tablets",    storageOptions: ["256 GB", "512 GB"], active: true },
  { id: 12, brand: "Sony",    model: "PlayStation 5",     category: "consoles",    storageOptions: ["825 GB"], active: true },
  { id: 13, brand: "Microsoft",model: "Xbox Series X",   category: "consoles",    storageOptions: ["1 TB"], active: true },
  { id: 14, brand: "Nintendo",model: "Switch OLED",       category: "consoles",    storageOptions: ["64 GB"], active: true },
  { id: 15, brand: "Apple",   model: "MacBook Pro 14\" M3",category: "laptops",   storageOptions: ["512 GB", "1 TB"], active: true },
  { id: 16, brand: "Apple",   model: "MacBook Air M2",    category: "laptops",     storageOptions: ["256 GB", "512 GB"], active: true },
  { id: 17, brand: "Dell",    model: "XPS 13 Plus",       category: "laptops",     storageOptions: ["512 GB", "1 TB"], active: true },
  { id: 18, brand: "Sony",    model: "WH-1000XM5",        category: "accessories", storageOptions: ["—"], active: true },
  { id: 19, brand: "Apple",   model: "AirPods Pro 2nd Gen",category: "accessories",storageOptions: ["—"], active: true },
];

const CATEGORIES: Category[] = ["phones", "tablets", "consoles", "laptops", "accessories"];

const EMPTY_FORM = {
  brand: "",
  model: "",
  category: "phones" as Category,
  storageOptions: [""],
  active: true,
};

export default function CatalogPage() {
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  const filtered = devices.filter(d => {
    const matchesCat = filterCat === "all" || d.category === filterCat;
    const q = search.toLowerCase();
    const matchesSearch = !q || d.brand.toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(d: Device) {
    setEditId(d.id);
    setForm({ brand: d.brand, model: d.model, category: d.category, storageOptions: [...d.storageOptions], active: d.active });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditId(null);
  }

  function saveModal() {
    const storageClean = form.storageOptions.map(s => s.trim()).filter(Boolean);
    if (!form.brand.trim() || !form.model.trim() || !storageClean.length) return;

    if (editId !== null) {
      setDevices(prev => prev.map(d => d.id === editId ? { ...d, ...form, storageOptions: storageClean } : d));
    } else {
      const newId = Math.max(0, ...devices.map(d => d.id)) + 1;
      setDevices(prev => [...prev, { id: newId, ...form, storageOptions: storageClean }]);
    }
    closeModal();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleActive(id: number) {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, active: !d.active } : d));
  }

  function confirmDelete() {
    if (deleteId !== null) {
      setDevices(prev => prev.filter(d => d.id !== deleteId));
      setDeleteId(null);
    }
  }

  function updateStorage(idx: number, val: string) {
    setForm(f => { const s = [...f.storageOptions]; s[idx] = val; return { ...f, storageOptions: s }; });
  }

  function addStorageSlot() {
    setForm(f => ({ ...f, storageOptions: [...f.storageOptions, ""] }));
  }

  function removeStorageSlot(idx: number) {
    setForm(f => ({ ...f, storageOptions: f.storageOptions.filter((_, i) => i !== idx) }));
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Device Catalog</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            Manage which device models appear in the trade-in wizard.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
              >
                <Check className="h-3.5 w-3.5" /> Saved
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Device
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search brand or model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl bg-white border border-zinc-200 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterCat("all")}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors ${filterCat === "all" ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}
          >
            All ({devices.length})
          </button>
          {CATEGORIES.map(cat => {
            const meta = CATEGORY_META[cat];
            const count = devices.filter(d => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors ${filterCat === cat ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {CATEGORIES.map(cat => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = devices.filter(d => d.category === cat && d.active).length;
          const total = devices.filter(d => d.category === cat).length;
          return (
            <div key={cat} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-400 truncate">{meta.label}</p>
                <p className="font-bold text-lg text-zinc-900 leading-none">{count}<span className="text-xs font-medium text-zinc-300">/{total}</span></p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="grid grid-cols-[2fr_3fr_1.5fr_2fr_auto_auto] text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-6 py-3 border-b border-zinc-100 bg-zinc-50">
          <span>Brand</span>
          <span>Model</span>
          <span>Category</span>
          <span>Storage Options</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        <div className="divide-y divide-zinc-50">
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-zinc-400 font-medium">
                No devices match your filters.
              </div>
            ) : (
              filtered.map(device => {
                const meta = CATEGORY_META[device.category];
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={device.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-[2fr_3fr_1.5fr_2fr_auto_auto] items-center px-6 py-4 hover:bg-zinc-50/60 transition-colors"
                  >
                    <span className="text-sm font-bold text-zinc-900">{device.brand}</span>
                    <span className="text-sm font-medium text-zinc-700">{device.model}</span>
                    <span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${meta.color}`}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {device.storageOptions.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md text-[11px] font-medium">{s}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => toggleActive(device.id)}
                      className="flex items-center gap-1.5 text-xs font-bold transition-colors"
                      title={device.active ? "Disable" : "Enable"}
                    >
                      {device.active
                        ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                        : <ToggleLeft className="h-6 w-6 text-zinc-300" />}
                    </button>
                    <div className="flex items-center gap-2 pl-4">
                      <button
                        onClick={() => openEdit(device)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(device.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <h2 className="font-bold text-lg">{editId !== null ? "Edit Device" : "Add Device"}</h2>
                <button onClick={closeModal} className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Brand</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                      placeholder="e.g. Apple"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Category</label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 appearance-none transition-all"
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
                    type="text"
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    placeholder='e.g. iPhone 15 Pro'
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Storage Options</label>
                    <button
                      type="button"
                      onClick={addStorageSlot}
                      className="text-[11px] font-bold text-zinc-500 hover:text-black flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.storageOptions.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={s}
                          onChange={e => updateStorage(idx, e.target.value)}
                          placeholder='e.g. 256 GB'
                          className="flex-1 h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
                        />
                        {form.storageOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStorageSlot(idx)}
                            className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors"
                          >
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
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                    className="transition-colors"
                  >
                    {form.active
                      ? <ToggleRight className="h-8 w-8 text-emerald-500" />
                      : <ToggleLeft className="h-8 w-8 text-zinc-300" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <button
                  onClick={closeModal}
                  className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModal}
                  className="flex-1 h-11 rounded-2xl bg-zinc-950 text-white text-sm font-bold hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                >
                  {editId !== null ? "Save changes" : "Add device"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Remove device?</h3>
              <p className="text-sm text-zinc-400 mb-7">
                This device will be removed from the trade-in wizard immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 h-11 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
