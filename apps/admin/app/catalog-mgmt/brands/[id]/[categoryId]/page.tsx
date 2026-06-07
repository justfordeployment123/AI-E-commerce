"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  productsApi,
  catalogBrandsApi,
  catalogCategoriesApi,
  type Product,
  type CatalogBrandItem,
  type CatalogCategoryItem,
} from "../../../../../lib/api";
import { ArrowLeft, Edit2, Package, Image as ImageIcon, Check, X, ArrowUpRight } from "lucide-react";

export default function RelatedProductsPage() {
  const { id: brandId, categoryId } = useParams<{ id: string; categoryId: string }>();
  const router = useRouter();

  const [brand, setBrand] = useState<CatalogBrandItem | null>(null);
  const [category, setCategory] = useState<CatalogCategoryItem | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [brands, categories, allProducts] = await Promise.all([
        catalogBrandsApi.list(true),
        catalogCategoriesApi.list(true),
        productsApi.list({ limit: 1000 }),
      ]);

      const foundBrand = brands.find((b) => b.id === brandId);
      const foundCategory = categories.find((c) => c.id === categoryId);

      if (!foundBrand || !foundCategory) {
        router.replace("/catalog-mgmt/brands");
        return;
      }

      setBrand(foundBrand);
      setCategory(foundCategory);

      // Filter products by brand name and category name
      const filtered = allProducts.items.filter(
        (p) =>
          p.brand.toLowerCase() === foundBrand.name.toLowerCase() &&
          p.category.toLowerCase() === foundCategory.name.toLowerCase()
      );
      setProducts(filtered);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [brandId, categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand || !category) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header and Back Link */}
      <div>
        <Link
          href={`/catalog-mgmt/brands/${brandId}`}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-bold mb-2 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to brand details
        </Link>
        <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          {brand.name} {category.name} Products
        </h1>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Currently viewing actual products matching the {brand.name} brand and {category.name} category.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Products table list card */}
      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50">
                <tr className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <th className="text-left px-6 py-4">Product</th>
                  <th className="text-left px-6 py-4">Spec</th>
                  <th className="text-left px-6 py-4">Condition</th>
                  <th className="text-right px-6 py-4">Price</th>
                  <th className="text-center px-6 py-4">Stock</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {products.map((product) => {
                  const mainImage = product.images?.[0];
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-zinc-50/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover bg-zinc-50 border border-zinc-100"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-zinc-800 line-clamp-1">{product.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            ID: {product.id.slice(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-bold text-xs">
                        {product.storage || "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-semibold text-xs">
                        {product.condition}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-zinc-800">
                        {product.price != null ? `£${product.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-700">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                          }`}
                        >
                          {product.isActive ? (
                            <Check className="h-2.5 w-2.5" />
                          ) : (
                            <X className="h-2.5 w-2.5" />
                          )}
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/products/${product.id}`}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:border-zinc-400 hover:text-black transition-all"
                            title="Edit Product"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <Package className="h-10 w-10 mx-auto opacity-35" />
            <div className="font-bold text-zinc-500">No products listed</div>
            <p className="text-xs font-medium max-w-sm mx-auto">
              There are no products currently listed in the store for {brand.name} {category.name}.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center h-8 px-4 rounded-xl border border-zinc-200 hover:border-zinc-400 text-xs font-bold text-zinc-600 hover:text-black transition-colors"
              >
                Go to Products
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
