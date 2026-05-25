"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Laptop, Smartphone, Tablet, Gamepad2, Headphones, ShieldCheck, Database, Layers } from "lucide-react";
import { deviceCatalogApi, productsApi, type DeviceCatalogItem, type Product } from "../../../lib/api";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  phones:      { label: "Phones",      icon: Smartphone, color: "bg-blue-500/10 text-blue-400" },
  tablets:     { label: "Tablets",     icon: Tablet,     color: "bg-rose-500/10 text-rose-400" },
  consoles:    { label: "Consoles",    icon: Gamepad2,   color: "bg-violet-500/10 text-violet-400" },
  laptops:     { label: "Laptops",     icon: Laptop,     color: "bg-amber-500/10 text-amber-400" },
  accessories: { label: "Accessories", icon: Headphones, color: "bg-emerald-500/10 text-emerald-400" },
};

export default function CatalogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [device, setDevice] = useState<DeviceCatalogItem | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [devItem, prodList] = await Promise.all([
          deviceCatalogApi.getById(id),
          productsApi.list({ limit: 200 }),
        ]);
        setDevice(devItem);
        
        // Filter products that match this device catalog brand and model
        const filteredProds = prodList.items.filter(
          p => p.brand.toLowerCase() === devItem.brand.toLowerCase() &&
               p.model.toLowerCase() === devItem.model.toLowerCase()
        );
        setProducts(filteredProds);
      } catch (err: any) {
        setError(err.message || "Failed to load catalog details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-8">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] p-8 max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/catalog")}
          className="flex items-center gap-2 text-zinc-500 hover:text-black font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to catalog
        </button>
        <div className="bg-white rounded-3xl p-8 border border-zinc-150 text-center shadow-sm">
          <p className="text-red-500 font-bold mb-4">{error || "Catalog device not found"}</p>
          <button
            onClick={() => router.push("/catalog")}
            className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_META[device.category] ?? CATEGORY_META.phones;
  const Icon = meta.icon;
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans">
      {/* Header breadcrumb */}
      <button
        onClick={() => router.push("/catalog")}
        className="flex items-center gap-2 text-zinc-500 hover:text-black font-semibold mb-6 transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </button>

      {/* Main Grid: Device Info & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Device Info Card */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-zinc-150 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${meta.color}`}>
                <Icon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${device.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500"}`}>
                {device.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-950 mb-1 leading-tight">{device.brand} {device.model}</h1>
            <p className="text-zinc-400 text-xs font-medium">Device Catalog ID: <span className="font-mono text-[10px]">{device.id}</span></p>

            {/* Storage variants */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Configured Storage Variants</h3>
              <div className="flex flex-wrap gap-2">
                {device.storageOptions.length > 0 ? (
                  device.storageOptions.map(option => (
                    <span key={option} className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-semibold border border-zinc-200/50">
                      {option}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-400 italic">No storage options configured.</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Created: {new Date(device.createdAt).toLocaleDateString()}</span>
            <span>Last Updated: {new Date(device.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-150 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">Stock & Items Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-bold">Total E-Commerce Listings</p>
                  <p className="text-xl font-bold">{products.length} products</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-xs text-zinc-400 font-bold">Total Available Stock</p>
                  <p className="text-xl font-bold">{totalStock} units</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>These metrics are calculated from active product listings matching this brand & model.</span>
          </div>
        </div>
      </div>

      {/* Linked Products Section */}
      <div className="bg-white rounded-3xl border border-zinc-150 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">Linked E-Commerce Products</h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">Click any product listing to edit or manage its details.</p>
        </div>

        {products.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-400 font-medium">
            <p className="text-sm mb-2">No products currently linked to this catalog model.</p>
            <p className="text-xs text-zinc-300">New product listings with this exact brand and model will automatically link here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Product Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Condition</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Price</th>
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.map(p => (
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
                        <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-150 flex items-center justify-center shrink-0">
                          <span className="text-zinc-300 text-xs font-bold">Image</span>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-zinc-950 group-hover:text-black">{p.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Storage: {(p.specs?.storage as string) || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">{p.condition}</span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold font-mono text-zinc-900">
                    £{p.price}
                  </td>
                  <td className={`px-4 py-4 text-right font-bold font-mono ${p.stock === 0 ? "text-red-500" : p.stock <= 2 ? "text-amber-500" : "text-zinc-700"}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {p.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-black transition-colors">
                      Edit <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
