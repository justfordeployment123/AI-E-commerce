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
  Star,
  ChevronDown,
  Filter
} from "lucide-react";

export default function ShopPage() {
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

  const products = [
    {
      title: "iPhone 14 Pro",
      grade: "Excellent",
      storage: "256 GB",
      price: "$679.00",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1678652197831-2d180705cd2c?q=80&w=300&h=300&auto=format&fit=crop",
    },
    {
      title: "MacBook Air M2",
      grade: "Very good",
      storage: "16 GB / 512 GB",
      price: "$899.00",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1661961111184-11317b40adb2?q=80&w=300&h=300&auto=format&fit=crop",
    },
    {
      title: "Samsung Galaxy S23",
      grade: "Excellent",
      storage: "128 GB",
      price: "$469.00",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=300&h=300&auto=format&fit=crop",
    },
    {
      title: "PlayStation 5",
      grade: "Good",
      storage: "825 GB",
      price: "$399.00",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=500&auto=format&fit=crop",
    },
    {
      title: "iPad Air 5",
      grade: "Excellent",
      storage: "64 GB",
      price: "$429.00",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1544244015-c24b59b8102e?q=80&w=500&auto=format&fit=crop",
    },
    {
      title: "AirPods Max",
      grade: "Excellent",
      storage: "N/A",
      price: "$379.00",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=300&h=300&auto=format&fit=crop",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      {/* Navigation */}
      <header className="border-b border-zinc-100 bg-white sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <a href="/" className="text-2xl font-bold tracking-tighter">
              TECHSTOP<span className="text-zinc-400">LEICESTER</span>
            </a>
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="h-10 w-[300px] rounded-full bg-zinc-100 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <a href="/login" className="flex items-center gap-2 hover:text-zinc-600">
              <User className="h-4 w-4" />
              Log in
            </a>
            <a href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100">
              <ShoppingCart className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div>
              <h3 className="font-bold mb-4">Categories</h3>
              <ul className="space-y-3">
                {categories.map((cat) => (
                  <li key={cat.name}>
                    <a href="#" className="flex items-center gap-3 text-sm text-zinc-600 hover:text-black font-medium">
                      <cat.icon className="h-4 w-4" />
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Condition</h3>
              <ul className="space-y-3">
                {["Fair", "Good", "Very Good", "Excellent"].map((grade) => (
                  <li key={grade}>
                    <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer hover:text-black">
                      <input type="checkbox" className="rounded border-zinc-300 text-black focus:ring-black" />
                      {grade}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold">All Products</h1>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-sm font-bold border border-zinc-200 rounded-lg px-4 py-2 hover:bg-zinc-50">
                  <Filter className="h-4 w-4" />
                  Sort by: Newest
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
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
                    </div>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xl font-bold">{product.price}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
