import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
  PackageCheck,
  AlertCircle,
  Send,
  XCircle,
  Filter,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../../services/auth.service";
import { ordersService } from "../../../services/orders.service";
import { shippingService } from "../../../services/shipping.service";
import { returnsService } from "../../../services/reviews-returns.service";
import type {
  Order,
  TrackingInfo,
  ReturnRequest,
  CreateReturnItemPayload,
  OrderItem,
} from "../../../services/types";

// Status Filter Tabs
type TabCategory =
  | "ALL"
  | "PENDING"
  | "SHIPPING"
  | "DELIVERED"
  | "RETURNED"
  | "CANCELLED";

interface TabConfig {
  id: TabCategory;
  label: string;
  statuses: string[];
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: "ALL", label: "All Orders", statuses: [], icon: Package },
  {
    id: "PENDING",
    label: "Pending Fulfillment",
    statuses: ["PENDING", "PAID", "PROCESSING"],
    icon: Clock,
  },
  {
    id: "SHIPPING",
    label: "Shipping",
    statuses: ["SHIPPED", "IN_TRANSIT"],
    icon: Truck,
  },
  {
    id: "DELIVERED",
    label: "Delivered",
    statuses: ["DELIVERED"],
    icon: PackageCheck,
  },
  {
    id: "RETURNED",
    label: "Returned",
    statuses: ["RETURNED"],
    icon: RotateCcw,
  },
  {
    id: "CANCELLED",
    label: "Cancelled",
    statuses: ["CANCELLED"],
    icon: XCircle,
  },
];

const RETURN_REASONS = [
  "Doesn't fit",
  "Defective/Damaged",
  "Wrong item",
  "Not as described",
  "Changed my mind",
  "Other",
] as const;

type ReturnReason = (typeof RETURN_REASONS)[number];

interface ReturnFormItem {
  orderItemId: string;
  selected: boolean;
  reason: ReturnReason;
  condition: string;
  quantity: number;
  maxQuantity: number;
}

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

const SHIPMENT_STATUS_STEPS = [
  "LABEL_CREATED",
  "IN_TRANSIT",
  "DELIVERED",
] as const;

