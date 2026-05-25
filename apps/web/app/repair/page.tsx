"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { repairsApi, uploadsApi } from "../../lib/api";
import {
  Smartphone, Tablet, Gamepad2, Laptop, ArrowLeft, ArrowRight,
  Check, MapPin, Truck, Wrench, Clock, Shield, X,
  Monitor, Zap, Battery, Wifi, HardDrive, CircleAlert,
  Star, HelpCircle, ChevronDown, Sparkles, ChevronRight, Upload, Plus
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

const DEVICE_TYPES = [
  { id: "Phone", label: "Phone", icon: Smartphone, img: "/bento_smartphones.png", mood: "bg-sky-500/10 border-sky-500/20", glow: "hover:shadow-sky-500/10", count: "60+ models" },
  { id: "Tablet", label: "Tablet", icon: Tablet, img: "/bento_tablets.png", mood: "bg-rose-500/10 border-rose-500/20", glow: "hover:shadow-rose-500/10", count: "20+ models" },
  { id: "Console", label: "Console", icon: Gamepad2, img: "/bento_gaming.png", mood: "bg-violet-500/10 border-violet-500/20", glow: "hover:shadow-violet-500/10", count: "17 models" },
  { id: "Laptop", label: "Laptop / MacBook", icon: Laptop, img: "/bento_laptops.png", mood: "bg-amber-500/10 border-amber-500/20", glow: "hover:shadow-amber-500/10", count: "25+ models" },
];

const BRANDS: Record<string, string[]> = {
  Phone: ["Apple", "Samsung", "Google", "OnePlus", "Nothing", "Other"],
  Tablet: ["Apple", "Samsung", "Microsoft", "Other"],
  Console: ["Sony PlayStation", "Microsoft Xbox", "Nintendo", "Other"],
  Laptop: ["Apple", "Dell", "Lenovo", "HP", "ASUS", "Other"],
};

const ISSUES: Record<string, { id: string; label: string; desc: string; icon: React.ElementType }[]> = {
  Phone: [
    { id: "screen", label: "Cracked / damaged screen", desc: "Screen repair, glass replacement or display fix", icon: Monitor },
    { id: "battery", label: "Battery replacement", desc: "Battery draining fast or swollen", icon: Battery },
    { id: "charging", label: "Charging port issue", desc: "Won't charge or loose connection", icon: Zap },
    { id: "camera", label: "Camera not working", desc: "Blurry, black screen or broken lens", icon: Smartphone },
    { id: "software", label: "Software / boot issue", desc: "Stuck in recovery, boot loop, or data recovery", icon: HardDrive },
    { id: "water", label: "Water damage", desc: "Device got wet or exposed to liquid", icon: Wifi },
    { id: "other", label: "Something else", desc: "Describe the issue in the notes field", icon: CircleAlert },
  ],
  Tablet: [
    { id: "screen", label: "Cracked / damaged screen", desc: "Screen repair or glass replacement", icon: Monitor },
    { id: "battery", label: "Battery replacement", desc: "Battery draining fast or not charging", icon: Battery },
    { id: "charging", label: "Charging port issue", desc: "Won't charge or loose connection", icon: Zap },
    { id: "software", label: "Software / boot issue", desc: "Factory reset, data recovery, iOS issues", icon: HardDrive },
    { id: "other", label: "Something else", desc: "Describe the issue in the notes field", icon: CircleAlert },
  ],
  Console: [
    { id: "disc", label: "Disc drive issue", desc: "Won't read, eject discs or drive clicking", icon: HardDrive },
    { id: "hdmi", label: "HDMI / video port", desc: "No display signal or broken HDMI port", icon: Monitor },
    { id: "controller", label: "Controller repair", desc: "Joystick drift, buttons or trigger issues", icon: Gamepad2 },
    { id: "overheating", label: "Overheating / fan noise", desc: "Loud fan, thermal paste, or shutting off", icon: Zap },
    { id: "power", label: "Won't power on", desc: "Dead console or power supply issue", icon: Battery },
    { id: "other", label: "Something else", desc: "Describe the issue in the notes field", icon: CircleAlert },
  ],
  Laptop: [
    { id: "screen", label: "Cracked / damaged screen", desc: "Screen replacement or display cable fix", icon: Monitor },
    { id: "keyboard", label: "Keyboard or trackpad", desc: "Keys not working or trackpad unresponsive", icon: Laptop },
    { id: "battery", label: "Battery replacement", desc: "Battery not holding charge", icon: Battery },
    { id: "charging", label: "Charging port / board", desc: "Won't charge or broken charging connector", icon: Zap },
    { id: "software", label: "Software / OS issue", desc: "macOS / Windows reinstall or data recovery", icon: HardDrive },
    { id: "overheating", label: "Overheating", desc: "Very hot, noisy fan or thermal paste", icon: CircleAlert },
    { id: "other", label: "Something else", desc: "Describe the issue in the notes field", icon: CircleAlert },
  ],
};

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

interface RepairState {
  deviceType: string;
  brand: string;
  model: string;
  issue: string[];
  issueNotes: string;
  fulfillment: string;
  contact: { name: string; email: string; phone: string; address: string; postcode: string };
}

const STEP_LABELS = ["Brand & Model", "Issue", "Delivery", "Contact", "Done"];
const TOTAL_STEPS = 5;

const ESTIMATED_PRICES: Record<string, Record<string, string>> = {
  Phone: { screen: "£69 - £149", battery: "£39 - £69", charging: "£39 - £59", camera: "£49 - £89", software: "£29 - £49", water: "£59 - £129", other: "Quote on inspection" },
  Tablet: { screen: "£89 - £189", battery: "£49 - £79", charging: "£49 - £79", software: "£39 - £59", other: "Quote on inspection" },
  Console: { disc: "£49 - £89", hdmi: "£69 - £99", controller: "£25 - £45", overheating: "£39 - £69", power: "£59 - £99", other: "Quote on inspection" },
  Laptop: { screen: "£119 - £249", keyboard: "£69 - £129", battery: "£59 - £109", charging: "£49 - £99", software: "£39 - £69", overheating: "£39 - £59", other: "Quote on inspection" }
};

export default function RepairPage() {
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<RepairState>({
    deviceType: "", brand: "", model: "", issue: [], issueNotes: "",
    fulfillment: "",
    contact: { name: "", email: "", phone: "", address: "", postcode: "" },
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitRef, setSubmitRef] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [calcCategory, setCalcCategory] = useState("Phone");
  const [calcBrand, setCalcBrand] = useState("Apple");
  const [calcIssue, setCalcIssue] = useState("screen");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [images, setImages] = useState<{ filePath: string; previewUrl: string }[]>([]);
  const [batchId, setBatchId] = useState(() => crypto.randomUUID());
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const router = useRouter();
  const [missingDetailsOpen, setMissingDetailsOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Restore wizard state on mount (after settings redirect or Google OAuth)
  useEffect(() => {
    const saved = sessionStorage.getItem("ts_wizard_repair");
    if (saved) {
      try {
        const { state: s, step: savedStep, images: savedImages, batchId: savedBatchId } = JSON.parse(saved);
        setState(s);
        setStep(savedStep);
        if (savedImages?.length) setImages(savedImages);
        if (savedBatchId) setBatchId(savedBatchId);
        setIsWizardActive(true);
      } catch {}
    }
  }, []);

  // Auto-save wizard state to sessionStorage whenever anything changes
  useEffect(() => {
    if (isWizardActive) {
      sessionStorage.setItem("ts_wizard_repair", JSON.stringify({ state, step, images, batchId }));
    }
  }, [state, step, images, batchId, isWizardActive]);

  // Auto-fill contact from logged-in user
  useEffect(() => {
    if (user) {
      setState(s => ({
        ...s,
        contact: {
          ...s.contact,
          name:    user.name    || s.contact.name,
          email:   user.email   || s.contact.email,
          phone:   user.phone   || s.contact.phone,
          address: user.address || s.contact.address,
        },
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isWizardActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isWizardActive]);

  const scrollToTop = () => {
    modalScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const go = (n: number) => {
    setDir(n > 0 ? 1 : -1);
    setStep(s => s + n);
    scrollToTop();
  };

  const closeWizard = () => {
    sessionStorage.removeItem("ts_wizard_repair");
    setIsWizardActive(false);
  };

  const back = () => {
    if (step === 1) { closeWizard(); return; }
    go(-1);
  };

  async function compressToBlob(file: File): Promise<{ blob: Blob; previewUrl: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        const previewUrl = canvas.toDataURL("image/jpeg", 0.75);
        canvas.toBlob(blob => resolve({ blob: blob!, previewUrl }), "image/jpeg", 0.75);
      };
      img.src = url;
    });
  }

  async function handleImageFiles(files: File[]) {
    if (files.length === 0) return;
    setImageUploading(true);
    try {
      const results = await Promise.all(
        files.slice(0, 6 - images.length).map(async (file) => {
          const { blob, previewUrl } = await compressToBlob(file);
          const uploadFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
          const { filePath } = await uploadsApi.repairImage(uploadFile, batchId);
          return { filePath, previewUrl };
        })
      );
      setImages(prev => [...prev, ...results].slice(0, 6));
    } catch {
      // silently ignore upload errors
    } finally {
      setImageUploading(false);
    }
  }

  const openWizardWithDevice = (deviceId: string) => {
    setState({ deviceType: deviceId, brand: "", model: "", issue: [], issueNotes: "", fulfillment: "", contact: { name: "", email: "", phone: "", address: "", postcode: "" } });
    setImages([]);
    setBatchId(crypto.randomUUID());
    setStep(1);
    setIsWizardActive(true);
  };

  const progress = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);

  function handleEstimatorBook() {
    setState({
      deviceType: calcCategory,
      brand: calcBrand,
      model: `${calcBrand} ${calcCategory} (Est. Repair)`,
      issue: [calcIssue],
      issueNotes: "Booked via interactive estimator.",
      fulfillment: "",
      contact: { name: "", email: "", phone: "", address: "", postcode: "" }
    });
    setStep(3);
    setIsWizardActive(true);
  }

  const estimatorBrands = BRANDS[calcCategory] ?? [];
  const estimatorIssues = ISSUES[calcCategory] ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans relative overflow-x-hidden">
      <Navbar />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
      ` }} />

      {/* ─── LANDING PAGE ────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="bg-white relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-mood-violet blur-[130px] rounded-full pointer-events-none -z-10" />

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">

            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-emerald-50 border border-emerald-100/50 px-4 py-2 text-xs font-bold text-emerald-800 mb-8 shadow-sm">
              <span className="flex items-center gap-0.5 text-emerald-600">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />)}
              </span>
              <span>4.9/5 stars on Trustpilot</span>
              <span className="text-emerald-300">|</span>
              <span className="text-emerald-600 font-medium">Over 10,000+ repairs completed</span>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-950 mb-8 max-w-4xl mx-auto leading-none">
              Professional device repairs. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-zinc-800 to-zinc-950">Done fast &amp; right.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-500 font-semibold text-base md:text-lg mb-12 leading-relaxed">
              Certified technicians. Premium OEM-grade parts. 1-year warranty on all repairs. Same-day service in Leicester, or free mail-in postage UK-wide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => document.getElementById("device-types")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="px-8 py-5 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl shadow-xl transition-all flex items-center gap-2 group"
              >
                Book a Repair Now <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-16 text-xs font-semibold text-zinc-500">
              <span className="font-bold text-zinc-400">Popular:</span>
              {[
                { name: "iPhone Screen Repair", category: "Phone", brand: "Apple", issue: "screen" },
                { name: "MacBook Battery Replacement", category: "Laptop", brand: "Apple", issue: "battery" },
                { name: "Nintendo Switch Drift Fix", category: "Console", brand: "Nintendo", issue: "controller" },
                { name: "PS5 Overheating Cleaning", category: "Console", brand: "Sony PlayStation", issue: "overheating" }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setState({
                      deviceType: item.category, brand: item.brand,
                      model: `${item.brand} ${item.category} (Est. Repair)`,
                      issue: [item.issue], issueNotes: `Shortcut select: ${item.name}`,
                      fulfillment: "", contact: { name: "", email: "", phone: "", address: "", postcode: "" }
                    });
                    setStep(3);
                    setIsWizardActive(true);
                  }}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full transition-colors font-bold shadow-sm"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Device Type Cards — outside modal, on landing page */}
            <div id="device-types" className="max-w-5xl mx-auto mb-28 text-left">
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 mb-12 text-center">
                Select your device type
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {DEVICE_TYPES.map((d) => (
                  <motion.button
                    key={d.id}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openWizardWithDevice(d.id)}
                    className={`flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm hover:shadow-xl hover:border-zinc-950 transition-all group overflow-hidden w-full ${d.glow}`}
                  >
                    <div className="w-full aspect-[4/3] bg-gradient-to-b from-zinc-50 to-white border-b border-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
                      <img
                        src={d.img}
                        alt={d.label}
                        className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between text-left">
                      <div>
                        <h3 className="font-extrabold text-lg text-zinc-950 mb-1 leading-tight">{d.label}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{d.count}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-zinc-500 group-hover:text-black transition-colors">
                        Start Repair <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-b border-zinc-150 py-10 mb-28">
              {[
                { Icon: Shield, title: "1-Year Warranty", desc: "All repair work covered" },
                { Icon: Wrench, title: "Certified Technicians", desc: "Qualified in-house engineers" },
                { Icon: Clock, title: "Same-Day Turnaround", desc: "Completed in under 45 mins" },
                { Icon: Zap, title: "OEM-Grade Parts", desc: "Premium quality guaranteed" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-zinc-50 rounded-2xl border border-zinc-150/40 flex items-center justify-center mb-3">
                    <item.Icon className="h-5 w-5 text-zinc-700" strokeWidth={1.8} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 leading-tight mb-1">{item.title}</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Interactive Cost Estimator */}
            <div className="max-w-5xl mx-auto mb-32 text-left">
              <div className="bg-zinc-950 text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                <div className="grid md:grid-cols-5 gap-8 items-center">
                  <div className="md:col-span-2 space-y-6">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="h-3.5 w-3.5" />
                      Live Repair Cost Estimator
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                      Check your repair price range
                    </h3>
                    <p className="text-zinc-400 text-xs font-semibold leading-relaxed">
                      Select your device specifics and view standard starting ranges immediately. Zero obligations, transparent flat rates.
                    </p>
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Device Type</label>
                        <select value={calcCategory} onChange={(e) => { const c = e.target.value; setCalcCategory(c); setCalcBrand(BRANDS[c]?.[0] ?? ""); setCalcIssue(ISSUES[c]?.[0]?.id ?? ""); }} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors">
                          {Object.keys(ISSUES).map(c => <option key={c} value={c} className="bg-zinc-900 text-white">{c === "Laptop" ? "Laptop / MacBook" : c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Brand</label>
                        <select value={calcBrand} onChange={(e) => setCalcBrand(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors">
                          {estimatorBrands.map(b => <option key={b} value={b} className="bg-zinc-900 text-white">{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Issue / Fault</label>
                        <select value={calcIssue} onChange={(e) => setCalcIssue(e.target.value)} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors">
                          {estimatorIssues.map(issue => <option key={issue.id} value={issue.id} className="bg-zinc-900 text-white">{issue.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-3 flex flex-col justify-between h-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md min-h-[300px]">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Estimated Payout Range</span>
                      <p className="text-sm font-bold text-zinc-300 mt-2">
                        {calcBrand} {calcCategory} · {estimatorIssues.find(i => i.id === calcIssue)?.label}
                      </p>
                    </div>
                    <div className="my-8">
                      <p className="text-5xl font-black text-accent font-mono tracking-tight">
                        {ESTIMATED_PRICES[calcCategory]?.[calcIssue] ?? "Quote on inspection"}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-2 font-semibold">
                        * Diagnostics run on receipt. Quote fixed and sent for your confirmation before work.
                      </p>
                    </div>
                    <button onClick={handleEstimatorBook} className="w-full h-14 bg-white hover:bg-accent text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2">
                      Book this repair <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="max-w-5xl mx-auto mb-32">
              <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-zinc-950 mb-14 text-center">
                How our repair service works
              </h2>
              <div className="grid md:grid-cols-4 gap-8 text-left">
                {[
                  { step: "1", title: "Book Online / Drop In", desc: "Select your device specifics and request a repair code or visit our Leicester store." },
                  { step: "2", title: "Diagnostic Checks", desc: "Our technicians run comprehensive hardware and port sanity diagnostics." },
                  { step: "3", title: "Approve Quote", desc: "We contact you with a fixed cost proposal. Rejection returns your device free." },
                  { step: "4", title: "Express Assembly", desc: "Repair is completed, tested thoroughly, and returned with a full 1-year warranty." },
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-start p-6 rounded-[2rem] bg-zinc-50 border border-zinc-150/40 relative hover:shadow-md transition-all">
                    <div className="h-10 w-10 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center mb-6">{item.step}</div>
                    <h4 className="font-extrabold text-lg text-zinc-950 mb-2">{item.title}</h4>
                    <p className="text-zinc-500 text-xs font-semibold leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="max-w-5xl mx-auto mb-32 text-left">
              <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 mb-12 text-center">
                Loved by 10,000+ happy clients
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { name: "Sarah K.", loc: "Leicester", rating: 5, title: "Fixed iPad screen in 40 mins!", review: "I walked in with a cracked screen. Techs were polite, verified the parts, and replaced the assembly inside 40 minutes. Truly express repair work!" },
                  { name: "James M.", loc: "Nottingham", rating: 5, title: "Simple postal service", review: "Prepaid postal label arrived instantly. Dispatched my HDMI broken PS5 on Monday and it was safely returned fully functional on Thursday morning. Incredible." },
                  { name: "Elena R.", loc: "Loughborough", rating: 5, title: "Honest diagnostics", review: "My MacBook would not charge. Fearing a motherboard issue, they inspected it and found a simple port connection fault. Charged me just £49. Very honest company." }
                ].map((rev, idx) => (
                  <div key={idx} className="flex flex-col justify-between p-8 rounded-3xl bg-zinc-50 border border-zinc-150/40 relative hover:shadow-md transition-all shadow-sm">
                    <div>
                      <div className="flex gap-0.5 mb-4">
                        {[...Array(rev.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-950 mb-2">&ldquo;{rev.title}&rdquo;</h4>
                      <p className="text-zinc-500 text-xs font-semibold leading-relaxed mb-6">&ldquo;{rev.review}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-200/50">
                      <div className="h-8 w-8 bg-zinc-200/60 rounded-full flex items-center justify-center font-black text-xs text-zinc-700">{rev.name[0]}</div>
                      <div>
                        <p className="text-xs font-black text-zinc-950">{rev.name}</p>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{rev.loc} · Verified Repair</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="max-w-3xl mx-auto mb-20 text-left">
              <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-center text-zinc-950 mb-14">
                Repair Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {[
                  { q: "Do I pay anything upfront?", a: "No, booking is completely free. We do not charge anything until the device has been received, inspected, and you have formally approved the final quote." },
                  { q: "What parts do you use for repairs?", a: "We use premium OEM-grade parts that match the exact technical specifications of the original screen, battery, and hardware. All parts carry our 1-year guarantee." },
                  { q: "How long does a standard repair take?", a: "In-store drop-offs for screens and batteries are completed within 45-60 minutes. Postal repairs take 3-5 working days including Royal Mail shipping time." },
                  { q: "Is my personal data safe?", a: "Absolutely. We do not access user files during hardware repair. However, we recommend backing up your data to iCloud or Google Drive before sending devices for service." },
                  { q: "What happens if a device cannot be repaired?", a: "If our diagnostic checks reveal a device is unfixable, we do not charge a penny for the attempt. We will package and return your device to you completely free of charge." }
                ].map((faq, idx) => (
                  <div key={idx} className="border border-zinc-200/80 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                    <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full flex items-center justify-between p-6 text-left font-bold text-sm text-zinc-950 hover:bg-zinc-50 transition-colors">
                      <span className="flex items-center gap-3">
                        <HelpCircle className="h-4 w-4 text-zinc-400 shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === idx && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                          <div className="px-6 pb-6 text-xs text-zinc-500 font-semibold leading-relaxed border-t border-zinc-100 pt-4 bg-zinc-50/50">{faq.a}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* ─── WIZARD MODAL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isWizardActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeWizard}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md"
            />

            {/* Modal container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-zinc-50 rounded-[2.5rem] border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-3xl min-h-[500px] flex flex-col z-10 max-h-[90vh]"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={closeWizard}
                className="absolute top-6 right-6 h-10 w-10 rounded-full border border-zinc-200 bg-white hover:border-zinc-950 flex items-center justify-center text-zinc-500 hover:text-zinc-950 transition-colors z-20 cursor-pointer shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  await handleImageFiles(files);
                }}
              />

              {/* Scrollable content */}
              <div ref={modalScrollRef} className="p-6 md:p-10 flex-1 flex flex-col overflow-y-auto custom-scrollbar pt-14">
                <div className="w-full max-w-3xl mx-auto space-y-6">

                  {/* Progress header */}
                  <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={back}
                        className="h-10 px-4 rounded-xl border border-zinc-200 hover:border-zinc-950 flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <div className="h-4 w-px bg-zinc-200 hidden md:block" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Step {step} of {TOTAL_STEPS}</span>
                        <span className="text-sm font-extrabold text-zinc-800">{STEP_LABELS[step - 1]}</span>
                      </div>
                    </div>
                    <div className="flex-1 max-w-xs md:ml-auto">
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-zinc-950 rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step card */}
                  <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                    <div className="p-8 md:p-10 flex-1 flex flex-col">
                      <AnimatePresence mode="wait" custom={dir}>
                        <motion.div
                          key={step}
                          custom={dir}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ type: "spring", stiffness: 320, damping: 30 }}
                          className="flex-1 flex flex-col"
                        >

                          {/* STEP 1 – Brand & Model */}
                          {step === 1 && (
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="space-y-6">
                                <div>
                                  <h2 className="font-serif text-3xl md:text-4xl font-medium mb-2">Brand &amp; model</h2>
                                  <p className="text-zinc-400 font-medium text-sm">Tell us exactly what device you have.</p>
                                </div>
                                <div className="space-y-3">
                                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Brand</p>
                                  <div className="flex flex-wrap gap-2">
                                    {BRANDS[state.deviceType]?.map(brand => (
                                      <button
                                        key={brand}
                                        onClick={() => setState(s => ({ ...s, brand }))}
                                        className={`px-5 py-3 rounded-[1rem] border-2 font-bold text-sm transition-all ${state.brand === brand ? "border-black bg-black text-white" : "border-zinc-200 hover:border-zinc-400"}`}
                                      >
                                        {brand}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Exact model</label>
                                  <input
                                    type="text"
                                    placeholder={`E.g. ${state.deviceType === "Phone" ? "iPhone 14 Pro, Galaxy S23" : state.deviceType === "Console" ? "PS5 Digital, Xbox Series X" : "MacBook Air M2, XPS 15"}`}
                                    value={state.model}
                                    onChange={e => setState(s => ({ ...s, model: e.target.value }))}
                                    className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="pt-6 border-t border-zinc-100">
                                <button
                                  onClick={() => { if (state.brand && state.model) go(1); }}
                                  disabled={!state.brand || !state.model}
                                  className="w-full h-14 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                                >
                                  Continue <ArrowRight className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* STEP 2 – Issue */}
                          {step === 2 && (
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="space-y-6">
                                <div>
                                  <h2 className="font-serif text-3xl md:text-4xl font-medium mb-2">What&apos;s the problem?</h2>
                                  <p className="text-zinc-400 font-medium text-sm">Select the closest description — don&apos;t worry if you&apos;re not sure.</p>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Select all that apply</p>
                                <div className="space-y-3">
                                  {(ISSUES[state.deviceType] ?? []).map(issue => {
                                    const Icon = issue.icon;
                                    const selected = state.issue.includes(issue.id);
                                    return (
                                      <motion.button
                                        key={issue.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setState(s => ({
                                          ...s,
                                          issue: selected
                                            ? s.issue.filter(i => i !== issue.id)
                                            : [...s.issue, issue.id],
                                        }))}
                                        className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 text-left transition-all ${selected ? "border-black bg-black text-white" : "border-zinc-200 hover:border-zinc-400 hover:shadow-sm"}`}
                                      >
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${selected ? "bg-white/10" : "bg-zinc-100"}`}>
                                          <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-sm">{issue.label}</p>
                                          <p className={`text-xs mt-0.5 ${selected ? "text-white/60" : "text-zinc-400"}`}>{issue.desc}</p>
                                        </div>
                                        <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "bg-white border-white" : "border-zinc-300"}`}>
                                          {selected && <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />}
                                        </div>
                                      </motion.button>
                                    );
                                  })}
                                </div>
                                {state.issue.length > 0 && (
                                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                                      Additional details <span className="text-zinc-300">(optional)</span>
                                    </label>
                                    <textarea
                                      placeholder="Any extra info that would help our technician..."
                                      value={state.issueNotes}
                                      onChange={e => setState(s => ({ ...s, issueNotes: e.target.value }))}
                                      rows={3}
                                      className="w-full rounded-[1rem] border-2 border-zinc-200 px-5 py-4 text-sm font-medium outline-none focus:border-black transition-colors resize-none"
                                    />
                                  </motion.div>
                                )}
                              </div>
                              {/* Image Upload (required) */}
                              {state.issue.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">
                                    Device Photos <span className="text-red-500">*</span> <span className="text-zinc-300 font-normal normal-case tracking-normal">(min 1 required)</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={imageUploading || images.length >= 6}
                                    className="w-full border-2 border-dashed border-zinc-200 hover:border-black rounded-[1.5rem] p-6 flex flex-col items-center gap-2 transition-all bg-zinc-50 hover:bg-white disabled:opacity-60 disabled:pointer-events-none group"
                                  >
                                    <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center group-hover:bg-black group-hover:border-black transition-all">
                                      {imageUploading ? (
                                        <div className="h-4 w-4 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                                      ) : (
                                        <Upload className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                                      )}
                                    </div>
                                    <p className="text-xs font-bold text-zinc-700">{imageUploading ? "Uploading…" : "Upload photos of the damage"}</p>
                                    <p className="text-[10px] text-zinc-400">JPEG or PNG · max 6</p>
                                  </button>
                                  {images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                      {images.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200">
                                          <img src={img.previewUrl} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-1 right-1 h-6 w-6 bg-zinc-950/80 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                                          >
                                            <X className="h-3 w-3 text-white" />
                                          </button>
                                        </div>
                                      ))}
                                      {images.length < 6 && (
                                        <button
                                          type="button"
                                          onClick={() => fileInputRef.current?.click()}
                                          disabled={imageUploading}
                                          className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 hover:border-black bg-zinc-50 flex items-center justify-center transition-colors text-zinc-400 hover:text-black disabled:opacity-50"
                                        >
                                          <Plus className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                              <div className="pt-6 border-t border-zinc-100">
                                <button
                                  onClick={() => { if (state.issue.length > 0 && images.length > 0) go(1); }}
                                  disabled={state.issue.length === 0 || images.length === 0 || imageUploading}
                                  className="w-full h-14 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                                >
                                  Continue <ArrowRight className="h-5 w-5" />
                                </button>
                                {state.issue.length > 0 && images.length === 0 && !imageUploading && (
                                  <p className="text-center text-[10px] text-red-500 font-bold mt-2">Please upload at least 1 photo to continue</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* STEP 3 – Fulfillment */}
                          {step === 3 && (
                            <div className="flex-1">
                              <h2 className="font-serif text-3xl md:text-4xl font-medium mb-2">How will you get it to us?</h2>
                              <p className="text-zinc-400 font-medium text-sm mb-8">Choose the most convenient option.</p>
                              <div className="space-y-4">
                                {[
                                  { id: "dropoff", label: "Drop off in store", desc: "Bring your device to TechStop Leicester. Our technician will diagnose it and give you a quote on the spot.", icon: MapPin, badge: "No postage needed", badgeColor: "bg-blue-100 text-blue-700" },
                                  { id: "mail", label: "Send by post", desc: "We'll send you a prepaid shipping label. Pack your device and drop it at any post office.", icon: Truck, badge: "Free prepaid label", badgeColor: "bg-emerald-100 text-emerald-700" },
                                ].map(opt => {
                                  const Icon = opt.icon;
                                  return (
                                    <motion.button
                                      key={opt.id}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => { setState(s => ({ ...s, fulfillment: opt.id })); go(1); }}
                                      className={`w-full rounded-[2rem] border-2 p-7 text-left transition-all ${state.fulfillment === opt.id ? "border-black bg-black text-white" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-white"}`}
                                    >
                                      <div className="flex items-start gap-5">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${state.fulfillment === opt.id ? "bg-white/10" : "bg-white shadow-sm"}`}>
                                          <Icon className="h-7 w-7" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                          <p className="font-bold text-lg mb-1">{opt.label}</p>
                                          <p className={`text-sm leading-relaxed ${state.fulfillment === opt.id ? "text-white/70" : "text-zinc-500"}`}>{opt.desc}</p>
                                          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${state.fulfillment === opt.id ? "bg-accent/20 text-accent" : opt.badgeColor}`}>
                                            {opt.badge}
                                          </span>
                                        </div>
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* STEP 4 – Contact */}
                          {step === 4 && (
                            <form
                              className="flex-1 flex flex-col justify-between"
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (user) {
                                  const missing: string[] = [];
                                  if (!user.phone)    missing.push("Phone number");
                                  if (!user.address)  missing.push("Street address");
                                  if (!user.city)     missing.push("City");
                                  if (!user.postcode) missing.push("Postcode");
                                  if (missing.length > 0) {
                                    setMissingFields(missing);
                                    setMissingDetailsOpen(true);
                                    return;
                                  }
                                }
                                setSubmitting(true);
                                setSubmitError("");
                                try {
                                  const result = await repairsApi.submit({
                                    deviceType: state.deviceType,
                                    brand: state.brand,
                                    model: state.model,
                                    issue: state.issue.join(", "),
                                    issueNotes: state.issueNotes,
                                    fulfillment: state.fulfillment === "mail" ? "ship" : state.fulfillment,
                                    images: images.map(i => i.filePath),
                                    contact: state.contact,
                                  });
                                  setSubmitRef(result.reference);
                                  go(1);
                                } catch (err) {
                                  setSubmitError(err instanceof Error ? err.message : "Submission failed");
                                } finally {
                                  setSubmitting(false);
                                }
                              }}
                            >
                              <div className="space-y-4">
                                <div>
                                  <h2 className="font-serif text-3xl md:text-4xl font-medium mb-2">Your contact details</h2>
                                  <p className="text-zinc-400 font-medium text-sm">Our technician will reach out to confirm the booking and pricing.</p>
                                </div>

                                {user ? (
                                  <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-black text-xs text-emerald-700 shrink-0">
                                      {user.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-black text-emerald-900 truncate">{user.name}</p>
                                      <p className="text-[10px] font-bold text-emerald-600">Details filled from your account</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <a
                                      href={`${API_URL}/auth/google`}
                                      onClick={() => { /* auto-save handles sessionStorage */ }}
                                      className="w-full h-12 bg-white border-2 border-zinc-200 rounded-2xl font-bold transition-all hover:scale-[1.02] hover:border-zinc-400 active:scale-[0.98] flex items-center justify-center gap-3 text-sm text-zinc-700 shadow-sm"
                                    >
                                      <GoogleIcon />
                                      Continue with Google
                                    </a>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 h-px bg-zinc-200" />
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">or fill manually</span>
                                      <div className="flex-1 h-px bg-zinc-200" />
                                    </div>
                                  </div>
                                )}

                                {(() => {
                                  const allFields = [
                                    { key: "name",     label: "Full Name",          type: "text",  placeholder: "E.g. Alex Turner" },
                                    { key: "email",    label: "Email Address",       type: "email", placeholder: "you@example.com" },
                                    { key: "phone",    label: "Phone Number",        type: "tel",   placeholder: "+44 7700 000000" },
                                    ...(state.fulfillment === "mail" ? [
                                      { key: "address",  label: "Collection Address", type: "text",  placeholder: "Street address" },
                                      { key: "postcode", label: "Postcode",           type: "text",  placeholder: "LE1 1AA" },
                                    ] : []),
                                  ];
                                  const visibleFields = user ? [] : allFields;
                                  if (visibleFields.length === 0) return null;
                                  return visibleFields.map(({ key, label, type, placeholder }) => (
                                    <div key={key} className="flex flex-col gap-2">
                                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
                                      <input
                                        type={type}
                                        required
                                        placeholder={placeholder}
                                        value={state.contact[key as keyof typeof state.contact]}
                                        onChange={e => setState(s => ({ ...s, contact: { ...s.contact, [key]: e.target.value } }))}
                                        className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                                      />
                                    </div>
                                  ));
                                })()}

                                {submitError && (
                                  <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{submitError}</p>
                                )}
                              </div>

                              <div className="pt-6 border-t border-zinc-100">
                                <button
                                  type="submit"
                                  disabled={submitting}
                                  className="w-full h-14 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {submitting ? "Submitting…" : "Book Repair"} {!submitting && <ArrowRight className="h-5 w-5" />}
                                </button>
                                <p className="text-center text-[10px] text-zinc-400 font-medium mt-3">
                                  No payment now — you approve the quote before any work begins.
                                </p>
                              </div>
                            </form>
                          )}

                          {/* STEP 5 – Confirmation */}
                          {step === 5 && (
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center flex-1 flex flex-col items-center justify-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                                className="mx-auto h-24 w-24 bg-mood-violet rounded-[2.5rem] flex items-center justify-center mb-8 border border-violet-100"
                              >
                                <Wrench className="h-12 w-12 text-black" strokeWidth={1.5} />
                              </motion.div>
                              <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">Booking received!</h2>
                              <p className="text-zinc-400 font-medium text-base mb-8 max-w-sm mx-auto leading-relaxed">
                                Your repair request for <strong className="text-black">{state.brand} {state.model}</strong> is logged. Expect a call or email within <strong className="text-black">2 hours</strong>.
                              </p>
                              <div className="w-full rounded-[2rem] bg-zinc-50 border border-zinc-100 p-6 mb-6 text-left">
                                <div className="space-y-3 text-sm">
                                  {[
                                    ...(submitRef ? [["Reference", submitRef]] : []),
                                    ["Device", `${state.brand} ${state.model}`],
                                    ["Issue", state.issue.map(id => ISSUES[state.deviceType]?.find(i => i.id === id)?.label ?? id).join(", ")],
                                    ["Method", state.fulfillment === "dropoff" ? "Drop-off in store" : "Post to us"],
                                    ["Contact", state.contact.email],
                                  ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-2.5 border-b border-zinc-100 last:border-0">
                                      <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] self-center">{k}</span>
                                      <span className="font-bold text-right max-w-[200px]">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="w-full rounded-[1.5rem] bg-black text-white p-5 mb-8 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                  <Clock className="h-5 w-5 text-accent" />
                                  <p className="font-bold text-sm">What happens next?</p>
                                </div>
                                <p className="text-white/70 text-xs leading-relaxed">
                                  Our technician will contact you to confirm the diagnosis, give you a fixed quote, and schedule the repair. You pay nothing until you approve the quote.
                                </p>
                              </div>
                              <button
                                onClick={closeWizard}
                                className="inline-flex items-center gap-2 h-12 px-8 bg-black text-white rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-colors"
                              >
                                Back to repair center
                              </button>
                            </motion.div>
                          )}

                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Missing profile details modal */}
      {missingDetailsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMissingDetailsOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-950">Complete your profile first</h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">We need a few more details before you can book.</p>
              </div>
              <button onClick={() => setMissingDetailsOpen(false)} className="text-zinc-400 hover:text-zinc-700 transition-colors ml-4 mt-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {missingFields.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {f} is missing
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                setMissingDetailsOpen(false);
                router.push("/account/settings");
              }}
              className="w-full h-11 bg-black text-white rounded-xl text-sm font-black hover:bg-zinc-800 transition-colors"
            >
              Go to Account Settings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
