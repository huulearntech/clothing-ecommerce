import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Building,
  Ticket,
  Tag,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import RootLayout from "../../layouts/root.layout";
import { authService } from "../../services/auth.service";
import { cartService } from "../../services/cart.service";
import { ordersService } from "../../services/orders.service";
import { usersService } from "../../services/users.service";
import { vouchersService } from "../../services/vouchers.service";
import { shippingService } from "../../services/shipping.service";
import type { CartItem as ServerCartItem, Order, Voucher, ShippingRateResponse, OrderSummaryResponse } from "../../services/types";
import { DiscountType } from "../../services/types";
import VoucherSelectorModal from "./components/voucher-selector-modal";
import { usePageTitle } from "../../hooks/usePageTitle";

interface OrderItemUI {
  id: string;
  variantId?: string;
  name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CheckoutPage() {
  usePageTitle(
    "Checkout & Secure Order",
    "Complete your purchase securely at StyleShop with flexible shipping and discount options."
  );

  const navigate = useNavigate();
  const [isGuest, setIsGuest] = useState(true);
  const [selectedShippingCode, setSelectedShippingCode] = useState<string>("STD_GROUND");
  const [shippingRates, setShippingRates] = useState<ShippingRateResponse[]>([]);
  const [isLoadingShippingRates, setIsLoadingShippingRates] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemUI[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  // Server-Authoritative Order Summary State
  const [orderSummary, setOrderSummary] = useState<OrderSummaryResponse | null>(null);
  const [isCalculatingSummary, setIsCalculatingSummary] = useState(false);

  // Voucher Selection State
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherInputCode, setVoucherInputCode] = useState("");
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    cardNumber: "•••• •••• •••• 4242",
    cardExp: "12/28",
    cardCvc: "123",
  });

  useEffect(() => {
    const selectedIdsRaw = sessionStorage.getItem("selected_cart_item_ids");
    let selectedIds: string[] | null = null;
    if (selectedIdsRaw) {
      try {
        selectedIds = JSON.parse(selectedIdsRaw);
      } catch {
        selectedIds = null;
      }
    }

    const savedVoucherRaw = sessionStorage.getItem("cart_applied_voucher");
    if (savedVoucherRaw) {
      try {
        const savedVoucher: Voucher = JSON.parse(savedVoucherRaw);
        setAppliedVoucher(savedVoucher);
        setVoucherInputCode(savedVoucher.code);
      } catch {
        // Ignore parse error
      }
    }

    cartService
      .getCart()
      .then((cartData) => {
        if (cartData && cartData.items && cartData.items.length > 0) {
          const filteredItems = selectedIds
            ? cartData.items.filter((item: ServerCartItem) => selectedIds!.includes(item.id))
            : cartData.items;

          if (filteredItems.length === 0) {
            navigate("/cart", { replace: true });
            return;
          }

          const mapped: OrderItemUI[] = filteredItems.map(
            (item: ServerCartItem) => ({
              id: item.id,
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
          setOrderItems(mapped);
          setIsLoadingCart(false);
        } else {
          // Empty cart: redirect to cart page immediately
          navigate("/cart", { replace: true });
        }
      })
      .catch((err) => {
        console.error("Failed to load cart items for checkout:", err);
        navigate("/cart", { replace: true });
      });

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setIsGuest(false);
      if (currentUser.id) {
        usersService
          .getUserById(currentUser.id)
          .then((userData) => {
            if (userData) {
              const primaryAddr = userData.addresses?.[0];
              setFormData((prev) => ({
                ...prev,
                email: userData.email || currentUser.email || "",
                firstName: userData.firstName || currentUser.firstName || "",
                lastName: userData.lastName || currentUser.lastName || "",
                phone: userData.phone || "",
                address: primaryAddr?.streetLine1 || "",
                city: primaryAddr?.city || "",
                state: primaryAddr?.stateProvince || "",
                zip: primaryAddr?.postalCode || "",
                country: primaryAddr?.country || "United States",
              }));
            }
          })
          .catch(() => {
            setFormData((prev) => ({
              ...prev,
              email: currentUser.email || "",
              firstName: currentUser.firstName || "",
              lastName: currentUser.lastName || "",
            }));
          });
      }
    }
  }, [navigate]);

  // Fetch real server shipping rates when destination address or items change
  useEffect(() => {
    if (!formData.address || !formData.city || !formData.country) return;

    const totalWeight = orderItems.reduce((acc, item) => acc + item.quantity * 0.5, 0) || 1.0;
    const totalQty = orderItems.reduce((acc, item) => acc + item.quantity, 0);
    setIsLoadingShippingRates(true);

    shippingService
      .getRates({
        destinationAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zip || "10001",
          country: formData.country || "United States",
        },
        weightInKg: totalWeight,
        itemCount: totalQty,
      })
      .then((rates) => {
        if (Array.isArray(rates) && rates.length > 0) {
          setShippingRates(rates);
          if (!rates.some((r) => r.serviceCode === selectedShippingCode)) {
            setSelectedShippingCode(rates[0].serviceCode);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch shipping rates from server:", err);
      })
      .finally(() => {
        setIsLoadingShippingRates(false);
      });
  }, [formData.address, formData.city, formData.state, formData.zip, formData.country, orderItems.length]);

  // Recalculate order summary via server API whenever items, shipping rate, or applied voucher change
  useEffect(() => {
    if (orderItems.length === 0) return;

    const itemsPayload = orderItems
      .filter((i) => Boolean(i.variantId))
      .map((i) => ({ variantId: i.variantId!, quantity: i.quantity }));

    if (itemsPayload.length === 0) return;

    const selectedRate = shippingRates.find((r) => r.serviceCode === selectedShippingCode);
    const shippingCost = selectedRate ? Number(selectedRate.cost) : 5.0;

    setIsCalculatingSummary(true);
    ordersService
      .calculateOrderSummary({
        items: itemsPayload,
        voucherId: appliedVoucher?.id,
        shippingCost,
      })
      .then((res) => {
        setOrderSummary(res);
        if (res.voucherError) {
          setVoucherError(res.voucherError);
        } else {
          setVoucherError(null);
        }
      })
      .catch((err) => {
        console.error("Failed to calculate server order summary:", err);
      })
      .finally(() => {
        setIsCalculatingSummary(false);
      });
  }, [orderItems, selectedShippingCode, shippingRates, appliedVoucher]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Values derived directly from server-authoritative order summary response
  const subtotal = orderSummary?.subtotalAmount ?? 0;
  const totalItemQuantity = orderSummary?.totalItemQuantity ?? orderItems.reduce((acc, i) => acc + i.quantity, 0);
  const discountAmount = orderSummary?.discountAmount ?? 0;
  const currentShippingCost = orderSummary?.shippingFee ?? (shippingRates.find((r) => r.serviceCode === selectedShippingCode)?.cost ?? 5.0);
  const tax = orderSummary?.taxAmount ?? 0;
  const total = orderSummary?.totalAmount ?? 0;
  const isFreeShippingVoucher =
    appliedVoucher?.discountType === DiscountType.FREE_SHIPPING ||
    orderSummary?.appliedVoucher?.discountType === DiscountType.FREE_SHIPPING;

  const handleApplyManualVoucher = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!voucherInputCode.trim()) return;

    setVoucherError(null);
    setVoucherSuccess(null);
    setIsApplyingVoucher(true);

    try {
      const totalQty = orderItems.reduce((acc, i) => acc + i.quantity, 0);
      const subtotalAmount = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

      const result = await vouchersService.validateAndApplyVoucher({
        code: voucherInputCode.trim().toUpperCase(),
        orderAmount: subtotalAmount,
        itemQuantity: totalQty,
      });

      if (result && result.voucher) {
        setAppliedVoucher(result.voucher);
        setVoucherSuccess(`Voucher "${result.voucher.code}" applied!`);
        setVoucherError(null);
      } else {
        setVoucherError("Invalid or ineligible voucher code.");
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "message" in err.response.data
          ? String(err.response.data.message)
          : err instanceof Error
          ? err.message
          : "Failed to apply voucher.";
      setVoucherError(errorMsg);
      setVoucherSuccess(null);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleSelectVoucherFromModal = (voucher: Voucher) => {
    setAppliedVoucher(voucher);
    setVoucherInputCode(voucher.code);
    setVoucherError(null);
    setVoucherSuccess(`Voucher "${voucher.code}" applied!`);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInputCode("");
    setVoucherError(null);
    setVoucherSuccess(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemsPayload = orderItems
      .filter((i) => i.variantId)
      .map((i) => ({
        variantId: i.variantId!,
        quantity: i.quantity,
      }));

    if (itemsPayload.length === 0) return;

    try {
      const currentUser = authService.getCurrentUser();
      const orderResult = await ordersService.createOrder({
        userId: currentUser?.id,
        voucherId: appliedVoucher?.id,
        shippingAddress: {
          recipientName: `${formData.firstName} ${formData.lastName}`,
          streetLine1: formData.address,
          city: formData.city,
          stateProvince: formData.state,
          postalCode: formData.zip,
          country: formData.country,
        },
        items: itemsPayload,
      });
      setCreatedOrder(orderResult);

      // Remove purchased items from the cart in a single batch request
      const itemIds = orderItems.map((item) => item.id).filter(Boolean);
      if (itemIds.length > 0) {
        try {
          await cartService.removeItems(itemIds);
        } catch (cleanupErr) {
          console.warn("Failed to clean up cart items after order:", cleanupErr);
        }
      }
      sessionStorage.removeItem("selected_cart_item_ids");
      setOrderPlaced(true);
    } catch (err) {
      console.error("Failed to create order:", err);
    }
  };

  if (isLoadingCart && !orderPlaced) {
    return (
      <RootLayout>
        <div className="py-20 text-center bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Verifying cart items...
          </p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <a
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Cart
            </a>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Checkout
            </h1>
          </div>

          {orderPlaced ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-lg mx-auto shadow-xl my-8">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Order Confirmed
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 mb-2">
                Thank You for Your Order!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Order{" "}
                <strong>
                  #{createdOrder?.orderNumber || "ORD-89241"}
                </strong>{" "}
                has been placed successfully. A confirmation email has been sent
                to <strong>{formData.email}</strong>.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-xs text-left space-y-2 mb-6 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping To:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formData.firstName} {formData.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formData.address}, {formData.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Amount Paid:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    ${(createdOrder?.totalAmount || total).toFixed(2)}
                  </span>
                </div>
              </div>
              <a
                href="/"
                className="inline-flex items-center justify-center w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
              >
                Continue Shopping
              </a>
            </div>
          ) : (
            <form
              onSubmit={handlePlaceOrder}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                        1
                      </span>
                      Customer Information
                    </h2>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setIsGuest(true)}
                        className={`px-3 py-1 rounded-lg transition-all ${isGuest
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                            : "text-slate-500"
                          }`}
                      >
                        Guest Checkout
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsGuest(false)}
                        className={`px-3 py-1 rounded-lg transition-all ${!isGuest
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold"
                            : "text-slate-500"
                          }`}
                      >
                        Sign In
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    Shipping Address
                  </h2>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          State / Province
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                        3
                      </span>
                      Shipping Method
                    </h2>
                    {isLoadingShippingRates && (
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse font-medium">
                        Calculating live rates...
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {shippingRates.length === 0 ? (
                      <div className="p-4 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                        Enter your shipping address above to calculate live carrier rates.
                      </div>
                    ) : (
                      shippingRates.map((opt) => (
                        <label
                          key={opt.serviceCode}
                          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedShippingCode === opt.serviceCode
                              ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShippingCode === opt.serviceCode}
                              onChange={() => setSelectedShippingCode(opt.serviceCode)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {opt.serviceName}
                                </span>
                                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {opt.carrierName}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Estimated Delivery: ~{opt.estimatedDays} {opt.estimatedDays === 1 ? "day" : "days"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {isFreeShippingVoucher ? (
                              <span className="line-through text-slate-400 mr-1.5">${opt.cost.toFixed(2)} FREE</span>
                            ) : opt.cost === 0 ? (
                              "FREE"
                            ) : (
                              `$${opt.cost.toFixed(2)}`
                            )}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                      4
                    </span>
                    Payment Details
                  </h2>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment("card")}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${selectedPayment === "card"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-600"
                        }`}
                    >
                      <CreditCard className="h-5 w-5" />
                      Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayment("paypal")}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${selectedPayment === "paypal"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-600"
                        }`}
                    >
                      <Building className="h-5 w-5" />
                      PayPal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPayment("cod")}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${selectedPayment === "cod"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600"
                          : "border-slate-200 dark:border-slate-700 text-slate-600"
                        }`}
                    >
                      <Truck className="h-5 w-5" />
                      Cash on Delivery
                    </button>
                  </div>

                  {selectedPayment === "card" && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          required
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Expiration Date
                          </label>
                          <input
                            type="text"
                            name="cardExp"
                            value={formData.cardExp}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                            CVC / CVV
                          </label>
                          <input
                            type="text"
                            name="cardCvc"
                            value={formData.cardCvc}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Order Summary ({orderItems.length} items)
                    </h2>
                    {isCalculatingSummary && (
                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                        Updating server totals...
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto pr-1 mb-4">
                    {(orderSummary?.items && orderSummary.items.length > 0
                      ? orderSummary.items
                      : orderItems.map((i) => ({
                          variantId: i.variantId || i.id,
                          productName: i.name,
                          size: i.size,
                          colorName: i.color,
                          imageUrl: i.image,
                          unitPrice: i.price,
                          quantity: i.quantity,
                          totalPrice: i.price * i.quantity,
                        }))
                    ).map((item) => (
                      <div
                        key={item.variantId}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {item.productName}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              Size: {item.size} • Color: {item.colorName} • Qty:{" "}
                              {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white shrink-0">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Voucher Selection Section */}
                  <div className="py-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Ticket className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Voucher & Promo Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsVoucherModalOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3 text-amber-400" />
                        Browse Available Vouchers
                      </button>
                    </div>

                    {appliedVoucher ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2">
                          <Ticket className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">
                              {appliedVoucher.code}
                            </p>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                              {appliedVoucher.name || "Active Voucher Applied"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveVoucher}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove voucher"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              value={voucherInputCode}
                              onChange={(e) => {
                                setVoucherInputCode(e.target.value);
                                if (voucherError) setVoucherError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleApplyManualVoucher(e);
                                }
                              }}
                              placeholder="Enter Voucher Code"
                              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-mono uppercase"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleApplyManualVoucher}
                            disabled={isApplyingVoucher || !voucherInputCode.trim()}
                            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {isApplyingVoucher ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </button>
                        </div>
                        {voucherError && (
                          <p className="text-xs text-rose-500 font-medium">{voucherError}</p>
                        )}
                        {voucherSuccess && (
                          <p className="text-xs text-emerald-600 font-medium">{voucherSuccess}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Voucher Discount ({appliedVoucher.code})
                        </span>
                        <span className="font-bold">
                          {isFreeShippingVoucher
                            ? "Free Shipping Waived"
                            : `-$${discountAmount.toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Shipping</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {currentShippingCost === 0 ? (
                          <span className="text-emerald-600 font-bold">FREE</span>
                        ) : (
                          `$${currentShippingCost.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Estimated Tax (8%)</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Place Order (${total.toFixed(2)})
                  </button>

                  <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Secure 256-Bit SSL Encrypted Payment
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Voucher Selection Modal */}
          <VoucherSelectorModal
            isOpen={isVoucherModalOpen}
            onClose={() => setIsVoucherModalOpen(false)}
            subtotal={subtotal}
            totalItemQuantity={totalItemQuantity}
            appliedVoucherCode={appliedVoucher?.code}
            onSelectVoucher={handleSelectVoucherFromModal}
          />
        </div>
      </main>
    </RootLayout>
  );
}