function ShipmentStatusStepper({ currentStatus }: { currentStatus: string }) {
  const labels: Record<string, string> = {
    LABEL_CREATED: "Label Created",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
  };

  const currentIdx = SHIPMENT_STATUS_STEPS.indexOf(
    currentStatus as (typeof SHIPMENT_STATUS_STEPS)[number],
  );

  return (
    <div className="flex items-center gap-1 w-full">
      {SHIPMENT_STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                } ${
                  isCurrent
                    ? "ring-2 ring-emerald-300 dark:ring-emerald-700 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                    : ""
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {labels[step]}
              </span>
            </div>
            {idx < SHIPMENT_STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-18px] rounded-full ${
                  idx < currentIdx
                    ? "bg-emerald-400"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TrackingTimeline({ tracking }: { tracking: TrackingInfo }) {
  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="px-4">
        <ShipmentStatusStepper currentStatus={tracking.status} />
      </div>

      {/* Info header */}
      <div className="flex flex-wrap gap-4 text-xs px-1">
        <div>
          <span className="text-slate-400 dark:text-slate-500">Carrier:</span>{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {tracking.carrierName}
          </span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500">Tracking #:</span>{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
            {tracking.trackingNumber}
          </span>
        </div>
        {tracking.estimatedDelivery && (
          <div>
            <span className="text-slate-400 dark:text-slate-500">
              Est. Delivery:
            </span>{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {new Date(tracking.estimatedDelivery).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Events timeline */}
      {tracking.events.length > 0 && (
        <div className="relative pl-5 space-y-3">
          <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-gradient-to-b from-emerald-400 to-slate-200 dark:to-slate-700 rounded-full" />
          {tracking.events.map((event, idx) => (
            <div key={idx} className="relative flex items-start gap-3">
              <div
                className={`absolute left-[-14px] w-2.5 h-2.5 rounded-full mt-1 ${
                  idx === 0
                    ? "bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {event.description}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{event.location}</span>
                  <span>•</span>
                  <span>
                    {new Date(event.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReturnRequestForm({
  order,
  userId,
  onSubmitted,
  onCancel,
}: {
  order: Order;
  userId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [formItems, setFormItems] = useState<ReturnFormItem[]>(
    order.items.map((item) => ({
      orderItemId: item.id,
      selected: false,
      reason: "Doesn't fit" as ReturnReason,
      condition: "",
      quantity: item.quantity,
      maxQuantity: item.quantity,
    })),
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedCount = formItems.filter((fi) => fi.selected).length;

  const toggleItem = (idx: number) => {
    setFormItems((prev) =>
      prev.map((fi, i) => (i === idx ? { ...fi, selected: !fi.selected } : fi)),
    );
  };

  const updateItem = (
    idx: number,
    field: keyof ReturnFormItem,
    value: string | number,
  ) => {
    setFormItems((prev) =>
      prev.map((fi, i) => (i === idx ? { ...fi, [field]: value } : fi)),
    );
  };

  const handleSubmit = async () => {
    const selectedItems = formItems.filter((fi) => fi.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to return.");
      return;
    }

    setSubmitting(true);
    try {
      const items: CreateReturnItemPayload[] = selectedItems.map((fi) => ({
        orderItemId: fi.orderItemId,
        reason: fi.reason,
        condition: fi.condition || undefined,
        quantity: fi.quantity,
      }));

      await returnsService.createReturnRequest({
        orderId: order.id,
        userId,
        items,
      });

      toast.success("Return request submitted successfully!");
      onSubmitted();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit return request";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
          Select items to return
        </h4>
        <span className="text-[10px] font-semibold text-slate-400">
          {selectedCount} of {formItems.length} selected
        </span>
      </div>

      <div className="space-y-3">
        {formItems.map((fi, idx) => {
          const orderItem = order.items[idx];
          const imageUrl =
            orderItem.variant?.product?.images?.[0]?.imageUrl ||
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80";

          return (
            <div
              key={fi.orderItemId}
              className={`rounded-xl border transition-all ${
                fi.selected
                  ? "border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              {/* Item header with checkbox & image */}
              <div className="flex items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={fi.selected}
                  onChange={() => toggleItem(idx)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <img
                  src={imageUrl}
                  alt={orderItem.productNameSnapshot}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                />
                <div
                  onClick={() => toggleItem(idx)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                    {orderItem.productNameSnapshot}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Size: {orderItem.sizeSnapshot} • Color:{" "}
                    {orderItem.colorSnapshot} • Qty: {orderItem.quantity}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ${Number(orderItem.unitPrice).toFixed(2)}
                </span>
              </div>

              {/* Return details (shown when selected) */}
              {fi.selected && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Reason
                      </label>
                      <select
                        value={fi.reason}
                        onChange={(e) =>
                          updateItem(idx, "reason", e.target.value)
                        }
                        className="mt-0.5 w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Quantity
                      </label>
                      <select
                        value={fi.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", Number(e.target.value))
                        }
                        className="mt-0.5 w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {Array.from(
                          { length: fi.maxQuantity },
                          (_, i) => i + 1,
                        ).map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Condition Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={fi.condition}
                      onChange={(e) =>
                        updateItem(idx, "condition", e.target.value)
                      }
                      placeholder="e.g., Unworn with tags"
                      className="mt-0.5 w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Cancel */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || selectedCount === 0}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-600/20 inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Submit Return Request
        </button>
      </div>
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const imageUrl =
    item.variant?.product?.images?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80";

  return (
    <div className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4">
      <img
        src={imageUrl}
        alt={item.productNameSnapshot}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          {item.skuSnapshot}
        </span>
        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
          {item.productNameSnapshot}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Size: {item.sizeSnapshot} • Color: {item.colorSnapshot} • Qty:{" "}
          {item.quantity}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
          ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
        </span>
        {item.quantity > 1 && (
          <p className="text-[11px] text-slate-400">
            (${Number(item.unitPrice).toFixed(2)} each)
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabCategory>("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<
    Record<string, TrackingInfo>
  >({});
  const [trackingLoading, setTrackingLoading] = useState<
    Record<string, boolean>
  >({});
  const [confirmingDelivery, setConfirmingDelivery] = useState<
    Record<string, boolean>
  >({});
  const [returnFormOrderId, setReturnFormOrderId] = useState<string | null>(
    null,
  );
  const [userReturns, setUserReturns] = useState<ReturnRequest[]>([]);

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    Promise.all([
      ordersService.getOrdersByUserId(userId),
      returnsService.getReturnRequestsByUser(userId),
    ])
      .then(([serverOrders, returns]) => {
        setOrders(serverOrders);
        setUserReturns(returns);
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
        toast.error("Failed to load orders. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const filteredOrders = useMemo(() => {
    if (activeTab === "ALL") return orders;
    const tabConfig = TABS.find((t) => t.id === activeTab);
    if (!tabConfig) return orders;
    return orders.filter((o) => tabConfig.statuses.includes(o.status));
  }, [orders, activeTab]);

  const getTabCount = (tabId: TabCategory) => {
    if (tabId === "ALL") return orders.length;
    const tabConfig = TABS.find((t) => t.id === tabId);
    if (!tabConfig) return 0;
    return orders.filter((o) => tabConfig.statuses.includes(o.status)).length;
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
  };

  const handleTrackPackage = async (
    orderId: string,
    trackingNumber: string,
  ) => {
    if (trackingData[orderId]) return; // Already loaded

    setTrackingLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const info = await shippingService.trackShipment(trackingNumber);
      setTrackingData((prev) => ({ ...prev, [orderId]: info }));
    } catch (err) {
      console.error("Failed to track shipment:", err);
      toast.error("Failed to load tracking information.");
    } finally {
      setTrackingLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!userId) return;

    setConfirmingDelivery((prev) => ({ ...prev, [orderId]: true }));
    try {
      const updatedOrder = await ordersService.confirmDelivery(orderId, userId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updatedOrder.status } : o)),
      );
      toast.success("Order confirmed as delivered! Thank you.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to confirm delivery";
      toast.error(errorMessage);
    } finally {
      setConfirmingDelivery((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleReturnSubmitted = () => {
    setReturnFormOrderId(null);
    if (userId) {
      Promise.all([
        ordersService.getOrdersByUserId(userId),
        returnsService.getReturnRequestsByUser(userId),
      ]).then(([serverOrders, returns]) => {
        setOrders(serverOrders);
        setUserReturns(returns);
      });
    }
  };

  const getOrderReturnRequests = (orderId: string): ReturnRequest[] => {
    return userReturns.filter((r) => r.orderId === orderId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            My Orders & Tracking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track shipments, view detailed information, confirm delivery, or request returns.
          </p>
        </div>
      </div>

      {/* Status Filter Tab Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-sm overflow-x-auto">
        <nav className="flex space-x-1 sm:space-x-2 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = getTabCount(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Orders List Area */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex items-center justify-center gap-2 text-xs text-slate-500 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Orders Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            {activeTab === "ALL"
              ? "You haven't placed any orders yet."
              : `There are no orders matching "${
                  TABS.find((t) => t.id === activeTab)?.label
                }".`}
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-indigo-600/20"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const primaryShipment = order.shipments?.[0];
            const hasTracking = !!primaryShipment?.trackingNumber;
            const orderReturns = getOrderReturnRequests(order.id);
            const showReturnForm = returnFormOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Order Header */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/orders/${order.id}`}
                          className="font-bold text-slate-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          Order #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                        </a>
                        <span className="text-xs text-slate-400">
                          •{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {primaryShipment && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {primaryShipment.carrier} •{" "}
                          <span className="font-mono">
                            {primaryShipment.trackingNumber}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.colorClass}`}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      title={isExpanded ? "Collapse quick view" : "Expand quick view"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Quick Content */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Items list */}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        Order Items
                      </h3>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {order.items.map((item) => (
                          <OrderItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">
                            Subtotal
                          </span>
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            ${Number(order.subtotalAmount).toFixed(2)}
                          </p>
                        </div>
                        {Number(order.discountAmount) > 0 && (
                          <div>
                            <span className="text-slate-400 dark:text-slate-500">
                              Discount
                            </span>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              -${Number(order.discountAmount).toFixed(2)}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">
                            Shipping
                          </span>
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            ${Number(order.shippingFee).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">
                            Tax
                          </span>
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            ${Number(order.taxAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tracking Panel */}
                    {hasTracking && (
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Shipment Tracking
                          </h3>
                          {!trackingData[order.id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackPackage(
                                  order.id,
                                  primaryShipment.trackingNumber,
                                );
                              }}
                              disabled={trackingLoading[order.id]}
                              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              {trackingLoading[order.id] ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Truck className="h-3 w-3" />
                              )}
                              Load Tracking
                            </button>
                          )}
                        </div>

                        {trackingLoading[order.id] && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fetching tracking data...
                          </div>
                        )}

                        {trackingData[order.id] && (
                          <TrackingTimeline
                            tracking={trackingData[order.id]}
                          />
                        )}
                      </div>
                    )}

                    {/* Existing Return Requests */}
                    {orderReturns.length > 0 && (
                      <div className="p-4 sm:p-5">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                          Return Requests
                        </h3>
                        <div className="space-y-2">
                          {orderReturns.map((ret) => (
                            <div
                              key={ret.id}
                              className="flex items-center justify-between bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl px-3 py-2"
                            >
                              <div>
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                  Return #{ret.id.slice(0, 8)}
                                </p>
                                <p className="text-[10px] text-purple-500 dark:text-purple-400">
                                  {ret.items.length} item(s) •{" "}
                                  {new Date(ret.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "2-digit",
                                    },
                                  )}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                                {ret.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Return Form */}
                    {showReturnForm && (
                      <div className="p-4 sm:p-5">
                        <ReturnRequestForm
                          order={order}
                          userId={userId!}
                          onSubmitted={handleReturnSubmitted}
                          onCancel={() => setReturnFormOrderId(null)}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="p-4 sm:p-5 flex flex-wrap items-center justify-end gap-2">
                      <a
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-sm shadow-indigo-600/20 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                      {/* Confirm Delivery — shown only for SHIPPED orders */}
                      {order.status === "SHIPPED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDelivery(order.id);
                          }}
                          disabled={confirmingDelivery[order.id]}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-all shadow-sm shadow-emerald-600/20 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {confirmingDelivery[order.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PackageCheck className="h-3.5 w-3.5" />
                          )}
                          Confirm Delivery
                        </button>
                      )}

                      {/* Request Return — shown only for DELIVERED orders */}
                      {order.status === "DELIVERED" && !showReturnForm && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReturnFormOrderId(order.id);
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition-all shadow-sm shadow-purple-600/20 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Request Return
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
