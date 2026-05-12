import Image from "next/image";
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Headphones, 
  Gamepad2, 
  Speaker, 
  Watch, 
  Camera,
  Search,
  ShoppingCart,
  User,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Mail,
  Star,
  Zap,
  Leaf
} from "lucide-react";

export default function Home() {
  const categories = [
    { name: "Smartphones", icon: Smartphone },
    { name: "Laptops", icon: Laptop },
    { name: "Tablets", icon: Tablet },
    { name: "Headphones", icon: Headphones },
    { name: "Gaming", icon: Gamepad2 },
    { name: "Audio", icon: Speaker },
    { name: "Watches", icon: Watch },
    { name: "Cameras", icon: Camera },
  ];

  const featuredProducts = [
    {
      title: "iPhone 14 Pro",
      grade: "Excellent condition",
      storage: "256 GB",
      price: "$679.00",
      oldPrice: "$1,099.00",
      rating: 4.8,
      reviews: 1240,
      image: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=300&h=300&auto=format&fit=crop",
    },
    {
      title: "MacBook Air M2",
      grade: "Very good",
      storage: "16 GB / 512 GB",
      price: "$899.00",
      oldPrice: "$1,499.00",
      rating: 4.9,
      reviews: 856,
      image: "https://images.unsplash.com/photo-1661961111184-11317b40adb2?q=80&w=300&h=300&auto=format&fit=crop",
    },
    {
      title: "Samsung Galaxy S23",
      grade: "Excellent condition",
      storage: "128 GB",
      price: "$469.00",
      oldPrice: "$859.00",
      rating: 4.7,
      reviews: 420,
      image: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=300&h=300&auto=format&fit=crop",
    },
    {
      title: "PlayStation 5",
      grade: "Good condition",
      storage: "825 GB",
      price: "$399.00",
      oldPrice: "$629.00",
      rating: 4.8,
      reviews: 2100,
      image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=300&h=300&auto=format&fit=crop",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black font-sans">
      {/* Top Banner */}
      <div className="bg-black py-2 text-center text-xs font-medium text-white flex items-center justify-center gap-2">
        <Zap className="h-3 w-3 text-accent fill-accent" />
        Free 12-month warranty on every device. Better for your wallet, better for the planet.
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold tracking-tighter">
              MARKHOR<span className="text-zinc-400">MARKET</span>
            </a>
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for an iPhone, a MacBook..."
                  className="h-10 w-[400px] rounded-full bg-zinc-100 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-black/5 focus:bg-white border border-transparent focus:border-zinc-200"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="#" className="hover:text-zinc-600">Sell</a>
            <a href="#" className="hover:text-zinc-600">Help</a>
            <a href="#" className="flex items-center gap-2 hover:text-zinc-600">
              <User className="h-4 w-4" />
              Log in
            </a>
            <a href="#" className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black">
                0
              </span>
            </a>
          </nav>
        </div>
      </header>

      {/* Category Rail */}
      <div className="border-b border-zinc-100 overflow-x-auto scrollbar-hide">
        <div className="mx-auto flex max-w-7xl gap-8 px-4 py-4 sm:px-6 lg:px-8">
          {categories.map((cat) => (
            <a key={cat.name} href="#" className="flex flex-shrink-0 flex-col items-center gap-2 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 text-xl transition-all group-hover:scale-110 group-hover:bg-accent/20">
                <cat.icon className="h-5 w-5 text-zinc-600 group-hover:text-black" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-black">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-950 text-white">
            <div className="absolute inset-0 opacity-60">
              <Image 
                src="/hero.png" 
                alt="Refurbished technology" 
                fill 
                className="object-cover"
                priority
              />
            </div>
            <div className="relative z-10 flex flex-col items-start justify-center p-8 md:p-16 lg:w-1/2">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-black">
                <Zap className="h-3 w-3 fill-black" />
                Up to 70% off
              </div>
              <h1 className="font-serif text-5xl font-medium leading-[1.1] md:text-7xl">
                Tech that’s <i>better</i> for your wallet.
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-zinc-300">
                Top-quality refurbished devices, tested and certified by experts. 
                With 12-month warranty and 30-day returns.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#" className="rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
                  Shop the sale
                </a>
                <a href="#" className="rounded-full border border-white/30 bg-black/20 px-8 py-4 text-sm font-bold backdrop-blur-md transition-transform hover:scale-105 active:scale-95">
                  How it works
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust signals */}
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { title: "12-month warranty", text: "Every device is covered for a full year.", icon: ShieldCheck },
            { title: "30-day returns", text: "Not satisfied? Send it back for free.", icon: RefreshCw },
            { title: "Expert certification", text: "25+ quality checks by professionals.", icon: CheckCircle2 },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-6">
              <item.icon className="h-8 w-8 text-black" strokeWidth={1.5} />
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-zinc-600">{item.text}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Trending Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-medium md:text-4xl">Trending deals</h2>
              <p className="mt-2 text-zinc-600">The most popular picks from our verified sellers.</p>
            </div>
            <a href="#" className="font-bold underline decoration-accent decoration-4 underline-offset-8 flex items-center gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <article key={product.title} className="group cursor-pointer">
                <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-zinc-50 p-6 transition-all group-hover:bg-zinc-100">
                  <div className="absolute top-4 left-4 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {product.grade}
                  </div>
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="mt-4 space-y-1">
                  <h3 className="font-bold">{product.title}</h3>
                  <p className="text-xs text-zinc-500">{product.storage}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="text-xs font-bold">{product.rating}</span>
                    <span className="text-xs text-zinc-400">({product.reviews})</span>
                  </div>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-xl font-bold">{product.price}</span>
                    <span className="text-sm text-zinc-400 line-through">{product.oldPrice}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-accent/10 py-20 mt-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-serif text-4xl font-medium leading-tight md:text-5xl">
                  Saving the planet, <i>one phone</i> at a time.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-700">
                  Refurbished isn't just about the price. It's about reducing electronic waste. 
                  Choosing a refurbished smartphone saves 77kg of CO2 and 243kg of raw materials.
                </p>
                <div className="mt-10">
                  <a href="#" className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-bold text-white transition-transform hover:scale-105">
                    Our sustainability mission
                    <Leaf className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-[2.5rem]">
                <img 
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop" 
                  alt="Nature sustainability"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="col-span-2">
              <a href="/" className="text-2xl font-bold tracking-tighter">
                MARKHOR<span className="text-zinc-400">MARKET</span>
              </a>
              <p className="mt-6 max-w-sm text-zinc-600 text-sm">
                Join our newsletter for the latest tech deals, sustainability tips, and exclusive offers.
              </p>
              <div className="mt-6 flex max-w-sm gap-2">
                <div className="relative flex-1">
                  <input
                    type="email"
                    placeholder="Your email"
                    className="h-12 w-full rounded-2xl bg-zinc-100 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
                <button className="rounded-2xl bg-black px-6 text-sm font-bold text-white transition-transform hover:scale-105">Join</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold">Shop</h4>
              <ul className="mt-6 space-y-4 text-sm text-zinc-600 font-medium">
                <li><a href="#" className="hover:text-black">Smartphones</a></li>
                <li><a href="#" className="hover:text-black">Laptops</a></li>
                <li><a href="#" className="hover:text-black">Tablets</a></li>
                <li><a href="#" className="hover:text-black">Cameras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold">About</h4>
              <ul className="mt-6 space-y-4 text-sm text-zinc-600 font-medium">
                <li><a href="#" className="hover:text-black">Our story</a></li>
                <li><a href="#" className="hover:text-black">Quality grading</a></li>
                <li><a href="#" className="hover:text-black">Sustainability</a></li>
                <li><a href="#" className="hover:text-black">Sitemap</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-zinc-100 pt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 font-bold tracking-widest uppercase">
            <p>© 2026 Markhor Market. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black">Privacy Policy</a>
              <a href="#" className="hover:text-black">Terms of Service</a>
              <a href="#" className="hover:text-black">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


