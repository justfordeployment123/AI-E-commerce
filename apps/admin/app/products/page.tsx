"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit2, Trash2, X, Check, Package, Image as ImageIcon,
  ChevronDown, ExternalLink, AlertTriangle, Zap, ToggleLeft, ToggleRight,
  RefreshCw } from "lucide-react";
import { productsApi, deviceCatalogApi, productPricingApi, pricingConfigApi,
  type Product, type CreateProductPayload, type DeviceCatalogItem,
  type PricingRunResult } from "../../lib/api";

const CONDITIONS = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];

// These categories belong to Other Products page — excluded from main Products
// Includes both slugs AND display names (p.category returns the name from the API)
const OTHERS_SLUGS = new Set([
  // slugs
  "accessories", "cables", "chargers", "memory", "storage",
  "mouse", "pen", "graphics", "lens",
  "smartwatches", "games", "films",
  "other", "others",
  // display names (as returned by productsApi)
  "camera lenses", "graphics cards", "mouse & peripherals", "stylus & pens",
  "chargers", "cables", "memory", "storage",
]);

const EMPTY_FORM: CreateProductPayload = {
  catalogId: "", name: "", condition: "Excellent",
  storage: "", price: 0, comparePrice: undefined,
  stock: 0, description: "", isActive: true,
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showModal, setShowModal]   = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData]     = useState<CreateProductPayload>(EMPTY_FORM);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllInput, setDeleteAllInput] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const [filterStatus, setFilterStatus]       = useState<string>("All");
  const [autoPricing, setAutoPricing]         = useState(false);
  const [autoPriceResult, setAutoPriceResult] = useState<PricingRunResult | null>(null);
  const [togglingId, setTogglingId]           = useState<string | null>(null);
  const [showUnpriced, setShowUnpriced]       = useState(false);
  const [savingUnpriced, setSavingUnpriced]   = useState(false);

  // Pricing panel state (modal)
  const [estimate, setEstimate]               = useState<import("../../lib/api").EstimateResult | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [pricingProductId, setPricingProductId] = useState<string | null>(null);

  // Catalog device picker (used only in ADD mode)
  const [catalogDevices, setCatalogDevices]   = useState<DeviceCatalogItem[]>([]);
  const [selectedDevice, setSelectedDevice]   = useState<DeviceCatalogItem | null>(null);
  const [deviceQuery, setDeviceQuery]         = useState("");
  const [pickerOpen, setPickerOpen]           = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
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
      setProducts(res.items.filter(p => !p.otherBrandId));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const loadProducts = load;

  useEffect(() => {
    load();
    pricingConfigApi.list()
      .then(configs => {
        const c = configs.find(x => x.key === 'show_unpriced_products');
        setShowUnpriced((c?.value ?? 0) === 1);
      })
      .catch(() => {});
  }, []);

  async function toggleShowUnpriced() {
    setSavingUnpriced(true);
    const next = !showUnpriced;
    try {
      await pricingConfigApi.upsert('show_unpriced_products', next ? 1 : 0, 'Show unpriced products on storefront (0=hide, 1=show)');
      setShowUnpriced(next);
    } catch { /* ignore */ }
    finally { setSavingUnpriced(false); }
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" ||
      p.category.toLowerCase() === filterCategory.toLowerCase();
    const matchStatus = filterStatus === "All"
      || (filterStatus === "Flagged" && p.pricingStatus === "flagged")
      || (filterStatus === "No Price" && p.price == null)
      || (filterStatus === "Auto-priced" && p.pricingStatus === "auto_priced");
    const isOther = OTHERS_SLUGS.has(p.category?.toLowerCase());
    return matchSearch && matchCat && matchStatus && !isOther;
  });

  const filteredCatalog = catalogDevices.filter(d => {
    const q = deviceQuery.toLowerCase();
    return !q || d.brandCategory.brand.name.toLowerCase().includes(q) || d.model.toLowerCase().includes(q);
  });

  // Filter device picker in Add mode to exclude OTHERS categories
  function openAdd() {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setSelectedDevice(null);
    setDeviceQuery("");
    setPickerOpen(false);
    setError("");
    setShowModal(true);
    if (catalogDevices.length === 0) {
      deviceCatalogApi.list()
        .then(items => setCatalogDevices(items.filter(d => !OTHERS_SLUGS.has(d.brandCategory.category.slug.toLowerCase()))))
        .catch(() => {});
    }
  }

  function openEdit(p: Product, e: React.MouseEvent) {
    e.stopPropagation();
    setEditProduct(p);
    setFormData({
      catalogId: p.catalogId, name: p.name, condition: p.condition,
      storage: p.storage, price: p.price, comparePrice: p.comparePrice,
      stock: p.stock, description: p.description ?? "",
      isActive: p.isActive, specs: p.specs,
    });
    setError("");
    setShowModal(true);
    if (p.catalogId && p.brand && p.model) {
      loadEstimate(p.brand, p.model, p.storage ?? '', p.condition);
    }
  }

  function selectCatalogDevice(dev: DeviceCatalogItem) {
    const firstStorage = dev.storageOptions[0] ?? "";
    setSelectedDevice(dev);
    setDeviceQuery(`${dev.brandCategory.brand.name} ${dev.model}`);
    setPickerOpen(false);
    const suggestedName = `${dev.brandCategory.brand.name} ${dev.model}${firstStorage ? ` ${firstStorage}` : ""}`;
    setFormData(f => ({
      ...f,
      catalogId: dev.id,
      name: suggestedName,
      storage: firstStorage,
    }));
    const brand = dev.brandCategory.brand.name;
    loadEstimate(brand, dev.model, firstStorage, formData.condition);
  }

  async function handleDeleteAll() {
    setDeletingAll(true);
    setError("");
    try {
      await productsApi.removeAll();
      setProducts([]);
      setShowDeleteAll(false);
      setDeleteAllInput("");
    } catch (e: any) {
      setError(e.message || "Delete failed. Please try again.");
    } finally {
      setDeletingAll(false);
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
        setProducts(ps => [created, ...ps]);
      }
      setShowModal(false);
      setEstimate(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product");
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

  async function handleAutoPrice() {
    setAutoPricing(true);
    setAutoPriceResult(null);
    try {
      const result = await productPricingApi.run();
      setAutoPriceResult(result);
      loadProducts();
      setTimeout(() => setAutoPriceResult(null), 6000);
    } catch (e: any) {
      alert(e.message ?? "Auto-pricing failed");
    } finally {
      setAutoPricing(false);
    }
  }

  async function handleToggleActive(product: Product) {
    setTogglingId(product.id);
    try {
      await productsApi.update(product.id, { isActive: !product.isActive });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p));
    } catch (e: any) {
      alert(e.message ?? "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  }

  async function loadEstimate(brand: string, model: string, storage: string, condition: string) {
    if (!brand || !model) return;
    setLoadingEstimate(true);
    setEstimate(null);
    try {
      const result = await productPricingApi.estimate(brand, model, storage, condition);
      setEstimate(result);
    } catch {
      setEstimate(null);
    } finally {
      setLoadingEstimate(false);
    }
  }

  const storage = (p: Product) => p.storage || "—";
  const mainProducts = products.filter(p => !OTHERS_SLUGS.has(p.category?.toLowerCase()));
  const countFor = (cat: string) => mainProducts.filter(p =>
    cat === "All" ? true : p.category.toLowerCase() === cat.toLowerCase()
  ).length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {products.length} total · {products.filter(p => p.isActive).length} active · {products.filter(p => p.stock === 0).length} out of stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleShowUnpriced}
            disabled={savingUnpriced}
            title={showUnpriced ? "Unpriced products visible on storefront — click to hide" : "Unpriced products hidden from storefront — click to show"}
            className={`flex items-center gap-2 h-11 px-4 rounded-2xl text-sm font-bold border transition-colors ${
              showUnpriced
                ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-400"
            } disabled:opacity-50`}
          >
            {showUnpriced ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
            Unpriced on web
          </button>
          <Link
            href="/products/others"
            className="flex items-center gap-2 h-11 px-4 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 hover:border-zinc-400 hover:text-black transition-colors bg-white"
          >
            View Others
          </Link>
          <button
            onClick={() => { setShowDeleteAll(true); setDeleteAllInput(""); }}
            className="flex items-center gap-2 h-11 px-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-bold hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete All
          </button>
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
          {["All", ...Array.from(new Set(mainProducts.map(p => p.category))).sort()].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`h-11 px-4 rounded-2xl text-sm font-bold transition-all ${filterCategory === cat ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {cat} ({countFor(cat)})
            </button>
          ))}
        </div>
      </div>

      {/* Status filter tabs + Auto-price All */}
      <div className="flex items-center gap-2 flex-wrap mt-2 mb-4">
        {["All", "Auto-priced", "Flagged", "No Price"].map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              filterStatus === tab
                ? tab === "Flagged" ? "bg-amber-100 text-amber-700" : "bg-black text-white"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        {autoPriceResult && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
            ✓ {autoPriceResult.applied} priced · {autoPriceResult.flagged} flagged
          </span>
        )}
        <button
          onClick={handleAutoPrice}
          disabled={autoPricing}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {autoPricing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          Auto-price All
        </button>
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
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Price</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Stock</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Active</th>
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
                        <p className="text-xs text-zinc-400 mt-0.5">{p.brand} · {storage(p)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-500 font-medium capitalize">{p.category}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{p.condition}</span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold font-mono">
                    {p.price != null ? `£${p.price}` : <span className="text-zinc-400 italic text-xs font-normal">No price</span>}
                    {p.comparePrice && <span className="text-zinc-300 line-through ml-2 text-xs">£{p.comparePrice}</span>}
                  </td>
                  <td className={`px-4 py-4 text-right font-bold font-mono ${p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-500" : ""}`}>
                    {p.stock}
                  </td>
                  {/* Pricing status badge + stock badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {p.pricingStatus === 'auto_priced' && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg w-fit">Auto-priced</span>
                      )}
                      {p.pricingStatus === 'manual' && (
                        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-lg w-fit">Manual</span>
                      )}
                      {p.pricingStatus === 'flagged' && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg w-fit">⚠ Flagged</span>
                      )}
                      {(p.pricingStatus === 'no_data' || !p.pricingStatus) && (
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-lg w-fit">No price data</span>
                      )}
                      {p.stock === 0 && (
                        <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg w-fit">Out of stock</span>
                      )}
                    </div>
                  </td>

                  {/* Enable/disable toggle */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(p); }}
                      disabled={togglingId === p.id || (!p.isActive && (p.price == null || !p.images?.length))}
                      title={!p.isActive && p.price == null ? "Set a price to enable" : ""}
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 ${
                        p.isActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                      }`}
                    >
                      {togglingId === p.id
                        ? <RefreshCw className="h-3 w-3 animate-spin" />
                        : p.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />
                      }
                      {p.isActive ? "Live" : "Disabled"}
                    </button>
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
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEstimate(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-4xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editProduct ? "Edit product" : "Add new product"}</h2>
                <button onClick={() => { setShowModal(false); setEstimate(null); }} className="h-9 w-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">

                {/* ── ADD MODE: Device picker from catalog ──────────────────── */}
                {!editProduct && (
                  <div className="flex flex-col gap-1.5" ref={pickerRef}>
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Device <span className="text-zinc-300 font-normal normal-case tracking-normal">(from Device Catalog)</span>
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search catalog — e.g. iPhone 15 Pro"
                        value={deviceQuery}
                        onChange={e => {
                          setDeviceQuery(e.target.value);
                          setPickerOpen(true);
                          setSelectedDevice(null);
                          setFormData(f => ({ ...f, brand: "", model: "" }));
                        }}
                        onFocus={() => setPickerOpen(true)}
                        className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-10 pr-10 text-sm font-medium outline-none focus:border-black transition-colors"
                      />
                      {selectedDevice && (
                        <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                      )}
                      {!selectedDevice && deviceQuery && (
                        <button
                          type="button"
                          onClick={() => { setDeviceQuery(""); setSelectedDevice(null); setPickerOpen(false); setFormData(f => ({ ...f, brand: "", model: "" })); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 hover:text-zinc-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {/* Dropdown */}
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
                                <p className="text-xs text-zinc-400 mb-3">Devices must be registered in the catalog before listing them as products.</p>
                                <a
                                  href="/catalog"
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-black underline underline-offset-2"
                                >
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
                                      <span className="font-bold text-zinc-900">{dev.brandCategory.brand.name}</span>{" "}
                                      <span className="text-zinc-700">{dev.model}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{dev.brandCategory.category.slug}</span>
                                      {!dev.isActive && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">inactive</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selected device info badge */}
                    {selectedDevice ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-800">{selectedDevice.brandCategory.brand.name} {selectedDevice.model}</span>
                        <span className="text-emerald-600">· {selectedDevice.brandCategory.category.name}</span>
                        <span className="text-emerald-500 ml-auto">{selectedDevice.storageOptions.length} storage option{selectedDevice.storageOptions.length !== 1 ? "s" : ""}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">
                        Device not in the catalog?{" "}
                        <a href="/catalog" target="_blank" className="font-bold text-zinc-600 hover:text-black underline underline-offset-2 inline-flex items-center gap-0.5">
                          Register it first <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    )}
                  </div>
                )}

                {/* ── EDIT MODE: show device info read-only ──────────────── */}
                {editProduct && (
                  <div className="px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100 text-sm">
                    <span className="font-bold text-zinc-700">{editProduct.brand} {editProduct.model}</span>
                    <span className="text-zinc-400 ml-2">· {editProduct.category}</span>
                    <p className="text-xs text-zinc-400 mt-0.5">Device catalog entry — edit from the Device Catalog page.</p>
                  </div>
                )}

                {/* Product name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Product name</label>
                  <input
                    type="text"
                    placeholder="iPhone 14 Pro 256GB"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                  />
                  {!editProduct && selectedDevice && (
                    <p className="text-xs text-zinc-400">Auto-filled from device selection — edit as needed.</p>
                  )}
                </div>

                {/* Storage */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Storage / Spec</label>
                  {!editProduct && selectedDevice ? (
                    <div className="relative">
                      <select
                        value={formData.storage ?? ""}
                        onChange={e => {
                          const newStorage = e.target.value;
                          setFormData(f => ({
                            ...f,
                            storage: newStorage,
                            name: `${selectedDevice.brandCategory.brand.name} ${selectedDevice.model}${newStorage ? ` ${newStorage}` : ""}`,
                          }));
                          loadEstimate(selectedDevice.brandCategory.brand.name, selectedDevice.model, newStorage, formData.condition);
                        }}
                        className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-4 pr-10 text-sm font-medium outline-none focus:border-black transition-colors bg-white appearance-none"
                      >
                        {selectedDevice.storageOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="256 GB"
                      value={formData.storage ?? ""}
                      onChange={e => setFormData(f => ({ ...f, storage: e.target.value }))}
                      className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                    />
                  )}
                </div>

                {/* ── Pricing Intelligence Panel (catalog products only) ── */}
                {(editProduct?.catalogId || selectedDevice) && (
                  <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pricing Intelligence</p>

                    {loadingEstimate && (
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Loading competitor prices…
                      </div>
                    )}

                    {/* Scraped competitor prices table */}
                    {estimate?.scrapedPrices && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                          Competitor prices · {new Date(estimate.scrapedPrices.scrapedAt).toLocaleDateString('en-GB')}
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {([
                            { label: "CeX Sell",   value: estimate.scrapedPrices.cexSellPrice },
                            { label: "CeX Cash",   value: estimate.scrapedPrices.cexCashPrice },
                            { label: "Envirofone", value: estimate.scrapedPrices.envirofonePrice },
                            { label: "Best",       value: estimate.scrapedPrices.marketPrice },
                          ] as { label: string; value: number | null }[]).map(({ label, value }) => (
                            <div key={label} className="bg-white rounded-xl border border-zinc-200 px-3 py-2 text-center">
                              <p className="text-[10px] font-bold text-zinc-400">{label}</p>
                              <p className="text-sm font-bold text-zinc-800 mt-0.5">
                                {value !== null ? `£${value.toFixed(0)}` : <span className="text-zinc-300">—</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI estimate range bar */}
                    {estimate && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                          AI estimate range · {formData.condition}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-zinc-600">£{estimate.low}</span>
                          <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{
                                marginLeft: `${Math.min(90, Math.max(0,
                                  ((estimate.suggested - estimate.low) / Math.max(1, estimate.high - estimate.low)) * 80
                                ))}%`,
                                width: '10%',
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-zinc-600">£{estimate.high}</span>
                          <button
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, price: estimate.suggested }))}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0"
                          >
                            <Zap className="h-3 w-3" />
                            Auto-fill £{estimate.suggested}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Auto-price this product button (edit mode only) */}
                    {editProduct?.id && (
                      <button
                        type="button"
                        disabled={pricingProductId === editProduct.id}
                        onClick={async () => {
                          setPricingProductId(editProduct.id);
                          try {
                            const result = await productPricingApi.priceOne(editProduct.id);
                            if (result.candidatePrice !== undefined) {
                              setFormData(f => ({ ...f, price: result.candidatePrice! }));
                            }
                            await loadEstimate(
                              editProduct.brand, editProduct.model,
                              editProduct.storage ?? '', editProduct.condition,
                            );
                          } catch (e: any) {
                            alert(e.message ?? 'Pricing failed');
                          } finally {
                            setPricingProductId(null);
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 w-fit"
                      >
                        {pricingProductId === editProduct.id
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          : <Zap className="h-3.5 w-3.5" />
                        }
                        Auto-price this product
                      </button>
                    )}
                  </div>
                )}

                {/* Inline AI range feedback on price input */}
                {estimate && formData.price != null && formData.price > 0 && (
                  formData.price >= estimate.low && formData.price <= estimate.high ? (
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 -mt-1">
                      <Check className="h-3 w-3" /> Within AI range (£{estimate.low}–£{estimate.high})
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-amber-600 flex items-center gap-1 -mt-1">
                      <AlertTriangle className="h-3 w-3" /> Outside AI range (£{estimate.low}–£{estimate.high}) — you can still save
                    </p>
                  )
                )}

                {/* Price + Compare Price */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "price", label: "Price (£)", placeholder: "579" },
                    { key: "comparePrice", label: "Compare price (£)", placeholder: "Optional" },
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
                    placeholder="3"
                    value={formData.stock ?? ""}
                    onChange={e => setFormData(f => ({ ...f, stock: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                  />
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

                {/* Condition */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</label>
                  <div className="relative">
                    <select
                      value={formData.condition}
                      onChange={e => {
                        const newCondition = e.target.value;
                        setFormData(f => ({ ...f, condition: newCondition }));
                        if (selectedDevice) {
                          loadEstimate(selectedDevice.brandCategory.brand.name, selectedDevice.model, formData.storage ?? '', newCondition);
                        } else if (editProduct?.catalogId && editProduct.brand && editProduct.model) {
                          loadEstimate(editProduct.brand, editProduct.model, formData.storage ?? '', newCondition);
                        }
                      }}
                      className="h-12 w-full rounded-[0.875rem] border-2 border-zinc-200 pl-4 pr-10 text-sm font-medium outline-none focus:border-black transition-colors bg-white appearance-none"
                    >
                      {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFormData(f => ({ ...f, isActive: !f.isActive }))}
                    className={`h-6 w-10 rounded-full transition-colors relative shrink-0 ${formData.isActive ? "bg-black" : "bg-zinc-200"}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <label className="text-sm font-medium">{formData.isActive ? "Active (visible on site)" : "Hidden (not visible)"}</label>
                </div>

                {error && <p className="text-sm font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setShowModal(false); setEstimate(null); }} className="flex-1 h-12 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:bg-zinc-50 transition-colors">
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

      {/* Delete All confirm */}
      <AnimatePresence>
        {showDeleteAll && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-1 text-center">Delete all products?</h3>
              <p className="text-sm text-zinc-500 mb-5 text-center">This will permanently delete every product. This cannot be undone.</p>
              <p className="text-xs font-bold text-zinc-500 mb-2">Type <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">delete all</span> to confirm</p>
              <input
                type="text"
                value={deleteAllInput}
                onChange={e => { setDeleteAllInput(e.target.value); setError(""); }}
                placeholder="delete all"
                className="w-full h-11 rounded-xl border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-red-400 transition-colors mb-4"
              />
              {error && (
                <p className="text-xs text-red-600 font-medium mb-3 text-center">{error}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteAll(false); setError(""); }} className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 font-bold text-sm">Cancel</button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deleteAllInput !== "delete all" || deletingAll}
                  className="flex-1 h-11 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deletingAll ? "Deleting…" : "Delete All"}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Delete product?</h3>
              <p className="text-sm text-zinc-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-2xl border-2 border-zinc-200 font-bold text-sm">Cancel</button>
                <button onClick={() => deleteProduct(deleteId!)} className="flex-1 h-11 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
