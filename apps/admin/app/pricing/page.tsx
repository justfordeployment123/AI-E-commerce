"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Save, RotateCcw, Info, Check } from "lucide-react";
import { pricingConfigApi } from "../../lib/api";

interface Modifier {
  label: string;
  key: string;
  backendKey: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  desc: string;
  isDecimalBackend: boolean;
}

const MODIFIER_SCHEMA: Omit<Modifier, "value">[] = [
  { label: "Mint condition",       key: "mint",           backendKey: "multiplier_mint",          min: 80,  max: 100, step: 1, unit: "%", desc: "Multiplier applied to the base market price for Mint / like-new devices.",                        isDecimalBackend: true },
  { label: "Good condition",       key: "good",           backendKey: "multiplier_good",          min: 60,  max: 95,  step: 1, unit: "%", desc: "Multiplier for Good condition — minor scuffs only, fully functional.",                           isDecimalBackend: true },
  { label: "Used condition",       key: "used",           backendKey: "multiplier_used",          min: 40,  max: 80,  step: 1, unit: "%", desc: "Multiplier for Used condition — visible wear but fully working.",                                isDecimalBackend: true },
  { label: "Damaged condition",    key: "damaged",        backendKey: "multiplier_damaged",       min: 10,  max: 50,  step: 1, unit: "%", desc: "Multiplier for Damaged — cracked screen or body damage.",                                       isDecimalBackend: true },
  { label: "Resale margin",        key: "margin",         backendKey: "margin_pct",               min: 10,  max: 40,  step: 1, unit: "%", desc: "Built-in resale margin. Offer = Market price × condition × (1 - margin).",                     isDecimalBackend: false },
  { label: "Cracked screen penalty", key: "cracked_screen", backendKey: "penalty_cracked_screen", min: 10, max: 50,  step: 5, unit: "%", desc: "Additional deduction when customer reports a cracked but usable screen.",                        isDecimalBackend: false },
  { label: "Faulty battery penalty", key: "battery",      backendKey: "penalty_battery",          min: 5,   max: 30,  step: 5, unit: "%", desc: "Extra deduction for battery below 80% or very poor runtime.",                                  isDecimalBackend: false },
  { label: "Charging fault penalty", key: "charging",     backendKey: "penalty_charging",         min: 5,   max: 25,  step: 1, unit: "%", desc: "Deduction when charging port or power functionality is reported faulty.",                       isDecimalBackend: false },
  { label: "AI fallback buffer",   key: "ai_buffer",      backendKey: "ai_buffer",                min: 5,   max: 30,  step: 5, unit: "%", desc: "Safety buffer applied to AI-estimated prices for unknown models.",                             isDecimalBackend: false },
];

const DEFAULTS: Record<string, number> = {
  mint: 100, good: 82, used: 62, damaged: 30,
  margin: 22, cracked_screen: 25, battery: 15, charging: 12, ai_buffer: 15,
};

function toDisplay(schema: Omit<Modifier, "value">, backendValue: number): number {
  return schema.isDecimalBackend ? Math.round(backendValue * 100) : Math.round(backendValue);
}

function toBackend(schema: Omit<Modifier, "value">, displayValue: number): number {
  return schema.isDecimalBackend ? displayValue / 100 : displayValue;
}

export default function PricingPage() {
  const [modifiers, setModifiers] = useState<Modifier[]>(
    MODIFIER_SCHEMA.map(s => ({ ...s, value: DEFAULTS[s.key] }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    pricingConfigApi.list().then(configs => {
      const byKey: Record<string, number> = {};
      for (const c of configs) byKey[c.key] = c.value;

      setModifiers(MODIFIER_SCHEMA.map(s => ({
        ...s,
        value: byKey[s.backendKey] !== undefined
          ? toDisplay(s, byKey[s.backendKey])
          : DEFAULTS[s.key],
      })));
    }).catch(() => {/* keep defaults */}).finally(() => setLoading(false));
  }, []);

  function handleChange(key: string, value: number) {
    setModifiers(ms => ms.map(m => m.key === key ? { ...m, value } : m));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(
        modifiers.map(m =>
          pricingConfigApi.upsert(m.backendKey, toBackend(m, m.value), m.label)
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function handleReset() {
    setModifiers(ms => ms.map(m => ({ ...m, value: DEFAULTS[m.key] })));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Rules</h1>
          <p className="text-sm text-zinc-500 mt-1">Adjust condition multipliers, resale margin, and damage deductions.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 h-11 px-5 rounded-2xl border-2 border-zinc-200 bg-white text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Reset defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 h-11 px-5 rounded-2xl text-sm font-bold transition-all disabled:opacity-60 ${
              saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold mb-5">Condition multipliers &amp; deductions</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Condition multipliers</p>
              <div className="space-y-6">
                {modifiers.filter(m => ["mint", "good", "used", "damaged"].includes(m.key)).map(m => (
                  <SliderRow key={m.key} modifier={m} onChange={handleChange} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Margin &amp; buffer</p>
              <div className="space-y-6">
                {modifiers.filter(m => ["margin", "ai_buffer"].includes(m.key)).map(m => (
                  <SliderRow key={m.key} modifier={m} onChange={handleChange} />
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Pricing formula</p>
                <p className="text-xs font-mono text-zinc-600 leading-loose">
                  offer = market_price<br />
                  &nbsp;&nbsp;× condition_multiplier<br />
                  &nbsp;&nbsp;× (1 - resale_margin)<br />
                  &nbsp;&nbsp;- damage_deductions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Damage deductions</p>
            <div className="grid md:grid-cols-3 gap-6">
              {modifiers.filter(m => ["cracked_screen", "battery", "charging"].includes(m.key)).map(m => (
                <SliderRow key={m.key} modifier={m} onChange={handleChange} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Live preview */}
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
            <h2 className="font-bold mb-4">Live offer preview</h2>
            <p className="text-xs text-zinc-500 mb-4">Example: iPhone 14 Pro 256 GB, market value £580</p>
            {(["mint", "good", "used", "damaged"] as const).map(key => {
              const condMod = modifiers.find(x => x.key === key);
              const margin = modifiers.find(x => x.key === "margin");
              const val = condMod && margin
                ? Math.round(580 * (condMod.value / 100) * (1 - margin.value / 100) / 5) * 5
                : 0;
              return (
                <div key={key} className="flex justify-between items-center py-2.5 border-b border-zinc-50 last:border-0">
                  <span className="text-sm font-medium text-zinc-600 capitalize">{key}</span>
                  <span className="font-bold font-mono">£{val}</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl bg-zinc-950 text-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-accent" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">AI fallback</p>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              When a device isn&apos;t in the scraped database, the backend calls the AI API with full context. The AI buffer ({modifiers.find(m => m.key === "ai_buffer")?.value}%) is applied as extra safety margin on those estimates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ modifier, onChange }: { modifier: Modifier; onChange: (key: string, value: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold">{modifier.label}</p>
        <p className="text-sm font-bold font-mono">{modifier.value}{modifier.unit}</p>
      </div>
      <input
        type="range"
        min={modifier.min}
        max={modifier.max}
        step={modifier.step}
        value={modifier.value}
        onChange={e => onChange(modifier.key, Number(e.target.value))}
        className="w-full h-2 rounded-full accent-black bg-zinc-100 cursor-pointer"
      />
      <p className="text-xs text-zinc-400 mt-1.5 leading-snug">{modifier.desc}</p>
    </div>
  );
}
