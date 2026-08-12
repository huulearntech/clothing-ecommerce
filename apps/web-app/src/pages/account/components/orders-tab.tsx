import { useEffect, useState } from "react";
import { Package, Truck, ExternalLink, CheckCircle2 } from "lucide-react";
import { authService } from "../../../services/auth.service";
import { ordersService } from "../../../services/orders.service";
import type { Order as ServerOrder } from "../../../services/types";

interface OrderItemUI {
  name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderUI {
  id: string;
  date: string;
  status: string;
  trackingNumber: string;
  carrier: string;
  total: number;
  items: OrderItemUI[];
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<OrderUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      setLoading(false);
      return;
    }

    const fetchPromise = currentUser.id
      ? ordersService.getOrdersByUserId(currentUser.id)
      : ordersService.getAllOrders();

    fetchPromise
      .then((serverOrders: ServerOrder[]) => {
        if (serverOrders) {
          const mapped: OrderUI[] = serverOrders.map((o) => ({
            id: o.orderNumber || o.id,
            date: new Date(o.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            status: o.status || "PROCESSING",
            trackingNumber: o.shipments?.[0]?.trackingNumber || "TRK-PENDING",
            carrier: o.shipments?.[0]?.carrier || "Standard Carrier",
            total: Number(o.totalAmount) || 0,
            items:
              o.items?.map((item) => ({
                name: item.productNameSnapshot || "Apparel Item",
                category: "Apparel",
                size: item.sizeSnapshot || "M",
                color: item.colorSnapshot || "Standard",
                price: Number(item.unitPrice) || 0,
                quantity: item.quantity,
                image:
                  "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=300&q=80",
              })) || [],
          }));
          setOrders(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load orders:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Past Orders & Live Tracking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track current shipments or view order details and receipts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Orders Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            You haven't placed any orders yet.
          </p>
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
            >
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {order.id}
                      </span>
                      <span className="text-xs text-slate-400">• {order.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Carrier: {order.carrier} (Tracking: {order.trackingNumber})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "In Transit" || order.status === "SHIPPED"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    }`}
                  >
                    {order.status === "In Transit" || order.status === "SHIPPED" ? (
                      <Truck className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {order.status}
                  </span>

                  <button className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center gap-1">
                    Track Package
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 first:pt-0 last:pb-0 flex items-center gap-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Order Amount:</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
