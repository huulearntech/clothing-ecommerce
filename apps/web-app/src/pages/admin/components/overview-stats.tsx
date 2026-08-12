import { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Shirt,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { statisticsService } from "../../../services/statistics.service";
import type { OverviewStatsData } from "../../../services/types";

interface OverviewStatsProps {
  stats?: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    lowStockAlerts: number;
  };
}

function formatGrowth(change?: number | null): { text: string; isPositive: boolean } {
  if (change === null || change === undefined) {
    return { text: "N/A", isPositive: true };
  }
  if (change > 0) {
    return { text: `+${change.toFixed(1)}%`, isPositive: true };
  }
  if (change < 0) {
    return { text: `${change.toFixed(1)}%`, isPositive: false };
  }
  return { text: "0.0%", isPositive: true };
}

export default function OverviewStats({ stats: initialStats }: OverviewStatsProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "ytd">("30d");
  const [data, setData] = useState<OverviewStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics(timeRange);
  }, [timeRange]);

  const fetchStatistics = async (range: "7d" | "30d" | "ytd") => {
    setIsLoading(true);
    setError(null);
    try {
      const statsData = await statisticsService.getOverviewStats(range);
      setData(statsData);
    } catch (err: unknown) {
      console.error("API statistics calculation error:", err);
      const errObj = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const apiMsg = errObj?.response?.data?.message;
      const finalMsg = Array.isArray(apiMsg)
        ? apiMsg.join(", ")
        : apiMsg || errObj?.message || "Failed to retrieve statistics calculation from server.";
      setError(finalMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Live API metrics directly
  const totalRevenue = data?.totalRevenue ?? initialStats?.totalRevenue ?? 0;
  const totalOrders = data?.totalOrders ?? initialStats?.totalOrders ?? 0;
  const totalCustomers = data?.totalCustomers ?? initialStats?.totalCustomers ?? 0;
  const lowStockAlerts = data?.lowStockAlerts ?? initialStats?.lowStockAlerts ?? 0;
  const avgOrderValue = data?.avgOrderValue ?? (totalOrders > 0 ? totalRevenue / totalOrders : 0);

  const revGrowth = formatGrowth(data?.revenueChange);
  const ordersGrowth = formatGrowth(data?.ordersChange);
  const aovGrowth = formatGrowth(data?.aovChange);
  const customersGrowth = formatGrowth(data?.customersChange);

  const revenueTimeline = data?.revenueTrend ?? [];
  const categorySales = data?.categorySales ?? [];
  const topSellingItems = data?.topSellingItems ?? [];
  const departmentReturnRates = data?.departmentReturnRates ?? [];

  // KPI Summary Cards with computed change values
  const cards = [
    {
      title: "Total Sales Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      change: revGrowth.text,
      isPositive: revGrowth.isPositive,
      subtext: "vs. previous period",
      icon: DollarSign,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Orders Processed",
      value: totalOrders.toLocaleString(),
      change: ordersGrowth.text,
      isPositive: ordersGrowth.isPositive,
      subtext: "Live database orders",
      icon: ShoppingBag,
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Avg. Order Value (AOV)",
      value: `$${avgOrderValue.toFixed(2)}`,
      change: aovGrowth.text,
      isPositive: aovGrowth.isPositive,
      subtext: "Avg cart total",
      icon: Shirt,
      iconBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Active Customers",
      value: totalCustomers.toLocaleString(),
      change: customersGrowth.text,
      isPositive: customersGrowth.isPositive,
      subtext: "Registered users",
      icon: Users,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Inventory Health",
      value: `${lowStockAlerts} Alert Items`,
      change: lowStockAlerts > 0 ? "Restock Required" : "Optimal",
      isPositive: lowStockAlerts === 0,
      subtext: "Low stock threshold < 15",
      icon: AlertTriangle,
      iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Error Banner when API fails */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-700 dark:text-red-300 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Calculation Error</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchStatistics(timeRange)}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shrink-0"
          >
            Retry Calculation
          </button>
        </div>
      )}

      {/* Time Filter Bar & Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Business Performance & Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key metrics, revenue trends, top clothing best-sellers, and category share calculated from live data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStatistics(timeRange)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            {(["7d", "30d", "ytd"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  timeRange === range
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {range === "7d" ? "Last 7 Days" : range === "30d" ? "Last 30 Days" : "Year to Date"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </h3>
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold flex items-center gap-0.5 ${
                      card.isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {card.isPositive ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {card.change}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {card.subtext}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Growth Trend (Area Chart) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily sales performance over time
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                <span className="text-slate-700 dark:text-slate-300">Revenue</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {revenueTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, undefined]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <ShoppingBag className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No sales revenue recorded for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Share (Pie Chart) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sales by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share of total clothing revenue
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {categorySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="sales"
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, undefined]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Shirt className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No category sales data</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categorySales.length > 0 ? (
              categorySales.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-slate-900 dark:text-white">${cat.sales.toLocaleString()}</span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal">({cat.percentage}%)</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-400 text-center py-1">No categories recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts & Clothing Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (Bar Chart) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Best-Selling Apparel Units
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Highest volume clothing items this period
            </p>
          </div>

          <div className="h-64 w-full">
            {topSellingItems.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSellingItems} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value: unknown, name: unknown) => [
                      name === "unitsSold" ? `${value} units` : `$${Number(value).toLocaleString()}`,
                      name === "unitsSold" ? "Units Sold" : "Revenue",
                    ]}
                  />
                  <Bar dataKey="unitsSold" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Shirt className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-medium">No top selling items for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Clothing Department Performance & Return Rate */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Department Return Rates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Return frequency by apparel category
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {departmentReturnRates.length > 0 ? (
              departmentReturnRates.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.category}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.orders} total orders completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/30">
                      {item.returnRate} return rate
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <p className="text-xs font-medium">No department return data recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
