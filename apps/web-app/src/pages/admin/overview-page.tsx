import OverviewStats from "./components/overview-stats";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function AdminOverviewPage() {
  usePageTitle(
    "Admin Overview & Analytics",
    "StyleShop Administration Dashboard Overview and Store Analytics."
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <OverviewStats />
    </div>
  );
}
