import { useState } from "react";
import { Star, ShoppingCart, Heart, Check, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartService } from "../../../services/cart.service";
import { toast } from "sonner";
import { wishlistService } from "../../../services/wishlist.service";
import { authService } from "../../../services/auth.service";

export interface ProductItem {
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
  colors: string[];
  sizes: string[];
  isNew?: boolean;
}
export default function ProductCard({ product }: { product: ProductItem }) {
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const categoryLabel =
    product.category === "top-half"
      ? "Top-Half"
      : product.category === "bottom-half"
        ? "Bottom-Half"
        : "Accessories";

  const addToCartMutation = useMutation({
    mutationFn: (variantId: string) => cartService.addItem({ variantId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add product to cart.");
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: () =>
      wishlistService.addToWishlist({
        productId: product.id,
        variantId: product.variantId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      setIsWishlisted((prev) => !prev);
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update wishlist.");
    },
  });

  const handleAddToCart = () => {
    if (isAdmin) {
      toast.warning("Admins are not allowed to add items to cart.");
      return;
    }
    if (product.variantId) {
      addToCartMutation.mutate(product.variantId);
    }
  };

  const handleToggleWishlist = () => {
    if (isAdmin) {
      toast.warning("Admins are not allowed to add items to wishlist.");
      return;
    }
    toggleWishlistMutation.mutate();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
      <div>
        {/* Product Image */}
        <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <a href={`/products/${product.id}`} className="block w-full h-full">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </a>
          {product.isNew && (
            <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm pointer-events-none">
              NEW
            </span>
          )}
          <button
            onClick={handleToggleWishlist}
            aria-label="Wishlist"
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors shadow-sm ${isWishlisted
              ? "bg-rose-50 dark:bg-rose-950 text-red-500"
              : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-red-500"
              }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        </div>
        {/* Product Details */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded capitalize">
              {categoryLabel} • {product.subtype}
            </span>
            <div className="flex items-center text-xs text-amber-500 font-semibold gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
            </div>
          </div>
          <a href={`/products/${product.id}`} className="block">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
          </a>
          {/* Sizes & Colors preview */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Sizes: {product.sizes.slice(0, 3).join(", ")}</span>
            <span className="capitalize">{product.colors[0]}</span>
          </div>
          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Add to Cart Footer Button */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
          className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${added
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600"
            }`}
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : added ? (
            <Check className="h-4 w-4" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          {addToCartMutation.isPending ? "Adding..." : added ? "Added to Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}