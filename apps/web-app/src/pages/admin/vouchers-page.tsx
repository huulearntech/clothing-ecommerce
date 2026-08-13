import VoucherManagement from "./components/voucher-management";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function AdminVouchersPage() {
  usePageTitle(
    "Admin Vouchers & Promotions",
    "StyleShop Vouchers & Promo Code Administration."
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <VoucherManagement />
      </div>
    </div>
  );
}
