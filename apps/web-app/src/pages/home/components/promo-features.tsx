import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";

const FEATURES = [
  {
    icon: Truck,
    title: "Free Worldwide Shipping",
    description: "On all orders over $75 with tracking",
  },
  {
    icon: RotateCcw,
    title: "30-Day Easy Returns",
    description: "Hassle-free return policy & instant refund",
  },
  {
    icon: ShieldCheck,
    title: "100% Secure Checkout",
    description: "Encrypted transactions & fraud protection",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Service",
    description: "Dedicated support team ready to assist",
  },
];

export default function PromoFeatures() {
  return (
    <section className="py-12 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
