import { 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Star,
  Smartphone,
  ChevronRight
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      {/* Navigation */}
      <header className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-2xl font-bold tracking-tighter">
            MARKHOR<span className="text-zinc-400">MARKET</span>
          </a>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/shop" className="hover:text-zinc-600">Shop</a>
            <a href="/sell" className="hover:text-zinc-600">Sell</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-zinc-50 py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="font-serif text-5xl font-medium mb-6">How refurbishment works</h1>
            <p className="text-xl text-zinc-600 leading-relaxed">
              We're on a mission to make refurbished tech as reliable as new. 
              Here's how we ensure every device meets our high standards.
            </p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Expert Testing",
                text: "Every device undergoes a 25-point inspection by certified professionals.",
                icon: Smartphone
              },
              {
                step: "02",
                title: "Quality Grading",
                text: "We transparently grade each device based on its cosmetic condition.",
                icon: Star
              },
              {
                step: "03",
                title: "12-Month Warranty",
                text: "We stand by our products. If anything goes wrong, we've got you covered.",
                icon: ShieldCheck
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-8xl font-serif text-zinc-100 absolute -top-10 -left-4 -z-10">{item.step}</span>
                <item.icon className="h-10 w-10 mb-6 text-black" strokeWidth={1.5} />
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Grading System */}
        <section className="bg-black text-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="font-serif text-4xl font-medium mb-4">Our Grading System</h2>
              <p className="text-zinc-400">All devices are 100% functional, regardless of the grade.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { grade: "Excellent", condition: "Like new. No scratches on the screen. Minimal marks on the body." },
                { grade: "Very Good", condition: "Minor micro-scratches on the screen (invisible when on). Light wear on body." },
                { grade: "Fair", condition: "Visible scratches on screen and body. Perfect for those who use a case." }
              ].map((item) => (
                <div key={item.grade} className="border border-zinc-800 rounded-[2rem] p-8 hover:bg-zinc-900 transition-colors">
                  <h3 className="text-2xl font-bold mb-4 flex items-center justify-between">
                    {item.grade}
                    <ChevronRight className="h-5 w-5 text-accent" />
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">{item.condition}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
