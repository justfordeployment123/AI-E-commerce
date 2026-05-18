"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Tablet, Gamepad2, Laptop, ArrowLeft, ArrowRight,
  Check, ChevronRight, Package, MapPin, Zap, Shield, Clock,
  Star, CheckCircle2, Truck, Gift
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// ─── Data ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "Phone", label: "Phone", icon: Smartphone, mood: "bg-mood-sky" },
  { id: "Tablet", label: "Tablet", icon: Tablet, mood: "bg-mood-rose" },
  { id: "Console", label: "Console", icon: Gamepad2, mood: "bg-mood-violet" },
  { id: "Laptop", label: "Laptop / MacBook", icon: Laptop, mood: "bg-mood-amber" },
];

const BRANDS: Record<string, string[]> = {
  Phone: ["Apple", "Samsung", "Google", "OnePlus", "Nothing", "Motorola"],
  Tablet: ["Apple", "Samsung", "Microsoft"],
  Console: ["Sony PlayStation", "Microsoft Xbox", "Nintendo"],
  Laptop: ["Apple", "Dell", "Lenovo", "HP", "ASUS"],
};

const MODELS: Record<string, Record<string, string[]>> = {
  Phone: {
    Apple: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11"],
    Samsung: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22", "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21"],
    Google: ["Pixel 8 Pro", "Pixel 8", "Pixel 7 Pro", "Pixel 7", "Pixel 6 Pro", "Pixel 6"],
    OnePlus: ["OnePlus 12", "OnePlus 11", "OnePlus 10 Pro", "OnePlus 9 Pro"],
    Nothing: ["Nothing Phone (2)", "Nothing Phone (1)"],
    Motorola: ["Edge 50 Pro", "Edge 40 Pro", "Moto G84", "Moto G54"],
  },
  Tablet: {
    Apple: ["iPad Pro 13\" M4", "iPad Pro 11\" M4", "iPad Air 13\" M2", "iPad Air 11\" M2", "iPad mini 7th Gen", "iPad Pro 13\" M2", "iPad Pro 11\" M2", "iPad Air 5th Gen", "iPad 10th Gen", "iPad 9th Gen", "iPad mini 6th Gen"],
    Samsung: ["Galaxy Tab S10 Ultra", "Galaxy Tab S10+", "Galaxy Tab S10", "Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9", "Galaxy Tab S8 Ultra"],
    Microsoft: ["Surface Pro 11", "Surface Pro 10", "Surface Pro 9", "Surface Pro 8"],
  },
  Console: {
    "Sony PlayStation": ["PS5 Disc Edition", "PS5 Digital Edition", "PS4 Pro", "PS4 Slim", "PS4", "PS3 Slim", "PS3"],
    "Microsoft Xbox": ["Xbox Series X", "Xbox Series S", "Xbox One X", "Xbox One S", "Xbox One", "Xbox 360 S", "Xbox 360"],
    Nintendo: ["Nintendo Switch OLED", "Nintendo Switch (V2)", "Nintendo Switch Lite"],
  },
  Laptop: {
    Apple: ["MacBook Pro 16\" M3 Max", "MacBook Pro 16\" M3 Pro", "MacBook Pro 14\" M3 Max", "MacBook Pro 14\" M3 Pro", "MacBook Air 15\" M3", "MacBook Air 13\" M3", "MacBook Pro 16\" M2 Max", "MacBook Pro 16\" M2 Pro", "MacBook Pro 14\" M2 Pro", "MacBook Air 15\" M2", "MacBook Air 13\" M2", "MacBook Air 13\" M1"],
    Dell: ["XPS 15 (2024)", "XPS 13 (2024)", "Inspiron 15 5530", "Latitude 14 5440"],
    Lenovo: ["ThinkPad X1 Carbon Gen 12", "ThinkPad T14s Gen 5", "IdeaPad Slim 5", "Legion 5i Gen 9"],
    HP: ["Spectre x360 14", "EliteBook 840 G11", "Pavilion 15", "Envy x360 15"],
    ASUS: ["ZenBook 14 OLED", "ROG Zephyrus G14 2024", "VivoBook 15 OLED", "ExpertBook B9 OLED"],
  },
};

