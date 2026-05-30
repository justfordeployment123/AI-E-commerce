"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, X, Check,
  Smartphone, Tablet, Gamepad2, Laptop, Headphones, ChevronDown,
  ToggleLeft, ToggleRight, RefreshCw, TrendingUp, CheckCircle2, AlertCircle, AlertTriangle,
} from "lucide-react";
import { deviceCatalogApi, catalogBrandCategoryApi, scraperApi, type DeviceCatalogItem, type BrandCategoryOption, type ScrapedPriceRow } from "../../lib/api";

const SCRAPER_ENABLED = process.env.NEXT_PUBLIC_SCRAPER_ENABLED === "true";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  phones:      { label: "Phones",      icon: Smartphone, color: "bg-blue-500/10 text-blue-400" },
  tablets:     { label: "Tablets",     icon: Tablet,     color: "bg-rose-500/10 text-rose-400" },
  consoles:    { label: "Consoles",    icon: Gamepad2,   color: "bg-violet-500/10 text-violet-400" },
  laptops:     { label: "Laptops",     icon: Laptop,     color: "bg-amber-500/10 text-amber-400" },
  accessories: { label: "Accessories", icon: Headphones, color: "bg-emerald-500/10 text-emerald-400" },
  audio:       { label: "Audio",       icon: Headphones, color: "bg-emerald-500/10 text-emerald-400" },
};

const EMPTY_FORM = { brandCategoryId: "", model: "", storageOptions: [""], isActive: true };

function priceRange(prices: (number | null)[]): string | null {
  const valid = prices.filter((p): p is number => p !== null && p > 0);
  if (!valid.length) return null;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return min === max ? `£${min}` : `£${min}–£${max}`;
}

// Helpers to extract flat brand/category from the nested response
function brandName(d: DeviceCatalogItem) { return d.brandCategory?.brand?.name ?? ""; }
function categorySlug(d: DeviceCatalogItem) { return d.brandCategory?.category?.slug ?? ""; }

