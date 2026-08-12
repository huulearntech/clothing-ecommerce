
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="text-xl font-bold text-white tracking-tight">STYLESHOP</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Elevate your everyday wardrobe with top-half apparel, bottom-half essentials, and curated accessories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#top-half" className="hover:text-white transition-colors">Top-Half (Shirts & Polos)</a></li>
              <li><a href="#bottom-half" className="hover:text-white transition-colors">Bottom-Half (Jeans & Shorts)</a></li>
              <li><a href="#accessories" className="hover:text-white transition-colors">Accessories & Belts</a></li>
              <li><a href="#featured" className="hover:text-white transition-colors">New Arrivals</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Exchange</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ & Support</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4">Stay Connected</h4>
            <p className="text-xs text-slate-400 mb-3">Subscribe to get special offers & updates.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 text-sm rounded-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-md transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} StyleShop Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
