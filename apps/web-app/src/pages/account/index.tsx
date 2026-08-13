import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, MapPin, User, LogOut, ArrowLeft } from "lucide-react";
import RootLayout from "../../layouts/root.layout";
import OrdersTab from "./components/orders-tab";
import AddressesTab from "./components/addresses-tab";
import ProfileTab from "./components/profile-tab";
import { authService } from "../../services/auth.service";
import { usersService } from "../../services/users.service";
import type { User as ServerUser } from "../../services/types";
import { usePageTitle } from "../../hooks/usePageTitle";

type AccountTab = "orders" | "addresses" | "profile";

export default function AccountPage() {
  usePageTitle(
    "My Account & Profile",
    "Manage your account profile settings, addresses, and account security at StyleShop."
  );

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabQuery = (searchParams.get("tab") as AccountTab) || "orders";
  const [activeTab, setActiveTab] = useState<AccountTab>(
    ["orders", "addresses", "profile"].includes(tabQuery) ? tabQuery : "orders"
  );

  useEffect(() => {
    if (tabQuery && ["orders", "addresses", "profile"].includes(tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [userData, setUserData] = useState<ServerUser | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    setUserData(currentUser);

    authService
      .getProfile()
      .then((data) => {
        if (data) {
          setUserData(data);
        }
      })
      .catch(() => {
        if (currentUser.id) {
          usersService.getUserById(currentUser.id).then((u) => {
            if (u) setUserData(u);
          });
        }
      });
  }, [navigate]);

  const handleSignOut = () => {
    authService.logout();
    navigate("/auth");
  };

  const fullName = userData
    ? `${userData.firstName} ${userData.lastName}`.trim()
    : "Customer User";
  const initials = userData
    ? `${userData.firstName?.[0] || ""}${userData.lastName?.[0] || ""}`.toUpperCase() || "CU"
    : "CU";
  const email = userData?.email || "customer@example.com";
  const roleLabel = userData?.role || "CUSTOMER";

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </a>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Account
            </h1>
          </div>

          {/* User Profile Banner Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {fullName}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {roleLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {email}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Account Tabs Navigation Bar */}
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange("orders")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "orders"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <Package className="h-4 w-4" />
              Orders & Tracking
            </button>

            <button
              onClick={() => handleTabChange("addresses")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "addresses"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <MapPin className="h-4 w-4" />
              Saved Addresses
            </button>

            <button
              onClick={() => handleTabChange("profile")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
              }`}
            >
              <User className="h-4 w-4" />
              Profile & Sizing
            </button>
          </div>

          {/* Active Tab View */}
          <div>
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "addresses" && <AddressesTab />}
            {activeTab === "profile" && <ProfileTab />}
          </div>
        </div>
      </main>
    </RootLayout>
  );
}
