import VoucherManagement from "./components/voucher-management";

export default function AdminVouchersPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <VoucherManagement />
      </div>
    </div>
  );
}
