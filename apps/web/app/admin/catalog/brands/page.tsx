"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { catalogApi, CatalogBrand } from "../../../../lib/api";
import { Pencil, Trash2, Plus, Upload, Check, X, ExternalLink } from "lucide-react";

type FormState = { name: string; slug: string; isActive: boolean };
const empty: FormState = { name: "", slug: "", isActive: true };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingUploadId, setPendingUploadId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    catalogApi.listBrands(true).then(setBrands).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function startEdit(brand: CatalogBrand) {
    setEditing(brand.id);
    setForm({ name: brand.name, slug: brand.slug, isActive: brand.isActive });
    setError("");
  }

  function startCreate() { setEditing("new"); setForm(empty); setError(""); }
  function cancelEdit() { setEditing(null); setForm(empty); setError(""); }

  async function save() {
    setSaving(true); setError("");
    try {
      if (editing === "new") {
        await catalogApi.createBrand({ name: form.name, slug: form.slug, isActive: form.isActive });
      } else if (editing) {
        await catalogApi.updateBrand(editing, { name: form.name, slug: form.slug, isActive: form.isActive });
      }
      cancelEdit(); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this brand?")) return;
    await catalogApi.deleteBrand(id).catch(() => {});
    load();
  }

  async function handleLogoFile(file: File) {
    if (!pendingUploadId) return;
    setUploadingId(pendingUploadId);
    try {
      await catalogApi.uploadBrandLogo(pendingUploadId, file);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUploadingId(null); setPendingUploadId(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-sm text-zinc-500">Manage brand logos and category assignments.</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-black">
          <Plus className="h-4 w-4" /> Add brand
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h2 className="font-bold mb-4">{editing === "new" ? "New brand" : "Edit brand"}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-1">Name</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing === "new" ? slugify(e.target.value) : f.slug }))}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 block mb-1">Slug</label>
              <input
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-4 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="h-9 px-4 rounded-xl bg-zinc-900 text-white text-sm font-bold disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelEdit} className="h-9 px-4 rounded-xl border border-zinc-200 text-sm font-bold">Cancel</button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); e.target.value = ""; }}
      />

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-2xl border border-zinc-200 animate-pulse" />)}</div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100">
              <tr className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Brand</th>
                <th className="text-left px-5 py-3">Slug</th>
                <th className="text-left px-5 py-3">Logo</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {brands.map(brand => (
                <tr key={brand.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-semibold">{brand.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{brand.slug}</td>
                  <td className="px-5 py-3">
                    {brand.logo ? (
                      <img src={brand.logo} alt="" className="h-8 w-8 rounded-lg object-contain bg-zinc-100 p-1" />
                    ) : (
                      <button onClick={() => { setPendingUploadId(brand.id); fileRef.current?.click(); }}
                        disabled={uploadingId === brand.id}
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700">
                        <Upload className="h-3 w-3" />
                        {uploadingId === brand.id ? "Uploading…" : "Upload"}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${brand.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {brand.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {brand.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/catalog/brands/${brand.id}`} className="text-zinc-400 hover:text-zinc-700" title="Manage categories & images">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      {brand.logo && (
                        <button onClick={() => { setPendingUploadId(brand.id); fileRef.current?.click(); }} className="text-zinc-400 hover:text-zinc-700">
                          <Upload className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => startEdit(brand)} className="text-zinc-400 hover:text-zinc-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(brand.id)} className="text-zinc-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-400">No brands yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
