import { ArrowRight, Sparkles, ShoppingBag } from "lucide-react";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-16 lg:py-24">
      {/* Decorative gradient glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              New Season Apparel Collection
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Style Your Fit <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                Top to Bottom
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal">
              Explore curated top-half shirts & polos, bottom-half denim & trousers, plus signature accessories designed for effortless everyday confidence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#categories"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4" />
                Shop Categories
              </a>
              <a
                href="#featured"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                Browse New Arrivals
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </a>
            </div>

            {/* Sub Stats / Highlights */}
            <div className="pt-8 border-t border-slate-800 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-400">Premium Cotton</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-slate-400">Apparel Styles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">4.9★</p>
                <p className="text-xs text-slate-400">Customer Rating</p>
              </div>
            </div>
          </div>

          {/* Hero Featured Card Image Grid */}
          <div className="lg:col-span-5 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group">
                  <img
                    src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80"
                    alt="Top-Half Shirt"
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-white bg-indigo-600/80 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      Tops Collection
                    </span>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group">
                  <img
                    src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80"
                    alt="Bottom-Half Jeans"
                    className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-white bg-purple-600/80 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      Bottoms Collection
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group">
                  <img
                    src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80"
                    alt="Polo Shirt"
                    className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-white bg-indigo-600/80 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      Polo Shirts
                    </span>
                  </div>
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group">
                  <img
                    src="https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80"
                    alt="Accessories"
                    className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-semibold text-white bg-emerald-600/80 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      Accessories
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}