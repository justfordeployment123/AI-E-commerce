"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { repairsApi, storesApi, uploadsApi, catalogApi, productsApi, type Store, type CatalogCategory } from "@/lib/api";
import {
  Smartphone, Tablet, Gamepad2, Laptop, Package, ArrowLeft, ArrowRight,
  Check, MapPin, Truck, Wrench, Clock, Shield, X,
  Monitor, Zap, Battery, Wifi, HardDrive, CircleAlert,
  Star, HelpCircle, ChevronDown, Sparkles, ChevronRight, Upload, Plus,
  CheckCircle2
} from "lucide-react";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/auth-context";

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

// Visual metadata keyed by category slug — the list itself comes from the API
const DEVICE_TYPE_META: Record<string, { oldId: string; Icon: React.ElementType; img: string; mood: string; glow: string }> = {
  phones:   { oldId: "Phone",   Icon: Smartphone, img: "/bento_smartphones.png", mood: "bg-sky-500/10 border-sky-500/20",    glow: "hover:shadow-sky-500/10"    },
  tablets:  { oldId: "Tablet",  Icon: Tablet,     img: "/bento_tablets.png",     mood: "bg-rose-500/10 border-rose-500/20",  glow: "hover:shadow-rose-500/10"   },
  consoles: { oldId: "Console", Icon: Gamepad2,   img: "/bento_gaming.png",      mood: "bg-violet-500/10 border-violet-500/20",glow: "hover:shadow-violet-500/10"},
  laptops:  { oldId: "Laptop",  Icon: Laptop,     img: "/bento_laptops.png",     mood: "bg-amber-500/10 border-amber-500/20", glow: "hover:shadow-amber-500/10"  },
};

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



