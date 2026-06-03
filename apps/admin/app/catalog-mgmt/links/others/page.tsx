"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  catalogBrandsApi,
  catalogCategoriesApi,
  catalogBrandCategoryApi,
  type CatalogBrandItem,
  type BrandCategoryOption,
  type CatalogCategoryItem,
} from "../../../../lib/api";
import { ArrowLeft, Plus, Trash2, Upload, X, Check, AlertTriangle, Image as ImageIcon, ShoppingBag } from "lucide-react";

const MAX_IMAGES = 10;
const MAIN_CATEGORIES_SLUGS = new Set(["phones", "tablets", "consoles", "laptops", "audio"]);

export default function OtherBrandCategoryLinksPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<CatalogCategoryItem[]>([]);
  const [brands, setBrands] = useState<CatalogBrandItem[]>([]);
  const [bcs, setBcs] = useState<BrandCategoryOption[]>([]);
  const [activeCatId, setActiveCatId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [assignBrandId, setAssignBrandId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [uploadingBcId, setUploadingBcId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pendingBcId = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cats, brandList, bcList] = await Promise.all([
        catalogCategoriesApi.list(true),
        catalogBrandsApi.list(true),
        catalogBrandCategoryApi.list({ includeInactive: true }),
      ]);

      // Filter categories to only include other categories
      const filteredCats = cats.filter(
        (c) => !MAIN_CATEGORIES_SLUGS.has(c.slug.toLowerCase())
      );
      setCategories(filteredCats);
      setBrands(brandList);
      setBcs(bcList);

      if (filteredCats.length > 0 && !activeCatId) {
        setActiveCatId(filteredCats[0].id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCategory = categories.find((c) => c.id === activeCatId);
  const activeLinks = bcs.filter((bc) => bc.categoryId === activeCatId);

  // Find brands not yet linked to the active category
  const linkedBrandIds = new Set(activeLinks.map((bc) => bc.brandId));
  const unassignedBrands = brands.filter((b) => !linkedBrandIds.has(b.id));

  async function handleAssignBrand() {
    if (!assignBrandId || !activeCatId) return;

    if (assignBrandId === "create_new") {
      router.push("/catalog-mgmt/brands?create=true");
      return;
    }

    setAssigning(true);
    setError("");
    try {
      await catalogBrandCategoryApi.create({
        brandId: assignBrandId,
        categoryId: activeCatId,
      });
      setAssignBrandId("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign(bcId: string) {
    if (!confirm("Remove this brand–category link and all its images?")) return;
    try {
      await catalogBrandCategoryApi.delete(bcId);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleImageUpload(file: File) {
    const bcId = pendingBcId.current;
    if (!bcId) return;
    setUploadingBcId(bcId);
    setError("");
    try {
      await catalogBrandCategoryApi.uploadImage(bcId, file);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingBcId(null);
      pendingBcId.current = null;
    }
  }

  async function handleDeleteImage(bcId: string, imgUrl: string) {
    const link = bcs.find((bc) => bc.id === bcId);
    if (!link) return;

    // Minimum 1 image validation
    if (link.images.length <= 1) {
      alert(
        "Cannot delete the last image. A minimum of 1 image is required for this brand-category link. Please upload another image first."
      );
      return;
    }

    setError("");
    try {
      await catalogBrandCategoryApi.deleteImage(bcId, imgUrl);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/catalog-mgmt"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-bold mb-2 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Catalog Management
        </Link>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Other Brand–Category Links</h1>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Manage product presentation images associated with specific secondary/accessory brand/category combinations.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar: Categories */}
        <div className="md:col-span-1 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-3 mb-1">
            Other Categories
          </div>
          <div className="bg-white border border-zinc-100 rounded-3xl p-3 shadow-sm space-y-1">
            {categories.map((cat) => {
              const active = cat.id === activeCatId;
              const linkCount = bcs.filter((bc) => bc.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCatId(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                    active
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-black"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {linkCount}
                  </span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-zinc-100 mt-2">
              <Link
                href="/catalog-mgmt/links"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-400 bg-white text-zinc-600 hover:text-black text-xs font-bold transition-all shadow-sm"
              >
                Back to Links
              </Link>
            </div>
          </div>
        </div>

        {/* Right Panel: Assigned Brands & Images */}
        <div className="md:col-span-3 space-y-6">
          {activeCategory ? (
            <>
              {/* Header card */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-zinc-900">{activeCategory.name}</h2>
                  <p className="text-xs text-zinc-400 font-medium mt-0.5">
                    {activeLinks.length} brands linked to this category
                  </p>
                </div>

                {/* Link brand action */}
                <div className="flex items-center gap-2">
                  <select
                    value={assignBrandId}
                    onChange={(e) => setAssignBrandId(e.target.value)}
                    className="h-9 border-2 border-zinc-200 rounded-xl px-3 text-xs font-bold bg-white outline-none focus:border-black transition-colors"
                  >
                    <option value="">Link new brand…</option>
                    {unassignedBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                    <option value="create_new" className="text-zinc-500 font-bold bg-zinc-50">
                      + Create new brand...
                    </option>
                  </select>
                  <button
                    onClick={handleAssignBrand}
                    disabled={!assignBrandId || assigning}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {assignBrandId === "create_new" ? "Go" : "Link"}
                  </button>
                </div>
              </div>

              {/* Brands list */}
              <div className="space-y-4">
                {activeLinks.map((bc) => {
                  const hasZeroImages = bc.images.length === 0;
                  const brandDetail = brands.find((b) => b.id === bc.brandId);
                  const logoUrl = brandDetail?.logo;

                  return (
                    <div
                      key={bc.id}
                      className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="h-10 w-10 rounded-xl object-contain bg-zinc-50 p-1 border border-zinc-100"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-zinc-900">{bc.brand?.name}</h3>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                              {bc.images.length} images assigned
                            </p>
                          </div>
                        </div>

                        {/* Right side warnings & remove link */}
                        <div className="flex items-center gap-3">
                          {hasZeroImages && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 animate-pulse">
                              <AlertTriangle className="h-3 w-3" /> Minimum 1 image required
                            </span>
                          )}
                          <button
                            onClick={() => router.push(`/catalog-mgmt/brands/${bc.brandId}/${activeCatId}`)}
                            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 hover:text-black text-xs font-bold transition-colors shadow-sm"
                            title="View related products"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" /> Products
                          </button>
                          <button
                            onClick={() => handleUnassign(bc.id)}
                            className="text-zinc-400 hover:text-red-500 flex items-center gap-1 text-xs font-bold transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove Link
                          </button>
                        </div>
                      </div>

                      {/* Images grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
                        {bc.images.map((img, i) => (
                          <div
                            key={i}
                            className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              onClick={() => handleDeleteImage(bc.id, img)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Delete image"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ))}
                        {bc.images.length < MAX_IMAGES && (
                          <button
                            onClick={() => {
                              pendingBcId.current = bc.id;
                              fileRef.current?.click();
                            }}
                            disabled={uploadingBcId === bc.id}
                            className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 hover:border-zinc-400 flex flex-col items-center justify-center gap-1.5 text-zinc-400 hover:text-zinc-600 transition-colors bg-zinc-50/30"
                          >
                            {uploadingBcId === bc.id ? (
                              <div className="h-5 w-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                <span className="text-[10px] font-bold">Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {activeLinks.length === 0 && (
                  <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center text-zinc-400 font-bold shadow-sm">
                    No brands linked to this category yet. Use the dropdown selector above to associate
                    a brand.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center text-zinc-400 font-bold shadow-sm">
              No categories found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
