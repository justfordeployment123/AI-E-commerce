"use client";

import { useEffect, useRef, useState } from "react";
import { catalogCategoriesApi, type CatalogCategoryItem } from "../../../lib/api";
import { Plus, Pencil, Trash2, Upload, Check, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Form = { name: string; slug: string; description: string; isActive: boolean };
const empty: Form = { name: "", slug: "", description: "", isActive: true };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Slugs that belong to the "Others" group — mirrors the Navbar grouping
const OTHERS_SLUGS = new Set([
  "accessories", "cables", "chargers", "memory", "storage",
  "mouse", "pen", "graphics", "lens",
  "smartwatches", "games", "films",
  "other", "others",
]);

export default function CategoriesPage() {
  const [cats, setCats] = useState<CatalogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const pendingUploadId = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    catalogCategoriesApi.list(true).then(setCats).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function startEdit(c: CatalogCategoryItem) {
    setEditing(c.id); setError("");
    setForm({ name: c.name, slug: c.slug, description: c.description ?? "", isActive: c.isActive });
  }
  function startCreate() { setEditing("new"); setForm(empty); setError(""); }
  function cancel() { setEditing(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (editing === "new") {
        await catalogCategoriesApi.create({ name: form.name, slug: form.slug, description: form.description || undefined, isActive: form.isActive });
      } else if (editing) {
        await catalogCategoriesApi.update(editing, { name: form.name, slug: form.slug, description: form.description || undefined, isActive: form.isActive });
      }
      cancel(); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    await catalogCategoriesApi.delete(id).catch(() => {});
    load();
  }

  async function handleFile(file: File) {
    const id = pendingUploadId.current; if (!id) return;
    setUploadingId(id);
    try { await catalogCategoriesApi.uploadImage(id, file); load(); }
    catch (e: any) { setError(e.message); }
    finally { setUploadingId(null); pendingUploadId.current = null; }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/catalog-mgmt" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-1">
            <ArrowLeft className="h-3 w-3" /> Catalog Management
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Categories</h1>
        </div>
        <button onClick={startCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800">
          <Plus className="h-3.5 w-3.5" /> Add category
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4 text-sm">{editing === "new" ? "New category" : "Edit category"}</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Name</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing === "new" ? slugify(e.target.value) : f.slug }))} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Slug</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm font-mono"
                value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Description</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold mb-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active
          </label>
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="h-8 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancel} className="h-8 px-4 rounded-xl border border-zinc-200 text-xs font-bold">Cancel</button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : (() => {
        const mainCats   = cats.filter(c => !OTHERS_SLUGS.has(c.slug));
        const othersCats = cats.filter(c =>  OTHERS_SLUGS.has(c.slug));

        const renderTable = (rows: CatalogCategoryItem[]) => (
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Slug</th>
                  <th className="text-left px-5 py-3">Images</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-center px-3 py-3">Sellable</th>
                  <th className="text-center px-3 py-3">Repairable</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {rows.map(cat => (
                  <tr key={cat.id} className="hover:bg-zinc-50/50">
                    <td className="px-5 py-3 font-semibold text-zinc-900">{cat.name}</td>
                    <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{cat.slug}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(cat.images ?? []).map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt="" className="h-8 w-8 rounded-lg object-cover border border-zinc-100" />
                            <button
                              onClick={async () => {
                                setUploadingId(cat.id);
                                try { await catalogCategoriesApi.deleteImage(cat.id, img); load(); }
                                catch (e: any) { setError(e.message); }
                                finally { setUploadingId(null); }
                              }}
                              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >×</button>
                          </div>
                        ))}
                        {(cat.images ?? []).length < 10 && (
                          <button onClick={() => { pendingUploadId.current = cat.id; fileRef.current?.click(); }}
                            disabled={uploadingId === cat.id}
                            className="h-8 w-8 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 flex items-center justify-center text-zinc-300 hover:text-zinc-500 transition-colors">
                            {uploadingId === cat.id ? <div className="h-3 w-3 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" /> : <Upload className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                        {cat.isActive ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* Sellable toggle */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => {
                          const next = !cat.isSellable;
                          setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isSellable: next } : c));
                          catalogCategoriesApi.update(cat.id, { isSellable: next }).catch(() =>
                            setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isSellable: !next } : c))
                          );
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${cat.isSellable ? "bg-emerald-500" : "bg-zinc-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${cat.isSellable ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    {/* Repairable toggle */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => {
                          const next = !cat.isRepairable;
                          setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isRepairable: next } : c));
                          catalogCategoriesApi.update(cat.id, { isRepairable: next }).catch(() =>
                            setCats(prev => prev.map(c => c.id === cat.id ? { ...c, isRepairable: !next } : c))
                          );
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${cat.isRepairable ? "bg-blue-500" : "bg-zinc-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${cat.isRepairable ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {cat.image && <button onClick={() => { pendingUploadId.current = cat.id; fileRef.current?.click(); }} className="text-zinc-300 hover:text-zinc-600"><Upload className="h-3.5 w-3.5" /></button>}
                        <button onClick={() => startEdit(cat)} className="text-zinc-300 hover:text-zinc-700"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(cat.id)} className="text-zinc-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">None.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        );

        return (
          <div className="space-y-8">
            {/* Main device categories */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Main Categories</h2>
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-[10px] font-bold text-zinc-300">{mainCats.length}</span>
              </div>
              {renderTable(mainCats)}
            </div>

            {/* Others (accessories, games, films, smartwatches…) */}
            {othersCats.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Other Categories</h2>
                  <div className="flex-1 h-px bg-zinc-100" />
                  <span className="text-[10px] font-bold text-zinc-300">{othersCats.length}</span>
                </div>
                {renderTable(othersCats)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
