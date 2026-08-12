import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle2, Clock, Truck, AlertCircle, RefreshCw } from "lucide-react";
import { ordersService } from "../../../services/orders.service";
import type { Order, OrderStatus } from "../../../services/types";

export interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  itemsCount: number;
  createdAt: string;
}

interface OrderManagementProps {
  orders?: OrderItem[];
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export default function OrderManagement({
  orders: propOrders,
  onUpdateStatus: propOnUpdateStatus,
}: OrderManagementProps) {
  const [orders, setOrders] = useState<OrderItem[]>(propOrders || []);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data: Order[] = await ordersService.getAllOrders();
      if (Array.isArray(data)) {
        const mappedOrders: OrderItem[] = data.map((o) => {
          const totalAmount = Number(o.totalAmount || 0);
          const itemsCount = o.items
            ? o.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
            : 0;

          return {
            id: o.id,
            orderNumber: o.orderNumber || o.id,
            customerName:
              (o.user ? `${o.user.firstName} ${o.user.lastName}`.trim() : "") ||
              o.shippingAddressSnapshot?.recipientName ||
              o.shippingAddressSnapshot?.fullName ||
              "N/A",
            customerEmail:
              o.user?.email ||
              o.shippingAddressSnapshot?.email ||
              "N/A",
            totalAmount: totalAmount,
            status: o.status,
            itemsCount: itemsCount,
            createdAt: o.createdAt,
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Failed to fetch orders from API:", err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Update state locally immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    if (propOnUpdateStatus) {
      propOnUpdateStatus(orderId, newStatus);
    }

    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.warn(`Failed to sync order status update for #${orderId} with API:`, err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Truck className="w-3.5 h-3.5" /> Shipped
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      case "PENDING":
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" /> {status === "PAID" ? "Paid" : "Pending"}
          </span>
        );
      case "CANCELLED":
      case "RETURNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Customer Orders</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fulfill orders, track shipping status, and manage client purchases.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID, customer name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                  {isLoading ? "Loading orders..." : "No orders match your filter criteria."}
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {o.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900 dark:text-white">{o.customerName}</p>
                    <p className="text-xs text-slate-400">{o.customerEmail}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {new Date(o.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    ${Number(o.totalAmount).toFixed(2)}
                    <span className="text-xs text-slate-400 font-normal block">{o.itemsCount} items</span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(o.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value as OrderStatus)}
                      className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
