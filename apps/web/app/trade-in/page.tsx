"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Tablet, Gamepad2, Laptop, ArrowLeft, ArrowRight,
  Check, ChevronRight, MapPin, Zap, Shield, Clock,
  Star, CheckCircle2, Truck, Gift, User, RefreshCw,
  Search, ChevronDown, Award, Sparkles, HelpCircle, Watch, Headphones
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// ─── Data ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "Phone", label: "Smartphone", icon: Smartphone, img: "/bento_smartphones.png", mood: "bg-sky-500/10 border-sky-500/20", moodIcon: "text-sky-500", glow: "hover:shadow-sky-500/10", sub: "iPhone, Galaxy, Pixel, OnePlus", count: "60+ models" },
  { id: "Tablet", label: "Tablet / iPad", icon: Tablet, img: "/bento_tablets.png", mood: "bg-rose-500/10 border-rose-500/20", moodIcon: "text-rose-500", glow: "hover:shadow-rose-500/10", sub: "iPad, Galaxy Tab, Surface Pro", count: "20+ models" },
  { id: "Console", label: "Gaming Console", icon: Gamepad2, img: "/bento_gaming.png", mood: "bg-violet-500/10 border-violet-500/20", moodIcon: "text-violet-500", glow: "hover:shadow-violet-500/10", sub: "PS5, Xbox Series, Switch", count: "17 models" },
  { id: "Laptop", label: "Laptop & MacBook", icon: Laptop, img: "/bento_laptops.png", mood: "bg-amber-500/10 border-amber-500/20", moodIcon: "text-amber-600", glow: "hover:shadow-amber-500/10", sub: "MacBook, XPS, ThinkPad", count: "25+ models" },
  { id: "Smartwatch", label: "Smartwatch", icon: Watch, img: "/galaxy_watch_promo_1778927696615.png", mood: "bg-emerald-500/10 border-emerald-500/20", moodIcon: "text-emerald-500", glow: "hover:shadow-emerald-500/10", sub: "Apple Watch, Galaxy Watch, Fitbit", count: "30+ models" },
  { id: "Audio", label: "Audio & Headphones", icon: Headphones, img: "/bento_audio.png", mood: "bg-indigo-500/10 border-indigo-500/20", moodIcon: "text-indigo-500", glow: "hover:shadow-indigo-500/10", sub: "AirPods, Sony, Bose", count: "25+ models" },
];

