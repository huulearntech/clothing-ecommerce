import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User, CheckCircle2, AlertCircle } from "lucide-react";
import RootLayout from "../../layouts/root.layout";
import { authService } from "../../services/auth.service";
import { usePageTitle } from "../../hooks/usePageTitle";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  usePageTitle(
    isLogin ? "Sign In - StyleShop Account" : "Create Account - StyleShop",
    "Sign in or create a new StyleShop account for fast checkout, saved orders, and wishlist tracking."
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    agreeTerms: false,
  });

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        await authService.login({
          email: formData.email.trim(),
          password: formData.password,
        });
        navigate("/account");
      } else {
        // Handle Sign Up
        const nameParts = formData.fullName.trim().split(" ");
        const firstName = nameParts[0] || "Customer";
        const lastName = nameParts.slice(1).join(" ") || "User";

        await authService.register({
          email: formData.email.trim(),
          password: formData.password,
          firstName,
          lastName,
        });
        navigate("/account");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred during authentication.";
      setErrorMsg(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootLayout>
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          
          {/* Left Decorative Branding Section */}
          <div className="lg:col-span-5 relative bg-slate-900 text-white p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
            {/* Background High-Fashion Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80"
                alt="Fashion model editorial"
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000 hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            </div>

            {/* Top Brand Tagline */}
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/15 text-slate-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Member Benefits
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Elevate Your Everyday Style
              </h2>
            </div>

            {/* Middle Perks List */}
            <div className="relative z-10 my-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Exclusive Early Access</p>
                  <p className="text-xs text-slate-400">First look at seasonal drops & limited capsule collections.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Free Worldwide Express Delivery</p>
                  <p className="text-xs text-slate-400">Enjoy complimentary shipping & 30-day effortless returns.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Curated VIP Rewards</p>
                  <p className="text-xs text-slate-400">Earn 5% back on every purchase as store credit.</p>
                </div>
              </div>
            </div>

            {/* Footer Trust Quote */}
            <div className="relative z-10 pt-6 border-t border-slate-800/80">
              <p className="text-xs italic text-slate-400">
                "Simple, modern luxury designed for timeless versatility."
              </p>
            </div>
          </div>

          {/* Right Interactive Form Section */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
            {/* Form Header */}
            <div className="mb-8">
              {/* Tab Toggle Header */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                    isLogin
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                    !isLogin
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {isLogin ? "Welcome Back" : "Join the Atelier"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isLogin
                  ? "Enter your credentials to access your account & saved items."
                  : "Create an account to start shopping and track your orders."}
              </p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.11-.98.04-2.19.66-2.88 1.47-.62.72-1.16 1.88-.99 3.01 1.09.08 2.22-.55 2.88-1.37z" />
                </svg>
                Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 tracking-wider">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Main Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {isLogin && (
                    <a
                      href="#"
                      className="text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    required
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:border-slate-700"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-slate-500 dark:text-slate-400">
                    I agree to the{" "}
                    <a href="#" className="underline text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="underline text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In to Your Account" : "Create My Account"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> 256-Bit Encrypted & Secure Checkout Guaranteed
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
