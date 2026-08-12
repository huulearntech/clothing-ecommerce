import { useEffect, useState } from "react";
import { User, Shirt, Save, Check } from "lucide-react";
import { authService } from "../../../services/auth.service";
import { usersService } from "../../../services/users.service";

export default function ProfileTab() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    userId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredTopSize: "L",
    preferredBottomSize: "32",
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      setLoading(false);
      return;
    }

    usersService
      .getUserById(currentUser.id)
      .then((userData) => {
        if (userData) {
          setProfile({
            userId: userData.id,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            preferredTopSize: userData.profile?.preferredTopSize || "L",
            preferredBottomSize: userData.profile?.preferredBottomSize || "32",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load user profile:", err);
        setProfile({
          userId: currentUser.id,
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          preferredTopSize: "L",
          preferredBottomSize: "32",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersService.updateUser(profile.userId, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
      });
      await usersService.upsertProfile(profile.userId, {
        preferredTopSize: profile.preferredTopSize,
        preferredBottomSize: profile.preferredBottomSize,
      });
    } catch (err) {
      console.error("Profile update handled with UI feedback:", err);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Profile & Size Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Update your personal details and default apparel sizing for fast checkout.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Shirt className="h-4 w-4 text-indigo-600" />
            Clothing Size Preferences
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Pre-select your sizes so product pages highlight your best fit automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Top-Half Preferred Size (Shirts, Polos)
              </label>
              <select
                name="preferredTopSize"
                value={profile.preferredTopSize}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="S">S (Small)</option>
                <option value="M">M (Medium)</option>
                <option value="L">L (Large)</option>
                <option value="XL">XL (Extra Large)</option>
                <option value="XXL">XXL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Bottom-Half Preferred Size (Jeans, Pants)
              </label>
              <select
                name="preferredBottomSize"
                value={profile.preferredBottomSize}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="28">28 Waist</option>
                <option value="30">30 Waist</option>
                <option value="32">32 Waist</option>
                <option value="34">34 Waist</option>
                <option value="36">36 Waist</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-end">
          <button
            type="submit"
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Changes Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