const BRANDS: Record<string, string[]> = {
  Phone: ["Apple", "Samsung", "Google", "OnePlus", "Nothing", "Motorola"],
  Tablet: ["Apple", "Samsung", "Microsoft"],
  Console: ["Sony PlayStation", "Microsoft Xbox", "Nintendo"],
  Laptop: ["Apple", "Dell", "Lenovo", "HP", "ASUS"],
  Smartwatch: ["Apple", "Samsung", "Fitbit"],
  Audio: ["Apple", "Sony", "Bose"],
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
  Smartwatch: {
    Apple: ["Apple Watch Ultra 2", "Apple Watch Series 9", "Apple Watch Series 8", "Apple Watch SE (2nd Gen)"],
    Samsung: ["Galaxy Watch 6 Classic", "Galaxy Watch 6", "Galaxy Watch 5 Pro", "Galaxy Watch 5"],
    Fitbit: ["Fitbit Sense 2", "Fitbit Versa 4", "Fitbit Charge 6"],
  },
  Audio: {
    Apple: ["AirPods Max", "AirPods Pro 2", "AirPods Pro", "AirPods 3rd Gen"],
    Sony: ["WH-1000XM5", "WF-1000XM5", "WH-1000XM4"],
    Bose: ["QuietComfort Ultra", "QuietComfort II Headphones", "QuietComfort Earbuds II"],
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
  Smartwatch: [
    { label: "Case Size", options: ["40mm/41mm", "44mm/45mm", "49mm (Ultra)"] },
    { label: "Connectivity", options: ["GPS Only", "GPS + Cellular"] },
  ],
  Audio: [
    { label: "Type", options: ["Over-Ear", "In-Ear Wireless"] },
    { label: "Colorway", options: ["Signature Black/Silver", "Special Edition / Other"] },
  ],
};

const CONDITIONS = [
  { id: "Mint", label: "Mint", desc: "Like new — barely used, no marks whatsoever", color: "bg-emerald-50 border-emerald-200/60", dot: "bg-emerald-400", multiplier: 1.0 },
  { id: "Good", label: "Good", desc: "Minor scuffs only — fully functional, no screen damage", color: "bg-blue-50 border-blue-200/60", dot: "bg-blue-400", multiplier: 0.82 },
  { id: "Used", label: "Used", desc: "Visible wear — scratches or light marks, works perfectly", color: "bg-amber-50 border-amber-200/60", dot: "bg-amber-400", multiplier: 0.62 },
  { id: "Damaged", label: "Damaged", desc: "Cracked screen or significant body damage", color: "bg-red-50 border-red-200/60", dot: "bg-red-400", multiplier: 0.3 },
];

const CONDITION_QUESTIONS: Record<string, { id: string; question: string; options: string[] }[]> = {
  Phone: [
    { id: "screen", question: "How is the screen?", options: ["No cracks or scratches", "Light surface scratches", "Cracked but display works", "Shattered / unusable display"] },
    { id: "back", question: "How is the back of the phone?", options: ["Perfect — no marks", "Minor scuffs", "Cracked back glass"] },
    { id: "battery", question: "What's the battery health?", options: ["90%+: (Excellent)", "80–89% (Good)", "70–79% (Fair)", "Below 70% / Unknown"] },
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
  Smartwatch: [
    { id: "power", question: "Does the watch power on and function?", options: ["Yes, fully working", "Powers on but has screen/sensor issues", "Won't power on"] },
    { id: "screen", question: "How is the screen glass?", options: ["Pristine - no scratches", "Light micro-scratches", "Deep scratches or chips", "Cracked screen"] },
    { id: "battery", question: "Does battery hold a normal charge?", options: ["Holds charge well (1+ day)", "Degraded charge (under 12 hours)"] },
    { id: "charging", question: "Is the charger working and connecting?", options: ["Yes", "No / loose connection"] },
    { id: "reset", question: "Is Activation Lock / iCloud turned off?", options: ["Yes, fully removed", "I will remove before posting"] },
  ],
  Audio: [
    { id: "sound", question: "How is the sound quality?", options: ["Perfect - crisp audio & active ANC", "Muffled sound or static in one ear", "No sound in one/both ears"] },
    { id: "body", question: "How is the cosmetic condition?", options: ["Like new - clean pads/tips", "Minor scratches or wear on case", "Heavy wear or staining"] },
    { id: "battery", question: "How is the battery health?", options: ["Excellent charge", "Low capacity - drains fast"] },
    { id: "charging", question: "Does the charging case work?", options: ["Yes, charges fully", "No / faulty connection"] },
  ],
};

const BASE_PRICES: Record<string, { base: number }> = {
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
  "Apple Watch Ultra 2": { base: 410 }, "Apple Watch Series 9": { base: 220 }, "Apple Watch Series 8": { base: 160 }, "Apple Watch SE (2nd Gen)": { base: 105 },
  "Galaxy Watch 6 Classic": { base: 150 }, "Galaxy Watch 6": { base: 110 }, "Galaxy Watch 5 Pro": { base: 90 }, "Galaxy Watch 5": { base: 65 },
  "Fitbit Sense 2": { base: 85 }, "Fitbit Versa 4": { base: 60 }, "Fitbit Charge 6": { base: 45 },
  "AirPods Max": { base: 260 }, "AirPods Pro 2": { base: 115 }, "AirPods Pro": { base: 75 }, "AirPods 3rd Gen": { base: 60 },
  "WH-1000XM5": { base: 170 }, "WF-1000XM5": { base: 100 }, "WH-1000XM4": { base: 100 },
  "QuietComfort Ultra": { base: 175 }, "QuietComfort II Headphones": { base: 110 }, "QuietComfort Earbuds II": { base: 85 },
};

function computeOffer(state: TradeInState): number {
  const base = BASE_PRICES[state.model]?.base ?? 200;
  const condition = CONDITIONS.find(c => c.id === state.condition);
  const mult = condition?.multiplier ?? 0.5;
  let price = base * mult;
  if (state.answers.screen === "Cracked but display works") price *= 0.75;
  if (state.answers.screen === "Shattered / unusable display" || state.answers.screen === "Shattered") price *= 0.4;
  if (state.answers.battery === "70–79% (Fair)") price *= 0.92;
  if (state.answers.battery === "Below 70% / Unknown") price *= 0.82;
  if (state.answers.battery === "Drains quickly (1–3 hours)") price *= 0.88;
  if (state.answers.battery === "Very poor under 1 hour" || state.answers.battery === "Very poor under 3 hours") price *= 0.75;
  if (state.answers.charging === "No / Loose" || state.answers.charging === "No / loose connection") price *= 0.85;
  if (state.answers.biometrics === "No / Faulty") price *= 0.9;
  if (state.answers.power === "No, won't power on" || state.answers.power === "No" || state.answers.power === "Won't power on") price *= 0.25;
  if (state.answers.power === "Yes but has some issues" || state.answers.power === "Powers on but has screen/sensor issues") price *= 0.7;
  if (state.answers.back === "Cracked back glass") price *= 0.88;
  if (state.answers.body === "Significant damage" || state.answers.body === "Heavy wear or staining") price *= 0.7;
  if (state.answers.body === "Dents or significant marks" || state.answers.body === "Minor scratches or wear on case") price *= 0.8;
  if (state.answers.screen === "Cracked" || state.answers.screen === "Cracked screen") price *= 0.65;
  if (state.answers.screen === "Deep scratches or chips") price *= 0.75;
  if (state.answers.input === "Major issues") price *= 0.6;
  if (state.answers.sound === "Muffled sound or static in one ear") price *= 0.5;
  if (state.answers.sound === "No sound in one/both ears") price *= 0.15;
  return Math.max(Math.round(price / 5) * 5, 10);
}

const ALL_MODELS = Object.keys(BASE_PRICES).map(modelName => {
  let category = "Phone";
  let brand = "";
  for (const [catId, brandsMap] of Object.entries(MODELS)) {
    for (const [brandName, modelsList] of Object.entries(brandsMap)) {
      if (modelsList.includes(modelName)) {
        category = catId;
        brand = brandName;
        break;
      }
    }
  }
  return { name: modelName, category, brand };
});

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
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function OptionButton({ label, selected, onClick, desc, icon: Icon }: {
  label: string; selected?: boolean; onClick: () => void;
  desc?: string; icon?: React.ElementType;
}) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full group flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-250 ${
        selected
          ? "border-zinc-950 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10"
          : "border-zinc-200/80 bg-white hover:border-zinc-400 hover:shadow-md"
      }`}
    >
      {Icon && (
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${selected ? "bg-white/15" : "bg-zinc-50 group-hover:bg-zinc-100"}`}>
          <Icon className={`h-6 w-6 ${selected ? "text-white" : "text-zinc-500"}`} strokeWidth={1.5} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-extrabold text-sm ${selected ? "text-white" : "text-zinc-900"}`}>{label}</p>
        {desc && <p className={`text-xs mt-0.5 leading-relaxed font-semibold ${selected ? "text-white/60" : "text-zinc-400"}`}>{desc}</p>}
      </div>
      <motion.div
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className="h-6 w-6 rounded-full bg-accent flex items-center justify-center shrink-0"
      >
        <Check className="h-3.5 w-3.5 text-zinc-950" strokeWidth={3} />
      </motion.div>
    </motion.button>
  );
}

function StepHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-2.5 text-zinc-950">{label}</h2>
      {sub && <p className="text-zinc-400 font-semibold text-sm leading-relaxed">{sub}</p>}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TradeInPage() {
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<TradeInState>({
    category: "", brand: "", model: "", specs: {}, condition: "",
    answers: {}, fulfillment: "",
    contact: { name: "", email: "", phone: "", address: "", postcode: "" },
  });
  const [specStep, setSpecStep] = useState(0);
  const [questionStep, setQuestionStep] = useState(0);

  // Search autocomplete states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sustainability impact calculator states
  const [calcCategory, setCalcCategory] = useState("Phone");
  const [calcQuantity, setCalcQuantity] = useState(1);

  const go = useCallback((n: number) => {
    setDir(n > 0 ? 1 : -1);
    setStep(s => s + n);
  }, []);

  const back = () => {
    if (step === 4 && specStep > 0) { setSpecStep(s => s - 1); return; }
    if (step === 6 && questionStep > 0) { setQuestionStep(s => s - 1); return; }
    if (step === 2) {
      setIsWizardActive(false);
      return;
    }
    go(-1);
  };

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

  function handleSelectSuggestion(suggestion: typeof ALL_MODELS[0]) {
    setState({
      category: suggestion.category,
      brand: suggestion.brand,
      model: suggestion.name,
      specs: {},
      condition: "",
      answers: {},
      fulfillment: "",
      contact: { name: "", email: "", phone: "", address: "", postcode: "" }
    });
    setSpecStep(0);
    setQuestionStep(0);
    setStep(4); // Straight to specs
    setIsWizardActive(true);
    setSearchQuery("");
  }

  const stepLabels = [
    "Category", "Brand", "Model", "Specifications", "Condition Grading",
    "Functional Profile", "Valuation Offer", "Fulfillment", "Contact Details", "Done"
  ];

  const suggestions = searchQuery.trim() === ""
    ? []
    : ALL_MODELS.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  const CALC_STATS: Record<string, { co2: number; raw: number; water: number; name: string }> = {
    Phone: { co2: 70, raw: 85, water: 120, name: "Smartphones" },
    Tablet: { co2: 140, raw: 180, water: 250, name: "Tablets / iPads" },
    Console: { co2: 180, raw: 220, water: 350, name: "Gaming Consoles" },
    Laptop: { co2: 240, raw: 450, water: 600, name: "Laptops & MacBooks" },
    Smartwatch: { co2: 45, raw: 50, water: 80, name: "Smartwatches" },
    Audio: { co2: 30, raw: 30, water: 50, name: "Audio & Headphones" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-950 font-sans relative overflow-x-hidden">
      <Navbar />

      {!isWizardActive ? (
        // ─── BUYBACK LANDING PAGE (VIBRANT & ULTRA PREMIUM STYLE) ───────────
        <div className="flex-1 bg-white relative">
          
          {/* Subtle top background decorative orb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-accent/10 blur-[130px] rounded-full pointer-events-none -z-10" />

          {/* Hero Section */}
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
            
            {/* Trustpilot-style Rating Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-emerald-50 border border-emerald-100/50 px-4 py-2 text-xs font-bold text-emerald-800 mb-8 shadow-sm">
              <span className="flex items-center gap-0.5 text-emerald-600">
                <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
              </span>
              <span>4.8/5 on Trustpilot</span>
              <span className="text-emerald-300">|</span>
              <span className="text-emerald-600 font-medium">Over 25,000+ happy sellers</span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-950 mb-8 max-w-4xl mx-auto leading-none">
              Sell your tech for cash. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-zinc-800 to-zinc-950">Fast. Fair. Easy.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-500 font-semibold text-base md:text-lg mb-10 leading-relaxed">
              Get an instant online offer on your phone, tablet, laptop, or gaming console. Free fully-insured Royal Mail shipping is included with every trade.
            </p>

            {/* Premium Search Autocomplete Bar */}
            <div className="relative w-full max-w-xl mx-auto mb-6 z-20">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 220)}
                  placeholder="Search your device (e.g. iPhone 15 Pro, Watch Ultra, PS5...)"
                  className="h-16 w-full rounded-2xl bg-zinc-100 border-2 border-transparent pl-14 pr-6 text-sm font-semibold outline-none focus:border-zinc-950 focus:bg-white transition-all shadow-lg hover:bg-zinc-150/70 placeholder:text-zinc-400"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5.5 w-5.5 text-zinc-400 group-focus-within:text-zinc-950 transition-colors" />
              </div>

              <AnimatePresence>
                {isSearchFocused && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden text-left z-30 p-2"
                  >
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-50 rounded-xl transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500">
                            <Smartphone className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-zinc-950">{sug.name}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{sug.brand} · {sug.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-black">
                          Get Cash <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Popular quick links */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-28 text-xs font-semibold text-zinc-450">
              <span className="text-zinc-500 font-extrabold">Popular:</span>
              {[
                { name: "iPhone 15 Pro Max", category: "Phone", brand: "Apple" },
                { name: "PS5 Disc Edition", category: "Console", brand: "Sony PlayStation" },
                { name: "MacBook Air 13\" M2", category: "Laptop", brand: "Apple" },
                { name: "Apple Watch Ultra 2", category: "Smartwatch", brand: "Apple" },
                { name: "AirPods Pro 2", category: "Audio", brand: "Apple" }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSuggestion({ name: item.name, category: item.category, brand: item.brand })}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full transition-colors font-bold shadow-sm"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Value Proposition Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-b border-zinc-150 py-10 mb-28">
              {[
                { Icon: Shield, title: "Highest Value Guaranteed", desc: "Always-updated market rates" },
                { Icon: Zap, title: "Paid Within 48 Hours", desc: "Straight bank transfer deposit" },
                { Icon: Truck, title: "Free & Insured Postage", desc: "Insured Royal Mail shipping label" },
                { Icon: Clock, title: "14-Day Offer Lock-in", desc: "Protection against price drop" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-zinc-50 rounded-2xl border border-zinc-150/40 flex items-center justify-center mb-3">
                    <item.Icon className="h-5.5 w-5.5 text-zinc-700" strokeWidth={1.8} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 leading-tight mb-1">{item.title}</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Category Cards Section with Real Beautiful Product Images */}
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 mb-12 text-center">
              Select category to get started
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-32 text-left">
              {CATEGORIES.map((cat) => {
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setState({
                        category: cat.id, brand: "", model: "", specs: {}, condition: "",
                        answers: {}, fulfillment: "",
                        contact: { name: "", email: "", phone: "", address: "", postcode: "" }
                      });
                      setSpecStep(0);
                      setQuestionStep(0);
                      setStep(2); // Straight to brand select
                      setIsWizardActive(true);
                    }}
                    className={`flex flex-col rounded-3xl border-2 border-zinc-200/60 bg-white shadow-sm hover:shadow-xl hover:border-zinc-950 transition-all group overflow-hidden w-full ${cat.glow}`}
                  >
                    {/* Centered Image with custom gradient backdrop */}
                    <div className="w-full aspect-[4/3] bg-gradient-to-b from-zinc-50 to-white border-b border-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
                      <img
                        src={cat.img}
                        alt={cat.label}
                        className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-108"
                      />
                    </div>
                    {/* Details section */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-lg text-zinc-950 mb-1 leading-tight">{cat.label}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{cat.count}</p>
                      </div>
                      <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-zinc-500 group-hover:text-black transition-colors">
                        Start BuyBack <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Popular Direct Valuations */}
            <div className="max-w-5xl mx-auto mb-32 text-left">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 text-accent border border-accent/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-3">
                    <Sparkles className="h-3.5 w-3.5 fill-accent text-accent" />
                    High Demand Valuations
                  </div>
                  <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 leading-none">
                    Hot trade-in prices
                  </h2>
                </div>
                <p className="text-zinc-500 font-semibold text-sm max-w-sm mt-4 md:mt-0 leading-relaxed">
                  Ready to upgrade? We are currently paying premium rates for these popular devices:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: "iPhone 15 Pro Max", val: "£780", img: "/showcase_iphone.png", category: "Phone", brand: "Apple" },
                  { name: "MacBook Pro 16\" M3 Max", val: "£1,800", img: "/showcase_macbook.png", category: "Laptop", brand: "Apple" },
                  { name: "PS5 Disc Edition", val: "£340", img: "/showcase_ps5.png", category: "Console", brand: "Sony PlayStation" },
                  { name: "AirPods Max", val: "£260", img: "/showcase_airpods_max.png", category: "Audio", brand: "Apple" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                    className="bg-white border border-zinc-200/80 rounded-[2rem] p-6 flex flex-col justify-between hover:border-zinc-950 transition-all group shadow-sm"
                  >
                    <div className="w-full aspect-[4/3] bg-zinc-50 rounded-2xl flex items-center justify-center p-4 mb-6 relative overflow-hidden">
                      <img src={item.img} alt={item.name} className="h-full w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.brand}</span>
                      <h4 className="font-extrabold text-base text-zinc-900 leading-tight mb-2 mt-1 truncate">{item.name}</h4>
                      <div className="flex items-baseline justify-between mt-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">Up to</p>
                          <p className="text-2xl font-black text-zinc-950 font-mono mt-1">{item.val}</p>
                        </div>
                        <button
                          onClick={() => handleSelectSuggestion({ name: item.name, category: item.category, brand: item.brand })}
                          className="px-4 py-2 bg-zinc-950 hover:bg-accent hover:text-zinc-950 text-white rounded-xl text-xs font-black transition-colors"
                        >
                          Sell Now
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Interactive Environmental Impact Calculator */}
            <div className="max-w-5xl mx-auto mb-32 text-left">
              <div className="bg-zinc-950 text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

                <div className="grid md:grid-cols-5 gap-8 items-center">
                  <div className="md:col-span-2 space-y-6">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                      Green Impact Calculator
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                      Calculate your recycling impact
                    </h3>
                    <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                      Every electronics device refurbished avoids intensive mining of precious raw minerals and cuts greenhouse gas emissions. See what your trade-in saves.
                    </p>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Device Type</label>
                        <select
                          value={calcCategory}
                          onChange={(e) => setCalcCategory(e.target.value)}
                          className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors"
                        >
                          {Object.keys(CALC_STATS).map((cat) => (
                            <option key={cat} value={cat} className="bg-zinc-900 text-white">
                              {CALC_STATS[cat].name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantity</label>
                          <span className="text-xs font-black text-accent">{calcQuantity} {calcQuantity === 1 ? "device" : "devices"}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={calcQuantity}
                          onChange={(e) => setCalcQuantity(parseInt(e.target.value))}
                          className="w-full accent-accent bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                    {[
                      {
                        label: "CO2 Emissions Saved",
                        val: `${CALC_STATS[calcCategory].co2 * calcQuantity} kg`,
                        desc: `Equivalent to planting ${Math.round((CALC_STATS[calcCategory].co2 * calcQuantity) / 22)} trees`,
                        color: "text-emerald-400",
                        glow: "shadow-emerald-500/10"
                      },
                      {
                        label: "Raw Materials Conserved",
                        val: `${CALC_STATS[calcCategory].raw * calcQuantity}g`,
                        desc: "Precious metals and copper protected from mining",
                        color: "text-accent",
                        glow: "shadow-accent/10"
                      },
                      {
                        label: "Pure Water Saved",
                        val: `${CALC_STATS[calcCategory].water * calcQuantity}L`,
                        desc: "Avoided in battery & microchip production cooling",
                        color: "text-sky-400",
                        glow: "shadow-sky-500/10"
                      }
                    ].map((stat, i) => (
                      <div key={i} className={`flex flex-col justify-between p-5 bg-white/5 rounded-2xl border border-white/5 ${stat.glow} hover:bg-white/10 transition-all`}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none">{stat.label}</p>
                        <p className={`text-3xl font-black font-mono my-4 ${stat.color}`}>{stat.val}</p>
                        <p className="text-[10px] font-bold text-zinc-400 leading-normal">{stat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* "3 Easy Steps" component */}
            <div className="max-w-5xl mx-auto mb-32">
              <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-zinc-950 mb-14 text-center">
                Just 3 easy steps
              </h2>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                {[
                  { step: "1", title: "Instant Offer Valuation", desc: "Select your hardware models and complete our 2-minute diagnostic questionnaire to lock in a cash offer." },
                  { step: "2", title: "Free Postage Label", desc: "Pack your device securely and dispatch it using our prepaid, fully-insured Royal Mail parcel shipping labels." },
                  { step: "3", title: "Direct Bank Transfer", desc: "Our technicians inspect the hardware. Upon verification, funds are released directly to your account within 48 hours." },
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-start p-8 rounded-[2rem] bg-zinc-50 border border-zinc-150/40 relative hover:shadow-md transition-all">
                    <div className="h-10 w-10 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center mb-6">
                      {item.step}
                    </div>
                    <h4 className="font-extrabold text-lg text-zinc-950 mb-2">{item.title}</h4>
                    <p className="text-zinc-500 text-xs font-semibold leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Customer Reviews Section */}
            <div className="max-w-5xl mx-auto mb-32 text-left">
              <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 mb-12 text-center">
                Loved by 25,000+ happy sellers
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Sarah Jenkins",
                    loc: "London",
                    rating: 5,
                    title: "Paid within 24 hours!",
                    review: "Traded in my cracked iPhone 14 Pro expecting a low offer, but got £430! Sent it off Monday morning, they checked it Tuesday, and cash hit my account Wednesday. Incredibly smooth."
                  },
                  {
                    name: "Michael Chen",
                    loc: "Manchester",
                    rating: 5,
                    title: "Better price than anywhere else",
                    review: "Compared trade-in prices on three other major platforms and TechStop was offering £60 more for my MacBook Air. The prepaid Royal Mail drop-off was simple and safe."
                  },
                  {
                    name: "David O'Connor",
                    loc: "Leicester",
                    rating: 5,
                    title: "Fantastic in-store experience",
                    review: "I decided to do the in-store drop off at Leicester center rather than shipping. Technicians tested my PS5 and had cash in my hand in less than 10 minutes. Extremely polite staff!"
                  }
                ].map((rev, idx) => (
                  <div key={idx} className="flex flex-col justify-between p-8 rounded-3xl bg-zinc-50 border border-zinc-150/40 relative hover:shadow-md transition-all shadow-sm">
                    <div>
                      <div className="flex gap-0.5 text-zinc-900 mb-4">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-accent text-accent border-none" />
                        ))}
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-950 mb-2">"{rev.title}"</h4>
                      <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-6">"{rev.review}"</p>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-200/50">
                      <div className="h-8 w-8 bg-zinc-200/60 rounded-full flex items-center justify-center font-black text-xs text-zinc-700">
                        {rev.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-zinc-950">{rev.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{rev.loc} · Verified Seller</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact section */}
            <div className="max-w-5xl mx-auto mb-32 text-left">
              <div className="bg-zinc-950 text-white rounded-[3rem] p-10 md:p-16 grid md:grid-cols-3 gap-12 relative overflow-hidden shadow-2xl">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
                {[
                  { num: "1.5M+", title: "Devices Repurposed", desc: "We've saved over 1.5 million functional gadgets from leaking toxic chemical e-waste into regional landfills." },
                  { num: "2x", title: "Lifespan Extension", desc: "Every smartphone or laptop refurbished doubles its operational lifetime, conserving precious raw minerals." },
                  { num: "5 Billion", title: "Idle Electronics", desc: "Global statistics show 5 billion mobile devices are sitting unused in cupboards. Let's recycle yours for cash." }
                ].map((stat, i) => (
                  <div key={i} className="space-y-3 relative">
                    <p className="font-serif text-5xl md:text-6xl font-black text-accent tracking-tighter leading-none">{stat.num}</p>
                    <h4 className="font-extrabold text-sm text-white">{stat.title}</h4>
                    <p className="text-zinc-400 text-xs font-semibold leading-relaxed">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs Accordion */}
            <div className="max-w-3xl mx-auto mb-20 text-left">
              <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-center text-zinc-950 mb-14">

                Frequently asked questions
              </h2>
              <div className="space-y-4">
                {[
                  { q: "How is my trade-in valuation calculated?", a: "Valuations are calculated in real time using automated depreciation rates. We grade overall condition (Mint, Good, Used, Damaged) and modify the base product value using specific inputs from hardware tests (e.g. screen wear, battery capacity index, bios checks, and loose connectivity ports)." },
                  { q: "How do I ship my device to TechStop Leicester?", a: "After accepting your offer, you'll receive a printable, prepaid shipping voucher via email. Pack the hardware inside a standard bubble mailer envelope or corrugated cardboard box, tape the label on top, and scan it free of charge at any post office counter." },
                  { q: "How and when do I get paid?", a: "Payments are triggered instantly upon physical verification of the hardware model and diagnostic matching. Sums are disbursed via Faster Payments direct bank deposit or PayPal transfer. Leicester store credit is also available with a 10% bonus." },
                  { q: "What happens to the data on my device?", a: "We run hardware through an enterprise-grade sanitization wipe that permanently destroys all files and accounts. For safety, we recommend clearing personal iCloud, Google accounts, and factory resetting before dispatch." },
                  { q: "What if the device condition is different than described?", a: "If our in-store inspection reveals errors in grading (e.g., cracked back glass, dead pixels), we issue an adjusted quote. If you choose to decline, we mail the device back to you for free with return tracking provided." }
                ].map((faq, idx) => (
                  <div key={idx} className="border border-zinc-200/80 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-6 text-left font-bold text-sm text-zinc-950 hover:bg-zinc-50 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <HelpCircle className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 text-xs text-zinc-500 font-semibold leading-relaxed border-t border-zinc-100 pt-4 bg-zinc-50/50">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

          </section>
        </div>
      ) : (
        // ─── CENTERED WIZARD FLOW (ULTRA CLEAN MODERNIST STATE) ────────────
        <div className="flex-1 bg-zinc-50/70 flex items-center justify-center py-16 px-4 relative">
          
          {/* Subtle background graphic blur circles */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="w-full max-w-2xl bg-white border border-zinc-200/70 shadow-2xl rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden z-10">
            
            {/* Header stepper */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={back}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors group"
              >
                <ArrowLeft className="h-4.5 w-4.5 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stepLabels[step - 1]}</span>
              <span className="text-xs font-bold text-zinc-400">{step} / {TOTAL_STEPS}</span>
            </div>

            {/* Stepper progress bar with dynamic glow */}
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden mb-10 relative">
              <motion.div
                className="h-full bg-zinc-950 rounded-full"
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Current device selected summary header */}
            {state.category && step > 1 && step < 10 && (
              <div className="mb-8 p-5 bg-zinc-50 rounded-2xl border border-zinc-150 flex items-center gap-4">
                <div className="h-10 w-10 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone className="h-5.5 w-5.5 text-zinc-655" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-zinc-950 truncate leading-tight">{state.model || state.category}</p>
                  <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest mt-1">
                    {state.brand && `${state.brand} · `}
                    {Object.values(state.specs).join(" · ")}
                    {state.condition && ` · ${state.condition}`}
                  </p>
                </div>
                {step >= 7 && offerPrice > 0 && (
                  <span className="text-sm font-black text-zinc-950 font-mono">£{offerPrice}</span>
                )}
              </div>
            )}

            {/* Animated card wizard screens */}
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step === 4 ? `4-${specStep}` : step === 6 ? `6-${questionStep}` : step}
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              >
                {/* ── STEP 1 – Category Fallback ───────────────────── */}
                {step === 1 && (
                  <div>
                    <StepHeader
                      label="Select your device"
                      sub="Pick the hardware category to start diagnostic evaluation."
                    />
                    <div className="space-y-3">
                      {CATEGORIES.map((cat) => (
                        <OptionButton
                          key={cat.id}
                          label={cat.label}
                          desc={cat.sub}
                          icon={cat.icon}
                          onClick={() => {
                            setState(s => ({ ...s, category: cat.id, brand: "", model: "", specs: {}, condition: "", answers: {} }));
                            setSpecStep(0);
                            setQuestionStep(0);
                            go(1);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 2 – Brand selection ─────────────────────── */}
                {step === 2 && (
                  <div>
                    <StepHeader
                      label="Which brand is it?"
                      sub={`Select the brand of your device category: ${state.category.toLowerCase()}.`}
                    />
                    <div className="grid grid-cols-2 gap-4">
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

                {/* ── STEP 3 – Model Selection ─────────────────────── */}
                {step === 3 && (
                  <div>
                    <StepHeader
                      label="Select your model"
                      sub={`Identify the exact specification of your ${state.brand} ${state.category.toLowerCase()}.`}
                    />
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-zinc-200">
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

                {/* ── STEP 4 – Specifications ──────────────────────── */}
                {step === 4 && currentSpec && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                      Device Specification {specStep + 1} of {currentSpecs.length}
                    </p>
                    <StepHeader label={`Choose ${currentSpec.label.toLowerCase()}`} />
                    <div className="grid grid-cols-2 gap-4">
                      {currentSpec.options.map(opt => (
                        <OptionButton
                          key={opt}
                          label={opt}
                          selected={state.specs[currentSpec.label] === opt}
                          onClick={() => handleSpecSelect(opt)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 5 – Condition Grading ───────────────────── */}
                {step === 5 && (
                  <div>
                    <StepHeader
                      label="Estimate overall condition"
                      sub="We will inspect the hardware. Honest selections prevent adjusted quotes."
                    />
                    <div className="space-y-3">
                      {CONDITIONS.map(c => (
                        <motion.button
                          key={c.id}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setState(s => ({ ...s, condition: c.id }));
                            go(1);
                          }}
                          className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                            state.condition === c.id
                              ? "border-zinc-950 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10"
                              : `${c.color} hover:border-zinc-400 hover:shadow-sm`
                          }`}
                        >
                          <div className={`h-4.5 w-4.5 rounded-full shrink-0 ${state.condition === c.id ? "bg-accent border-zinc-950 border" : c.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`font-extrabold text-sm ${state.condition === c.id ? "text-white" : "text-zinc-900"}`}>{c.label}</p>
                            <p className={`text-xs mt-0.5 leading-relaxed font-semibold ${state.condition === c.id ? "text-white/60" : "text-zinc-550"}`}>{c.desc}</p>
                          </div>
                          <motion.div
                            initial={false}
                            animate={{ scale: state.condition === c.id ? 1 : 0, opacity: state.condition === c.id ? 1 : 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 25 }}
                            className="h-6 w-6 rounded-full bg-accent flex items-center justify-center shrink-0"
                          >
                            <Check className="h-3.5 w-3.5 text-zinc-950" strokeWidth={3} />
                          </motion.div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STEP 6 – Functional Profile Questions ────────── */}
                {step === 6 && currentQuestion && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                      Diagnostic Question {questionStep + 1} of {currentQuestions.length}
                    </p>
                    <div className="flex gap-2 mb-8">
                      {currentQuestions.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= questionStep ? "bg-zinc-950" : "bg-zinc-200"}`}
                        />
                      ))}
                    </div>
                    <StepHeader label={currentQuestion.question} />
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

                {/* ── STEP 7 – Cash Offer Dynamic Certificate ──────── */}
                {step === 7 && (
                  <div>
                    <motion.div
                      initial={{ scale: 0.94, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 220, damping: 22 }}
                      className="rounded-[2rem] bg-zinc-950 text-white p-8 md:p-10 mb-8 text-center relative overflow-hidden shadow-2xl border border-white/5"
                    >
                      {/* Gradient glows inside card */}
                      <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                      <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/10 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />

                      <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 text-accent px-4 py-1.5 text-[9px] font-black uppercase tracking-widest mb-6 relative">
                        <Award className="h-3.5 w-3.5 text-accent animate-pulse" />
                        Guaranteed Payout locked
                      </div>

                      <div className="mb-4 relative">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Net payout estimate</span>
                        <motion.p
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.12 }}
                          className="text-7xl md:text-8xl font-black tracking-tighter my-2 font-mono text-white"
                        >
                          £{offerPrice}
                        </motion.p>
                        <p className="text-zinc-500 text-xs font-semibold">Live Leicester market pricing · Valid 14 days</p>
                      </div>

                      {/* Barcode Receipt design wrapper */}
                      <div className="mt-8 pt-6 border-t border-dashed border-white/10 flex flex-col items-center">
                        {/* Barcode lines */}
                        <div className="flex gap-[2px] h-8 w-44 bg-transparent mb-4 opacity-30 select-none">
                          {Array.from({ length: 44 }).map((_, i) => (
                            <div
                              key={i}
                              style={{ width: i % 3 === 0 ? "3px" : i % 5 === 0 ? "1px" : "2px" }}
                              className="h-full bg-white"
                            />
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full text-left">
                          {[
                            ["Device", state.model],
                            ["Grade", state.condition],
                            ["Capacity", state.specs["Storage"] ?? state.specs["RAM"] ?? "—"],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1 leading-none">{k}</p>
                              <p className="text-xs font-extrabold truncate text-white leading-tight mt-1">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-4 mb-8">
                      {[
                        { Icon: Shield, text: "Includes fully-insured pre-addressed shipping label" },
                        { Icon: Zap, text: "Leicester diagnostic clearing & payment within 48h" },
                        { Icon: Clock, text: "Price guarantee locks payout rate against devaluation" },
                      ].map(({ Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-zinc-50 border border-zinc-150/40 flex items-center justify-center shrink-0">
                            <Icon className="h-4.5 w-4.5 text-zinc-700" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-500">{text}</p>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => go(1)}
                      className="w-full h-14 bg-accent text-zinc-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 hover:bg-[#c8f050] transition-all shadow-xl shadow-accent/15"
                    >
                      Accept Cash Offer <ArrowRight className="h-4.5 w-4.5" />
                    </motion.button>
                  </div>
                )}

                {/* ── STEP 8 – Fulfillment option ──────────────────── */}
                {step === 8 && (
                  <div>
                    <StepHeader
                      label="Select shipment method"
                      sub="Choose how you would like to transfer your device to our Leicester hub."
                    />
                    <div className="space-y-4">
                      {[
                        {
                          id: "ship", title: "Ship via Royal Mail", icon: Truck,
                          desc: "We email a prepaid shipping label. Pack your device and drop off at any local Post Office counter.",
                          badge: { Icon: Gift, text: "Free Insured Shipping", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                        },
                        {
                          id: "dropoff", title: "Drop off in Store", icon: MapPin,
                          desc: "Visit TechStop Leicester. Hand in your device for direct inspection and instant in-hand cash payout.",
                          badge: { Icon: Zap, text: "Instant in-store payout", cls: "bg-blue-50 text-blue-700 border-blue-100" },
                        },
                      ].map((opt) => {
                        const selected = state.fulfillment === opt.id;
                        const { icon: Icon } = opt;
                        return (
                          <motion.button
                            key={opt.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => {
                              setState(s => ({ ...s, fulfillment: opt.id }));
                              go(1);
                            }}
                            className={`w-full rounded-3xl border-2 p-6 text-left transition-all duration-200 ${
                              selected
                                ? "border-zinc-950 bg-zinc-950 text-white shadow-xl shadow-zinc-950/10"
                                : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-350 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${selected ? "bg-white/15 border-white/10" : "bg-white border-zinc-150 shadow-sm"}`}>
                                <Icon className={`h-6 w-6 ${selected ? "text-white" : "text-zinc-650"}`} strokeWidth={1.5} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-extrabold text-sm mb-1 ${selected ? "text-white" : "text-zinc-900"}`}>{opt.title}</p>
                                <p className={`text-xs leading-relaxed ${selected ? "text-white/60" : "text-zinc-500 font-semibold"}`}>{opt.desc}</p>
                                <div className={`mt-4 inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${selected ? "bg-accent/25 text-accent border-accent/15" : opt.badge.cls}`}>
                                  <opt.badge.Icon className="h-3 w-3" />
                                  {opt.badge.text}
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 9 – Contact forms ───────────────────────── */}
                {step === 9 && (
                  <div>
                    <StepHeader
                      label="Enter your details"
                      sub={state.fulfillment === "ship" ? "Prepaid shipment labels will be dispatched to your email address." : "We'll confirm your Leicester hub drop-off slot."}
                    />
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); go(1); }}>
                      {[
                        { key: "name", label: "Full Name", type: "text", placeholder: "E.g. Jordan Mitchell", required: true },
                        { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com", required: true },
                        { key: "phone", label: "Phone Number", type: "tel", placeholder: "+44 7700 000000", required: true },
                        ...(state.fulfillment === "ship" ? [
                          { key: "address", label: "Collection Address", type: "text", placeholder: "Street address", required: true },
                          { key: "postcode", label: "Postcode", type: "text", placeholder: "LE1 1AA", required: true },
                        ] : []),
                      ].map(({ key, label, type, placeholder, required }) => (
                        <div key={key}>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</label>
                          <input
                            type={type}
                            required={required}
                            placeholder={placeholder}
                            value={state.contact[key as keyof typeof state.contact]}
                            onChange={e => setState(s => ({ ...s, contact: { ...s.contact, [key]: e.target.value } }))}
                            className="w-full h-14 rounded-2xl border-2 border-zinc-200 px-5 text-sm font-semibold outline-none focus:border-zinc-950 transition-colors bg-white placeholder:text-zinc-400"
                          />
                        </div>
                      ))}
                      <div className="pt-4">
                        <motion.button
                          type="submit"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 hover:bg-zinc-800 transition-all shadow-lg"
                        >
                          Submit Trade-In Request <ArrowRight className="h-4.5 w-4.5" />
                        </motion.button>
                        <p className="text-center text-[10px] text-zinc-400 font-semibold mt-3 leading-relaxed">
                          By submitting this form you consent to our terms of buyback. Customer records are secured under SSL protection.
                        </p>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── STEP 10 – Confirmation ──────────────────────── */}
                {step === 10 && (
                  <div>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 280, damping: 22 }}
                      className="h-16 w-16 bg-accent border border-black/5 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-accent/10 animate-bounce"
                    >
                      <CheckCircle2 className="h-8 w-8 text-zinc-950" strokeWidth={1.5} />
                    </motion.div>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium mb-3 leading-tight tracking-tight text-zinc-950">You're all set!</h2>
                    <p className="text-zinc-500 font-semibold mb-8 text-sm leading-relaxed">
                      Trade-in request for your <strong className="text-zinc-950 font-black">{state.model}</strong> was processed. Your guaranteed payout estimate is <strong className="text-zinc-950 font-black">£{offerPrice}</strong>.
                    </p>

                    <div className="rounded-3xl bg-zinc-50 border border-zinc-150 overflow-hidden mb-8">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-100/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Shipment Timeline</p>
                        <div className="flex items-center gap-2">
                          {state.fulfillment === "ship"
                            ? <Truck className="h-4.5 w-4.5 text-zinc-500" strokeWidth={1.5} />
                            : <MapPin className="h-4.5 w-4.5 text-zinc-500" strokeWidth={1.5} />
                          }
                          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                            {state.fulfillment === "ship" ? "Insured Shipping" : "Leicester drop slot"}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 space-y-6 relative">
                        {/* Connecting dashed line behind items */}
                        <div className="absolute left-[34px] top-10 bottom-10 w-[2px] border-l-2 border-dashed border-zinc-200 -z-10" />
                        
                        {(state.fulfillment === "ship" ? [
                          { n: "1", title: "Retrieve your shipping label", desc: `Prepaid label and packaging instructions have been sent to ${state.contact.email || "your inbox"}.`, hi: true },
                          { n: "2", title: "Dispatch the package", desc: "Wrap the hardware securely inside bubble protective sheets, paste the label, and hand it to any Royal Mail counter.", hi: false },
                          { n: "3", title: "Verification & bank payout", desc: " Leicester depot confirms diagnostics. Payout will clear directly to your bank within 48h.", hi: false },
                        ] : [
                          { n: "1", title: "Visit TechStop Leicester hub", desc: `We have registered your drop slot. Check ${state.contact.email || "your inbox"} for address and confirmation barcode.`, hi: true },
                          { n: "2", title: "Five-minute in-store diagnostics", desc: "Our hardware technician inspects the device functionality, screen index, and resets to match description.", hi: false },
                          { n: "3", title: `Instant direct bank deposit of £${offerPrice}`, desc: "Once diagnostic completes, funds are released directly to bank account, store voucher, or paid in cash.", hi: false },
                        ]).map(item => (
                          <div key={item.n} className="flex items-start gap-4 bg-transparent">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm border ${item.hi ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-600 border-zinc-150"}`}>
                              <span className="font-extrabold text-sm">{item.n}</span>
                            </div>
                            <div>
                              <p className="font-extrabold text-sm text-zinc-900 leading-snug">{item.title}</p>
                              <p className="text-xs text-zinc-550 mt-1 leading-relaxed font-semibold">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsWizardActive(false);
                        setStep(1);
                      }}
                      className="flex items-center justify-center gap-2 h-14 bg-zinc-950 text-white rounded-2xl font-black text-sm hover:bg-zinc-800 transition-all w-full shadow-lg"
                    >
                      Done <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
