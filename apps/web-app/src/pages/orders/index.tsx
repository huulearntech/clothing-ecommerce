import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  RotateCcw,
  XCircle,
  ShoppingBag,
  ChevronRight,
  Filter,
} from 'lucide-react';
import RootLayout from '../../layouts/root.layout';
import { authService } from '../../services/auth.service';
import { ordersService } from '../../services/orders.service';
import type { Order as ServerOrder, OrderStatus } from '../../services/types';

// Tab categories filter options
type TabCategory =
  | 'ALL'
  | 'PENDING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED';

interface TabConfig {
  id: TabCategory;
  label: string;
  statuses: string[];
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  { id: 'ALL', label: 'All Orders', statuses: [], icon: Package },
  {
    id: 'PENDING',
    label: 'Pending Fulfillment',
    statuses: ['PENDING', 'PAID', 'PROCESSING'],
    icon: Clock,
  },
  { id: 'SHIPPING', label: 'Shipping', statuses: ['SHIPPED', 'IN_TRANSIT'], icon: Truck },
  { id: 'DELIVERED', label: 'Delivered', statuses: ['DELIVERED'], icon: CheckCircle2 },
  { id: 'RETURNED', label: 'Returned', statuses: ['RETURNED'], icon: RotateCcw },
  { id: 'CANCELLED', label: 'Cancelled', statuses: ['CANCELLED'], icon: XCircle },
];

interface OrderItemDisplay {
  id?: string;
  name: string;
  category?: string;
  size?: string;
  color?: string;
  price: number;
  quantity: number;
  image: string;
}

interface OrderDisplay {
  id: string;
  orderNumber: string;
  date: string;
  rawDate: Date;
  status: OrderStatus;
  totalAmount: number;
  carrier: string;
  trackingNumber: string;
  items: OrderItemDisplay[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabCategory>('ALL');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      setLoading(false);
      return;
    }

    ordersService
      .getOrdersByUserId(currentUser.id)
      .then((serverOrders: ServerOrder[]) => {
        if (serverOrders) {
          const mapped: OrderDisplay[] = serverOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber || o.id.substring(0, 8).toUpperCase(),
            date: new Date(o.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            }),
            rawDate: new Date(o.createdAt),
            status: o.status || 'PENDING',
            carrier: o.shipments?.[0]?.carrier || 'Standard Express',
            trackingNumber: o.shipments?.[0]?.trackingNumber || 'TRK-PENDING',
            totalAmount: Number(o.totalAmount) || 0,
            items:
              o.items?.map((item) => ({
                id: item.id,
                name: item.productNameSnapshot || 'Apparel Product',
                category: 'Clothing',
                size: item.sizeSnapshot || 'M',
                color: item.colorSnapshot || 'Standard',
                price: Number(item.unitPrice) || 0,
                quantity: item.quantity,
                image:
                  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
              })) || [],
          }));
          
          // Sort orders newest first
          mapped.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
          setOrders(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load user orders:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'ALL') return orders;
    const tabConfig = TABS.find((t) => t.id === activeTab);
    if (!tabConfig) return orders;
    return orders.filter((o) => tabConfig.statuses.includes(o.status));
  }, [orders, activeTab]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
      case 'PAID':
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
            <Clock className="h-3.5 w-3.5" />
            {status === 'PROCESSING' ? 'Processing' : status === 'PAID' ? 'Paid & Preparing' : 'Pending Fulfillment'}
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
            <Truck className="h-3.5 w-3.5" />
            In Transit / Shipped
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/50">
            <RotateCcw className="h-3.5 w-3.5" />
            Returned
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTabCount = (tabId: TabCategory) => {
    if (tabId === 'ALL') return orders.length;
    const tabConfig = TABS.find((t) => t.id === tabId);
    if (!tabConfig) return 0;
    return orders.filter((o) => tabConfig.statuses.includes(o.status)).length;
  };

  return (
    <RootLayout>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                <span>Customer Portal</span>
                <span>•</span>
                <span>Order History</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                My Orders
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your purchases, monitor fulfillment progress, and track active shipments.
              </p>
            </div>
            <a
              href="/products"
              className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-sm shadow-indigo-200"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </a>
          </div>

          {/* Navigation Category Tabs */}
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Orders Content Area */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Fetching your orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                No orders found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                {activeTab === 'ALL'
                  ? "You haven't placed any orders yet. Start exploring our high-quality catalog!"
                  : `There are currently no orders under "${
                      TABS.find((t) => t.id === activeTab)?.label
                    }".`}
              </p>
              <a
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm"
              >
                Browse Products
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Order Header / Card Metadata */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                            Order #{order.orderNumber}
                          </span>
                          <span className="text-xs text-slate-400">
                            • Placed on {order.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Carrier: <span className="font-medium">{order.carrier}</span> (Tracking: #{order.trackingNumber})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(order.status)}

                      {/* Card links to Order Detail */}
                      <a
                        href={`/orders/${order.id}`}
                        className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        View Order Detail
                        <ChevronRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* List of product items in this order */}
                  <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200/80 dark:border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-slate-400">
                              (${item.price.toFixed(2)} each)
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer summary */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Total ({order.items.length} {order.items.length === 1 ? 'item' : 'items'}):
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RootLayout>
  );
}
