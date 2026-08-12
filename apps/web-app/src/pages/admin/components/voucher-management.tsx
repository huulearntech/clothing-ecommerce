import { useState, useEffect } from "react";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { vouchersService } from "../../../services/vouchers.service";
import type { Voucher, CreateVoucherPayload } from "../../../services/types";
import { DiscountType, VoucherType } from "../../../services/types";

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Drawer / Modal Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: VoucherType.COUPON as VoucherType,
    discountType: DiscountType.PERCENTAGE as DiscountType,
    discountValue: "",
    maxDiscountAmount: "",
    minOrderAmount: "0",
    minItemQuantity: "0",
    usageLimit: "100",
    perUserLimit: "1",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await vouchersService.getAllVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch vouchers:", err);
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to load vouchers from server.");
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenAddDrawer = () => {
    setEditingVoucher(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      type: VoucherType.COUPON,
      discountType: DiscountType.PERCENTAGE,
      discountValue: "15",
      maxDiscountAmount: "50",
      minOrderAmount: "0",
      minItemQuantity: "0",
      usageLimit: "100",
      perUserLimit: "1",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code || "",
      name: voucher.name || "",
      description: voucher.description || "",
      type: voucher.type || VoucherType.COUPON,
      discountType: voucher.discountType || DiscountType.PERCENTAGE,
      discountValue: voucher.discountValue ? String(voucher.discountValue) : "0",
      maxDiscountAmount: voucher.maxDiscountAmount ? String(voucher.maxDiscountAmount) : "",
      minOrderAmount: voucher.minOrderAmount ? String(voucher.minOrderAmount) : "0",
      minItemQuantity: voucher.minItemQuantity ? String(voucher.minItemQuantity) : "0",
      usageLimit: voucher.usageLimit ? String(voucher.usageLimit) : "",
      perUserLimit: voucher.perUserLimit ? String(voucher.perUserLimit) : "1",
      startDate: voucher.startDate ? new Date(voucher.startDate).toISOString().slice(0, 16) : "",
      endDate: voucher.endDate ? new Date(voucher.endDate).toISOString().slice(0, 16) : "",
      isActive: voucher.isActive ?? true,
    });
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingVoucher(null);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    const payload: CreateVoucherPayload = {
      code: formData.code.toUpperCase().trim(),
      name: formData.name,
      description: formData.description,
      type: formData.type,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue) || 0,
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      minItemQuantity: Number(formData.minItemQuantity) || 0,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      perUserLimit: Number(formData.perUserLimit) || 1,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      isActive: formData.isActive,
    };

    try {
      if (editingVoucher) {
        await vouchersService.updateVoucher(editingVoucher.id, payload);
        toast.success("Voucher updated successfully");
      } else {
        await vouchersService.createVoucher(payload);
        toast.success("Voucher created successfully");
      }
      await fetchVouchers();
      handleCloseDrawer();
    } catch (err: any) {
      console.error("Failed to save voucher:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to save voucher on server.");
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotional voucher?")) return;

    try {
      await vouchersService.deleteVoucher(id);
      toast.success("Voucher deleted");
      await fetchVouchers();
    } catch (err: any) {
      console.error("Failed to delete voucher:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete voucher on server.");
    }
  };

  // Filter logic
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "ALL" || v.type === typeFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && v.isActive) ||
      (statusFilter === "INACTIVE" && !v.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDiscountDisplay = (v: Voucher) => {
    if (v.discountType === DiscountType.PERCENTAGE) {
      return `${v.discountValue}% OFF`;
    }
    if (v.discountType === DiscountType.FIXED_AMOUNT) {
      return `$${v.discountValue} OFF`;
    }
    return "FREE SHIPPING";
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Vouchers & Promotions
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create coupon codes, manage store discounts, minimum spend conditions, and validity periods.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchVouchers}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Vouchers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <button
            onClick={handleOpenAddDrawer}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create Voucher
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            onClick={fetchVouchers}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/80 hover:bg-rose-200 dark:hover:bg-rose-800 text-rose-800 dark:text-rose-200 font-semibold rounded-lg transition-colors text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or promo title..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Types</option>
            <option value={VoucherType.COUPON}>Coupons</option>
            <option value={VoucherType.PROMOTION}>Promotions</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive / Expired</option>
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Code & Promo</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Discount</th>
              <th className="py-3.5 px-4">Min. Spend</th>
              <th className="py-3.5 px-4">Redemptions</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No vouchers found matching search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((v) => {
                const isLimitReached = v.usageLimit ? v.usageCount >= v.usageLimit : false;
                const isExpired = v.endDate ? new Date(v.endDate) < new Date() : false;

                return (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md text-indigo-600 dark:text-indigo-400 tracking-wider">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(v.code)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Copy code"
                          >
                            {copiedCode === v.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{v.name}</p>
                        {v.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{v.description}</p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {v.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDiscountDisplay(v)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      ${Number(v.minOrderAmount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium">
                        {v.usageCount} {v.usageLimit ? `/ ${v.usageLimit}` : "uses"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {v.isActive && !isExpired && !isLimitReached ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5" /> Expired
                        </span>
                      ) : isLimitReached ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5" /> Max Limit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditDrawer(v)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Edit voucher"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVoucher(v.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Drawer Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between transform transition-transform ease-in-out duration-300">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingVoucher ? "Edit Voucher" : "Create New Voucher"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingVoucher
                      ? `Update configuration for promo code ${editingVoucher.code}`
                      : "Configure discount rules and usage conditions"}
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form id="voucher-drawer-form" onSubmit={handleSaveVoucher} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Voucher Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SUMMER30"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Promo Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Summer Mega Discount"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Voucher Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as VoucherType })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value={VoucherType.COUPON}>Coupon Code</option>
                      <option value={VoucherType.PROMOTION}>Store Campaign</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                      <option value={DiscountType.FIXED_AMOUNT}>Fixed Amount ($)</option>
                      <option value={DiscountType.FREE_SHIPPING}>Free Shipping</option>
                    </select>
                  </div>
                </div>

                {formData.discountType !== DiscountType.FREE_SHIPPING && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        placeholder={formData.discountType === DiscountType.PERCENTAGE ? "30" : "15.00"}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    {formData.discountType === DiscountType.PERCENTAGE && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                          Max Discount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.maxDiscountAmount}
                          onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                          placeholder="Cap amount (optional)"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Min Order Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="Unlimited if empty"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Description & Terms
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details or promotion conditions..."
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="voucherIsActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="voucherIsActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enable this voucher code immediately
                  </label>
                </div>
              </form>

              {/* Drawer Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="voucher-drawer-form"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  {editingVoucher ? "Update Voucher" : "Save & Activate Voucher"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
