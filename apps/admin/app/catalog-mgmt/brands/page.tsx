"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { catalogBrandsApi, type CatalogBrandItem } from "../../../lib/api";
import { Plus, Pencil, Trash2, Upload, Check, X, ArrowLeft } from "lucide-react";

type Form = { name: string; slug: string; isActive: boolean };
const empty: Form = { name: "", slug: "", isActive: true };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Slugs that belong to the "Main Brands" group
const MAIN_BRANDS_SLUGS = new Set([
  "apple", "samsung", "google", "oneplus", "asus", "sony", "microsoft"
]);

export default function BrandsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldCreate = searchParams?.get("create") === "true";

  const [brands, setBrands] = useState<CatalogBrandItem[]>([]);
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
    catalogBrandsApi.list(true).then(setBrands).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (shouldCreate) {
      startCreate();
    }
  }, [shouldCreate]);

  function startEdit(b: CatalogBrandItem) {
    setEditing(b.id); setError("");
    setForm({ name: b.name, slug: b.slug, isActive: b.isActive });
  }
  function startCreate() { setEditing("new"); setForm(empty); setError(""); }
  function cancel() { setEditing(null); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (editing === "new") {
        await catalogBrandsApi.create({ name: form.name, slug: form.slug, isActive: form.isActive });
      } else if (editing) {
        await catalogBrandsApi.update(editing, { name: form.name, slug: form.slug, isActive: form.isActive });
      }
      cancel(); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this brand?")) return;
    await catalogBrandsApi.delete(id).catch(() => {});
    load();
  }

  async function handleFile(file: File) {
    const id = pendingUploadId.current; if (!id) return;
    setUploadingId(id);
    try { await catalogBrandsApi.uploadLogo(id, file); load(); }
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
          <h1 className="text-2xl font-bold text-zinc-900">Brands</h1>
        </div>
        <button onClick={startCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800">
          <Plus className="h-3.5 w-3.5" /> Add brand
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4 text-sm">{editing === "new" ? "New brand" : "Edit brand"}</h2>
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
        const mainBrands   = brands.filter(b =>  MAIN_BRANDS_SLUGS.has(b.slug));
        const othersBrands = brands.filter(b => !MAIN_BRANDS_SLUGS.has(b.slug));

        const renderTable = (rows: CatalogBrandItem[]) => (
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <th className="text-left px-5 py-3">Brand</th>
                  <th className="text-left px-5 py-3">Slug</th>
                  <th className="text-left px-5 py-3">Logo</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {rows.map(brand => (
                  <tr key={brand.id} className="hover:bg-zinc-50/50 cursor-pointer" onClick={() => router.push(`/catalog-mgmt/brands/${brand.id}`)}>
                    <td className="px-5 py-3 font-semibold text-zinc-900">{brand.name}</td>
                    <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{brand.slug}</td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      {brand.logo
                        ? <img src={brand.logo} alt="" className="h-8 w-8 rounded-lg object-contain bg-zinc-100 p-1" />
                        : <button onClick={(e) => { e.stopPropagation(); pendingUploadId.current = brand.id; fileRef.current?.click(); }}
                            disabled={uploadingId === brand.id}
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700">
                            <Upload className="h-3 w-3" />{uploadingId === brand.id ? "…" : "Upload"}
                          </button>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${brand.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                        {brand.isActive ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                        {brand.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={(e) => { e.stopPropagation(); remove(brand.id); }} className="text-zinc-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
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
            {/* Main Brands */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Main Brands</h2>
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-[10px] font-bold text-zinc-300">{mainBrands.length}</span>
              </div>
              {renderTable(mainBrands)}
            </div>

            {/* Other Brands */}
            {othersBrands.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Other Brands</h2>
                  <div className="flex-1 h-px bg-zinc-100" />
                  <span className="text-[10px] font-bold text-zinc-300">{othersBrands.length}</span>
                </div>
                {renderTable(othersBrands)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
