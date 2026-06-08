"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, Check, Calculator, Tag, ArrowDownLeft, Zap } from "lucide-react";
import { pricingConfigApi, scraperApi, productPricingApi, type ScrapedPriceRow } from "../../lib/api";

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

// ── Condition multipliers ────────────────────────────────────────────────────
const CONDITION_SCHEMA: Omit<Modifier, "value">[] = [
  { label: "Mint / Pristine", key: "mint",         backendKey: "multiplier_mint",    min: 50,  max: 130, step: 1, unit: "%", desc: "Set above 100% to price above market. 110% = 10% above CEX.", isDecimalBackend: true },
  { label: "Good",            key: "good",         backendKey: "multiplier_good",    min: 50,  max: 110, step: 1, unit: "%", desc: "Minor cosmetic wear. Typically 5–20% below competitor.", isDecimalBackend: true },
  { label: "Refurbished",     key: "used",         backendKey: "multiplier_used",    min: 30,  max: 100, step: 1, unit: "%", desc: "Tested & working, visible wear. Typically 20–35% below competitor.", isDecimalBackend: true },
  { label: "Damaged",         key: "damaged",      backendKey: "multiplier_damaged", min: 10,  max:  70, step: 1, unit: "%", desc: "Cracked screen or body damage. Parts value pricing.", isDecimalBackend: true },
  { label: "Sell margin",    key: "sell_margin",    backendKey: "sell_margin_pct",    min: -50, max: 50, step: 1, unit: "%", desc: "Added on top of multiplier. +10% = 10% more, −10% = 10% less. 0 = no effect.", isDecimalBackend: false },
  { label: "Sell discount",  key: "sell_discount",  backendKey: "sell_discount_pct",  min:   0, max: 50, step: 1, unit: "%", desc: "Promotional discount deducted from final price. 20% off = set to 20. 0 = no discount.", isDecimalBackend: false },
];

// ── Trade-in settings ────────────────────────────────────────────────────────
const TRADEIN_SCHEMA: Omit<Modifier, "value">[] = [
  { label: "Trade-in offer ratio",     key: "tradein_ratio",    backendKey: "tradein_ratio",          min: 20,  max: 80,  step: 1, unit: "%", desc: "What % of our sell price we offer the customer. 50% = half of what we'd sell for.", isDecimalBackend: true },
  { label: "Trade-in margin",          key: "tradein_margin",   backendKey: "tradein_margin_pct",     min: -50, max: 50,  step: 1, unit: "%", desc: "Applied after offer ratio. +10% = deduct 10% more (safer), −10% = give 10% more (attract trade-ins). 0 = no effect.", isDecimalBackend: false },
  { label: "Cracked screen deduction", key: "cracked_screen",   backendKey: "penalty_cracked_screen", min: 5,   max: 50,  step: 5, unit: "%", desc: "Extra % deducted from trade-in when customer reports a cracked but usable screen.", isDecimalBackend: false },
  { label: "Faulty battery deduction", key: "battery",          backendKey: "penalty_battery",        min: 5,   max: 30,  step: 5, unit: "%", desc: "Extra deduction for battery below 80% health or very poor runtime.", isDecimalBackend: false },
  { label: "Charging fault deduction", key: "charging",         backendKey: "penalty_charging",       min: 5,   max: 25,  step: 1, unit: "%", desc: "Deduction when charging port or power functionality is reported faulty.", isDecimalBackend: false },
  { label: "AI fallback buffer",       key: "ai_buffer",        backendKey: "ai_buffer",              min: 5,   max: 30,  step: 5, unit: "%", desc: "Safety buffer on AI-estimated prices for unknown models (no scraped data).", isDecimalBackend: false },
];

const DEFAULTS: Record<string, number> = {
  mint: 110, good: 90, used: 78, damaged: 45, sell_margin: 0, sell_discount: 0,
  tradein_ratio: 50, tradein_margin: 0, cracked_screen: 25, battery: 15, charging: 12, ai_buffer: 15,
};

