"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { repairsApi } from "../../lib/api";
import {
  Smartphone, Tablet, Gamepad2, Laptop, ArrowLeft, ArrowRight,
  Check, MapPin, Truck, Wrench, Clock, Shield, CheckCircle2,
  Monitor, Zap, Battery, Wifi, HardDrive, CircleAlert,
  Star, HelpCircle, ChevronDown, Sparkles, RefreshCw, ChevronRight
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
  issue: string;
  issueNotes: string;
  fulfillment: string;
  contact: { name: string; email: string; phone: string; address: string; postcode: string };
}

export default function RepairPage() {
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<RepairState>({
    deviceType: "", brand: "", model: "", issue: "", issueNotes: "",
    fulfillment: "",
    contact: { name: "", email: "", phone: "", address: "", postcode: "" },
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitRef, setSubmitRef] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Estimator states
  const [calcCategory, setCalcCategory] = useState("Phone");
  const [calcBrand, setCalcBrand] = useState("Apple");
  const [calcIssue, setCalcIssue] = useState("screen");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const go = (n: number) => { setDir(n > 0 ? 1 : -1); setStep(s => s + n); };

  const back = () => {
    if (step === 2 && state.model.includes("(Est. Repair)")) {
      setIsWizardActive(false);
      return;
    }
    if (step === 4 && state.model.includes("(Est. Repair)")) {
      setIsWizardActive(false);
      return;
    }
    if (step === 1) {
      setIsWizardActive(false);
      return;
    }
    go(-1);
  };

  const TOTAL_STEPS = 6;
  const progress = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
  const stepLabels = ["Device", "Brand & Model", "Issue", "Delivery", "Contact", "Done"];

  const ESTIMATED_PRICES: Record<string, Record<string, string>> = {
    Phone: { screen: "£69 - £149", battery: "£39 - £69", charging: "£39 - £59", camera: "£49 - £89", software: "£29 - £49", water: "£59 - £129", other: "Quote on inspection" },
    Tablet: { screen: "£89 - £189", battery: "£49 - £79", charging: "£49 - £79", software: "£39 - £59", other: "Quote on inspection" },
    Console: { disc: "£49 - £89", hdmi: "£69 - £99", controller: "£25 - £45", overheating: "£39 - £69", power: "£59 - £99", other: "Quote on inspection" },
    Laptop: { screen: "£119 - £249", keyboard: "£69 - £129", battery: "£59 - £109", charging: "£49 - £99", software: "£39 - £69", overheating: "£39 - £59", other: "Quote on inspection" }
  };

  function handleEstimatorBook() {
    setState({
      deviceType: calcCategory,
      brand: calcBrand,
      model: `${calcBrand} ${calcCategory} (Est. Repair)`,
      issue: calcIssue,
      issueNotes: "Booked via interactive estimator.",
      fulfillment: "",
      contact: { name: "", email: "", phone: "", address: "", postcode: "" }
    });
    setStep(4); // Straight to Delivery options (Fulfillment)
    setIsWizardActive(true);
  }

  const estimatorBrands = BRANDS[calcCategory] ?? [];
  const estimatorIssues = ISSUES[calcCategory] ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans relative overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        {!isWizardActive ? (
          // ─── REPAIR LANDING PAGE (VIBRANT & ULTRA PREMIUM STYLE) ───────────
          <div className="bg-white relative">
            {/* Background Blur Orb */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-mood-violet blur-[130px] rounded-full pointer-events-none -z-10" />

            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
              
              {/* Trust Badge */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-emerald-50 border border-emerald-100/50 px-4 py-2 text-xs font-bold text-emerald-800 mb-8 shadow-sm">
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                  <Star className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500" />
                </span>
                <span>4.9/5 stars on Trustpilot</span>
                <span className="text-emerald-300">|</span>
                <span className="text-emerald-600 font-medium">Over 10,000+ repairs completed</span>
              </div>

              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-zinc-950 mb-8 max-w-4xl mx-auto leading-none">
                Professional device repairs. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 via-zinc-800 to-zinc-950">Done fast & right.</span>
              </h1>
              <p className="max-w-2xl mx-auto text-zinc-500 font-semibold text-base md:text-lg mb-12 leading-relaxed">
                Certified technicians. Premium OEM-grade parts. 1-year warranty on all repairs. Same-day service in Leicester, or free mail-in postage UK-wide.
              </p>

              {/* Book Repair Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => {
                    setState({
                      deviceType: "", brand: "", model: "", issue: "", issueNotes: "",
                      fulfillment: "",
                      contact: { name: "", email: "", phone: "", address: "", postcode: "" },
                    });
                    setStep(1);
                    setIsWizardActive(true);
                  }}
                  className="px-8 py-5 bg-black hover:bg-zinc-800 text-white font-bold text-base rounded-2xl shadow-xl transition-all flex items-center gap-2 group"
                >
                  Book a Repair Now <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Shortcut pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-28 text-xs font-semibold text-zinc-500">
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
                        deviceType: item.category,
                        brand: item.brand,
                        model: `${item.brand} ${item.category} (Est. Repair)`,
                        issue: item.issue,
                        issueNotes: `Shortcut select: ${item.name}`,
                        fulfillment: "",
                        contact: { name: "", email: "", phone: "", address: "", postcode: "" }
                      });
                      setStep(4);
                      setIsWizardActive(true);
                    }}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full transition-colors font-bold shadow-sm"
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Guarantees / Value Proposition Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto border-t border-b border-zinc-150 py-10 mb-28">
                {[
                  { Icon: Shield, title: "1-Year Warranty", desc: "All repair work covered" },
                  { Icon: Wrench, title: "Certified Technicians", desc: "Qualified in-house engineers" },
                  { Icon: Clock, title: "Same-Day Turnaround", desc: "Completed in under 45 mins" },
                  { Icon: Zap, title: "OEM-Grade Parts", desc: "Premium quality guaranteed" },
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

              {/* Interactive Cost Estimator & Quote Tool */}
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
                          <select
                            value={calcCategory}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setCalcCategory(newCat);
                              const newBrands = BRANDS[newCat] ?? [];
                              const newIssues = ISSUES[newCat] ?? [];
                              if (newBrands.length > 0) setCalcBrand(newBrands[0]);
                              if (newIssues.length > 0) setCalcIssue(newIssues[0].id);
                            }}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors"
                          >
                            <option value="Phone" className="bg-zinc-900 text-white">Phone</option>
                            <option value="Tablet" className="bg-zinc-900 text-white">Tablet</option>
                            <option value="Console" className="bg-zinc-900 text-white">Console</option>
                            <option value="Laptop" className="bg-zinc-900 text-white">Laptop / MacBook</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Brand</label>
                          <select
                            value={calcBrand}
                            onChange={(e) => setCalcBrand(e.target.value)}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors"
                          >
                            {estimatorBrands.map((b) => (
                              <option key={b} value={b} className="bg-zinc-900 text-white">{b}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Issue / Fault</label>
                          <select
                            value={calcIssue}
                            onChange={(e) => setCalcIssue(e.target.value)}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-accent transition-colors"
                          >
                            {estimatorIssues.map((issue) => (
                              <option key={issue.id} value={issue.id} className="bg-zinc-900 text-white">{issue.label}</option>
                            ))}
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

                      <button
                        onClick={handleEstimatorBook}
                        className="w-full h-14 bg-white hover:bg-accent text-zinc-950 hover:text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        Book this repair <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works section */}
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
                      <div className="h-10 w-10 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center mb-6">
                        {item.step}
                      </div>
                      <h4 className="font-extrabold text-lg text-zinc-950 mb-2">{item.title}</h4>
                      <p className="text-zinc-500 text-xs font-semibold leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="max-w-5xl mx-auto mb-32 text-left">
                <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-zinc-950 mb-12 text-center">
                  Loved by 10,000+ happy clients
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      name: "Sarah K.",
                      loc: "Leicester",
                      rating: 5,
                      title: "Fixed iPad screen in 40 mins!",
                      review: "I walked in with a cracked screen. Techs were polite, verified the parts, and replaced the assembly inside 40 minutes. Truly express repair work!"
                    },
                    {
                      name: "James M.",
                      loc: "Nottingham",
                      rating: 5,
                      title: "Simple postal service",
                      review: "Prepaid postal label arrived instantly. Dispatched my HDMI broken PS5 on Monday and it was safely returned fully functional on Thursday morning. Incredible."
                    },
                    {
                      name: "Elena R.",
                      loc: "Loughborough",
                      rating: 5,
                      title: "Honest diagnostics",
                      review: "My MacBook would not charge. Fearing a motherboard issue, they inspected it and found a simple port connection fault. Charged me just £49. Very honest company."
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
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{rev.loc} · Verified Repair</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs Section */}
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
          // ─── REPAIR WIZARD BOOKING WORKFLOW ─────────────────────────────────
          <div>
            {/* Header */}
            <div className="bg-mood-violet border-b border-violet-100">
              <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-accent" />
                  </div>
                  <h1 className="font-bold text-lg">Book a Repair</h1>
                </div>
                <p className="text-zinc-500 text-sm font-medium mb-5">
                  Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}
                </p>
                <div className="h-1.5 bg-violet-200 rounded-full overflow-hidden">
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
                  key={step}
                  custom={dir}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                >

                  {/* STEP 1 – Device Type */}
                  {step === 1 && (
                    <div>
                      <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                        <ArrowLeft className="h-4 w-4" /> Back to repair center
                      </button>
                      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">What needs repairing?</h2>
                      <p className="text-zinc-400 font-medium mb-10">Select the type of device.</p>
                      <div className="grid grid-cols-2 gap-6">
                        {DEVICE_TYPES.map(d => (
                          <motion.button
                            key={d.id}
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setState(s => ({ ...s, deviceType: d.id, brand: "", model: "", issue: "" })); go(1); }}
                            className={`flex flex-col rounded-3xl border-2 border-zinc-200/60 bg-white shadow-sm hover:shadow-xl hover:border-zinc-950 transition-all group overflow-hidden w-full ${d.glow}`}
                          >
                            {/* Centered Image with custom gradient backdrop */}
                            <div className="w-full aspect-[4/3] bg-gradient-to-b from-zinc-50 to-white border-b border-zinc-100 flex items-center justify-center p-4 relative overflow-hidden">
                              <img
                                src={d.img}
                                alt={d.label}
                                className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-108"
                              />
                            </div>
                            {/* Details section */}
                            <div className="p-6 flex-1 flex flex-col justify-between text-left">
                              <div>
                                <h3 className="font-extrabold text-lg text-zinc-950 mb-1 leading-tight">{d.label}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{d.count}</p>
                              </div>
                              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-zinc-500 group-hover:text-black transition-colors">
                                Start Repair <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2 – Brand & Model */}
                  {step === 2 && (
                    <div>
                      <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">Brand &amp; model</h2>
                      <p className="text-zinc-400 font-medium mb-8">Tell us exactly what device you have.</p>

                      <div className="space-y-3 mb-8">
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

                      <div className="flex flex-col gap-2 mb-8">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Exact model</label>
                        <input
                          type="text"
                          placeholder={`E.g. ${state.deviceType === "Phone" ? "iPhone 14 Pro, Galaxy S23" : state.deviceType === "Console" ? "PS5 Digital, Xbox Series X" : "MacBook Air M2, XPS 15"}`}
                          value={state.model}
                          onChange={e => setState(s => ({ ...s, model: e.target.value }))}
                          className="h-14 rounded-[1rem] border-2 border-zinc-200 px-5 text-sm font-medium outline-none focus:border-black transition-colors"
                        />
                      </div>

                      <button
                        onClick={() => { if (state.brand && state.model) go(1); }}
                        disabled={!state.brand || !state.model}
                        className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                      >
                        Continue <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* STEP 3 – Issue */}
                  {step === 3 && (
                    <div>
                      <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">What's the problem?</h2>
                      <p className="text-zinc-400 font-medium mb-10">Select the closest description — don't worry if you're not sure.</p>
                      <div className="space-y-3 mb-6">
                        {(ISSUES[state.deviceType] ?? []).map(issue => {
                          const Icon = issue.icon;
                          return (
                            <motion.button
                              key={issue.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setState(s => ({ ...s, issue: issue.id }))}
                              className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 text-left transition-all ${
                                state.issue === issue.id ? "border-black bg-black text-white" : "border-zinc-200 hover:border-zinc-400 hover:shadow-sm"
                              }`}
                            >
                              <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${state.issue === issue.id ? "bg-white/10" : "bg-zinc-100"}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-sm">{issue.label}</p>
                                <p className={`text-xs mt-0.5 ${state.issue === issue.id ? "text-white/60" : "text-zinc-400"}`}>{issue.desc}</p>
                              </div>
                              {state.issue === issue.id && <Check className="h-5 w-5 text-accent flex-shrink-0" />}
                            </motion.button>
                          );
                        })}
                      </div>

                      {state.issue && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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

                      <button
                        onClick={() => { if (state.issue) go(1); }}
                        disabled={!state.issue}
                        className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-zinc-800 transition-colors"
                      >
                        Continue <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {/* STEP 4 – Drop-off or Mail-in */}
                  {step === 4 && (
                    <div>
                      <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">How will you get it to us?</h2>
                      <p className="text-zinc-400 font-medium mb-10">Choose the most convenient option.</p>
                      <div className="space-y-4">
                        {[
                          {
                            id: "dropoff",
                            label: "Drop off in store",
                            desc: "Bring your device to TechStop Leicester. Our technician will diagnose it and give you a quote on the spot.",
                            icon: MapPin,
                            badge: "No postage needed",
                            badgeColor: "bg-blue-100 text-blue-700",
                          },
                          {
                            id: "mail",
                            label: "Send by post",
                            desc: "We'll send you a prepaid shipping label. Pack your device and drop it at any post office.",
                            icon: Truck,
                            badge: "Free prepaid label",
                            badgeColor: "bg-emerald-100 text-emerald-700",
                          },
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

                  {/* STEP 5 – Contact */}
                  {step === 5 && (
                    <div>
                      <button onClick={back} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                        <ArrowLeft className="h-4 w-4" /> Back
                      </button>
                      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">Your contact details</h2>
                      <p className="text-zinc-400 font-medium mb-10">Our technician will reach out to confirm the booking and pricing.</p>
                      <form
                        className="space-y-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setSubmitting(true);
                          setSubmitError("");
                          try {
                            const result = await repairsApi.submit({
                              deviceType: state.deviceType,
                              brand: state.brand,
                              model: state.model,
                              issue: state.issue,
                              issueNotes: state.issueNotes,
                              fulfillment: state.fulfillment === "mail" ? "ship" : state.fulfillment,
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
                        {[
                          { key: "name", label: "Full Name", type: "text", placeholder: "E.g. Alex Turner" },
                          { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
                          { key: "phone", label: "Phone Number", type: "tel", placeholder: "+44 7700 000000" },
                          ...(state.fulfillment === "mail" ? [
                            { key: "address", label: "Collection Address", type: "text", placeholder: "Street address" },
                            { key: "postcode", label: "Postcode", type: "text", placeholder: "LE1 1AA" },
                          ] : []),
                        ].map(({ key, label, type, placeholder }) => (
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
                        ))}
                        {submitError && (
                          <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{submitError}</p>
                        )}
                        <div className="pt-4">
                          <button type="submit" disabled={submitting} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                            {submitting ? "Submitting…" : "Book Repair"} {!submitting && <ArrowRight className="h-5 w-5" />}
                          </button>
                          <p className="text-center text-[10px] text-zinc-400 font-medium mt-3">
                            No payment now — you approve the quote before any work begins.
                          </p>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* STEP 6 – Confirmation */}
                  {step === 6 && (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                        className="mx-auto h-28 w-28 bg-mood-violet rounded-[2.5rem] flex items-center justify-center mb-8 border border-violet-100"
                      >
                        <Wrench className="h-14 w-14 text-black" strokeWidth={1.5} />
                      </motion.div>
                      <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4">Booking received!</h2>
                      <p className="text-zinc-400 font-medium text-lg mb-10 max-w-sm mx-auto leading-relaxed">
                        Your repair request for <strong className="text-black">{state.brand} {state.model}</strong> is logged. Expect a call or email within <strong className="text-black">2 hours</strong>.
                      </p>

                      <div className="rounded-[2rem] bg-zinc-50 border border-zinc-100 p-8 mb-10 text-left">
                        <div className="space-y-4 text-sm">
                          {[
                            ...(submitRef ? [["Reference", submitRef]] : []),
                            ["Device", `${state.brand} ${state.model}`],
                            ["Issue", ISSUES[state.deviceType]?.find(i => i.id === state.issue)?.label ?? state.issue],
                            ["Method", state.fulfillment === "dropoff" ? "Drop-off in store" : "Post to us"],
                            ["Contact", state.contact.email],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-3 border-b border-zinc-100 last:border-0">
                              <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] self-center">{k}</span>
                              <span className="font-bold text-right max-w-[200px]">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] bg-black text-white p-6 mb-10 text-left">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="h-5 w-5 text-accent" />
                          <p className="font-bold">What happens next?</p>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">
                          Our technician will contact you to confirm the diagnosis, give you a fixed quote, and schedule the repair. You pay nothing until you approve the quote.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsWizardActive(false)}
                        className="inline-flex items-center gap-2 h-14 px-10 bg-black text-white rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-colors"
                      >
                        Back to repair center
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
