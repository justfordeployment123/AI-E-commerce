"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { catalogApi, CatalogBrand, CatalogBrandCategory, CatalogCategory } from "../../../../../lib/api";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";

const MAX_IMAGES = 10;

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [brandCategories, setBrandCategories] = useState<CatalogBrandCategory[]>([]);
  const [allCategories, setAllCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignCategoryId, setAssignCategoryId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [uploadingBcId, setUploadingBcId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const pendingBcId = useRef<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Brand basic info: use listBrands and filter by id since GET /brands/:slug is slug-based
      const [brands, bcs, cats] = await Promise.all([
        catalogApi.listBrands(true),
        catalogApi.listBrandCategories({ includeInactive: true, brandId: id }),
        catalogApi.listCategories(true),
      ]);
      const found = brands.find(b => b.id === id);
      if (!found) { router.replace("/admin/catalog/brands"); return; }
      setBrand(found);
      setBrandCategories(bcs);
      setAllCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const assignedCategoryIds = new Set(brandCategories.map(bc => bc.categoryId));
  const unassignedCategories = allCategories.filter(c => !assignedCategoryIds.has(c.id));

  async function assign() {
    if (!assignCategoryId) return;
    setAssigning(true); setError("");
    try {
      await catalogApi.createBrandCategory({ brandId: id, categoryId: assignCategoryId });
      setAssignCategoryId("");
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setAssigning(false); }
  }

  async function unassign(bcId: string) {
    if (!confirm("Remove this brand–category assignment and all its images?")) return;
    await catalogApi.deleteBrandCategory(bcId).catch(() => {});
    await load();
  }

  async function handleImageFile(file: File) {
    const bcId = pendingBcId.current;
    if (!bcId) return;
    setUploadingBcId(bcId); setError("");
    try {
      await catalogApi.uploadBrandCategoryImage(bcId, file);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setUploadingBcId(null); pendingBcId.current = null; }
  }

  async function deleteImage(bcId: string, imageKey: string) {
    setError("");
    try {
      await catalogApi.deleteBrandCategoryImage(bcId, imageKey);
      await load();
    } catch (e: any) { setError(e.message); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="h-6 w-6 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" /></div>;
  }
  if (!brand) return null;

  return (
    <div>
      <Link href="/admin/catalog/brands" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to brands
      </Link>

      <div className="flex items-center gap-4 mb-8">
        {brand.logo && <img src={brand.logo} alt="" className="h-14 w-14 rounded-2xl object-contain bg-zinc-100 p-2" />}
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <p className="text-sm text-zinc-400">{brand.slug}</p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Assign to category */}
      {unassignedCategories.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <select
            className="flex-1 border border-zinc-200 rounded-xl px-3 py-2 text-sm"
            value={assignCategoryId}
            onChange={e => setAssignCategoryId(e.target.value)}
          >
            <option value="">Select a category to assign…</option>
            {unassignedCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={assign} disabled={!assignCategoryId || assigning}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-zinc-900 text-white text-sm font-bold disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Assign
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
      />

      {/* Brand-category sections */}
      <div className="space-y-6">
        {brandCategories.map(bc => (
          <div key={bc.id} className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">{bc.category.name}</h2>
                <p className="text-xs text-zinc-400">{(bc.images as string[]).length}/{MAX_IMAGES} images</p>
              </div>
              <button onClick={() => unassign(bc.id)} className="text-zinc-400 hover:text-red-500 flex items-center gap-1 text-xs font-bold">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {(bc.images as string[]).map((img, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-zinc-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => deleteImage(bc.id, img)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              ))}

              {/* Upload slot */}
              {(bc.images as string[]).length < MAX_IMAGES && (
                <button
                  onClick={() => { pendingBcId.current = bc.id; fileRef.current?.click(); }}
                  disabled={uploadingBcId === bc.id}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {uploadingBcId === bc.id ? (
                    <div className="h-5 w-5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span className="text-[10px] font-bold">Add image</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {brandCategories.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-400">
            No category assignments yet. Use the selector above to assign this brand to a category.
          </div>
        )}
      </div>
    </div>
  );
}
