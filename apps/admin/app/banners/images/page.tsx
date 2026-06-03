"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Eye, EyeOff } from "lucide-react";
import { bannerImagesApi, type BannerItem } from "../../../lib/api";

export default function BannerImagesPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [labelInput, setLabelInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    bannerImagesApi.list().then(setBanners).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function handleUpload(file: File) {
    setUploading(true); setError("");
    try {
      await bannerImagesApi.upload(file, labelInput || undefined);
      setLabelInput("");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  async function handleToggle(id: string) {
    await bannerImagesApi.toggle(id).catch(() => {});
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner image? This cannot be undone.")) return;
    await bannerImagesApi.delete(id).catch(() => {});
    load();
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/banners" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-1">
            <ArrowLeft className="h-3 w-3" /> Banners
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Banner Images</h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-9 border border-zinc-200 rounded-xl px-3 text-sm w-40"
            placeholder="Label (optional)"
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload Banner"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm">No banners yet. Upload one above.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {banners.map((b) => (
            <div key={b.id} className={`relative group rounded-2xl overflow-hidden border ${b.isActive ? "border-zinc-200" : "border-zinc-100 opacity-50"}`}>
              <div className="aspect-video bg-zinc-50 flex items-center justify-center">
                {b.url
                  ? <img src={b.url} alt={b.label ?? ""} className="w-full h-full object-cover" />
                  : <span className="text-[10px] text-zinc-300">No image</span>
                }
              </div>
              {b.label && (
                <div className="px-3 py-2 text-xs font-semibold text-zinc-600 truncate">{b.label}</div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggle(b.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 border border-zinc-200 text-zinc-600 hover:text-zinc-900"
                  title={b.isActive ? "Deactivate" : "Activate"}
                >
                  {b.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/90 border border-zinc-200 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
