import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Ruler,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import RootLayout from "../../layouts/root.layout";
import SizeChartModal from "./components/size-chart-modal";
import { catalogService } from "../../services/catalog.service";
import { cartService } from "../../services/cart.service";
import { wishlistService } from "../../services/wishlist.service";
import { authService } from "../../services/auth.service";
import type { Product as ServerProduct } from "../../services/types";
import { cn } from "@/lib/utils";

const DEFAULT_DETAILS = [
  "100% Organic Oxford Cotton",
  "Button-down collar & chest pocket",
  "Pre-shrunk fabric for lasting shape",
  "Machine wash cold, tumble dry low",
];

export default function ProductDetailPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const productIdQuery = params.id || searchParams.get("id");

  const [product, setProduct] = useState<{
    id: string;
    variantId?: string;
    name: string;
    category: string;
    subtype: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewsCount: number;
    stockQty: number;
    description: string;
    colors: { name: string; hex: string }[];
    sizes: string[];
    variants: Array<{
      id: string;
      size: string;
      colorName: string;
      colorHex?: string;
      priceOverride?: number;
      stockQuantity: number;
    }>;
    images: string[];
    details: string[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("White");
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToWishlist, setAddedToWishlist] = useState(false);

  useEffect(() => {
    const mapProduct = (target: ServerProduct) => {
      const variantsList = (target.variants || []).map((v) => ({
        id: v.id,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex || "#FFFFFF",
        priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
        stockQuantity: v.stockQuantity ?? 0,
      }));

      setProduct({
        id: target.id,
        variantId: target.variants?.[0]?.id,
        name: target.name,
        category: (target.gender || "top-half").toLowerCase(),
        subtype: target.categories?.[0]?.name || "Clothing",
        price: Number(target.basePrice) || 49.99,
        originalPrice: Number(target.basePrice) ? Number(target.basePrice) + 15 : undefined,
        rating: 4.8,
        reviewsCount: 124,
        stockQty: target.variants?.[0]?.stockQuantity || 14,
        description: target.description || "High quality apparel crafted with premium materials.",
        colors: variantsList
          .filter((v, idx, self) => idx === self.findIndex((t) => t.colorName === v.colorName))
          .map((v) => ({
            name: v.colorName,
            hex: v.colorHex || "#FFFFFF",
          })),
        sizes: Array.from(
          new Set(variantsList.map((v) => v.size).filter(Boolean))
        ),
        variants: variantsList,
        images: target.images?.map((i) => i.imageUrl) || [
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        ],
        details: DEFAULT_DETAILS,
      });

      if (target.variants?.[0]?.colorName) {
        setSelectedColor(target.variants[0].colorName);
      }
      if (target.variants?.[0]?.size) {
        setSelectedSize(target.variants[0].size);
      }
    };

    setLoading(true);
    if (productIdQuery) {
      catalogService
        .getProductById(productIdQuery)
        .then((p) => {
          if (p) mapProduct(p);
        })
        .catch((err) => {
          console.error("Failed to load product by ID:", err);
        })
        .finally(() => setLoading(false));
    } else {
      catalogService
        .getProducts()
        .then((products: ServerProduct[]) => {
          if (products && products.length > 0) {
            mapProduct(products[0]);
          }
        })
        .catch((err) => {
          console.error("Failed to load products:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [productIdQuery]);

  // Active variant matching currently selected color and size
  const activeVariant = product?.variants.find(
    (v) => v.colorName === selectedColor && v.size === selectedSize
  );

  const activePrice = activeVariant?.priceOverride ?? product?.price ?? 49.99;
  const activeStock = activeVariant?.stockQuantity ?? 0;
  const isOutOfStock = !activeVariant || activeStock <= 0;

  // Auto-select a valid size when switching color if current size is invalid/out-of-stock
  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    if (!product) return;
    const availableVariantForColor = product.variants.find(
      (v) => v.colorName === colorName && v.size === selectedSize && v.stockQuantity > 0
    ) || product.variants.find(
      (v) => v.colorName === colorName && v.stockQuantity > 0
    ) || product.variants.find(
      (v) => v.colorName === colorName
    );
    if (availableVariantForColor) {
      setSelectedSize(availableVariantForColor.size);
    }
  };

  // Auto-select a valid color when switching size if current color is invalid/out-of-stock
  const handleSelectSize = (sizeName: string) => {
    setSelectedSize(sizeName);
    if (!product) return;
    const availableVariantForSize = product.variants.find(
      (v) => v.size === sizeName && v.colorName === selectedColor && v.stockQuantity > 0
    ) || product.variants.find(
      (v) => v.size === sizeName && v.stockQuantity > 0
    ) || product.variants.find(
      (v) => v.size === sizeName
    );
    if (availableVariantForSize) {
      setSelectedColor(availableVariantForSize.colorName);
    }
  };

  const queryClient = useQueryClient();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  const addToCartMutation = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      cartService.addItem({ variantId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add product to cart.");
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId?: string }) =>
      wishlistService.addToWishlist({ productId, variantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      setAddedToWishlist((prev) => !prev);
      toast.success(addedToWishlist ? "Removed from wishlist" : "Added to wishlist");
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
    const targetVariantId = activeVariant?.id || product?.variantId;
    if (targetVariantId && !isOutOfStock) {
      addToCartMutation.mutate({ variantId: targetVariantId, quantity });
    }
  };

  const handleToggleWishlist = () => {
    if (isAdmin) {
      toast.warning("Admins are not allowed to add items to wishlist.");
      return;
    }
    if (!product) return;
    toggleWishlistMutation.mutate({
      productId: product.id,
      variantId: activeVariant?.id || product.variantId,
    });
  };

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading product details...</div>
          ) : !product ? (
            <div className="p-12 text-center text-xs text-slate-500">Product not found.</div>
          ) : (
            <>
              <nav className="flex text-xs text-slate-500 dark:text-slate-400 gap-2 mb-8">
                <a href="/" className="hover:underline">
                  Home
                </a>
                <span>/</span>
                <a
                  href={`/products?category=${product.category}`}
                  className="hover:underline capitalize"
                >
                  {product.category}
                </a>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {product.name}
                </span>
              </nav>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 lg:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-4">
                  <div className="relative h-[24rem] sm:h-[30rem] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                    <img
                      src={product.images[selectedImageIndex] || product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    <span className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                      {product.category} • {product.subtype}
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${selectedImageIndex === idx
                          ? "border-indigo-600 shadow-md scale-95"
                          : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {product.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {product.rating}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({product.reviewsCount} customer reviews)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-y border-slate-100 dark:border-slate-800 py-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        ${activePrice.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-base text-slate-400 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                      {product.originalPrice && activePrice < product.originalPrice && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          Save ${(product.originalPrice - activePrice).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                      activeStock > 0
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${activeStock > 0 ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {activeStock > 0 ? `In Stock (${activeStock} left)` : "Out of Stock"}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {product.description}
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Select Color:{" "}
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {selectedColor}
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      {product.colors.map((col) => {
                        const variantForColor = product.variants.find(
                          (v) => v.colorName === col.name && v.size === selectedSize
                        );
                        const isColorInStockForSize = variantForColor && variantForColor.stockQuantity > 0;
                        const doesColorExistForSize = !!variantForColor;
                        const isDisabled = !doesColorExistForSize || !isColorInStockForSize;

                        return (
                          <button
                            key={col.name}
                            onClick={() => handleSelectColor(col.name)}
                            className={cn(
                              "relative h-9 w-9 rounded-full border-2 transition-all flex items-center justify-center",
                              selectedColor === col.name
                                ? "border-indigo-600 ring-2 ring-indigo-600/30 scale-110"
                                : "border-slate-300 dark:border-slate-600 hover:scale-105",
                              isDisabled && "opacity-40 cursor-not-allowed hover:scale-100"
                            )}
                            style={{ backgroundColor: col.hex }}
                            title={
                              !doesColorExistForSize
                                ? `${col.name} (Unavailable in size ${selectedSize})`
                                : !isColorInStockForSize
                                ? `${col.name} (Out of stock in size ${selectedSize})`
                                : col.name
                            }
                          >
                            {selectedColor === col.name && (
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  col.name === "White"
                                    ? "text-slate-900"
                                    : "text-white"
                                )}
                              />
                            )}
                            {isDisabled && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="w-full h-0.5 bg-red-500 rotate-45 rounded-full" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Select Size:{" "}
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {selectedSize}
                        </span>
                      </label>
                      <button
                        onClick={() => setIsSizeChartOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        Size Chart & Guide
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {product.sizes.map((sz) => {
                        const variantForSize = product.variants.find(
                          (v) => v.size === sz && v.colorName === selectedColor
                        );
                        const isSizeInStockForColor = variantForSize && variantForSize.stockQuantity > 0;
                        const doesSizeExistForColor = !!variantForSize;
                        const isDisabled = !doesSizeExistForColor || !isSizeInStockForColor;

                        return (
                          <button
                            key={sz}
                            onClick={() => handleSelectSize(sz)}
                            title={
                              !doesSizeExistForColor
                                ? `Size ${sz} unavailable in ${selectedColor}`
                                : !isSizeInStockForColor
                                ? `Size ${sz} out of stock in ${selectedColor}`
                                : `Size ${sz}`
                            }
                            className={cn(
                              "relative h-11 min-w-[2.75rem] px-3 rounded-xl text-xs font-bold transition-all border",
                              selectedSize === sz
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100",
                              isDisabled && "opacity-40 cursor-not-allowed line-through hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 h-12">
                        <button
                          disabled={isOutOfStock}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-3.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 h-full disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="px-4 text-sm font-bold text-slate-900 dark:text-white min-w-[2.5rem] text-center">
                          {quantity}
                        </span>
                        <button
                          disabled={isOutOfStock}
                          onClick={() =>
                            setQuantity((q) => Math.min(activeStock || 1, q + 1))
                          }
                          className="px-3.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 h-full disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                          isOutOfStock
                            ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                            : addedToCart
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isOutOfStock ? "Out of Stock" : addedToCart ? "Added to Cart!" : "Add to Cart"}
                      </button>

                      <button
                        onClick={handleToggleWishlist}
                        aria-label="Wishlist"
                        className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-colors ${addedToWishlist
                          ? "border-red-200 bg-rose-50 text-red-500 dark:bg-rose-950/60 dark:border-rose-900"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                      >
                        <Heart className={`h-5 w-5 ${addedToWishlist ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-indigo-600" />
                      <span>Fast Delivery</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4 text-indigo-600" />
                      <span>30-Day Returns</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-indigo-600" />
                      <span>Authentic Quality</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {product && (
          <SizeChartModal
            isOpen={isSizeChartOpen}
            onClose={() => setIsSizeChartOpen(false)}
            category={product.category}
          />
        )}
      </main>
    </RootLayout>
  );
}