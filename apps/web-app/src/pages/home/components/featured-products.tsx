import { useEffect, useState } from "react";
import { Star, ShoppingCart, Heart, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogService } from "../../../services/catalog.service";
import { cartService } from "../../../services/cart.service";
import { wishlistService } from "../../../services/wishlist.service";
import { authService } from "../../../services/auth.service";
import type { Product as ServerProduct } from "../../../services/types";

import { toast } from "sonner";

interface ProductUI {
  id: string;
  variantId?: string;
  name: string;
  category: string;
  subtype: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  tag?: string;
}

export default function FeaturedProducts() {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [wishlistMap, setWishlistMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    catalogService
      .getProducts()
      .then((serverProducts: ServerProduct[]) => {
        if (serverProducts) {
          const mapped: ProductUI[] = serverProducts.slice(0, 4).map((p, idx) => ({
            id: p.id,
            variantId: p.variants?.[0]?.id,
            name: p.name,
            category: (p.gender || "top-half").toLowerCase(),
            subtype: p.categories?.[0]?.name || "Clothing",
            price: Number(p.basePrice) || 49.99,
            originalPrice: idx % 2 === 0 ? Number(p.basePrice) + 15 : undefined,
            rating: 4.8,
            reviewsCount: 20 + idx * 5,
            image:
              p.images?.[0]?.imageUrl ||
              "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=80",
            tag: idx === 0 ? "Bestseller" : idx === 1 ? "New Arrival" : undefined,
          }));
          setProducts(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load featured products:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const addToCartMutation = useMutation({
    mutationFn: (variantId: string) => cartService.addItem({ variantId, quantity: 1 }),
    onSuccess: (_, variantId) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      const prod = products.find((p) => p.variantId === variantId);
      if (prod) {
        setAddedItems((prev) => ({ ...prev, [prod.id]: true }));
        setTimeout(() => {
          setAddedItems((prev) => ({ ...prev, [prod.id]: false }));
        }, 2000);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add item to cart.");
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId?: string }) =>
      wishlistService.addToWishlist({ productId, variantId }),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      setWishlistMap((prev) => ({ ...prev, [productId]: !prev[productId] }));
      toast.success("Updated wishlist");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add to wishlist.");
    },
  });

  const filteredProducts = products.filter((p) => {
    if (selectedFilter === "All") return true;
    return (
      p.category.toLowerCase().includes(selectedFilter.toLowerCase()) ||
      p.subtype.toLowerCase().includes(selectedFilter.toLowerCase())
    );
  });

  const handleAddToCart = (prod: ProductUI) => {
    if (isAdmin) {
      toast.warning("Admins are not allowed to add items to cart.");
      return;
    }
    if (prod.variantId) {
      addToCartMutation.mutate(prod.variantId);
    }
  };

  const handleToggleWishlist = (prod: ProductUI) => {
    if (isAdmin) {
      toast.warning("Admins are not allowed to add items to wishlist.");
      return;
    }
    toggleWishlistMutation.mutate({
      productId: prod.id,
      variantId: prod.variantId,
    });
  };

  return (
    <section id="featured" className="py-16 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Handpicked tops, bottoms, and accessories for your weekly style rotation.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {["All Items", "Top-Half", "Bottom-Half", "Accessories"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedFilter === filter
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading featured products...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {prod.tag && (
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                      {prod.tag}
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleWishlist(prod)}
                    aria-label="Add to wishlist"
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm ${
                      wishlistMap[prod.id]
                        ? "bg-rose-50 dark:bg-rose-950 text-red-500"
                        : "bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-red-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${wishlistMap[prod.id] ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                      {prod.category} • {prod.subtype}
                    </span>
                    <div className="flex items-center text-xs text-amber-500 font-semibold gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span>{prod.rating}</span>
                      <span className="text-slate-400 font-normal">
                        ({prod.reviewsCount})
                      </span>
                    </div>
                  </div>

                  <a href={`/products`}>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base mt-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {prod.name}
                    </h3>
                  </a>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      ${prod.price.toFixed(2)}
                    </span>
                    {prod.originalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        ${prod.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0">
                <button
                  onClick={() => handleAddToCart(prod)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    addedItems[prod.id]
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 hover:bg-indigo-600 text-white"
                  }`}
                >
                  {addedItems[prod.id] ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
