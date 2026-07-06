"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Trash2, Eye, EyeOff } from "lucide-react";
import { gradeBannersApi, GRADE_OPTIONS, type GradeBannerItem } from "../../../lib/api";

const GRADE_LABELS: Record<string, string> = {
  NEW: "New",
  A: "A Grade",
  B: "B Grade",
  C: "C Grade",
  F: "F Grade",
};

export default function GradeBannersPage() {
  const [banners, setBanners] = useState<GradeBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingGrade, setUploadingGrade] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = () => {
    setLoading(true);
    gradeBannersApi.list().then(setBanners).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function handleUpload(grade: string, file: File) {
    setUploadingGrade(grade); setError("");
    try {
      await gradeBannersApi.upload(grade, file);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUploadingGrade(null); }
  }

  async function handleToggle(id: string) {
    await gradeBannersApi.toggle(id).catch(() => {});
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this grade image? This cannot be undone.")) return;
    await gradeBannersApi.delete(id).catch(() => {});
    load();
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/banners" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-1">
          <ArrowLeft className="h-3 w-3" /> Banners
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Grade Guide Images</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Background photos for the homepage &quot;Grade Guide&quot; section — one small gallery per
          condition grade. Upload a few per grade; the homepage picks one at random.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="space-y-8">
        {GRADE_OPTIONS.map((grade) => {
          const items = banners.filter((b) => b.grade === grade);
          const uploading = uploadingGrade === grade;
          return (
            <div key={grade}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-zinc-900">{GRADE_LABELS[grade]}</h2>
                <button
                  onClick={() => fileRefs.current[grade]?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 h-8 px-3 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload"}
                </button>
                <input
                  ref={(el) => { fileRefs.current[grade] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(grade, f);
                    e.target.value = "";
                  }}
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="aspect-video bg-zinc-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-200 rounded-2xl text-zinc-400 text-xs">
                  No images yet for {GRADE_LABELS[grade]}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((b) => (
                    <div key={b.id} className={`relative group rounded-2xl overflow-hidden border ${b.isActive ? "border-zinc-200" : "border-zinc-100 opacity-50"}`}>
                      <div className="aspect-video bg-zinc-50 flex items-center justify-center">
                        {b.url
                          ? <img src={b.url} alt={b.label ?? ""} className="w-full h-full object-cover" />
                          : <span className="text-[10px] text-zinc-300">No image</span>
                        }
                      </div>
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
        })}
      </div>
    </div>
  );
}
