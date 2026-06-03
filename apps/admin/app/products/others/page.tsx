"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Edit2, Trash2, X, Check, Package,
  Image as ImageIcon, ChevronDown, ExternalLink, AlertTriangle,
} from "lucide-react";
import {
  productsApi, deviceCatalogApi,
  type Product, type CreateProductPayload, type DeviceCatalogItem,
} from "../../../lib/api";

// Categories that belong to "others" — includes both slugs and display names
const OTHERS_SLUGS = [
  // slugs
  "accessories", "cables", "chargers", "memory", "storage",
  "mouse", "pen", "graphics", "lens",
  "smartwatches", "games", "films",
  "other", "others",
  // display names (as returned by productsApi — p.category is the name)
  "camera lenses", "graphics cards", "mouse & peripherals", "stylus & pens",
];
const CONDITIONS = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];
const EMPTY_FORM: CreateProductPayload = {
  catalogId: "", name: "", condition: "Pristine",
  storage: "", price: 0, comparePrice: undefined,
  stock: 10, description: "", isActive: true,
};

export default function OtherProductsPage() {
  const router = useRouter();
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData]   = useState<CreateProductPayload>(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  // Catalog device picker
  const [catalogDevices, setCatalogDevices] = useState<DeviceCatalogItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceCatalogItem | null>(null);
  const [deviceQuery, setDeviceQuery]       = useState("");
  const [pickerOpen, setPickerOpen]         = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await productsApi.list({ limit: 500 });
      // Keep only products that belong to "others" categories
      setProducts(res.items.filter(p => OTHERS_SLUGS.includes(p.category.toLowerCase())));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const tabs = ["All", ...Array.from(new Set(products.map(p => p.category))).sort()];
  const countFor = (cat: string) => products.filter(p => cat === "All" || p.category.toLowerCase() === cat.toLowerCase()).length;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || p.category.toLowerCase() === filterCat.toLowerCase();
    return matchSearch && matchCat;
  });

  const filteredCatalog = catalogDevices.filter(d => {
    const slug = d.brandCategory.category.slug.toLowerCase();
    if (!OTHERS_SLUGS.includes(slug)) return false;
    const q = deviceQuery.toLowerCase();
    return !q || d.brandCategory.brand.name.toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
  });

  function openAdd() {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setSelectedDevice(null);
    setDeviceQuery("");
    setPickerOpen(false);
    setError("");
    setShowModal(true);
    if (catalogDevices.length === 0) {
      deviceCatalogApi.list().then(setCatalogDevices).catch(() => {});
    }
  }

  function openEdit(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setEditProduct(p);
    setFormData({
      catalogId: p.catalogId, name: p.name, condition: p.condition,
      storage: p.storage, price: p.price, comparePrice: p.comparePrice,
      stock: p.stock, description: p.description ?? "", isActive: p.isActive, specs: p.specs,
    });
    setError("");
    setShowModal(true);
  }

  function selectCatalogDevice(dev: DeviceCatalogItem) {
    setSelectedDevice(dev);
    setDeviceQuery(`${dev.brandCategory.brand.name} ${dev.model}`);
    setPickerOpen(false);
    setFormData(f => ({
      ...f,
      catalogId: dev.id,
      name: `${dev.brandCategory.brand.name} ${dev.model}`,
      storage: dev.storageOptions[0] ?? "",
    }));
  }

  async function saveProduct() {
    setSaving(true);
    setError("");
    try {
      if (editProduct) {
        const updated = await productsApi.update(editProduct.id, formData);
        setProducts(ps => ps.map(p => p.id === editProduct.id ? updated : p));
      } else {
        const created = await productsApi.create(formData);
        if (OTHERS_SLUGS.includes(created.category.toLowerCase())) {
          setProducts(ps => [created, ...ps]);
        }
      }
      setShowModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    try {
      await productsApi.remove(id);
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch { /* ignore */ }
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/products" className="text-xs text-zinc-400 hover:text-black flex items-center gap-1 font-bold">
              Products
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-zinc-600 font-bold">Others</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Other Products</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Accessories, smartwatches, games, films &amp; more ·{" "}
            {products.length} total · {products.filter(p => p.isActive).length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/products"
            className="flex items-center gap-2 h-11 px-4 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:border-zinc-400 hover:text-black transition-colors bg-white">
            Back to Products
          </Link>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 h-11 px-5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[260px]">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-2xl bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all capitalize ${
                filterCat === cat ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"
              }`}
            >
              {cat} ({countFor(cat)})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Product</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Category</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Price</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Stock</th>
                <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.map(p => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-xl object-cover border border-zinc-100 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-4 w-4 text-zinc-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-500 font-medium capitalize">{p.category}</td>
                  <td className="px-4 py-4 text-right font-bold font-mono">
                    £{p.price}
                    {p.comparePrice && <span className="text-zinc-300 line-through ml-2 text-xs">£{p.comparePrice}</span>}
                  </td>
                  <td className={`px-4 py-4 text-right font-bold font-mono ${p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-500" : ""}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={e => openEdit(p, e)} className="h-8 w-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
                        <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeleteId(p.id); }} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No products found</p>
            <p className="text-xs mt-1">Run the seed to populate other products.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-4xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editProduct ? "Edit product" : "Add other product"}</h2>
                <button onClick={() => setShowModal(false)} className="h-9 w-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Device picker (add mode only) */}
                {!editProduct && (
                  <div className="flex flex-col gap-1.5" ref={pickerRef}>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Device <span className="text-zinc-300 font-normal normal-case tracking-normal">(from Device Catalog — others only)</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search — e.g. Apple MagSafe Charger"
                        value={deviceQuery}
                        onChange={e => { setDeviceQuery(e.target.value); setPickerOpen(true); setSelectedDevice(null); }}
                        onFocus={() => setPickerOpen(true)}
                        className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-10 pr-10 text-sm font-medium outline-none focus:border-black transition-colors"
                      />
                      {selectedDevice && <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />}
                      {!selectedDevice && deviceQuery && (
                        <button type="button" onClick={() => { setDeviceQuery(""); setSelectedDevice(null); setPickerOpen(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <AnimatePresence>
                        {pickerOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden"
                          >
                            {filteredCatalog.length === 0 ? (
                              <div className="px-4 py-5 text-center">
                                <p className="text-sm font-bold text-zinc-500 mb-1">Not in catalog</p>
                                <p className="text-xs text-zinc-400 mb-3">Register it in the Device Catalog first.</p>
                                <a href="/catalog" target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-black underline underline-offset-2">
                                  Go to Device Catalog <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ) : (
                              <div className="max-h-52 overflow-y-auto">
                                {filteredCatalog.slice(0, 30).map(dev => (
                                  <button
                                    key={dev.id}
                                    type="button"
                                    onMouseDown={e => { e.preventDefault(); selectCatalogDevice(dev); }}
                                    className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center gap-3 border-b border-zinc-50 last:border-0"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <span className="font-bold">{dev.brandCategory.brand.name}</span>{" "}
                                      <span className="text-zinc-700">{dev.model}</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">
                                      {dev.brandCategory.category.slug}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {selectedDevice ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-800">{selectedDevice.brandCategory.brand.name} {selectedDevice.model}</span>
                        <span className="text-emerald-600 ml-auto capitalize">{selectedDevice.brandCategory.category.name}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">
                        Not in catalog?{" "}
                        <a href="/catalog" target="_blank" className="font-bold text-zinc-600 hover:text-black underline underline-offset-2 inline-flex items-center gap-0.5">
                          Register it first <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {editProduct && (
                  <div className="px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100 text-sm">
                    <span className="font-bold text-zinc-700">{editProduct.brand} {editProduct.model}</span>
                    <span className="text-zinc-400 ml-2 capitalize">· {editProduct.category}</span>
                  </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Product name</label>
                  <input
                    type="text"
                    placeholder="Apple MagSafe Charger"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Price + Compare */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "price", label: "Price (£)", placeholder: "27.99" },
                    { key: "comparePrice", label: "RRP (£)", placeholder: "Optional" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                      <input
                        type="number"
                        placeholder={placeholder}
                        value={(formData[key as keyof CreateProductPayload] as number | undefined) ?? ""}
                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                        className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                      />
                    </div>
                  ))}
                </div>

                {/* Stock */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stock quantity</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.stock ?? ""}
                    onChange={e => setFormData(f => ({ ...f, stock: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Condition */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</label>
                  <div className="relative">
                    <select
                      value={formData.condition}
                      onChange={e => setFormData(f => ({ ...f, condition: e.target.value }))}
                      className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-4 pr-10 text-sm font-medium outline-none focus:border-black transition-colors bg-white appearance-none"
                    >
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Description (optional)</label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    value={formData.description ?? ""}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                    className={`h-6 w-10 rounded-full transition-colors relative shrink-0 ${formData.isActive ? "bg-black" : "bg-zinc-200"}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <label className="text-sm font-medium">{formData.isActive ? "Active (visible on site)" : "Hidden"}</label>
                </div>

                {error && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveProduct}
                  disabled={saving || (!editProduct && !formData.catalogId)}
                  className="flex-1 h-12 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                  {editProduct ? "Save changes" : "Add product"}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-sm shadow-2xl text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Delete this product?</h3>
              <p className="text-sm text-zinc-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 font-bold text-sm">Cancel</button>
                <button onClick={() => deleteProduct(deleteId)} className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