function toDisplay(s: Omit<Modifier, "value">, v: number) { return s.isDecimalBackend ? Math.round(v * 100) : Math.round(v); }
function toBackend(s: Omit<Modifier, "value">, v: number) { return s.isDecimalBackend ? v / 100 : v; }
function round5(x: number) { return Math.max(Math.round(x / 5) * 5, 5); }

export default function PricingPage() {
  const router = useRouter();
  const ALL_SCHEMA = [...CONDITION_SCHEMA, ...TRADEIN_SCHEMA];

  const [modifiers, setModifiers] = useState<Modifier[]>(
    ALL_SCHEMA.map(s => ({ ...s, value: DEFAULTS[s.key] ?? 0 }))
  );
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [launching, setLaunching]     = useState(false);
  const [previewPrice, setPreviewPrice] = useState(355);
  const [previewLabel, setPreviewLabel] = useState("PS5 Digital 825GB");
  const [scrapedDevices, setScrapedDevices] = useState<ScrapedPriceRow[]>([]);
  const [deviceSearch, setDeviceSearch] = useState("PS5 Digital 825GB");
  const [showDeviceDrop, setShowDeviceDrop] = useState(false);

  useEffect(() => {
    scraperApi.prices(1, 500).then(res => {
      const withPrice = res.items.filter(d => d.marketPrice != null);
      setScrapedDevices(withPrice);
      const ps5 = withPrice.find(d =>
        d.model.toLowerCase().includes("digital") &&
        String(d.storage).toLowerCase().includes("825")
      );
      if (ps5 && ps5.marketPrice) {
        const label = `${ps5.brand} ${ps5.model} ${ps5.storage}`;
        setPreviewLabel(label);
        setDeviceSearch(label);
        setPreviewPrice(ps5.marketPrice);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    pricingConfigApi.list().then(configs => {
      const byKey: Record<string, number> = {};
      for (const c of configs) byKey[c.key] = c.value;
      setModifiers(ALL_SCHEMA.map(s => ({
        ...s,
        value: byKey[s.backendKey] !== undefined ? toDisplay(s, byKey[s.backendKey]) : (DEFAULTS[s.key] ?? 0),
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function handleChange(key: string, value: number) {
    setModifiers(ms => ms.map(m => m.key === key ? { ...m, value } : m));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(modifiers.map(m => pricingConfigApi.upsert(m.backendKey, toBackend(m, m.value), m.label)));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  function handleReset() {
    setModifiers(ms => ms.map(m => ({ ...m, value: DEFAULTS[m.key] ?? m.value })));
  }

  async function handleLaunchPricing() {
    setLaunching(true);
    try {
      await productPricingApi.run();
    } catch { /* already running or error — products page will show status */ }
    router.push("/products");
  }

  function get(key: string) { return modifiers.find(m => m.key === key)?.value ?? 0; }
  function priceBeforeDiscount(condKey: string) {
    return round5(previewPrice * get(condKey) / 100 * (1 + get("sell_margin") / 100));
  }
  function sellPrice(condKey: string) {
    return round5(priceBeforeDiscount(condKey) * (1 - get("sell_discount") / 100));
  }
  function tradeOffer(condKey: string) {
    return round5(sellPrice(condKey) * get("tradein_ratio") / 100 * (1 - get("tradein_margin") / 100));
  }

  const CONDITIONS = [
    { key: "mint",    label: "Mint / Pristine", color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
    { key: "good",    label: "Good",            color: "text-blue-700 bg-blue-50 border-blue-100" },
    { key: "used",    label: "Refurbished",     color: "text-amber-700 bg-amber-50 border-amber-100" },
    { key: "damaged", label: "Damaged",         color: "text-red-700 bg-red-50 border-red-100" },
  ];

  const filteredDevices = scrapedDevices
    .filter(d => `${d.brand} ${d.model} ${d.storage}`.toLowerCase().includes(deviceSearch.toLowerCase()))
    .slice(0, 25);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pricing Rules</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure sell prices and trade-in offers. Save then rerun pricing to apply.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex items-center gap-2 h-10 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold hover:border-zinc-400 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-zinc-800"}`}>
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save changes</>}
          </button>
          <button onClick={handleLaunchPricing} disabled={launching} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60">
            {launching ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Auto-price All
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_360px] gap-6">
        {/* ── Left ── */}
        <div className="space-y-5">

          {/* Sell price multipliers */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-zinc-500" />
              <p className="text-sm font-bold">Sell price multipliers</p>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              <strong>Formula: sell price = competitor market price × condition %</strong>
            </p>
            <p className="text-xs text-zinc-400 mb-6">
              Set 100% to match competitor. Above 100% to charge more (e.g. better warranty). Below 100% to undercut.
            </p>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-7">
              {CONDITION_SCHEMA.map(s => {
                const m = modifiers.find(x => x.key === s.key)!;
                return <SliderRow key={s.key} modifier={m} onChange={handleChange} />;
              })}
            </div>
            <div className="mt-6 rounded-xl bg-zinc-950 text-white p-4 font-mono text-xs leading-relaxed">
              <span className="text-zinc-400">sell = market × multiplier% × (1 + margin%) × (1 − discount%)</span><br />
              <span className="text-zinc-400">e.g. £{previewPrice} × {get("mint")}% × (1+{get("sell_margin")}%) × (1−{get("sell_discount")}%) = </span>
              <strong>£{sellPrice("mint")}</strong>
              <span className="text-zinc-400"> (Mint) · was £{previewPrice}</span>
            </div>
          </div>

          {/* Trade-in settings */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="h-4 w-4 text-zinc-500" />
              <p className="text-sm font-bold">Trade-in settings</p>
            </div>
            <p className="text-xs text-zinc-400 mb-1">
              <strong>Formula: trade-in offer = sell price × offer ratio − fault deductions</strong>
            </p>
            <p className="text-xs text-zinc-400 mb-6">
              Offer ratio is what % of our resale price we pay the customer. Deductions are subtracted on top for reported faults.
            </p>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-7">
              <SliderRow modifier={modifiers.find(x => x.key === "tradein_ratio")!} onChange={handleChange} />
              <SliderRow modifier={modifiers.find(x => x.key === "tradein_margin")!} onChange={handleChange} />
              <SliderRow modifier={modifiers.find(x => x.key === "ai_buffer")!} onChange={handleChange} />
            </div>
            <p className="text-xs font-semibold text-zinc-400 mt-7 mb-5 uppercase tracking-widest">Fault deductions</p>
            <div className="grid md:grid-cols-3 gap-x-8 gap-y-7">
              {["cracked_screen", "battery", "charging"].map(k => {
                const m = modifiers.find(x => x.key === k)!;
                return <SliderRow key={k} modifier={m} onChange={handleChange} />;
              })}
            </div>
            <div className="mt-6 rounded-xl bg-zinc-950 text-white p-4 font-mono text-xs leading-relaxed">
              <span className="text-zinc-400">trade_in = sell_price × ratio% × (1 − trade_margin%)</span><br />
              <span className="text-zinc-400">e.g. £{sellPrice("used")} (Refurb) × {get("tradein_ratio")}% × (1 − {get("tradein_margin")}%) = </span>
              <strong>£{tradeOffer("used")}</strong>
              <span className="text-zinc-400"> offered to customer</span>
            </div>
          </div>
        </div>

        {/* ── Right: live calculator ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Calculator className="h-4 w-4 text-zinc-500" />
              <h2 className="font-bold text-sm">Live price calculator</h2>
            </div>

            <div className="space-y-3 mb-6">
              <div className="relative">
                <label className="text-xs font-semibold text-zinc-500 block mb-1">Device (scraped products)</label>
                <input
                  type="text"
                  value={deviceSearch}
                  onChange={e => { setDeviceSearch(e.target.value); setShowDeviceDrop(true); }}
                  onFocus={() => setShowDeviceDrop(true)}
                  onBlur={() => setTimeout(() => setShowDeviceDrop(false), 150)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm font-medium focus:outline-none focus:border-zinc-800"
                  placeholder="Search scraped devices…"
                />
                {showDeviceDrop && filteredDevices.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                    {filteredDevices.map(d => (
                      <button
                        key={d.id}
                        onMouseDown={() => {
                          const label = `${d.brand} ${d.model} ${d.storage}`;
                          setDeviceSearch(label);
                          setPreviewLabel(label);
                          setPreviewPrice(d.marketPrice!);
                          setShowDeviceDrop(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 flex justify-between items-center gap-2"
                      >
                        <span className="truncate">{d.brand} {d.model} {d.storage}</span>
                        <span className="shrink-0 text-xs text-zinc-400 font-mono">£{d.marketPrice}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 block mb-1">Market price (£)</label>
                <input type="number" value={previewPrice} min={10} max={5000}
                  onChange={e => setPreviewPrice(Number(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm font-mono font-bold focus:outline-none focus:border-zinc-800" />
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Our sell price</p>
            <div className="space-y-1.5 mb-6">
              {CONDITIONS.map(({ key, label, color }) => {
                const before   = priceBeforeDiscount(key);
                const final    = sellPrice(key);
                const discount = get("sell_discount");
                return (
                  <div key={key} className={`flex justify-between items-center py-2 px-3 rounded-xl border ${color}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold">{get(key)}%{get("sell_margin") !== 0 && <span className="opacity-60"> {get("sell_margin") > 0 ? "+" : ""}{get("sell_margin")}%</span>}{discount > 0 && <span className="opacity-60"> −{discount}%</span>}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      {discount > 0 && <span className="text-[11px] text-current opacity-40 line-through font-mono">£{before}</span>}
                      <span className="font-bold font-mono text-sm">£{final}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Trade-in offer we pay</p>
            <div className="space-y-1.5">
              {CONDITIONS.map(({ key, label, color }) => (
                <div key={key} className={`flex justify-between items-center py-2 px-3 rounded-xl border ${color}`}>
                  <span className="text-sm font-medium">{label} trade-in</span>
                  <span className="font-bold font-mono text-sm">£{tradeOffer(key)}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
              {previewLabel} · market £{previewPrice} · trade-in ratio {get("tradein_ratio")}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ modifier, onChange }: { modifier: Modifier; onChange: (key: string, value: number) => void }) {
  const [draft, setDraft] = useState(String(modifier.value));

  useEffect(() => { setDraft(String(modifier.value)); }, [modifier.value]);

  function commit(raw: string) {
    const v = Number(raw);
    const clamped = Math.min(modifier.max, Math.max(modifier.min, isNaN(v) ? modifier.value : v));
    setDraft(String(clamped));
    onChange(modifier.key, clamped);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold">{modifier.label}</p>
        <input
          type="number" value={draft} min={modifier.min} max={modifier.max} step={modifier.step}
          onChange={e => {
            setDraft(e.target.value);
            const v = Number(e.target.value);
            if (!isNaN(v) && e.target.value !== "" && v >= modifier.min && v <= modifier.max) onChange(modifier.key, v);
          }}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") commit((e.target as HTMLInputElement).value); }}
          className="w-16 h-7 text-center text-sm font-bold font-mono rounded-lg border border-zinc-200 focus:outline-none focus:border-zinc-800"
        />
      </div>
      <input
        type="range" min={modifier.min} max={modifier.max} step={modifier.step} value={modifier.value}
        onChange={e => { const v = Number(e.target.value); setDraft(String(v)); onChange(modifier.key, v); }}
        className="w-full h-1.5 rounded-full accent-black bg-zinc-100 cursor-pointer"
      />
      <p className="text-xs text-zinc-400 mt-1.5 leading-snug">{modifier.desc}</p>
    </div>
  );
}
