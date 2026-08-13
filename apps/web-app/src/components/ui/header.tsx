import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, User, ShoppingCart, Heart, Package, Loader2, X, AlertCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cartService } from "../../services/cart.service";
import { wishlistService } from "../../services/wishlist.service";
import { authService } from "../../services/auth.service";
import { catalogService } from "../../services/catalog.service";
import type { Product } from "../../services/types";

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const currentUser = authService.getCurrentUser();

  const initialSearchParam = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchParam);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearchParam);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Keep search input in sync if URL search param changes
  useEffect(() => {
    const urlQuery = searchParams.get("search") || "";
    setSearchQuery(urlQuery);
  }, [searchParams]);

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results whenever debouncedQuery changes
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let isMounted = true;
    setIsSearching(true);
    setSearchError(null);

    catalogService
      .getProducts({ search: trimmed })
      .then((data) => {
        if (isMounted) {
          setSearchResults(data || []);
          setSearchError(null);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setSearchResults([]);
          setSearchError(err.message || "Failed to search products. Please try again.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsSearching(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Handle clicking outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSubmitSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setIsOpen(false);
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setIsOpen(false);
    navigate(`/products/${productId}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setSearchResults([]);
    setSearchError(null);
  };

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
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-white tracking-tight">
          <img src="/favicon.svg" alt="StyleShop Logo" className="h-9 w-9 rounded-xl shadow-sm" />
          <span>StyleShop</span>
        </a>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="/products?category=top-half" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Top-Half
          </a>
          <a href="/products?category=bottom-half" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Bottom-Half
          </a>
          <a href="/products?category=accessories" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Accessories
          </a>
          <a href="/products" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            All Products
          </a>
        </nav>

        {/* Search bar */}
        <div ref={searchContainerRef} className="hidden sm:flex flex-1 max-w-sm items-center relative">
          <form onSubmit={handleSubmitSearch} className="w-full relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search shirts, jeans, belts..."
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-full border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 h-4 w-4 text-indigo-600 animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </form>

          {/* Search Dropdown Popup */}
          {isOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
              {isSearching ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Searching products...</span>
                </div>
              ) : searchError ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No products found
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    No items match "{searchQuery.trim()}". Try checking for spelling errors or searching another keyword.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Search Results ({searchResults.length})
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {searchResults.slice(0, 5).map((product) => {
                      const image =
                        product.images?.[0]?.imageUrl ||
                        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=80";
                      const categoryName = product.categories?.[0]?.name || product.gender || "Apparel";
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product.id)}
                          className="w-full p-3 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                        >
                          <img
                            src={image}
                            alt={product.name}
                            className="h-10 w-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {product.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {categoryName} {product.brand?.name ? `• ${product.brand.name}` : ""}
                            </p>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            ${Number(product.basePrice || 0).toFixed(2)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitSearch}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-between border-t border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    <span>View all results for "{searchQuery.trim()}"</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2">
          <a
            href="/wishlist"
            aria-label="Wishlist"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
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
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
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
            href="/account?tab=orders"
            aria-label="My Orders"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="My Orders"
          >
            <Package className="h-5 w-5" />
          </a>
          <a
            href="/account"
            aria-label="User Account"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="My Account"
          >
            <User className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  );
}