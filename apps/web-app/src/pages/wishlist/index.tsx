import { useEffect, useState } from "react";
import { Heart, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import RootLayout from "../../layouts/root.layout";
import WishlistCard from "./components/wishlist-card";
import { authService } from "../../services/auth.service";
import { wishlistService } from "../../services/wishlist.service";
import { cartService } from "../../services/cart.service";
import type { WishlistItem as ServerWishlistItem } from "../../services/types";

interface WishlistItemUI {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  image: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItemUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    wishlistService
      .getWishlistByUserId(user.id)
      .then((wishlistData) => {
        if (wishlistData && wishlistData.items) {
          const mapped: WishlistItemUI[] = wishlistData.items.map(
            (item: ServerWishlistItem) => ({
              id: item.id,
              productId: item.productId || item.product?.id || "",
              variantId: item.variantId,
              name: item.product?.name || "Apparel Item",
              category: item.product?.gender || "Clothing",
              size: item.variant?.size || "M",
              color: item.variant?.colorName || "Default",
              price: Number(item.product?.basePrice) || 49.99,
              inStock: true,
              image:
                item.product?.images?.[0]?.imageUrl ||
                "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80",
            }),
          );
          setItems(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load wishlist:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const queryClient = useQueryClient();

  const handleRemove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await wishlistService.removeFromWishlist(id);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (err) {
      console.error("Failed to remove item from wishlist:", err);
    }
  };

  const handleAddToCart = async (item: WishlistItemUI) => {
    if (item.variantId) {
      try {
        await cartService.addItem({
          variantId: item.variantId,
          quantity: 1,
        });
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      } catch (err) {
        console.error("Failed to add wishlist item to cart:", err);
      }
    }
    setAddedMap((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [item.id]: false }));
    }, 2000);
  };

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                My Saved Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Keep track of your favorite top-half, bottom-half items and
                accessories.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {items.length} Saved {items.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto text-xs text-slate-500 shadow-sm">
              Loading saved items...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Your Wishlist is Empty
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Explore our apparel catalog to save items for later.
              </p>
              <a
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
              >
                Explore Products
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  addedToCart={addedMap[item.id]}
                  onAddToCart={handleAddToCart}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </RootLayout>
  );
}