export default function RepairPage() {
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<RepairState>({
    deviceType: "", brand: "", model: "", issue: [], issueNotes: "",
    fulfillment: "",
    contact: { name: "", email: "", phone: "", address: "", postcode: "" },
  });

  const [catalogCats, setCatalogCats] = useState<CatalogCategory[]>([]);
  const [catFallbackImages, setCatFallbackImages] = useState<Record<string, string>>({});
  const [stores, setStores] = useState<Store[]>([]);
  useEffect(() => {
    catalogApi.listCategories()
      .then(cats => {
        const repairable = cats.filter(c => c.isRepairable);
        setCatalogCats(repairable);
        repairable.filter(c => !c.image).forEach(c => {
          productsApi.list({ category: c.name, limit: 1 })
            .then(r => {
              const img = r.items[0]?.images?.[0];
              if (img) setCatFallbackImages(prev => ({ ...prev, [c.slug]: img }));
            })
            .catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [submitRef, setSubmitRef] = useState("");
  const [submitError, setSubmitError] = useState("");


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

    // Fetch stores on mount to show real info in the dropoff card
    storesApi.list()
      .then(setStores)
      .catch(() => {});
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

  const guardedOpen = (action: () => void) => {
    if (!user) {
      sessionStorage.setItem("ts_login_redirect", "/repair");
      router.push("/login?redirect=%2Frepair");
      return;
    }
    action();
  };

  const openWizardWithDevice = (deviceId: string) => {
    setState({ deviceType: deviceId, brand: "", model: "", issue: [], issueNotes: "", fulfillment: "", contact: { name: "", email: "", phone: "", address: "", postcode: "" } });
    setImages([]);
    setBatchId(crypto.randomUUID());
    setStep(1);
    setIsWizardActive(true);
  };

  const progress = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);



  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const activeStore = stores.find(s => s.id === selectedStoreId) || stores[0];
  const storeName = activeStore?.name || "TechStop Leicester";
  const storeAddress = activeStore ? `${activeStore.address}, ${activeStore.city} ${activeStore.postcode}` : "104 High St, Leicester LE1 5YP";
  const storeHours = activeStore?.openingHours || "Mon–Sat, 9:00 AM – 6:00 PM";
  const mapsLink = activeStore ? `https://maps.google.com/?q=${encodeURIComponent(`${activeStore.name}, ${activeStore.address}, ${activeStore.city} ${activeStore.postcode}`)}` : "https://maps.google.com/?q=104+High+St,+Leicester+LE1+5YP";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-accent selection:text-white">

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d8; }
      ` }} />

      {/* ─── LANDING PAGE ────────────────────────────────────────────────────── */}
      <main className="flex-1 bg-background text-foreground relative">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-[-100px] right-[10%] w-[350px] h-[350px] bg-violet-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-[100px] left-[5%] w-[400px] h-[400px] bg-sky-500/8 blur-[130px] rounded-full pointer-events-none -z-10" />
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="bg-background relative text-foreground">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-mood-violet blur-[130px] rounded-full pointer-events-none -z-10" />

          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-12">
            
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start text-left mb-12">
              
              {/* Left Column: Headline and Info */}
              <div className="lg:col-span-5 flex flex-col items-start text-left font-sans">
                {/* Trustpilot-style Rating Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 px-3.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-6 shadow-sm">
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                  </span>
                  <span>4.9/5 on Trustpilot</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-4 leading-none font-sans">
                  Professional <br />
                  device repairs. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-zinc-800 to-zinc-950 dark:from-red-500 dark:via-zinc-300 dark:to-white">Done fast &amp; right.</span>
                </h1>
                
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm md:text-base mb-8 leading-relaxed">
                  Certified technicians. Premium OEM-grade parts. 1-year warranty on all repairs. Same-day service in Leicester, or free mail-in postage UK-wide.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-500 mb-8">
                  <span className="text-zinc-500 font-extrabold">Popular:</span>
                  {[
                    { name: "iPhone Screen", category: "Phone", brand: "Apple", issue: "screen" },
                    { name: "MacBook Battery", category: "Laptop", brand: "Apple", issue: "battery" },
                    { name: "Switch Drift Fix", category: "Console", brand: "Nintendo", issue: "controller" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => guardedOpen(() => {
                        setState({
                          deviceType: item.category, brand: item.brand,
                          model: `${item.brand} ${item.category} (Est. Repair)`,
                          issue: [item.issue], issueNotes: `Shortcut select: ${item.name}`,
                          fulfillment: "", contact: { name: "", email: "", phone: "", address: "", postcode: "" }
                        });
                        setStep(3);
                        setIsWizardActive(true);
                      })}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-lg transition-colors font-bold shadow-sm"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Device Types Grid */}
              <div className="lg:col-span-7 w-full font-sans">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-none">
                    Select your device type to start
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  {catalogCats.map((cat) => {
                    const meta = DEVICE_TYPE_META[cat.slug] ?? {
                      oldId: cat.slug,
                      Icon: Package,
                      img: "",
                      mood: "bg-zinc-500/10 border-zinc-500/20",
                      glow: "hover:shadow-zinc-500/10",
                    };
                    const img = cat.image ?? catFallbackImages[cat.slug] ?? meta.img;
                    const isProductFallback = !cat.image && !!catFallbackImages[cat.slug];
                    const modelCount = cat.modelCount > 0 ? `${cat.modelCount}+ models` : null;
                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ y: -6, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => guardedOpen(() => openWizardWithDevice(meta.oldId))}
                        className={`flex flex-col rounded-[2.5rem] border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-xl hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 group overflow-hidden w-full text-left ${meta.glow}`}
                      >
                        <div className="w-full aspect-[4/3] bg-gradient-to-b from-zinc-50 to-white border-b border-zinc-100 dark:from-zinc-950/20 dark:border-zinc-850 flex items-center justify-center relative overflow-hidden">
                          {img && (
                            <img
                              src={img}
                              alt={cat.name}
                              className={`transition-transform duration-500 group-hover:scale-105 ${
                                isProductFallback 
                                  ? "h-[70%] w-[70%] object-contain drop-shadow-md p-3" 
                                  : "h-full w-full object-cover"
                              }`}
                            />
                          )}
                          {!isProductFallback && (
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/60 to-transparent dark:from-zinc-900/60 pointer-events-none" />
                          )}
                        </div>
                        <div className="px-3.5 py-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-xs sm:text-sm text-zinc-950 dark:text-white leading-tight truncate">{cat.name}</h3>
                            {modelCount && <p className="text-[9px] text-zinc-400 mt-0.5 truncate">{modelCount}</p>}
                          </div>
                          <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 group-hover:scale-105 transition-transform duration-200">
                            <ChevronRight className="h-3 w-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Value Proposition Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800 pt-10 mb-28 text-left font-sans">
              {[
                { Icon: Shield, title: "1-Year Warranty", desc: "All repair work covered" },
                { Icon: Wrench, title: "Certified Technicians", desc: "Qualified in-house engineers" },
                { Icon: Clock, title: "Same-Day Turnaround", desc: "Completed in under 45 mins" },
                { Icon: Zap, title: "OEM-Grade Parts", desc: "Premium quality guaranteed" },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="h-10 w-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                    <item.Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-200 leading-tight mb-1">{item.title}</h4>
                    <p className="text-[9px] text-zinc-400 font-semibold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Choose How to Trade In */}
            <div className="max-w-5xl mx-auto mb-20 text-left font-sans">
              <div className="text-center mb-12">
                <h3 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-none mb-3">
                  Two Convenient Ways to Get Serviced
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-sm max-w-xl mx-auto leading-relaxed">
                  Whether you prefer mailing your device from home or dropping in for an on-the-spot repair, we've got you covered.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Method 1: Postal */}
                <div className="flex flex-col justify-between p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group">
                  <div>
                    <div className="h-12 w-12 bg-sky-500/10 dark:bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                      <Truck className="h-6 w-6 text-sky-500" />
                    </div>
                    <h4 className="font-black text-xl text-zinc-950 dark:text-white mb-2">Mail it to Us (Free &amp; Insured)</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
                      Book online, and we'll instantly generate a prepaid, fully-insured Royal Mail shipping label. Print it out, wrap your device securely, and hand it to any Post Office counter. Our Leicester lab will fix, test, and ship it back completely free of charge.
                    </p>
                    <ul className="space-y-2.5 mb-8">
                      {[
                        "Free insured Royal Mail postage label included",
                        "Repaired & shipped back within 3-5 working days",
                        "1-Year warranty on all parts and labor",
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => guardedOpen(() => openWizardWithDevice("Phone"))}
                    className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    Start Postal Repair <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Method 2: In-Store */}
                <div className="flex flex-col justify-between p-8 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group relative">
                  <div className="absolute top-6 right-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Open Now
                  </div>
                  <div>
                    <div className="h-12 w-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                      <MapPin className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h4 className="font-black text-xl text-zinc-950 dark:text-white mb-2">Leicester Store Drop-Off</h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
                      Bring your device directly to our high-street retail store for an express evaluation and repair. Most screen and battery replacements are completed by our certified technicians in under 45 minutes while you wait.
                    </p>
                    {stores.length > 1 && (
                      <div className="mb-4">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">Select Store Location</label>
                        <select
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          className="h-10 w-full rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 px-3 text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none focus:border-accent"
                        >
                          {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-800/80 space-y-2 mb-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-bold">Address</span>
                        <span className="text-zinc-900 dark:text-zinc-200 font-black">{storeAddress}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-bold">Opening Hours</span>
                        <span className="text-zinc-900 dark:text-zinc-200 font-black">{storeHours}</span>
                      </div>
                    </div>
                    {/* Interactive Store Location Map */}
                    <div className="w-full h-40 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-850 mb-6 shadow-inner relative group bg-zinc-100 dark:bg-zinc-950">
                      <iframe
                        title="Store Location Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                        className="grayscale opacity-90 dark:opacity-85 contrast-[0.95] group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                      />
                    </div>
                  </div>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-1.5 text-center"
                  >
                    Get Directions <MapPin className="h-4 w-4" />
                  </a>
                </div>
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
                                  <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Brand &amp; model</h2>
                                  <p className="text-zinc-400 font-medium text-sm">Tell us exactly what device you have.</p>
                                </div>
                                <div className="space-y-3">
                                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Brand</p>
                                  <div className="flex flex-wrap gap-2">
                                    {BRANDS[state.deviceType]?.map(brand => (
                                      <button
                                        key={brand}
                                        onClick={() => setState(s => ({ ...s, brand }))}
                                        className={`px-5 py-3 rounded-[1rem] border-2 font-bold text-sm transition-all ${state.brand === brand ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-300"}`}
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
                                    className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-accent transition-colors"
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
                                  <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight mb-2">What&apos;s the problem?</h2>
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
                                        className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 text-left transition-all ${selected ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950 shadow-md" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 hover:shadow-sm text-zinc-800 dark:text-zinc-200"}`}
                                      >
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${selected ? "bg-white/10 text-white dark:bg-zinc-950/10 dark:text-zinc-950" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                                          <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-bold text-sm">{issue.label}</p>
                                          <p className={`text-xs mt-0.5 ${selected ? "text-white/60 dark:text-zinc-950/60" : "text-zinc-400 dark:text-zinc-550"}`}>{issue.desc}</p>
                                        </div>
                                        <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${selected ? "bg-white border-white dark:bg-zinc-950 dark:border-zinc-950" : "border-zinc-300 dark:border-zinc-700"}`}>
                                          {selected && <Check className="h-3.5 w-3.5 text-black dark:text-white" strokeWidth={3} />}
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
                                      className="w-full rounded-[1rem] border-2 border-zinc-200 px-5 py-4 text-sm font-medium outline-none focus:border-accent transition-colors resize-none"
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
                                    className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white rounded-[1.5rem] p-6 flex flex-col items-center gap-2 transition-all bg-zinc-50 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-950 group disabled:opacity-60 disabled:pointer-events-none"
                                  >
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center group-hover:bg-zinc-950 dark:group-hover:bg-white group-hover:border-zinc-950 dark:group-hover:border-white transition-all">
                                      {imageUploading ? (
                                        <div className="h-4 w-4 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-700 dark:border-t-zinc-200 rounded-full animate-spin" />
                                      ) : (
                                        <Upload className="h-4 w-4 text-zinc-400 dark:text-zinc-500 group-hover:text-white dark:group-hover:text-zinc-950 transition-colors" />
                                      )}
                                    </div>
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{imageUploading ? "Uploading…" : "Upload photos of the damage"}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">JPEG or PNG · max 6</p>
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
                                          className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-950 dark:hover:border-white bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white disabled:opacity-50"
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
                              <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight mb-2">How will you get it to us?</h2>
                              <p className="text-zinc-400 font-medium text-sm mb-8">Choose the most convenient option.</p>
                              <div className="space-y-4">
                                {[
                                  { id: "dropoff", label: "Drop off in store", desc: "Bring your device to TechStop Leicester. Our technician will diagnose it and give you a quote on the spot.", icon: MapPin, badge: "No postage needed", badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                                  { id: "mail", label: "Send by post", desc: "We'll send you a prepaid shipping label. Pack your device and drop it at any post office.", icon: Truck, badge: "Free prepaid label", badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                                ].map(opt => {
                                  const Icon = opt.icon;
                                  return (
                                    <motion.button
                                      key={opt.id}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => { setState(s => ({ ...s, fulfillment: opt.id })); go(1); }}
                                      className={`w-full rounded-[2rem] border-2 p-7 text-left transition-all ${state.fulfillment === opt.id ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950 shadow-md" : "border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-white hover:dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200"}`}
                                    >
                                      <div className="flex items-start gap-5">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${state.fulfillment === opt.id ? "bg-white/10 text-white dark:bg-zinc-950/10 dark:text-zinc-950" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-sm"}`}>
                                          <Icon className="h-7 w-7" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                          <p className="font-bold text-lg mb-1">{opt.label}</p>
                                          <p className={`text-sm leading-relaxed ${state.fulfillment === opt.id ? "text-white/70 dark:text-zinc-950/70" : "text-zinc-500 dark:text-zinc-450"}`}>{opt.desc}</p>
                                          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${state.fulfillment === opt.id ? "bg-accent/20 text-accent dark:bg-accent/15" : opt.badgeColor}`}>
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
                                  <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Your contact details</h2>
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
                                        className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-accent transition-colors"
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
                              <h2 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Booking received!</h2>
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