const SPECS: Record<string, { label: string; options: string[] }[]> = {
  Phone: [
    { label: "Storage", options: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
    { label: "Network", options: ["Unlocked", "EE", "Vodafone", "O2", "Three"] },
  ],
  Tablet: [
    { label: "Storage", options: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
    { label: "Connectivity", options: ["Wi-Fi Only", "Wi-Fi + Cellular"] },
  ],
  Console: [
    { label: "Controllers", options: ["1 Controller Included", "2 Controllers Included", "No Controllers"] },
    { label: "Cables", options: ["HDMI + Power Cables", "Power Cable Only", "No Cables"] },
  ],
  Laptop: [
    { label: "RAM", options: ["8 GB", "16 GB", "32 GB", "64 GB"] },
    { label: "Storage", options: ["256 GB SSD", "512 GB SSD", "1 TB SSD", "2 TB SSD"] },
  ],
};

const CONDITIONS = [
  { id: "Mint", label: "Mint", desc: "Like new — barely used, no marks whatsoever", color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-400", multiplier: 1.0 },
  { id: "Good", label: "Good", desc: "Minor scuffs only — fully functional, no screen damage", color: "bg-blue-50 border-blue-200", dot: "bg-blue-400", multiplier: 0.82 },
  { id: "Used", label: "Used", desc: "Visible wear — scratches or light marks, works perfectly", color: "bg-amber-50 border-amber-200", dot: "bg-amber-400", multiplier: 0.62 },
  { id: "Damaged", label: "Damaged", desc: "Cracked screen or significant body damage", color: "bg-red-50 border-red-200", dot: "bg-red-400", multiplier: 0.3 },
];

const CONDITION_QUESTIONS: Record<string, { id: string; question: string; options: string[] }[]> = {
  Phone: [
    { id: "screen", question: "How is the screen?", options: ["No cracks or scratches", "Light surface scratches", "Cracked but display works", "Shattered / unusable display"] },
    { id: "back", question: "How is the back of the phone?", options: ["Perfect — no marks", "Minor scuffs", "Cracked back glass"] },
    { id: "battery", question: "What's the battery health?", options: ["90%+ (Excellent)", "80–89% (Good)", "70–79% (Fair)", "Below 70% / Unknown"] },
    { id: "biometrics", question: "Is Face ID / Touch ID working?", options: ["Yes, fully working", "No / Faulty"] },
    { id: "charging", question: "Is the charging port working?", options: ["Yes", "No / Loose"] },
    { id: "reset", question: "Is the phone factory reset?", options: ["Yes, already reset", "I'll reset before sending"] },
  ],
  Tablet: [
    { id: "screen", question: "How is the screen?", options: ["No damage at all", "Light surface scratches", "Cracked but usable", "Shattered"] },
    { id: "body", question: "How is the body / casing?", options: ["Like new", "Light scratches", "Dents or significant marks"] },
    { id: "battery", question: "How's the battery life?", options: ["Holds charge well (6+ hours)", "Drains a bit fast (3–5 hours)", "Very poor under 3 hours"] },
    { id: "charging", question: "Is the charging port working?", options: ["Yes", "No / Loose"] },
    { id: "reset", question: "Is the tablet factory reset?", options: ["Yes, already reset", "I'll reset before sending"] },
  ],
  Console: [
    { id: "power", question: "Does the console power on and work?", options: ["Yes, works perfectly", "Yes but has some issues", "No, won't power on"] },
    { id: "disc", question: "Is the disc drive working?", options: ["Yes, works great", "No / Faulty", "No disc drive (digital edition)"] },
    { id: "body", question: "Any visible body damage?", options: ["Like new", "Minor scratches", "Significant damage"] },
    { id: "reset", question: "Have you done a factory reset?", options: ["Yes, already reset", "I'll reset before sending"] },
  ],
  Laptop: [
    { id: "power", question: "Does it power on?", options: ["Yes, works perfectly", "No"] },
    { id: "screen", question: "How is the screen?", options: ["No damage", "Minor scratches", "Cracked"] },
    { id: "input", question: "Are the keyboard and trackpad fully working?", options: ["Yes, all working", "Minor issues", "Major issues"] },
    { id: "battery", question: "How's the battery?", options: ["Holds charge well (4+ hours)", "Drains quickly (1–3 hours)", "Very poor under 1 hour"] },
    { id: "body", question: "Any body damage?", options: ["None", "Minor dents or scratches", "Significant damage"] },
    { id: "reset", question: "Have you done a factory reset?", options: ["Yes, already reset", "I'll reset before sending"] },
  ],
};

// Base prices in GBP for offer calculation
const BASE_PRICES: Record<string, Record<string, number>> = {
  "iPhone 15 Pro Max": { base: 780 }, "iPhone 15 Pro": { base: 680 }, "iPhone 15 Plus": { base: 580 },
  "iPhone 15": { base: 520 }, "iPhone 14 Pro Max": { base: 620 }, "iPhone 14 Pro": { base: 540 },
  "iPhone 14 Plus": { base: 430 }, "iPhone 14": { base: 380 }, "iPhone 13 Pro Max": { base: 480 },
  "iPhone 13 Pro": { base: 420 }, "iPhone 13": { base: 340 }, "iPhone 12 Pro Max": { base: 320 },
  "iPhone 12 Pro": { base: 280 }, "iPhone 12": { base: 230 }, "iPhone 11 Pro Max": { base: 220 },
  "iPhone 11 Pro": { base: 190 }, "iPhone 11": { base: 160 },
  "Galaxy S24 Ultra": { base: 720 }, "Galaxy S24+": { base: 580 }, "Galaxy S24": { base: 480 },
  "Galaxy S23 Ultra": { base: 580 }, "Galaxy S23+": { base: 440 }, "Galaxy S23": { base: 360 },
  "Galaxy S22 Ultra": { base: 440 }, "Galaxy S22+": { base: 320 }, "Galaxy S22": { base: 260 },
  "Galaxy S21 Ultra": { base: 300 }, "Galaxy S21+": { base: 220 }, "Galaxy S21": { base: 175 },
  "Pixel 8 Pro": { base: 560 }, "Pixel 8": { base: 420 }, "Pixel 7 Pro": { base: 380 },
  "Pixel 7": { base: 280 }, "Pixel 6 Pro": { base: 240 }, "Pixel 6": { base: 180 },
  "PS5 Disc Edition": { base: 340 }, "PS5 Digital Edition": { base: 280 }, "PS4 Pro": { base: 170 },
  "PS4 Slim": { base: 120 }, "PS4": { base: 95 }, "PS3 Slim": { base: 55 }, "PS3": { base: 40 },
  "Xbox Series X": { base: 320 }, "Xbox Series S": { base: 190 }, "Xbox One X": { base: 140 },
  "Xbox One S": { base: 90 }, "Xbox One": { base: 70 }, "Xbox 360 S": { base: 40 }, "Xbox 360": { base: 30 },
  "Nintendo Switch OLED": { base: 210 }, "Nintendo Switch (V2)": { base: 155 }, "Nintendo Switch Lite": { base: 110 },
  "MacBook Pro 16\" M3 Max": { base: 1800 }, "MacBook Pro 16\" M3 Pro": { base: 1500 },
  "MacBook Pro 14\" M3 Max": { base: 1600 }, "MacBook Pro 14\" M3 Pro": { base: 1200 },
  "MacBook Air 15\" M3": { base: 900 }, "MacBook Air 13\" M3": { base: 780 },
  "MacBook Pro 16\" M2 Max": { base: 1400 }, "MacBook Pro 16\" M2 Pro": { base: 1150 },
  "MacBook Pro 14\" M2 Pro": { base: 1050 }, "MacBook Air 15\" M2": { base: 780 },
  "MacBook Air 13\" M2": { base: 680 }, "MacBook Air 13\" M1": { base: 500 },
};

function computeOffer(state: TradeInState): number {
  const base = BASE_PRICES[state.model]?.base ?? 200;
  const condition = CONDITIONS.find(c => c.id === state.condition);
  const mult = condition?.multiplier ?? 0.5;
  let price = base * mult;

  // Condition question penalties
  if (state.answers.screen === "Cracked but display works") price *= 0.75;
  if (state.answers.screen === "Shattered / unusable display" || state.answers.screen === "Shattered") price *= 0.4;
  if (state.answers.battery === "70–79% (Fair)") price *= 0.92;
  if (state.answers.battery === "Below 70% / Unknown") price *= 0.82;
  if (state.answers.battery === "Drains quickly (1–3 hours)") price *= 0.88;
  if (state.answers.battery === "Very poor under 1 hour" || state.answers.battery === "Very poor under 3 hours") price *= 0.75;
  if (state.answers.charging === "No / Loose") price *= 0.85;
  if (state.answers.biometrics === "No / Faulty") price *= 0.9;
  if (state.answers.power === "No, won't power on" || state.answers.power === "No") price *= 0.25;
  if (state.answers.power === "Yes but has some issues") price *= 0.7;
  if (state.answers.back === "Cracked back glass") price *= 0.88;
  if (state.answers.body === "Significant damage") price *= 0.7;
  if (state.answers.body === "Dents or significant marks") price *= 0.8;
  if (state.answers.screen === "Cracked") price *= 0.65;
  if (state.answers.input === "Major issues") price *= 0.6;

  return Math.max(Math.round(price / 5) * 5, 10);
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface TradeInState {
  category: string;
  brand: string;
  model: string;
  specs: Record<string, string>;
  condition: string;
  answers: Record<string, string>;
  fulfillment: string;
  contact: { name: string; email: string; phone: string; address: string; postcode: string };
}

const TOTAL_STEPS = 10;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Sub-components ────────────────────────────────────────────────────────

function OptionButton({ label, selected, onClick, desc, icon: Icon }: {
  label: string; selected?: boolean; onClick: () => void;
  desc?: string; icon?: React.ElementType;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 text-left transition-all duration-200 ${
        selected
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md"
      }`}
    >
      {Icon && (
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? "bg-white/10" : "bg-zinc-100"}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm md:text-base leading-tight">{label}</p>
        {desc && <p className={`text-xs mt-0.5 leading-relaxed ${selected ? "text-white/70" : "text-zinc-400"}`}>{desc}</p>}
      </div>
      {selected && <Check className="h-5 w-5 text-accent flex-shrink-0" />}
    </motion.button>
  );
}

function ChipButton({ label, selected, onClick }: { label: string; selected?: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`px-5 py-3 rounded-[1rem] border-2 font-bold text-sm transition-all duration-200 ${
        selected
          ? "border-black bg-black text-white"
          : "border-zinc-200 bg-white hover:border-zinc-400"
      }`}
    >
      {label}
    </motion.button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TradeInPage() {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<TradeInState>({
    category: "", brand: "", model: "", specs: {}, condition: "",
    answers: {}, fulfillment: "",
    contact: { name: "", email: "", phone: "", address: "", postcode: "" },
  });
  const [specStep, setSpecStep] = useState(0);
  const [questionStep, setQuestionStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const go = useCallback((n: number) => {
    setDir(n > 0 ? 1 : -1);
    setStep(s => s + n);
  }, []);

  const back = () => {
    if (step === 5 && specStep > 0) { setSpecStep(s => s - 1); return; }
    if (step === 7 && questionStep > 0) { setQuestionStep(s => s - 1); return; }
    go(-1);
  };

  const progress = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  const currentSpecs = SPECS[state.category] ?? [];
  const currentSpec = currentSpecs[specStep];
  const currentQuestions = CONDITION_QUESTIONS[state.category] ?? [];
  const currentQuestion = currentQuestions[questionStep];
  const offerPrice = state.model ? computeOffer(state) : 0;

  function handleSpecSelect(value: string) {
    setState(s => ({ ...s, specs: { ...s.specs, [currentSpec.label]: value } }));
    if (specStep < currentSpecs.length - 1) {
      setSpecStep(s => s + 1);
    } else {
      go(1);
    }
  }

  function handleAnswerSelect(value: string) {
    setState(s => ({ ...s, answers: { ...s.answers, [currentQuestion.id]: value } }));
    if (questionStep < currentQuestions.length - 1) {
      setQuestionStep(s => s + 1);
    } else {
      go(1);
    }
  }

  const stepLabels = ["Category", "Brand", "Model", "Specs", "Condition", "Details", "Offer", "Fulfilment", "Contact", "Done"];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
        {/* Header strip */}
        <div className="border-b border-zinc-100 bg-zinc-50/50">
          <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-bold text-lg tracking-tight">Trade-In Flow</h1>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest mt-0.5">
                  Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Secure &amp; Free</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-black rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step === 5 ? `5-${specStep}` : step === 7 ? `7-${questionStep}` : step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >

              {/* STEP 1 – Category */}
              {step === 1 && (
                <div>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">What are you trading in?</h2>
                  <p className="text-zinc-400 font-medium mb-10">Select the type of device to get started.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setState(s => ({ ...s, category: cat.id, brand: "", model: "", specs: {}, condition: "", answers: {} }));
                          setSpecStep(0);
                          setQuestionStep(0);
                          go(1);
                        }}
                        className={`aspect-square rounded-[2rem] ${cat.mood} flex flex-col items-start justify-between p-7 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                      >
                        <div className="h-14 w-14 bg-white/60 rounded-2xl flex items-center justify-center">
                          <cat.icon className="h-7 w-7 text-black/70" strokeWidth={1.5} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-base">{cat.label}</p>
                          <ChevronRight className="h-4 w-4 text-black/40 mt-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 – Brand */}
              {step === 2 && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">Which brand?</h2>
                  <p className="text-zinc-400 font-medium mb-10">Select the manufacturer of your {state.category.toLowerCase()}.</p>
                  <div className="space-y-3">
                    {(BRANDS[state.category] ?? []).map(brand => (
                      <OptionButton
                        key={brand}
                        label={brand}
                        selected={state.brand === brand}
                        onClick={() => {
                          setState(s => ({ ...s, brand, model: "" }));
                          go(1);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3 – Model */}
              {step === 3 && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">Which model?</h2>
                  <p className="text-zinc-400 font-medium mb-10">{state.brand} — select your exact model.</p>
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
                    {(MODELS[state.category]?.[state.brand] ?? []).map(model => (
                      <OptionButton
                        key={model}
                        label={model}
                        selected={state.model === model}
                        onClick={() => {
                          setState(s => ({ ...s, model }));
                          go(1);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4 – Specs (sub-stepped) */}
              {step === 4 && currentSpec && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">{state.model}</p>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">{currentSpec.label}?</h2>
                  <p className="text-zinc-400 font-medium mb-10">
                    {specStep + 1} of {currentSpecs.length}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {currentSpec.options.map(opt => (
                      <ChipButton
                        key={opt}
                        label={opt}
                        selected={state.specs[currentSpec.label] === opt}
                        onClick={() => handleSpecSelect(opt)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5 – Condition */}
              {step === 5 && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">Overall condition?</h2>
                  <p className="text-zinc-400 font-medium mb-10">Be honest — we check every device and adjust the offer if needed.</p>
                  <div className="space-y-3">
                    {CONDITIONS.map(c => (
                      <motion.button
                        key={c.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setState(s => ({ ...s, condition: c.id }));
                          go(1);
                        }}
                        className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 text-left transition-all duration-200 ${
                          state.condition === c.id
                            ? "border-black bg-black text-white"
                            : `${c.color} hover:border-zinc-400`
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full flex-shrink-0 ${state.condition === c.id ? "bg-accent" : c.dot}`} />
                        <div className="flex-1">
                          <p className="font-bold text-sm md:text-base">{c.label}</p>
                          <p className={`text-xs mt-0.5 ${state.condition === c.id ? "text-white/70" : "text-zinc-500"}`}>{c.desc}</p>
                        </div>
                        {state.condition === c.id && <Check className="h-5 w-5 text-accent flex-shrink-0" />}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6 – Condition Questions (sub-stepped) */}
              {step === 6 && currentQuestion && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                    Question {questionStep + 1} of {currentQuestions.length}
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl font-medium mb-10 leading-snug">{currentQuestion.question}</h2>
                  <div className="space-y-3">
                    {currentQuestion.options.map(opt => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={state.answers[currentQuestion.id] === opt}
                        onClick={() => handleAnswerSelect(opt)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7 – Offer Price */}
              {step === 7 && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="rounded-[2.5rem] bg-black text-white p-10 mb-8 text-center"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mb-6">
                      <Star className="h-3 w-3 text-accent" />
                      Your Offer
                    </div>
                    <motion.p
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                      className="text-7xl md:text-8xl font-bold tracking-tighter mb-2"
                    >
                      £{offerPrice}
                    </motion.p>
                    <p className="text-white/60 font-medium text-sm">Based on market data — valid for 14 days</p>
                    <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                      {[["Model", state.model], ["Condition", state.condition], ["Storage", state.specs["Storage"] ?? state.specs["RAM"] ?? state.specs["Controllers"] ?? "—"]].map(([k, v]) => (
                        <div key={k} className="bg-white/5 rounded-2xl p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{k}</p>
                          <p className="text-sm font-bold truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="space-y-3 mb-8">
                    {[
                      { icon: Shield, text: "Free, insured shipping label included" },
                      { icon: Zap, text: "Payment within 48 hours of verification" },
                      { icon: Clock, text: "Offer valid for 14 days from today" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-black" />
                        </div>
                        <p className="text-sm font-medium text-zinc-600">{text}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => go(1)}
                    className="w-full h-16 bg-accent text-black rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-accent-dark transition-colors active:scale-[0.99]"
                  >
                    Accept Offer <ArrowRight className="h-5 w-5" />
                  </button>
                  <p className="text-center text-xs text-zinc-400 font-medium mt-4">No obligation — you can decline after inspection</p>
                </div>
              )}

              {/* STEP 8 – Fulfillment */}
              {step === 8 && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">How do you want to send it?</h2>
                  <p className="text-zinc-400 font-medium mb-10">Choose the option that works best for you.</p>
                  <div className="space-y-4">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setState(s => ({ ...s, fulfillment: "ship" })); go(1); }}
                      className={`w-full rounded-[2rem] border-2 p-7 text-left transition-all duration-200 ${state.fulfillment === "ship" ? "border-black bg-black text-white" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-white"}`}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${state.fulfillment === "ship" ? "bg-white/10" : "bg-white shadow-sm"}`}>
                          <Truck className="h-7 w-7" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-bold text-lg mb-1">Ship to us</p>
                          <p className={`text-sm leading-relaxed ${state.fulfillment === "ship" ? "text-white/70" : "text-zinc-500"}`}>
                            We email you a free prepaid label. Pack it up and drop it at any post office or collection point.
                          </p>
                          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${state.fulfillment === "ship" ? "bg-accent/20 text-accent" : "bg-emerald-100 text-emerald-700"}`}>
                            <Gift className="h-3 w-3" /> Free shipping label
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setState(s => ({ ...s, fulfillment: "dropoff" })); go(1); }}
                      className={`w-full rounded-[2rem] border-2 p-7 text-left transition-all duration-200 ${state.fulfillment === "dropoff" ? "border-black bg-black text-white" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-white"}`}
                    >
                      <div className="flex items-start gap-5">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${state.fulfillment === "dropoff" ? "bg-white/10" : "bg-white shadow-sm"}`}>
                          <MapPin className="h-7 w-7" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-bold text-lg mb-1">Drop off in store</p>
                          <p className={`text-sm leading-relaxed ${state.fulfillment === "dropoff" ? "text-white/70" : "text-zinc-500"}`}>
                            Bring your device to TechStop Leicester and get paid on the spot after a quick inspection.
                          </p>
                          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${state.fulfillment === "dropoff" ? "bg-accent/20 text-accent" : "bg-blue-100 text-blue-700"}`}>
                            <Zap className="h-3 w-3" /> Same-day payment
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* STEP 9 – Contact Details */}
              {step === 9 && (
                <div>
                  <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight">Your details</h2>
                  <p className="text-zinc-400 font-medium mb-10">
                    {state.fulfillment === "ship" ? "We'll send the prepaid label to your email." : "We'll confirm your drop-off appointment by email."}
                  </p>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); go(1); }}
                  >
                    {[
                      { key: "name", label: "Full Name", type: "text", placeholder: "E.g. Jordan Mitchell", required: true },
                      { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com", required: true },
                      { key: "phone", label: "Phone Number", type: "tel", placeholder: "+44 7700 000000", required: true },
                      ...(state.fulfillment === "ship" ? [
                        { key: "address", label: "Collection Address", type: "text", placeholder: "Street address", required: true },
                        { key: "postcode", label: "Postcode", type: "text", placeholder: "LE1 1AA", required: true },
                      ] : []),
                    ].map(({ key, label, type, placeholder, required }) => (
                      <div key={key} className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                        <input
                          type={type}
                          required={required}
                          placeholder={placeholder}
                          value={state.contact[key as keyof typeof state.contact]}
                          onChange={e => setState(s => ({ ...s, contact: { ...s.contact, [key]: e.target.value } }))}
                          className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                        />
                      </div>
                    ))}
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors active:scale-[0.99]"
                      >
                        Submit Trade-In <ArrowRight className="h-5 w-5" />
                      </button>
                      <p className="text-center text-[10px] text-zinc-400 font-medium mt-3 leading-relaxed">
                        By submitting you agree to our Terms &amp; Privacy Policy. Your data is encrypted and never sold.
                      </p>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 10 – Confirmation */}
              {step === 10 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="mx-auto h-28 w-28 bg-accent rounded-[2.5rem] flex items-center justify-center mb-8"
                  >
                    <CheckCircle2 className="h-14 w-14 text-black" strokeWidth={1.5} />
                  </motion.div>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">You're all set!</h2>
                  <p className="text-zinc-400 font-medium text-lg mb-10 max-w-sm mx-auto leading-relaxed">
                    Your trade-in for <strong className="text-black">{state.model}</strong> has been submitted for <strong className="text-black">£{offerPrice}</strong>.
                  </p>

                  <div className="rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 mb-10 text-left space-y-5">
                    {state.fulfillment === "ship" ? (
                      <>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white font-bold text-sm">1</span>
                          </div>
                          <div>
                            <p className="font-bold">Check your email</p>
                            <p className="text-sm text-zinc-500 mt-0.5">Your prepaid Royal Mail label will arrive within 1 hour at {state.contact.email}.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black font-bold text-sm">2</span>
                          </div>
                          <div>
                            <p className="font-bold">Pack &amp; post your device</p>
                            <p className="text-sm text-zinc-500 mt-0.5">Wrap the device carefully and drop it at any post office. No box? We'll still accept it.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black font-bold text-sm">3</span>
                          </div>
                          <div>
                            <p className="font-bold">Get paid within 48 hours</p>
                            <p className="text-sm text-zinc-500 mt-0.5">Once we verify your device, the offer amount is transferred directly to you.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white font-bold text-sm">1</span>
                          </div>
                          <div>
                            <p className="font-bold">Visit TechStop Leicester</p>
                            <p className="text-sm text-zinc-500 mt-0.5">Bring your device to our store. A confirmation email has been sent to {state.contact.email}.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black font-bold text-sm">2</span>
                          </div>
                          <div>
                            <p className="font-bold">Quick 5-minute inspection</p>
                            <p className="text-sm text-zinc-500 mt-0.5">We check the device matches your description and confirm the offer.</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black font-bold text-sm">3</span>
                          </div>
                          <div>
                            <p className="font-bold">Walk out with £{offerPrice}</p>
                            <p className="text-sm text-zinc-500 mt-0.5">Paid instantly to your bank account or as cash — your choice.</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <a href="/" className="inline-flex items-center gap-2 h-14 px-10 bg-black text-white rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-colors">
                    Back to Home
                  </a>
                  <p className="mt-4 text-xs text-zinc-400 font-medium">Questions? Chat with us or call 0116 000 0000</p>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
