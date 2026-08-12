import { Search, User, ShoppingCart, Heart, Shirt, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cartService } from "../../services/cart.service";
import { wishlistService } from "../../services/wishlist.service";
import { authService } from "../../services/auth.service";

export default function Header() {
  const currentUser = authService.getCurrentUser();

  // TanStack Query for Cart - counts distinct products (multiple variants/items of same product counted once)
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(),
  });

  const cartProductCount = cart?.items
    ? new Set(
        cart.items
          .map((item) => item.variant?.productId || item.variant?.product?.id)
          .filter(Boolean),
      ).size
    : 0;

  // TanStack Query for Wishlist
  const { data: wishlist } = useQuery({
    queryKey: ["wishlist", currentUser?.id],
    queryFn: () => wishlistService.getWishlistByUserId(currentUser?.id),
    enabled: !!currentUser?.id,
  });

  const wishlistCount = wishlist?.items?.length || 0;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 tracking-tight">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Shirt className="h-5 w-5" />
          </div>
          <span>StyleShop</span>
        </a>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="/products?category=top-half" className="hover:text-indigo-600 transition-colors">
            Top-Half
          </a>
          <a href="/products?category=bottom-half" className="hover:text-indigo-600 transition-colors">
            Bottom-Half
          </a>
          <a href="/products?category=accessories" className="hover:text-indigo-600 transition-colors">
            Accessories
          </a>
          <a href="/products" className="hover:text-indigo-600 transition-colors">
            All Products
          </a>
        </nav>

        {/* Search bar */}
        <div className="hidden sm:flex flex-1 max-w-xs items-center relative">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search shirts, jeans, belts..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 rounded-full border border-transparent focus:border-indigo-400 focus:bg-white focus:outline-none transition-all"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2">
          <a
            href="/wishlist"
            aria-label="Wishlist"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative"
            title="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </a>
          <a
            href="/cart"
            aria-label="Shopping Cart"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors relative"
            title="Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartProductCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartProductCount}
              </span>
            )}
          </a>
          <a
            href="/orders"
            aria-label="My Orders"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="My Orders"
          >
            <Package className="h-5 w-5" />
          </a>
          <a
            href="/account"
            aria-label="User Account"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="My Account"
          >
            <User className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}