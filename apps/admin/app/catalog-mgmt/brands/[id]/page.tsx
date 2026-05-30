"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { catalogBrandsApi, catalogCategoriesApi, catalogBrandCategoryApi, type CatalogBrandItem, type BrandCategoryOption, type CatalogCategoryItem } from "../../../../lib/api";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";

const MAX_IMAGES = 10;

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [brand, setBrand] = useState<CatalogBrandItem | null>(null);
  const [bcs, setBcs] = useState<BrandCategoryOption[]>([]);
  const [allCats, setAllCats] = useState<CatalogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignCatId, setAssignCatId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [uploadingBcId, setUploadingBcId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pendingBcId = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [brands, bcList, cats] = await Promise.all([
        catalogBrandsApi.list(true),
        catalogBrandCategoryApi.list({ includeInactive: true, brandId: id }),
        catalogCategoriesApi.list(true),
      ]);
      const found = brands.find(b => b.id === id);
      if (!found) { router.replace("/catalog-mgmt/brands"); return; }
      setBrand(found); setBcs(bcList); setAllCats(cats);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const assignedCatIds = new Set(bcs.map(bc => bc.categoryId));
  const unassigned = allCats.filter(c => !assignedCatIds.has(c.id));

  async function assign() {
    if (!assignCatId) return;
    setAssigning(true); setError("");
    try { await catalogBrandCategoryApi.create({ brandId: id, categoryId: assignCatId }); setAssignCatId(""); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setAssigning(false); }
  }

  async function unassign(bcId: string) {
    if (!confirm("Remove this brand–category link and all its images?")) return;
    await catalogBrandCategoryApi.delete(bcId).catch(() => {});
    await load();
  }

  async function handleFile(file: File) {
    const bcId = pendingBcId.current; if (!bcId) return;
    setUploadingBcId(bcId); setError("");
    try { await catalogBrandCategoryApi.uploadImage(bcId, file); await load(); }
    catch (e: any) { setError(e.message); }
    finally { setUploadingBcId(null); pendingBcId.current = null; }
  }

  async function deleteImage(bcId: string, key: string) {
    setError("");
    try { await catalogBrandCategoryApi.deleteImage(bcId, key); await load(); }
    catch (e: any) { setError(e.message); }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="h-6 w-6 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
    </div>
  );
  if (!brand) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <Link href="/catalog-mgmt/brands" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-4">
        <ArrowLeft className="h-3 w-3" /> Back to brands
      </Link>

      <div className="flex items-center gap-4 mb-6">
        {brand.logo && <img src={brand.logo} alt="" className="h-12 w-12 rounded-xl object-contain bg-zinc-100 p-1.5" />}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{brand.name}</h1>
          <p className="text-xs text-zinc-400 font-mono">{brand.slug}</p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Assign */}
      {unassigned.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <select value={assignCatId} onChange={e => setAssignCatId(e.target.value)}
            className="flex-1 h-9 border border-zinc-200 rounded-xl px-3 text-sm">
            <option value="">Assign to a category…</option>
            {unassigned.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={assign} disabled={!assignCatId || assigning}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" /> Assign
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      <div className="space-y-5">
        {bcs.map(bc => (
          <div key={bc.id} className="bg-white border border-zinc-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-zinc-900">{bc.category.name}</h2>
                <p className="text-[10px] text-zinc-400">{(bc.images as string[]).length}/{MAX_IMAGES} images</p>
              </div>
              <button onClick={() => unassign(bc.id)} className="text-zinc-400 hover:text-red-500 flex items-center gap-1 text-xs">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {(bc.images as string[]).map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => deleteImage(bc.id, img)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              {(bc.images as string[]).length < MAX_IMAGES && (
                <button
                  onClick={() => { pendingBcId.current = bc.id; fileRef.current?.click(); }}
                  disabled={uploadingBcId === bc.id}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {uploadingBcId === bc.id
                    ? <div className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    : <><Upload className="h-4 w-4" /><span className="text-[9px] font-bold">Add</span></>}
                </button>
              )}
            </div>
          </div>
        ))}
        {bcs.length === 0 && (
          <div className="bg-white border border-zinc-100 rounded-2xl p-8 text-center text-sm text-zinc-400">
            No category assignments yet. Use the selector above.
          </div>
        )}
      </div>
    </div>
  );
}
