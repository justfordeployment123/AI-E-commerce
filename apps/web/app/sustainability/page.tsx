import { 
  Leaf, 
  Wind, 
  Droplets, 
  Recycle,
  ArrowRight
} from "lucide-react";

export default function SustainabilityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      {/* Navigation */}
      <header className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-2xl font-bold tracking-tighter">
            TECHSTOP<span className="text-zinc-400">LEICESTER</span>
          </a>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/shop" className="hover:text-zinc-600">Shop</a>
            <a href="/how-it-works" className="hover:text-zinc-600">How it works</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1600&auto=format&fit=crop" 
            className="absolute inset-0 h-full w-full object-cover"
            alt="Sustainability"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="max-w-3xl px-4 text-center text-white">
              <h1 className="font-serif text-5xl md:text-7xl font-medium mb-6 italic">Tech for the future.</h1>
              <p className="text-xl md:text-2xl text-zinc-200">
                Why buy new when you can save the planet? Refurbished is the most sustainable choice for tech.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-accent/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 md:grid-cols-3 text-center">
              {[
                { label: "CO2 Saved", value: "77kg", icon: Wind, text: "The amount of carbon emissions avoided per refurbished smartphone." },
                { label: "Raw Materials", value: "243kg", icon: Recycle, text: "Amount of raw materials saved from mining for new components." },
                { label: "Water Saved", value: "12k Liters", icon: Droplets, text: "Water usage avoided compared to manufacturing a new device." }
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-zinc-100">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 mb-6">
                    <stat.icon className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">{stat.label}</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{stat.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Quote */}
        <section className="py-32 bg-white">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <Leaf className="h-12 w-12 mx-auto mb-8 text-accent" />
            <h2 className="font-serif text-4xl md:text-5xl font-medium leading-tight mb-12">
              "Our goal is to extend the life of electronics and reduce the 50 million tons of e-waste produced every year."
            </h2>
            <a href="/shop" className="inline-flex items-center gap-3 rounded-full bg-black px-10 py-5 text-sm font-bold text-white transition-transform hover:scale-105">
              Start shopping sustainably
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
