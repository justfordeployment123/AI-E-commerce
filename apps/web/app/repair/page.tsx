"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Tablet, Gamepad2, Laptop, ArrowLeft, ArrowRight,
  Check, MapPin, Truck, Wrench, Clock, Shield, CheckCircle2,
  Monitor, Zap, Battery, Wifi, HardDrive, CircleAlert
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const DEVICE_TYPES = [
  { id: "Phone", label: "Phone", icon: Smartphone, mood: "bg-mood-sky" },
  { id: "Tablet", label: "Tablet", icon: Tablet, mood: "bg-mood-rose" },
  { id: "Console", label: "Console", icon: Gamepad2, mood: "bg-mood-violet" },
  { id: "Laptop", label: "Laptop / MacBook", icon: Laptop, mood: "bg-mood-amber" },
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
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<RepairState>({
    deviceType: "", brand: "", model: "", issue: "", issueNotes: "",
    fulfillment: "",
    contact: { name: "", email: "", phone: "", address: "", postcode: "" },
  });

  const go = (n: number) => { setDir(n > 0 ? 1 : -1); setStep(s => s + n); };

  const TOTAL_STEPS = 6;
  const progress = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
  const stepLabels = ["Device", "Brand & Model", "Issue", "Delivery", "Contact", "Done"];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      <Navbar />

      <main className="flex-1">
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
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">What needs repairing?</h2>
                  <p className="text-zinc-400 font-medium mb-10">Select the type of device.</p>
                  <div className="grid grid-cols-2 gap-4">
                    {DEVICE_TYPES.map(d => (
                      <motion.button
                        key={d.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setState(s => ({ ...s, deviceType: d.id, brand: "", model: "", issue: "" })); go(1); }}
                        className={`aspect-square rounded-[2rem] ${d.mood} flex flex-col items-start justify-between p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}
                      >
                        <div className="h-14 w-14 bg-white/60 rounded-2xl flex items-center justify-center">
                          <d.icon className="h-7 w-7 text-black/70" strokeWidth={1.5} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-base">{d.label}</p>
                          <ArrowRight className="h-4 w-4 text-black/40 mt-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 – Brand & Model */}
              {step === 2 && (
                <div>
                  <button onClick={() => go(-1)} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
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
                  <button onClick={() => go(-1)} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
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
                  <button onClick={() => go(-1)} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
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
                  <button onClick={() => go(-1)} className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-black transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="font-serif text-4xl md:text-5xl font-medium mb-3">Your contact details</h2>
                  <p className="text-zinc-400 font-medium mb-10">Our technician will reach out to confirm the booking and pricing.</p>
                  <form
                    className="space-y-4"
                    onSubmit={e => { e.preventDefault(); go(1); }}
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
                    <div className="pt-4">
                      <button type="submit" className="w-full h-16 bg-black text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
                        Book Repair <ArrowRight className="h-5 w-5" />
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

                  <a href="/" className="inline-flex items-center gap-2 h-14 px-10 bg-black text-white rounded-[1.5rem] font-bold text-sm hover:bg-zinc-800 transition-colors">
                    Back to Home
                  </a>
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
