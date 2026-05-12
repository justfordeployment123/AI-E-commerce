import { 
  Smartphone, 
  DollarSign, 
  ArrowRight,
  Package,
  CreditCard
} from "lucide-react";

export default function SellPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      {/* Navigation */}
      <header className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-2xl font-bold tracking-tighter">
            MARKHOR<span className="text-zinc-400">MARKET</span>
          </a>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/shop" className="hover:text-zinc-600">Shop</a>
            <a href="/how-it-works" className="hover:text-zinc-600">How it works</a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-black text-white py-24">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="font-serif text-5xl md:text-7xl font-medium mb-8">Sell your old tech. <br/><span className="text-accent italic">Get paid fast.</span></h1>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
              Trade in your smartphone, laptop, or tablet. Get an instant quote and help the planet.
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="What are you selling? (e.g. iPhone 13)"
                  className="w-full h-16 rounded-full bg-zinc-900 border border-zinc-800 px-8 text-lg focus:ring-2 focus:ring-accent outline-none"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-accent text-black rounded-full px-6 font-bold flex items-center gap-2 transition-transform hover:scale-105">
                  Get quote
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif text-center mb-16">Three simple steps</h2>
          <div className="grid gap-12 md:grid-cols-3">
            {[
              {
                title: "Answer a few questions",
                text: "Tell us about your device's model and condition to get an instant quote.",
                icon: Smartphone
              },
              {
                title: "Ship it for free",
                text: "We'll send you a prepaid shipping label. Just pack it and send it.",
                icon: Package
              },
              {
                title: "Get paid",
                text: "Once we verify the condition, you'll receive payment within 2 business days.",
                icon: CreditCard
              }
            ].map((item, index) => (
              <div key={item.title} className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 mb-6">
                  <item.icon className="h-8 w-8 text-black" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold mb-4">{index + 1}. {item.title}</h3>
                <p className="text-zinc-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-accent text-black">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-serif text-4xl font-medium mb-8">Ready to turn your old tech into cash?</h2>
            <button className="bg-black text-white rounded-full px-10 py-5 text-sm font-bold transition-transform hover:scale-105">
              Start selling now
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
