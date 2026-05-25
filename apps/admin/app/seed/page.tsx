"use client";

import { useState } from "react";
import { DatabaseZap, CheckCircle, AlertCircle, Loader2, TriangleAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ts_admin_token") : null;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface SeedResult {
  pricingConfigs: number;
  deviceCatalog: number;
  products: {
    created: number;
    updated: number;
    errors: string[];
    total: number;
  };
}

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSeed() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch<SeedResult>("/admin/seed/run", { method: "POST" });
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Database Seed</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Seeds the production database from bundled files inside the container.
          Uploads all product images to S3 and upserts products, pricing configs, and the device trade-in catalog.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 space-y-6">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-800">Before you run</p>
          </div>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Reads <code className="bg-amber-100 px-1 rounded font-mono">prisma/downloads/products.json</code> bundled in this container.</li>
            <li>Uploads <code className="bg-amber-100 px-1 rounded font-mono">.jpg</code> images from that folder to S3.</li>
            <li>Upserts products by slug — existing products are updated, new ones created.</li>
            <li>Replaces the entire device trade-in catalog and upserts pricing configs.</li>
            <li>This can take <strong>1–3 minutes</strong> depending on image count — don't close the tab.</li>
          </ul>
        </div>

        {!result && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span className="text-sm text-zinc-600">
              I understand this will modify the production database and S3 storage.
            </span>
          </label>
        )}

        {!result && (
          <button
            onClick={handleSeed}
            disabled={loading || !confirmed}
            className="w-full h-12 rounded-2xl bg-zinc-950 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Seeding… this may take a couple of minutes
              </>
            ) : (
              <>
                <DatabaseZap className="h-4 w-4" />
                Run Full Seed
              </>
            )}
          </button>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="font-bold text-emerald-800">Seed complete!</p>
            </div>

            <div className="rounded-2xl border border-zinc-100 overflow-hidden divide-y divide-zinc-100">
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-500">Pricing configs seeded</span>
                <span className="font-bold text-sm">{result.pricingConfigs}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-500">Trade-in catalog entries</span>
                <span className="font-bold text-sm">{result.deviceCatalog}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-500">Products created</span>
                <span className="font-bold text-sm text-emerald-600">{result.products.created}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-500">Products updated</span>
                <span className="font-bold text-sm text-sky-600">{result.products.updated}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-500">Total processed</span>
                <span className="font-bold text-sm">{result.products.total}</span>
              </div>
            </div>

            {result.products.errors.length > 0 && (
              <div className="rounded-2xl border border-red-100 overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                    {result.products.errors.length} errors
                  </p>
                </div>
                <div className="px-5 py-3 max-h-48 overflow-y-auto space-y-1">
                  {result.products.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono">{e}</p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setConfirmed(false); }}
              className="w-full h-10 rounded-2xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Run again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
