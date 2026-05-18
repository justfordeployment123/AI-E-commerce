"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Save, RotateCcw, Info, Check } from "lucide-react";

interface Modifier {
  label: string;
  key: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  desc: string;
}

const DEFAULT_MODIFIERS: Modifier[] = [
  { label: "Mint condition", key: "mint", value: 100, min: 80, max: 100, step: 1, unit: "%", desc: "Multiplier applied to the base market price for Mint / like-new devices." },
  { label: "Good condition", key: "good", value: 82, min: 60, max: 95, step: 1, unit: "%", desc: "Multiplier for Good condition — minor scuffs only, fully functional." },
  { label: "Used condition", key: "used", value: 62, min: 40, max: 80, step: 1, unit: "%", desc: "Multiplier for Used condition — visible wear but fully working." },
  { label: "Damaged condition", key: "damaged", value: 30, min: 10, max: 50, step: 1, unit: "%", desc: "Multiplier for Damaged — cracked screen or body damage." },
  { label: "Resale margin", key: "margin", value: 22, min: 10, max: 40, step: 1, unit: "%", desc: "Built-in resale margin added on top after buying. Offer = Market price × condition × (1 - margin)." },
  { label: "Cracked screen penalty", key: "cracked_screen", value: 25, min: 10, max: 50, step: 5, unit: "%", desc: "Additional deduction when customer reports a cracked but usable screen." },
  { label: "Faulty battery penalty", key: "battery", value: 15, min: 5, max: 30, step: 5, unit: "%", desc: "Extra deduction for battery below 80% or very poor runtime." },
  { label: "Charging fault penalty", key: "charging", value: 12, min: 5, max: 25, step: 1, unit: "%", desc: "Deduction when charging port or power functionality is reported faulty." },
  { label: "AI fallback price buffer", key: "ai_buffer", value: 15, min: 5, max: 30, step: 5, unit: "%", desc: "Additional safety buffer applied to AI-estimated prices for unknown models." },
];

const SCRAPER_SOURCES = [
  { id: "backmarket", label: "BackMarket", active: true, lastRun: "Today 02:00", status: "ok" },
  { id: "cex", label: "CEX", active: true, lastRun: "Today 02:05", status: "ok" },
  { id: "musicmagpie", label: "Music Magpie", active: true, lastRun: "Today 02:11", status: "warning" },
  { id: "ebay", label: "eBay Completed Sales", active: false, lastRun: "Never", status: "idle" },
];

export default function PricingPage() {
  const [modifiers, setModifiers] = useState(DEFAULT_MODIFIERS);
  const [saved, setSaved] = useState(false);
  const [scrapers, setScrapers] = useState(SCRAPER_SOURCES);

  function handleChange(key: string, value: number) {
    setModifiers(ms => ms.map(m => m.key === key ? { ...m, value } : m));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setModifiers(DEFAULT_MODIFIERS);
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
            className="flex items-center gap-2 h-11 px-5 rounded-[1rem] border-2 border-zinc-200 bg-white text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Reset defaults
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 h-11 px-5 rounded-[1rem] text-sm font-bold transition-all ${
              saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-8">
        {/* Modifiers */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold mb-5">Condition multipliers &amp; deductions</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Condition multipliers group */}
            <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Condition multipliers</p>
              <div className="space-y-6">
                {modifiers.filter(m => ["mint", "good", "used", "damaged"].includes(m.key)).map(m => (
                  <SliderRow key={m.key} modifier={m} onChange={handleChange} />
                ))}
              </div>
            </div>

            {/* Margin */}
            <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Margin &amp; buffer</p>
              <div className="space-y-6">
                {modifiers.filter(m => ["margin", "ai_buffer"].includes(m.key)).map(m => (
                  <SliderRow key={m.key} modifier={m} onChange={handleChange} />
                ))}
              </div>

              {/* Formula */}
              <div className="mt-6 rounded-[1rem] bg-zinc-50 p-4">
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

          {/* Damage deductions */}
          <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">Damage deductions</p>
            <div className="grid md:grid-cols-3 gap-6">
              {modifiers.filter(m => ["cracked_screen", "battery", "charging"].includes(m.key)).map(m => (
                <SliderRow key={m.key} modifier={m} onChange={handleChange} />
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar — scraper status */}
        <div className="space-y-5">
          <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
            <h2 className="font-bold mb-5">Price scraper status</h2>
            <div className="space-y-4">
              {scrapers.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${s.status === "ok" ? "bg-emerald-400" : s.status === "warning" ? "bg-amber-400" : "bg-zinc-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{s.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Last run: {s.lastRun}</p>
                  </div>
                  <button
                    onClick={() => setScrapers(sc => sc.map(src => src.id === s.id ? { ...src, active: !src.active } : src))}
                    className={`h-5 w-9 rounded-full transition-colors relative flex-shrink-0 ${s.active ? "bg-black" : "bg-zinc-200"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${s.active ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full h-10 rounded-[1rem] bg-zinc-50 border border-zinc-200 text-xs font-bold hover:bg-zinc-100 transition-colors">
              Run scrapers now
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-[1.5rem] border border-zinc-100 shadow-sm p-6">
            <h2 className="font-bold mb-4">Live offer preview</h2>
            <p className="text-xs text-zinc-500 mb-4">Example: iPhone 14 Pro 256 GB, market value £580</p>
            {(["Mint", "Good", "Used", "Damaged"] as const).map(label => {
              const keyMap: Record<string, string> = { Mint: "mint", Good: "good", Used: "used", Damaged: "damaged" };
              const m = modifiers.find(x => x.key === keyMap[label]);
              const margin = modifiers.find(x => x.key === "margin");
              const val = m && margin ? Math.round(580 * (m.value / 100) * (1 - margin.value / 100) / 5) * 5 : 0;
              return (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-zinc-50 last:border-0">
                  <span className="text-sm font-medium text-zinc-600">{label}</span>
                  <span className="font-bold font-mono">£{val}</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-[1.5rem] bg-zinc-950 text-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-accent" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">AI fallback</p>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              When a device isn't in the weekly-scraped database, the backend calls the AI API once with full context. The AI buffer ({modifiers.find(m => m.key === "ai_buffer")?.value}%) is applied as extra safety margin on those estimates.
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
