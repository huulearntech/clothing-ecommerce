import type { ReactNode } from "react";
import {
  Shirt,
  ShieldCheck,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Ticket,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { authService } from "../services/auth.service";
import { useNavigate, NavLink } from "react-router-dom";

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate("/auth");
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 py-1.5 px-3.5 font-semibold text-xs rounded-lg transition-all ${
      isActive
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left Brand & Badge */}
          <div className="flex items-center gap-3">
            <NavLink to="/admin" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white tracking-tight">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 dark:shadow-none">
                <Shirt className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline">StyleShop</span>
            </NavLink>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Control
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            <NavLink to="/admin" end className={navItemClass}>
              <LayoutDashboard className="w-3.5 h-3.5" /> Overview
            </NavLink>
            <NavLink to="/admin/products" className={navItemClass}>
              <Package className="w-3.5 h-3.5" /> Products
            </NavLink>
            <NavLink to="/admin/orders" className={navItemClass}>
              <ShoppingBag className="w-3.5 h-3.5" /> Orders
            </NavLink>
            <NavLink to="/admin/vouchers" className={navItemClass}>
              <Ticket className="w-3.5 h-3.5" /> Vouchers
            </NavLink>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              title="View Customer Shop"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Shop
            </a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  {currentUser.firstName?.[0] || "A"}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentUser.firstName} {currentUser.lastName}
                </span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 StyleShop Admin Panel. Internal Management System.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> API Connected
            </span>
            <span>v1.2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
