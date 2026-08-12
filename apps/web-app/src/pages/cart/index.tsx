import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import RootLayout from "../../layouts/root.layout";
import CartCardItem from "./components/cart-card-item";
import { cartService } from "../../services/cart.service";
import type { CartItem as ServerCartItem } from "../../services/types";

interface CartItemType {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  useEffect(() => {
    cartService
      .getCart()
      .then((cartData) => {
        if (cartData && cartData.items) {
          const mapped: CartItemType[] = cartData.items.map(
            (item: ServerCartItem) => ({
              id: item.id,
              productId: item.variant?.productId || item.variant?.product?.id,
              variantId: item.variantId,
              name: item.variant?.product?.name || "Apparel Item",
              category: item.variant?.product?.gender || "Clothing",
              size: item.variant?.size || "M",
              color: item.variant?.colorName || "Default Color",
              price:
                Number(
                  item.variant?.priceOverride ?? item.variant?.product?.basePrice,
                ) || 49.99,
              quantity: item.quantity,
              image:
                item.variant?.product?.images?.[0]?.imageUrl ||
                "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80",
            }),
          );
          setItems(mapped);
          // By default, select all items in cart
          setSelectedItemIds(mapped.map((i) => i.id));
        }
      })
      .catch((err) => {
        console.error("Failed to load cart:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === items.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map((i) => i.id));
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQty = Math.max(1, item.quantity + delta);

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)),
    );

    try {
      await cartService.updateItemQuantity(id, newQty);
    } catch (err) {
      console.error("Failed to update cart quantity on server:", err);
    }
  };

  const queryClient = useQueryClient();

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItemIds((prev) => prev.filter((i) => i !== id));
    try {
      await cartService.removeItem(id);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (err) {
      console.error("Failed to remove item on server:", err);
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");

    if (promoCode.trim().toUpperCase() === "STYLE10") {
      setDiscountPercent(10);
      setPromoSuccess("10% discount applied!");
    } else if (promoCode.trim().toUpperCase() === "FREESHIP") {
      setDiscountPercent(15);
      setPromoSuccess("15% special discount applied!");
    } else {
      setPromoError("Invalid code. Try 'STYLE10'");
    }
  };

  const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const discountAmount = (subtotal * discountPercent) / 100;
  const shipping = subtotal > 100 || selectedItems.length === 0 ? 0 : 7.99;
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  const freeShippingThreshold = 100;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(
    100,
    (subtotal / freeShippingThreshold) * 100,
  );

  const handleProceedToCheckout = () => {
    sessionStorage.setItem(
      "selected_cart_item_ids",
      JSON.stringify(selectedItemIds),
    );
  };

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <a
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Continue Shopping
              </a>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Your Shopping Cart
              </h1>
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {items.reduce((acc, item) => acc + item.quantity, 0)}{" "}
              {items.reduce((acc, item) => acc + item.quantity, 0) === 1
                ? "item"
                : "items"}
            </span>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto text-xs text-slate-500 shadow-sm">
              Loading cart contents...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Your Cart is Empty
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Looks like you haven't added any top-half or bottom-half clothes
                to your cart yet.
              </p>
              <a
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md"
              >
                Start Shopping Now
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <span>
                      {amountToFreeShipping > 0
                        ? `Add $${amountToFreeShipping.toFixed(2)} more for FREE Shipping!`
                        : "🎉 You unlocked FREE Shipping!"}
                    </span>
                    <span>{freeShippingProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-4 sm:px-6 py-3 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && selectedItemIds.length === items.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>Select All ({selectedItemIds.length}/{items.length} items selected)</span>
                    </label>
                    {selectedItemIds.length > 0 && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        {selectedItemIds.length} item{selectedItemIds.length === 1 ? "" : "s"} ready for checkout
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item) => (
                      <CartCardItem
                        key={item.id}
                        item={item}
                        selected={selectedItemIds.includes(item.id)}
                        onToggleSelect={toggleSelectItem}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Order Summary
                  </h2>

                  <form onSubmit={handleApplyPromo} className="mb-6">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                      Have a Promo Code? (Try "STYLE10")
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Coupon Code"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500 mt-1">{promoError}</p>
                    )}
                    {promoSuccess && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        {promoSuccess}
                      </p>
                    )}
                  </form>

                  <div className="space-y-3 text-xs sm:text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal ({selectedItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Promo Discount ({discountPercent}%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Estimated Shipping</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {shipping === 0 ? (
                          <span className="text-emerald-600 uppercase font-bold text-xs">
                            FREE
                          </span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={selectedItemIds.length > 0 ? "/checkout" : "#"}
                    onClick={(e) => {
                      if (selectedItemIds.length === 0) {
                        e.preventDefault();
                        toast.warning("Please select at least one item to proceed to payment.");
                      } else {
                        handleProceedToCheckout();
                      }
                    }}
                    className={`w-full mt-6 py-3.5 px-4 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                      selectedItemIds.length > 0
                        ? "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 cursor-pointer"
                        : "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Proceed to Checkout ({selectedItemIds.length})
                  </a>

                  <p className="text-[11px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Encrypted 256-bit Secure Checkout
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </RootLayout>
  );
}
