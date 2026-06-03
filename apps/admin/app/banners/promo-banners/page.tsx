"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Check, X } from "lucide-react";
import { promoSlidesApi, THEME_PRESETS, type PromoSlideItem } from "../../../lib/api";

type Form = {
  tabTitle: string; tag: string; titleLine1: string; titleLine2: string;
  titleItalic: string; title: string; subtitle: string;
  badgeA: string; badgeB: string;
  spec1: string; spec2: string; spec3: string;
  themeColor: string; bgGlow: string;
  btnText: string; btnLink: string;
  isActive: boolean; imageUrl: string;
};

const emptyForm: Form = {
  tabTitle: "", tag: "", titleLine1: "", titleLine2: "", titleItalic: "",
  title: "", subtitle: "", badgeA: "", badgeB: "",
  spec1: "", spec2: "", spec3: "",
  themeColor: THEME_PRESETS[0].themeColor, bgGlow: THEME_PRESETS[0].bgGlow,
  btnText: "Shop Now", btnLink: "/", isActive: true, imageUrl: "",
};

function slideToForm(s: PromoSlideItem): Form {
  const [spec1 = "", spec2 = "", spec3 = ""] = s.specs;
  return {
    tabTitle: s.tabTitle, tag: s.tag, titleLine1: s.titleLine1,
    titleLine2: s.titleLine2, titleItalic: s.titleItalic,
    title: s.title, subtitle: s.subtitle,
    badgeA: s.badgeA, badgeB: s.badgeB,
    spec1, spec2, spec3,
    themeColor: s.themeColor, bgGlow: s.bgGlow,
    btnText: s.btnText, btnLink: s.btnLink,
    isActive: s.isActive, imageUrl: "",
  };
}

function formToPayload(f: Form) {
  const specs = [f.spec1, f.spec2, f.spec3].filter(Boolean);
  const base = {
    tabTitle: f.tabTitle, tag: f.tag, titleLine1: f.titleLine1,
    titleLine2: f.titleLine2, titleItalic: f.titleItalic,
    title: f.title, subtitle: f.subtitle,
    badgeA: f.badgeA, badgeB: f.badgeB, specs,
    themeColor: f.themeColor, bgGlow: f.bgGlow,
    btnText: f.btnText, btnLink: f.btnLink, isActive: f.isActive,
  };
  return f.imageUrl ? { ...base, imageUrl: f.imageUrl } : base;
}

