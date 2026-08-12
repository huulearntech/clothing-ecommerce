import { useEffect, useState } from "react";
import {
  Ticket,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Clock,
  Tag,
  Gift,
} from "lucide-react";
import { vouchersService } from "../../../services/vouchers.service";
import type { Voucher } from "../../../services/types";
import { DiscountType } from "../../../services/types";

interface VoucherSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  totalItemQuantity: number;
  appliedVoucherCode?: string;
  onSelectVoucher: (voucher: Voucher) => void;
}


export default function VoucherSelectorModal({
  isOpen,
  onClose,
  subtotal,
  totalItemQuantity,
  appliedVoucherCode,
  onSelectVoucher,
}: VoucherSelectorModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "eligible">("all");

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setFetchError(false);
    vouchersService
      .getAllVouchers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const activeOnly = data.filter((v) => v.isActive);
          setVouchers(activeOnly);
        } else {
          setVouchers([]);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch vouchers:", err);
        setFetchError(true);
        setVouchers([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const checkEligibility = (voucher: Voucher) => {
    const meetsMinOrder = subtotal >= (voucher.minOrderAmount || 0);
    const meetsMinQty = totalItemQuantity >= (voucher.minItemQuantity || 0);
    const now = new Date();
    const isStarted = !voucher.startDate || new Date(voucher.startDate) <= now;
    const isNotExpired = !voucher.endDate || new Date(voucher.endDate) >= now;

    return {
      isEligible: meetsMinOrder && meetsMinQty && isStarted && isNotExpired,
      meetsMinOrder,
      meetsMinQty,
      isStarted,
      isNotExpired,
      shortfall: Math.max(0, (voucher.minOrderAmount || 0) - subtotal),
    };
  };

  const getDiscountBadgeText = (voucher: Voucher) => {
    if (voucher.discountType === DiscountType.PERCENTAGE) {
      return `${Number(voucher.discountValue)}% OFF${
        voucher.maxDiscountAmount ? ` (Up to $${Number(voucher.maxDiscountAmount)})` : ""
      }`;
    }
    if (voucher.discountType === DiscountType.FIXED_AMOUNT) {
      return `$${Number(voucher.discountValue).toFixed(2)} OFF`;
    }
    return "FREE SHIPPING";
  };

  const eligibleVouchers = vouchers.filter((v) => checkEligibility(v).isEligible);
  const displayedVouchers = activeTab === "eligible" ? eligibleVouchers : vouchers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Select Voucher
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an available offer to apply to your order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
            }`}
          >
            All Vouchers ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab("eligible")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "eligible"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Applicable Now ({eligibleVouchers.length})
          </button>
        </div>

        {/* Voucher List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading available vouchers...
            </div>
          ) : fetchError ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Failed to load vouchers
              </p>
              <p>Please try again later or enter a voucher code manually.</p>
            </div>
          ) : displayedVouchers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Gift className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                No vouchers available in this category
              </p>
              <p>Try switching to "All Vouchers" to view upcoming offers.</p>
            </div>
          ) : (
            displayedVouchers.map((voucher) => {
              const status = checkEligibility(voucher);
              const isApplied = appliedVoucherCode === voucher.code;

              return (
                <div
                  key={voucher.id}
                  className={`relative rounded-2xl border p-4 transition-all ${
                    isApplied
                      ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-600/50 shadow-md"
                      : status.isEligible
                      ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
                      : "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-900/40 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 tracking-wider">
                        {voucher.code}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] rounded-md uppercase tracking-wider flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {getDiscountBadgeText(voucher)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!status.isEligible}
                      onClick={() => {
                        onSelectVoucher(voucher);
                        onClose();
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 ${
                        isApplied
                          ? "bg-emerald-600 text-white shadow-sm"
                          : status.isEligible
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Applied
                        </>
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {voucher.name}
                  </h3>
                  {voucher.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {voucher.description}
                    </p>
                  )}

                  {/* Conditions & Notice */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] gap-2 text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>Min Order: ${voucher.minOrderAmount || 0}</span>
                      {voucher.endDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          Exp: {new Date(voucher.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {!status.isEligible && (
                      <div className="flex items-center gap-1 font-semibold text-rose-500 dark:text-rose-400">
                        <AlertCircle className="h-3 w-3" />
                        {status.shortfall > 0
                          ? `Add $${status.shortfall.toFixed(2)} more to qualify`
                          : !status.meetsMinQty
                          ? `Requires at least ${voucher.minItemQuantity} items`
                          : "Voucher condition not met"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel and Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
