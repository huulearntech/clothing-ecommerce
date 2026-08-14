import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  RotateCcw,
  PackageCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import RootLayout from "../../layouts/root.layout";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/orders.service";
import { shippingService } from "../../services/shipping.service";
import { returnsService } from "../../services/reviews-returns.service";
import type {
  Order,
  TrackingInfo,
  ReturnRequest,
} from "../../services/types";
import { usePageTitle } from "../../hooks/usePageTitle";

const STATUS_CONFIG: Record<
  string,
  { label: string; colorClass: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    colorClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  PAID: {
    label: "Paid",
    colorClass:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  PROCESSING: {
    label: "Processing",
    colorClass:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900",
    icon: <Package className="h-3.5 w-3.5" />,
  },
  SHIPPED: {
    label: "Shipped",
    colorClass:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 border border-orange-200 dark:border-orange-900",
    icon: <Truck className="h-3.5 w-3.5" />,
  },
  DELIVERED: {
    label: "Delivered",
    colorClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900",
    icon: <PackageCheck className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    label: "Cancelled",
    colorClass:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  RETURNED: {
    label: "Returned",
    colorClass:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-900",
    icon: <RotateCcw className="h-3.5 w-3.5" />,
  },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);

  const currentUser = authService.getCurrentUser();

  usePageTitle(
    order
      ? `Order #${order.orderNumber || order.id.slice(0, 8)} Details`
      : "Order Details",
    "View detailed order items, live shipment tracking, address, and receipt breakdown."
  );

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    ordersService
      .getOrderById(id)
      .then((data) => {
        setOrder(data);
        if (data.shipments?.[0]?.trackingNumber) {
          setTrackingLoading(true);
          shippingService
            .trackShipment(data.shipments[0].trackingNumber)
            .then(setTrackingInfo)
            .catch((err) => console.error("Failed to load tracking:", err))
            .finally(() => setTrackingLoading(false));
        }

        if (currentUser?.id) {
          returnsService
            .getReturnRequestsByUser(currentUser.id)
            .then((rList) => setReturns(rList.filter((r) => r.orderId === id)))
            .catch((err) => console.error("Failed to load returns:", err));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch order details:", err);
        toast.error("Failed to load order details.");
      })
      .finally(() => setLoading(false));
  }, [id, currentUser?.id]);

  const handleConfirmDelivery = async () => {
    if (!order || !currentUser?.id) return;
    setConfirmingDelivery(true);
    try {
      const updated = await ordersService.confirmDelivery(
        order.id,
        currentUser.id
      );
      setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev));
      toast.success("Order delivery confirmed! Thank you.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to confirm delivery";
      toast.error(msg);
    } finally {
      setConfirmingDelivery(false);
    }
  };

  if (loading) {
    return (
      <RootLayout>
        <main className="py-12 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
            Loading order information...
          </div>
        </main>
      </RootLayout>
    );
  }

  if (!order) {
    return (
      <RootLayout>
        <main className="py-12 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
          <div className="max-w-xl mx-auto px-4 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Order Not Found
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              We couldn't find the requested order record. It may have been deleted or the URL is incorrect.
            </p>
            <a
              href="/account?tab=orders"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              Back to My Orders
            </a>
          </div>
        </main>
      </RootLayout>
    );
  }

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const primaryShipment = order.shipments?.[0];

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb & Navigation */}
          <div>
            <a
              href="/account?tab=orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to My Orders
            </a>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Order #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.colorClass}`}
                  >
                    {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Top Action */}
              {order.status === "SHIPPED" && (
                <button
                  onClick={handleConfirmDelivery}
                  disabled={confirmingDelivery}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {confirmingDelivery ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackageCheck className="h-4 w-4" />
                  )}
                  Confirm Order Delivery
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Main Details Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ordered Items List Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  Ordered Products ({order.items.length})
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items.map((item) => {
                    const imageUrl =
                      item.variant?.product?.images?.[0]?.imageUrl ||
                      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80";

                    const productId =
                      item.variant?.productId || item.variant?.product?.id;

                    return (
                      <div
                        key={item.id}
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={imageUrl}
                            alt={item.productNameSnapshot}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              SKU: {item.skuSnapshot}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {item.productNameSnapshot}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Size: {item.sizeSnapshot} • Color:{" "}
                              {item.colorSnapshot} • Quantity: {item.quantity}
                            </p>
                            {productId && (
                              <a
                                href={`/products/${productId}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                              >
                                View Product Page
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-400">
                            ${Number(item.unitPrice).toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipment Tracking Section */}
              {primaryShipment && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Truck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Shipment & Live Tracking
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {primaryShipment.carrier} • {primaryShipment.trackingNumber}
                    </span>
                  </div>

                  {trackingLoading ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      Loading live tracking updates...
                    </div>
                  ) : trackingInfo ? (
                    <div className="space-y-4">
                      {/* Timeline Events */}
                      <div className="relative pl-5 space-y-3 pt-2">
                        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-emerald-400 to-slate-200 dark:to-slate-700 rounded-full" />
                        {trackingInfo.events.map((event, idx) => (
                          <div key={idx} className="relative flex items-start gap-3">
                            <div
                              className={`absolute left-[-14px] w-2.5 h-2.5 rounded-full mt-1 ${
                                idx === 0
                                  ? "bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800"
                                  : "bg-slate-300 dark:bg-slate-600"
                              }`}
                            />
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {event.description}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {event.location} •{" "}
                                {new Date(event.timestamp).toLocaleString("en-US", {
                                  month: "short",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-2">
                      Shipment dispatched via {primaryShipment.carrier}. Tracking status will update automatically.
                    </p>
                  )}
                </div>
              )}

              {/* Existing Returns Request Status */}
              {returns.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-200 dark:border-purple-900/50 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    Return Requests ({returns.length})
                  </h3>
                  <div className="space-y-2">
                    {returns.map((ret) => (
                      <div
                        key={ret.id}
                        className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 p-3 rounded-2xl border border-purple-200/60 dark:border-purple-800"
                      >
                        <div>
                          <p className="text-xs font-bold text-purple-800 dark:text-purple-200">
                            Return #{ret.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-purple-600 dark:text-purple-400">
                            {ret.items.length} item(s) • Submitted on{" "}
                            {new Date(ret.createdAt).toLocaleDateString("en-US")}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                          {ret.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Summary Column (1 Col) */}
            <div className="space-y-6">
              {/* Receipt Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                  Payment Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ${Number(order.subtotalAmount).toFixed(2)}
                    </span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Voucher Discount</span>
                      <span className="font-semibold">
                        -${Number(order.discountAmount).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Shipping Fee</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ${Number(order.shippingFee).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Estimated Tax</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ${Number(order.taxAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Total Paid
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg sm:text-xl">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Card */}
              {order.shippingAddressSnapshot && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Delivery Address
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {order.shippingAddressSnapshot.recipientName ||
                        order.shippingAddressSnapshot.fullName ||
                        order.shippingAddressSnapshot.name}
                    </p>
                    <p>
                      {order.shippingAddressSnapshot.streetAddress ||
                        order.shippingAddressSnapshot.streetLine1}
                    </p>
                    <p>
                      {order.shippingAddressSnapshot.city},{" "}
                      {order.shippingAddressSnapshot.state ||
                        order.shippingAddressSnapshot.stateProvince}{" "}
                      {order.shippingAddressSnapshot.zipCode ||
                        order.shippingAddressSnapshot.postalCode}
                    </p>
                    {order.shippingAddressSnapshot.phone && (
                      <p className="pt-1 text-slate-400">
                        Phone: {order.shippingAddressSnapshot.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Method Card */}
              {order.payment && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Payment Details
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Gateway:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                        {order.payment.paymentGateway || "Credit Card"}
                      </span>
                    </div>
                    {order.payment.transactionId && (
                      <div className="flex justify-between">
                        <span>Transaction ID:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">
                          {order.payment.transactionId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span>Status:</span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                        {order.payment.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </RootLayout>
  );
}