export default function CatalogPage() {
  const router = useRouter();
  const [devices, setDevices]     = useState<DeviceCatalogItem[]>([]);
  const [brandCategories, setBrandCategories] = useState<BrandCategoryOption[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState<DeviceCatalogItem | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState("");

  const [priceMap, setPriceMap]   = useState<Map<string, number>>(new Map());
  const [scraping, setScraping]   = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState("");

  const loadPrices = useCallback(async () => {
    try {
      const res = await scraperApi.prices(1, 500);
      const map = new Map<string, number>();
      for (const row of res.items) {
        if (row.marketPrice !== null) map.set(row.deviceKey, row.marketPrice);
      }
      setPriceMap(map);
    } catch { /* non-fatal */ }
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [items, bcs] = await Promise.all([
        deviceCatalogApi.list(),
        catalogBrandCategoryApi.list().catch(() => [] as BrandCategoryOption[]),
      ]);
      setDevices(items);
      setBrandCategories(bcs);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); loadPrices(); }, [loadPrices]);

  // All unique category slugs present in loaded devices
  const presentCategories = [...new Set(devices.map(categorySlug).filter(Boolean))];

  const filtered = devices.filter(d => {
    const matchesCat = filterCat === "all" || categorySlug(d) === filterCat;
    const q = search.toLowerCase();
    const matchesSearch = !q || brandName(d).toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  async function handleScrape() {
    setScraping(true); setScrapeMsg("");
    try {
      const res = await scraperApi.run();
      setScrapeMsg(res.message);
      setTimeout(() => loadPrices(), 5000);
    } catch (e: any) {
      setScrapeMsg(e.message ?? "Failed to start scraper");
    } finally { setScraping(false); }
  }

  function openAdd() { setEditItem(null); setForm(EMPTY_FORM); setModalOpen(true); }

  async function handleDeleteAll() {
    setDeletingAll(true); setDeleteAllError("");
    try {
      await deviceCatalogApi.removeAll();
      setDevices([]); setShowDeleteAll(false); setDeleteAllInput("");
    } catch (e: any) {
      setDeleteAllError(e.message || "Delete failed. Please try again.");
    } finally { setDeletingAll(false); }
  }

  function openEdit(d: DeviceCatalogItem) {
    setEditItem(d);
    setForm({ brandCategoryId: d.brandCategoryId, model: d.model, storageOptions: [...d.storageOptions], isActive: d.isActive });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditItem(null); }

  async function saveModal() {
    const storageClean = form.storageOptions.map(s => s.trim()).filter(Boolean);
    if (!form.brandCategoryId || !form.model.trim() || !storageClean.length) return;
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

  function devicePriceRange(device: DeviceCatalogItem): string | null {
    const brand = brandName(device);
    const prices = device.storageOptions.map(storage => {
      const key = storage ? `${brand} ${device.model} ${storage}` : `${brand} ${device.model}`;
      return priceMap.get(key) ?? null;
    });
    return priceRange(prices);
  }

  const scrapeIsError = scrapeMsg.toLowerCase().includes("fail") || scrapeMsg.toLowerCase().includes("error");

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Device Catalog</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">Manage which device models appear in the trade-in wizard.</p>
        </div>
        <div className="flex items-center gap-3">
          {SCRAPER_ENABLED && (
            <button onClick={handleScrape} disabled={scraping}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-zinc-200 text-xs font-bold text-zinc-600 hover:border-zinc-400 hover:text-black transition-colors disabled:opacity-50">
              {scraping ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Scraping…</> : <><TrendingUp className="h-3.5 w-3.5" /> Scrape Prices</>}
            </button>
          )}
          <button onClick={() => { setShowDeleteAll(true); setDeleteAllInput(""); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete All
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
            <Plus className="h-4 w-4" /> Add Device
          </button>
        </div>
      </div>

      {/* Scrape result banner */}
      <AnimatePresence>
        {SCRAPER_ENABLED && scrapeMsg && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className={`flex items-center gap-3 rounded-2xl px-5 py-3 mb-5 text-sm font-bold ${scrapeIsError ? "bg-red-50 border border-red-100 text-red-700" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
            {scrapeIsError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {scrapeMsg}
            <button onClick={() => setScrapeMsg("")} className="ml-auto text-current opacity-50 hover:opacity-100"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input type="text" placeholder="Search brand or model..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl bg-white border border-zinc-200 pl-9 pr-4 text-sm outline-none focus:border-black transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat("all")}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors ${filterCat === "all" ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
            All ({devices.length})
          </button>
          {presentCategories.map(cat => {
            const meta = CATEGORY_META[cat] ?? { label: cat, icon: Smartphone, color: "bg-zinc-100 text-zinc-500" };
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition-colors ${filterCat === cat ? "bg-zinc-950 text-white" : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400"}`}>
                {meta.label} ({devices.filter(d => categorySlug(d) === cat).length})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className={`grid ${SCRAPER_ENABLED ? "grid-cols-[2fr_3fr_1.5fr_2fr_1.5fr_auto_auto]" : "grid-cols-[2fr_3fr_1.5fr_2fr_auto_auto]"} text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-6 py-3 border-b border-zinc-100 bg-zinc-50`}>
          <span>Brand</span><span>Model</span><span>Category</span><span>Storage Options</span>
          {SCRAPER_ENABLED && <span>CeX Price</span>}
          <span>Status</span><span>Actions</span>
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
                const slug = categorySlug(device);
                const meta = CATEGORY_META[slug] ?? { label: slug, icon: Smartphone, color: "bg-zinc-100 text-zinc-500" };
                const Icon = meta.icon;
                const range = devicePriceRange(device);
                return (
                  <motion.div key={device.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => router.push(`/catalog/${device.id}`)}
                    className={`grid ${SCRAPER_ENABLED ? "grid-cols-[2fr_3fr_1.5fr_2fr_1.5fr_auto_auto]" : "grid-cols-[2fr_3fr_1.5fr_2fr_auto_auto]"} items-center px-6 py-4 hover:bg-zinc-50/60 transition-colors cursor-pointer`}>
                    <span className="text-sm font-bold text-zinc-900">{brandName(device)}</span>
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
                    {SCRAPER_ENABLED && (
                      <span>
                        {range ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <TrendingUp className="h-3 w-3" />{range}
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-300 font-medium">No data</span>
                        )}
                      </span>
                    )}
                    <button onClick={e => { e.stopPropagation(); toggleActive(device.id, device.isActive); }} title={device.isActive ? "Disable" : "Enable"}>
                      {device.isActive ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-zinc-300" />}
                    </button>
                    <div className="flex items-center gap-2 pl-4">
                      <button onClick={e => { e.stopPropagation(); openEdit(device); }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteId(device.id); }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7">
              <div className="flex items-center justify-between mb-7">
                <h2 className="font-bold text-lg">{editItem ? "Edit Device" : "Add Device"}</h2>
                <button onClick={closeModal} className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Brand–Category picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Brand – Category</label>
                  <div className="relative">
                    <select value={form.brandCategoryId}
                      onChange={e => setForm(f => ({ ...f, brandCategoryId: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black appearance-none transition-colors">
                      <option value="">Select brand–category…</option>
                      {brandCategories.map(bc => (
                        <option key={bc.id} value={bc.id}>
                          {bc.brand.name} — {bc.category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  </div>
                  {brandCategories.length === 0 && (
                    <p className="text-[11px] text-amber-600">No brand-categories found. Create them first in the Catalog section.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Model Name</label>
                  <input type="text" value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. iPhone 15 Pro"
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Storage Options</label>
                    <button type="button" onClick={() => setForm(f => ({ ...f, storageOptions: [...f.storageOptions, ""] }))}
                      className="text-[11px] font-bold text-zinc-500 hover:text-black flex items-center gap-1 transition-colors">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.storageOptions.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" value={s} onChange={e => updateStorage(idx, e.target.value)}
                          placeholder="e.g. 256 GB"
                          className="flex-1 h-9 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm outline-none focus:border-black transition-colors" />
                        {form.storageOptions.length > 1 && (
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, storageOptions: f.storageOptions.filter((_, i) => i !== idx) }))}
                            className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors">
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
                <button onClick={saveModal} disabled={saving}
                  className="flex-1 h-11 rounded-2xl bg-zinc-950 text-white text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5"><Trash2 className="h-7 w-7 text-red-500" /></div>
              <h3 className="font-bold text-lg mb-2">Remove device?</h3>
              <p className="text-sm text-zinc-400 mb-7">This device will be removed from the trade-in wizard immediately.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors">Cancel</button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 h-11 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
                  {deleting ? "Removing..." : "Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete All confirm */}
      <AnimatePresence>
        {showDeleteAll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5"><AlertTriangle className="h-7 w-7 text-red-500" /></div>
              <h3 className="font-bold text-lg mb-1 text-center">Delete all devices?</h3>
              <p className="text-sm text-zinc-500 mb-5 text-center">This will permanently delete every device and all linked products. This cannot be undone.</p>
              <p className="text-xs font-bold text-zinc-500 mb-2">Type <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">delete all</span> to confirm</p>
              <input type="text" value={deleteAllInput}
                onChange={e => { setDeleteAllInput(e.target.value); setDeleteAllError(""); }}
                placeholder="delete all"
                className="w-full h-11 rounded-xl border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-red-400 transition-colors mb-4" />
              {deleteAllError && <p className="text-xs text-red-600 font-medium mb-3 text-center">{deleteAllError}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteAll(false); setDeleteAllError(""); }}
                  className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 text-sm font-bold hover:border-zinc-400 transition-colors">Cancel</button>
                <button onClick={handleDeleteAll} disabled={deleteAllInput !== "delete all" || deletingAll}
                  className="flex-1 h-11 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {deletingAll ? "Deleting…" : "Delete All"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