export default function PromoSlidesPage() {
  const [slides, setSlides] = useState<PromoSlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    promoSlidesApi.list().then(setSlides).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  function startCreate() { setEditing("new"); setForm(emptyForm); setError(""); }
  function startEdit(s: PromoSlideItem) { setEditing(s.id); setForm(slideToForm(s)); setError(""); }
  function cancel() { setEditing(null); setError(""); if (imgFileRef.current) imgFileRef.current.value = ""; }

  const setF = (patch: Partial<Form>) => setForm(prev => ({ ...prev, ...patch }));

  async function save() {
    setSaving(true); setError("");
    try {
      const payload = formToPayload(form);
      let targetId = editing === "new" ? "" : editing ?? "";

      if (editing === "new") {
        const created = await promoSlidesApi.create({ ...payload, order: slides.length } as any);
        targetId = created.id;
      } else if (editing) {
        await promoSlidesApi.update(editing, payload);
      }

      if (imgFileRef.current?.files?.[0] && targetId) {
        await promoSlidesApi.uploadImage(targetId, imgFileRef.current.files[0]);
      }

      cancel(); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this slide? This cannot be undone.")) return;
    await promoSlidesApi.delete(id).catch(() => {});
    load();
  }

  async function toggle(id: string) {
    await promoSlidesApi.toggle(id).catch(() => {});
    load();
  }

  function onDragStart(i: number) { setDragIdx(i); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(i: number) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); return; }
    const reordered = [...slides];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(i, 0, moved);
    const items = reordered.map((s, idx) => ({ id: s.id, order: idx }));
    setSlides(reordered.map((s, idx) => ({ ...s, order: idx })));
    promoSlidesApi.reorder(items).catch(() => load());
    setDragIdx(null);
  }

  const f = form;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/banners" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 mb-1">
            <ArrowLeft className="h-3 w-3" /> Banners
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Promo Banners</h1>
          <p className="text-sm text-zinc-400">Homepage hero carousel. Drag cards to reorder.</p>
        </div>
        <button onClick={startCreate}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800">
          <Plus className="h-3.5 w-3.5" /> Add Slide
        </button>
      </div>

      {/* ── Form ── */}
      {editing && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-sm mb-5">{editing === "new" ? "New Slide" : "Edit Slide"}</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {([
              ["Tab Title", "tabTitle"], ["Tag / Eyebrow", "tag"],
              ["Title Line 1", "titleLine1"], ["Title Line 2", "titleLine2"],
              ["Italic Word", "titleItalic"], ["Meta Title", "title"],
            ] as [string, keyof Form][]).map(([label, key]) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">{label}</label>
                <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                  value={f[key] as string}
                  onChange={e => setF({ [key]: e.target.value } as any)} />
              </div>
            ))}

            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Description</label>
              <textarea className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm resize-none" rows={2}
                value={f.subtitle} onChange={e => setF({ subtitle: e.target.value })} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Badge A</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={f.badgeA} onChange={e => setF({ badgeA: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Badge B</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={f.badgeB} onChange={e => setF({ badgeB: e.target.value })} />
            </div>

            {(["spec1", "spec2", "spec3"] as const).map((key, i) => (
              <div key={key}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Spec {i + 1}</label>
                <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                  value={f[key]} onChange={e => setF({ [key]: e.target.value } as any)} />
              </div>
            ))}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Button Text</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm"
                value={f.btnText} onChange={e => setF({ btnText: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Button Link</label>
              <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm font-mono"
                value={f.btnLink} onChange={e => setF({ btnLink: e.target.value })} />
            </div>
          </div>

          {/* Theme Swatches */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Theme Color</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_PRESETS.map((p) => (
                <button key={p.label} type="button"
                  onClick={() => setF({ themeColor: p.themeColor, bgGlow: p.bgGlow })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    f.themeColor === p.themeColor ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${p.swatch}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="mb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Image</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">Upload file</p>
                <input ref={imgFileRef} type="file" accept="image/*"
                  className="w-full text-xs text-zinc-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:text-xs file:font-semibold" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 mb-1">Or paste URL</p>
                <input className="w-full h-9 border border-zinc-200 rounded-xl px-3 text-sm font-mono"
                  placeholder="https://..."
                  value={f.imageUrl} onChange={e => setF({ imageUrl: e.target.value })} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold mb-4 cursor-pointer">
            <input type="checkbox" checked={f.isActive} onChange={e => setF({ isActive: e.target.checked })} />
            Active (visible on site)
          </label>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-50">
              <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Slide"}
            </button>
            <button onClick={cancel}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-zinc-200 text-xs font-bold hover:bg-zinc-50">
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-zinc-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : slides.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm">No slides yet. Add one above.</div>
      ) : (
        <div className="space-y-3">
          {slides.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              className={`flex items-center gap-4 bg-white border rounded-2xl px-4 py-3 transition-all ${
                dragIdx === i ? "border-zinc-400 shadow-md opacity-50" : "border-zinc-100 hover:border-zinc-200"
              }`}
            >
              <GripVertical className="h-4 w-4 text-zinc-300 cursor-grab shrink-0" />

              <div className="h-12 w-16 rounded-xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                {s.imgUrl
                  ? <img src={s.imgUrl} alt={s.tabTitle} className="h-full w-full object-cover" />
                  : <span className="text-[10px] text-zinc-300">No img</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-zinc-400">{String(s.order + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-bold text-zinc-900 truncate">{s.tabTitle || s.titleLine1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{s.titleLine1} {s.titleLine2} {s.titleItalic}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggle(s.id)} title={s.isActive ? "Deactivate" : "Activate"}
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-all">
                  {s.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => startEdit(s)} title="Edit"
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition-all">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(s.id)} title="Delete"
                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-zinc-200 text-red-400 hover:text-red-600 hover:border-red-200 transition-all">
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
