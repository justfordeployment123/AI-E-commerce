"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Edit2, Trash2, X, Check, Package,
  Image as ImageIcon, ChevronDown, AlertTriangle,
} from "lucide-react";
import {
  productsApi, otherBrandsApi, otherSubcategoriesApi,
  type Product, type CreateProductPayload, type OtherBrand, type OtherSubcategory,
} from "../../../lib/api";

const CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'A',   label: 'A Grade' },
  { value: 'B',   label: 'B Grade' },
  { value: 'C',   label: 'C Grade' },
  { value: 'F',   label: 'F Grade' },
];

const EMPTY_FORM: CreateProductPayload = {
  otherBrandId: "",
  otherSubcategoryId: "",
  name: "",
  condition: "A",
  storage: "",
  price: 0,
  comparePrice: undefined,
  stock: 10,
  description: "",
  isActive: true,
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

  const [brands, setBrands]   = useState<OtherBrand[]>([]);
  const [subcats, setSubcats] = useState<OtherSubcategory[]>([]);

  // Brand picker
  const [brandOpen, setBrandOpen]         = useState(false);
  const [newBrandInput, setNewBrandInput] = useState("");
  const [addingBrand, setAddingBrand]     = useState(false);
  const [savingBrand, setSavingBrand]     = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);

  // Subcategory picker
  const [subcatOpen, setSubcatOpen]           = useState(false);
  const [newSubcatInput, setNewSubcatInput]   = useState("");
  const [addingSubcat, setAddingSubcat]       = useState(false);
  const [savingSubcat, setSavingSubcat]       = useState(false);
  const subcatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setBrandOpen(false);
      if (subcatRef.current && !subcatRef.current.contains(e.target as Node)) setSubcatOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await productsApi.list({ limit: 500 });
      setProducts(res.items.filter(p => !!p.otherBrandId));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function loadPickerData() {
    const [b, s] = await Promise.all([
      otherBrandsApi.list().catch(() => [] as OtherBrand[]),
      otherSubcategoriesApi.list().catch(() => [] as OtherSubcategory[]),
    ]);
    setBrands(b);
    setSubcats(s);
  }

  const tabs = ["All", ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()];
  const countFor = (cat: string) => products.filter(p => cat === "All" || p.category.toLowerCase() === cat.toLowerCase()).length;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || p.category.toLowerCase() === filterCat.toLowerCase();
    return matchSearch && matchCat;
  });

  function openAdd() {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setError("");
    setAddingBrand(false);
    setAddingSubcat(false);
    setNewBrandInput("");
    setNewSubcatInput("");
    setShowModal(true);
    loadPickerData();
  }

  function openEdit(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setEditProduct(p);
    setFormData({
      otherBrandId:       p.otherBrandId ?? "",
      otherSubcategoryId: p.otherSubcategoryId ?? "",
      name:        p.name,
      condition:   p.condition,
      storage:     p.storage,
      price:       p.price,
      comparePrice: p.comparePrice,
      stock:       p.stock,
      description: p.description ?? "",
      isActive:    p.isActive,
      specs:       p.specs,
    });
    setError("");
    setShowModal(true);
    loadPickerData();
  }

  async function handleAddBrand() {
    if (!newBrandInput.trim()) return;
    setSavingBrand(true);
    try {
      const created = await otherBrandsApi.create(newBrandInput.trim());
      setBrands(bs => [...bs, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(f => ({ ...f, otherBrandId: created.id }));
      setNewBrandInput("");
      setAddingBrand(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create brand");
    } finally {
      setSavingBrand(false);
    }
  }

  async function handleAddSubcat() {
    if (!newSubcatInput.trim()) return;
    setSavingSubcat(true);
    try {
      const created = await otherSubcategoriesApi.create(newSubcatInput.trim());
      setSubcats(ss => [...ss, created].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(f => ({ ...f, otherSubcategoryId: created.id }));
      setNewSubcatInput("");
      setAddingSubcat(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create subcategory");
    } finally {
      setSavingSubcat(false);
    }
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
        if (!created.catalogId) setProducts(ps => [created, ...ps]);
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

  const selectedBrand  = brands.find(b => b.id === formData.otherBrandId);
  const selectedSubcat = subcats.find(s => s.id === formData.otherSubcategoryId);
  const canSave = editProduct
    ? true
    : !!formData.otherBrandId && !!formData.otherSubcategoryId && !!formData.name && (formData.price ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
            Accessories, games, films, cables &amp; more ·{" "}
            {products.length} total · {products.filter(p => p.isActive).length} active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/products"
            className="flex items-center gap-2 h-11 px-4 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:border-zinc-400 hover:text-black transition-colors bg-white">
            Back to Products
          </Link>
          <button onClick={openAdd}
            className="flex items-center gap-2 h-11 px-5 bg-black text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-colors">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute inset-y-0 left-4 my-auto h-4 w-4 text-zinc-400 pointer-events-none" />
          <input type="text" placeholder="Search by name or brand..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-2xl bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -my-1 max-w-full">
          {tabs.map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all capitalize shrink-0 ${
                filterCat === cat ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"
              }`}>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
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
                <tr key={p.id} onClick={() => router.push(`/products/${p.id}`)}
                  className="hover:bg-zinc-50/50 transition-colors group cursor-pointer">
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
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No other products yet</p>
            <p className="text-xs mt-1">Click "Add product" to add your first one.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-4xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editProduct ? "Edit product" : "Add other product"}</h2>
                <button onClick={() => setShowModal(false)} className="h-9 w-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Subcategory picker */}
                <div className="flex flex-col gap-1.5" ref={subcatRef}>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Subcategory</label>
                  <div className="relative">
                    <button type="button" onClick={() => { setSubcatOpen(o => !o); setBrandOpen(false); }}
                      className={`h-12 w-full rounded-[0.875rem] border-2 px-4 text-sm font-medium text-left flex items-center justify-between transition-colors ${subcatOpen ? "border-black" : "border-zinc-200"}`}>
                      <span className={selectedSubcat ? "text-zinc-900" : "text-zinc-400"}>
                        {selectedSubcat ? selectedSubcat.name : "Select subcategory…"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${subcatOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {subcatOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {subcats.map(s => (
                              <button key={s.id} type="button"
                                onMouseDown={e => { e.preventDefault(); setFormData(f => ({ ...f, otherSubcategoryId: s.id })); setSubcatOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center justify-between border-b border-zinc-50 last:border-0 ${formData.otherSubcategoryId === s.id ? "font-bold" : ""}`}>
                                {s.name}
                                {formData.otherSubcategoryId === s.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                              </button>
                            ))}
                            {subcats.length === 0 && (
                              <p className="px-4 py-3 text-xs text-zinc-400">No subcategories yet — add one below.</p>
                            )}
                          </div>
                          <div className="border-t border-zinc-100 p-3">
                            {addingSubcat ? (
                              <div className="flex gap-2">
                                <input autoFocus type="text" value={newSubcatInput}
                                  onChange={e => setNewSubcatInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") handleAddSubcat();
                                    if (e.key === "Escape") { setAddingSubcat(false); setNewSubcatInput(""); }
                                  }}
                                  placeholder="Subcategory name…"
                                  className="flex-1 h-9 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-black transition-colors" />
                                <button onMouseDown={e => { e.preventDefault(); handleAddSubcat(); }}
                                  disabled={savingSubcat || !newSubcatInput.trim()}
                                  className="h-9 px-3 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                                  {savingSubcat ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
                                  Add
                                </button>
                                <button onMouseDown={e => { e.preventDefault(); setAddingSubcat(false); setNewSubcatInput(""); }}
                                  className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center">
                                  <X className="h-3.5 w-3.5 text-zinc-400" />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onMouseDown={e => { e.preventDefault(); setAddingSubcat(true); }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                                <Plus className="h-3.5 w-3.5" /> Add new subcategory
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Brand picker */}
                <div className="flex flex-col gap-1.5" ref={brandRef}>
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Brand</label>
                  <div className="relative">
                    <button type="button" onClick={() => { setBrandOpen(o => !o); setSubcatOpen(false); }}
                      className={`h-12 w-full rounded-[0.875rem] border-2 px-4 text-sm font-medium text-left flex items-center justify-between transition-colors ${brandOpen ? "border-black" : "border-zinc-200"}`}>
                      <span className={selectedBrand ? "text-zinc-900" : "text-zinc-400"}>
                        {selectedBrand ? selectedBrand.name : "Select brand…"}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${brandOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {brandOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute z-20 left-0 right-0 top-[calc(100%+4px)] bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {brands.map(b => (
                              <button key={b.id} type="button"
                                onMouseDown={e => { e.preventDefault(); setFormData(f => ({ ...f, otherBrandId: b.id })); setBrandOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center justify-between border-b border-zinc-50 last:border-0 ${formData.otherBrandId === b.id ? "font-bold" : ""}`}>
                                {b.name}
                                {formData.otherBrandId === b.id && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                              </button>
                            ))}
                            {brands.length === 0 && (
                              <p className="px-4 py-3 text-xs text-zinc-400">No brands yet — add one below.</p>
                            )}
                          </div>
                          <div className="border-t border-zinc-100 p-3">
                            {addingBrand ? (
                              <div className="flex gap-2">
                                <input autoFocus type="text" value={newBrandInput}
                                  onChange={e => setNewBrandInput(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") handleAddBrand();
                                    if (e.key === "Escape") { setAddingBrand(false); setNewBrandInput(""); }
                                  }}
                                  placeholder="Brand name…"
                                  className="flex-1 h-9 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-black transition-colors" />
                                <button onMouseDown={e => { e.preventDefault(); handleAddBrand(); }}
                                  disabled={savingBrand || !newBrandInput.trim()}
                                  className="h-9 px-3 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1">
                                  {savingBrand ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-3 w-3" />}
                                  Add
                                </button>
                                <button onMouseDown={e => { e.preventDefault(); setAddingBrand(false); setNewBrandInput(""); }}
                                  className="h-9 w-9 rounded-xl border border-zinc-200 flex items-center justify-center">
                                  <X className="h-3.5 w-3.5 text-zinc-400" />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onMouseDown={e => { e.preventDefault(); setAddingBrand(true); }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-bold text-zinc-500 hover:text-black transition-colors">
                                <Plus className="h-3.5 w-3.5" /> Add new brand
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Product name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Product name</label>
                  <input type="text" placeholder="e.g. Logitech MX Master 3" value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                </div>

                {/* Price + RRP */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "price", label: "Price (£)", placeholder: "29.99" },
                    { key: "comparePrice", label: "RRP (£)", placeholder: "Optional" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                      <input type="number" placeholder={placeholder}
                        value={(formData[key as keyof CreateProductPayload] as number | undefined) ?? ""}
                        onChange={e => setFormData(f => ({ ...f, [key]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                        className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                    </div>
                  ))}
                </div>

                {/* Stock */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stock quantity</label>
                  <input type="number" placeholder="10" value={formData.stock ?? ""}
                    onChange={e => setFormData(f => ({ ...f, stock: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                </div>

                {/* Condition */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</label>
                  <div className="relative">
                    <select value={formData.condition} onChange={e => setFormData(f => ({ ...f, condition: e.target.value }))}
                      className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-4 pr-10 text-sm font-medium outline-none focus:border-black transition-colors bg-white appearance-none">
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Description (optional)</label>
                  <input type="text" placeholder="Brief description…" value={formData.description ?? ""}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors" />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                    className={`h-6 w-10 rounded-full transition-colors relative shrink-0 ${formData.isActive ? "bg-black" : "bg-zinc-200"}`}>
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
                <button onClick={saveProduct} disabled={saving || !canSave}
                  className="flex-1 h-12 rounded-2xl bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
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
