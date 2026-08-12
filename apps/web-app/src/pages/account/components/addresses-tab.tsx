import { useEffect, useState } from "react";
import { MapPin, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { authService } from "../../../services/auth.service";
import { usersService } from "../../../services/users.service";
import type { Address as ServerAddress, AddressType } from "../../../services/types";

interface AddressUI {
  id: string;
  label: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressesTab() {
  const [addresses, setAddresses] = useState<AddressUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipientName: "",
    streetLine1: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "United States",
  });

  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id || "";

  const fetchAddresses = () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    usersService
      .getUserById(userId)
      .then((user) => {
        if (user && user.addresses) {
          const mapped: AddressUI[] = user.addresses.map((a: ServerAddress) => ({
            id: a.id,
            label: a.addressType || "Shipping Address",
            name: a.recipientName || `${user.firstName} ${user.lastName}`,
            street: a.streetLine1 + (a.streetLine2 ? `, ${a.streetLine2}` : ""),
            city: a.city,
            state: a.stateProvince,
            zip: a.postalCode,
            country: a.country,
            phone: user.phone || "+1 (555) 000-0000",
            isDefault: Boolean(a.isDefault),
          }));
          setAddresses(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load user addresses:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersService.addAddress(userId, {
        addressType: "SHIPPING" as AddressType,
        recipientName: newAddr.recipientName,
        streetLine1: newAddr.streetLine1,
        city: newAddr.city,
        stateProvince: newAddr.stateProvince,
        postalCode: newAddr.postalCode,
        country: newAddr.country,
        isDefault: addresses.length === 0,
      });
      setIsAdding(false);
      setNewAddr({
        recipientName: "",
        streetLine1: "",
        city: "",
        stateProvince: "",
        postalCode: "",
        country: "United States",
      });
      fetchAddresses();
    } catch (err) {
      console.error("Failed to create address:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Saved Shipping Addresses
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your default checkout delivery destinations and billing info.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? "Cancel" : "Add New Address"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreateAddress}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-5 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={newAddr.recipientName}
                onChange={(e) => setNewAddr({ ...newAddr, recipientName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Street Address</label>
              <input
                type="text"
                required
                value={newAddr.streetLine1}
                onChange={(e) => setNewAddr({ ...newAddr, streetLine1: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">City</label>
              <input
                type="text"
                required
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">State / Province</label>
              <input
                type="text"
                required
                value={newAddr.stateProvince}
                onChange={(e) => setNewAddr({ ...newAddr, stateProvince: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Postal Code</label>
              <input
                type="text"
                required
                value={newAddr.postalCode}
                onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">Country</label>
              <input
                type="text"
                required
                value={newAddr.country}
                onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl"
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-md mx-auto shadow-sm">
          <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No Saved Addresses
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            You haven't added any shipping addresses yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between transition-all shadow-sm ${
                addr.isDefault
                  ? "border-indigo-600 ring-2 ring-indigo-600/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      DEFAULT
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-white">{addr.name}</p>
                  <p>{addr.street}</p>
                  <p>
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                  <p>{addr.country}</p>
                  <p className="text-slate-400 pt-1">Phone: {addr.phone}</p>
                </div>
              </div>

              {/* Address Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4 text-xs">
                {!addr.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Set as Default
                  </button>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Primary Address</span>
                )}

                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
