"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Filter, Edit2, Trash2, X, Check,
  Package, ChevronDown, Eye, Upload, Star
} from "lucide-react";

const GRADES = ["Pristine", "Excellent", "Very Good", "Good", "Fair"];
const CATEGORIES = ["Phones", "Tablets", "Consoles", "Laptops", "Accessories"];

const MOCK_PRODUCTS = [
  { id: 1, name: "iPhone 14 Pro", category: "Phones", grade: "Excellent", storage: "256 GB", price: 579, stock: 4, sku: "IP14P-256-EX", active: true },
  { id: 2, name: "MacBook Air M2", category: "Laptops", grade: "Pristine", storage: "512 GB SSD", price: 899, stock: 2, sku: "MBA-M2-512-PR", active: true },
  { id: 3, name: "Samsung Galaxy S23", category: "Phones", grade: "Very Good", storage: "128 GB", price: 349, stock: 7, sku: "SGS23-128-VG", active: true },
  { id: 4, name: "PS5 Disc Edition", category: "Consoles", grade: "Excellent", storage: "825 GB", price: 399, stock: 1, sku: "PS5-DE-EX", active: true },
  { id: 5, name: "iPad Air 5th Gen", category: "Tablets", grade: "Excellent", storage: "64 GB", price: 389, stock: 3, sku: "IPA5-64-EX", active: true },
  { id: 6, name: "Nintendo Switch OLED", category: "Consoles", grade: "Good", storage: "64 GB", price: 189, stock: 5, sku: "NSW-OLED-GO", active: false },
  { id: 7, name: "Sony WH-1000XM5", category: "Accessories", grade: "Pristine", storage: "—", price: 219, stock: 8, sku: "WH1000-PR", active: true },
  { id: 8, name: "iPhone 13", category: "Phones", grade: "Good", storage: "128 GB", price: 299, stock: 0, sku: "IP13-128-GO", active: true },
];

type Product = typeof MOCK_PRODUCTS[0];

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "", category: "Phones", grade: "Excellent", storage: "", price: 0, stock: 0, sku: "", active: true
};

export default function ProductsPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(EMPTY_PRODUCT);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  function openAdd() {
    setEditProduct(null);
    setFormData(EMPTY_PRODUCT);
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setFormData({ name: p.name, category: p.category, grade: p.grade, storage: p.storage, price: p.price, stock: p.stock, sku: p.sku, active: p.active });
    setShowModal(true);
  }

  function saveProduct() {
    if (editProduct) {
      setProducts(ps => ps.map(p => p.id === editProduct.id ? { ...p, ...formData } : p));
    } else {
      setProducts(ps => [...ps, { id: Date.now(), ...formData }]);
    }
    setShowModal(false);
  }

  function deleteProduct(id: number) {
    setProducts(ps => ps.filter(p => p.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">{products.length} total — {products.filter(p => p.stock === 0).length} out of stock</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 h-11 px-5 bg-black text-white rounded-[1rem] text-sm font-bold hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-[1rem] bg-white border border-zinc-200 pl-11 pr-5 text-sm font-medium outline-none focus:border-black transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {["All", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`h-11 px-4 rounded-[1rem] text-sm font-bold transition-all ${filterCategory === cat ? "bg-black text-white" : "bg-white border border-zinc-200 hover:border-zinc-400"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Product</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Category</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Grade</th>
              <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Price</th>
              <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Stock</th>
              <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">{p.sku} · {p.storage}</p>
                </td>
                <td className="px-4 py-4 text-zinc-500 font-medium">{p.category}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{p.grade}</span>
                </td>
                <td className="px-4 py-4 text-right font-bold font-mono">£{p.price}</td>
                <td className={`px-4 py-4 text-right font-bold font-mono ${p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-500" : ""}`}>
                  {p.stock}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => openEdit(p)} className="h-8 w-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
                      <Edit2 className="h-3.5 w-3.5 text-zinc-400" />
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm">No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editProduct ? "Edit product" : "Add new product"}</h2>
                <button onClick={() => setShowModal(false)} className="h-9 w-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { key: "name", label: "Product name", type: "text", placeholder: "iPhone 14 Pro" },
                  { key: "sku", label: "SKU", type: "text", placeholder: "IP14P-256-EX" },
                  { key: "storage", label: "Storage / Spec", type: "text", placeholder: "256 GB" },
                  { key: "price", label: "Price (£)", type: "number", placeholder: "579" },
                  { key: "stock", label: "Stock quantity", type: "number", placeholder: "3" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[key as keyof typeof formData] as string | number}
                      onChange={e => setFormData(f => ({ ...f, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                      className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                      className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors bg-white"
                    >
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Grade</label>
                    <select
                      value={formData.grade}
                      onChange={e => setFormData(f => ({ ...f, grade: e.target.value }))}
                      className="h-12 rounded-[0.875rem] border-2 border-zinc-200 px-4 text-sm font-medium outline-none focus:border-black transition-colors bg-white"
                    >
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFormData(f => ({ ...f, active: !f.active }))}
                    className={`h-6 w-10 rounded-full transition-colors relative flex-shrink-0 ${formData.active ? "bg-black" : "bg-zinc-200"}`}
                  >
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${formData.active ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <label className="text-sm font-medium">{formData.active ? "Active (visible on site)" : "Hidden (not visible)"}</label>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-[1rem] border-2 border-zinc-200 font-bold text-sm hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveProduct} className="flex-1 h-12 rounded-[1rem] bg-black text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> {editProduct ? "Save changes" : "Add product"}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-[1.5rem] p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="font-bold text-lg mb-2">Delete product?</h3>
              <p className="text-sm text-zinc-500 mb-6">This action cannot be undone. The product will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-[1rem] border-2 border-zinc-200 font-bold text-sm">Cancel</button>
                <button onClick={() => deleteProduct(deleteId)} className="flex-1 h-11 rounded-[1rem] bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
