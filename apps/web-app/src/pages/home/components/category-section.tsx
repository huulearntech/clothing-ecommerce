import { useEffect, useState } from "react";
import { Shirt, Footprints, Watch, ArrowRight } from "lucide-react";
import { catalogService } from "../../../services/catalog.service";
import type { Category } from "../../../services/types";

const FALLBACK_CATEGORIES = [
  {
    id: "top-half",
    title: "Top-Half Clothes",
    description: "Shirts, T-Shirts, Polo Shirts",
    subtypes: ["Shirt", "T-Shirt", "Polo Shirt"],
    itemCount: "42 Items",
    badge: "Popular",
    icon: Shirt,
    bgGradient: "from-blue-600/10 to-indigo-600/10",
    borderColor: "border-indigo-100 dark:border-indigo-900/30",
    image:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "bottom-half",
    title: "Bottom-Half Clothes",
    description: "Shorts, Jeans, Khakis, Pants",
    subtypes: ["Shorts", "Jeans", "Khakis", "Pants"],
    itemCount: "38 Items",
    badge: "Trending",
    icon: Footprints,
    bgGradient: "from-purple-600/10 to-pink-600/10",
    borderColor: "border-purple-100 dark:border-purple-900/30",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "accessories",
    title: "Other Clothes Accessories",
    description: "Belts, Hats, Sunglasses, Caps",
    subtypes: ["Belts", "Hats", "Sunglasses", "Caps"],
    itemCount: "24 Items",
    badge: "Essentials",
    icon: Watch,
    bgGradient: "from-emerald-600/10 to-teal-600/10",
    borderColor: "border-emerald-100 dark:border-emerald-900/30",
    image:
      "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=600&q=80",
  },
];

export default function CategorySection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogService
      .getCategories()
      .then((data) => {
        if (data) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const displayCategories = categories.map((cat, idx) => {
    const fallbackMeta = FALLBACK_CATEGORIES[idx % FALLBACK_CATEGORIES.length];
    return {
      id: cat.id || cat.slug || fallbackMeta.id,
      title: cat.name,
      description: `Collection of ${cat.name}`,
      subtypes: cat.children?.map((c) => c.name) || [],
      itemCount: `${cat.children?.length || 0} Subcategories`,
      badge: "Collection",
      icon: fallbackMeta.icon,
      bgGradient: fallbackMeta.bgGradient,
      borderColor: fallbackMeta.borderColor,
      image: fallbackMeta.image,
    };
  });

  return (
    <section
      id="categories"
      className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Shop by Product Category
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
          Find your fit effortlessly divided into top-half, bottom-half, and
          signature accessories.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`group relative rounded-2xl border ${cat.borderColor} bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cat.bgGradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {cat.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  {cat.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {cat.subtypes.map((sub) => (
                    <span
                      key={sub}
                      className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="h-44 rounded-xl overflow-hidden mb-4 relative">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                    {cat.itemCount}
                  </div>
                </div>

                <a
                  href={`/products?category=${cat.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all"
                >
                  Explore Collection
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
