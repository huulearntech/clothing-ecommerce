import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RootLayout from "../../layouts/root.layout";
import ProductFilter from "./components/product-filter";
import ProductCard from "./components/product-card";
import type { ProductItem } from "./components/product-card";
import { catalogService } from "../../services/catalog.service";
import type { Product as ServerProduct } from "../../services/types";
import { SearchX } from "lucide-react";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productsList, setProductsList] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const searchQuery = searchParams.get("search") || "";
  const genderQuery = searchParams.get("gender") || searchParams.get("category") || "";
  const categorySlugQuery = searchParams.get("categorySlug") || searchParams.get("subtype") || "";
  const sortQuery = searchParams.get("sort") || "";

  useEffect(() => {
    setLoading(true);

    const filterParams: Record<string, string> = {};
    if (searchQuery) filterParams.search = searchQuery;
    if (genderQuery) {
      const upper = genderQuery.toUpperCase();
      if (["MEN", "WOMEN", "UNISEX", "KIDS"].includes(upper)) {
        filterParams.gender = upper;
      }
    }
    if (categorySlugQuery) filterParams.categorySlug = categorySlugQuery;
    if (sortQuery) filterParams.sort = sortQuery;

    catalogService
      .getProducts(filterParams)
      .then((serverProducts: ServerProduct[]) => {
        if (serverProducts) {
          const mapped: ProductItem[] = serverProducts.map((p) => ({
            id: p.id,
            variantId: p.variants?.[0]?.id,
            name: p.name,
            category: (p.gender || "UNISEX").toLowerCase() as ProductItem["category"],
            subtype: p.categories?.[0]?.name || "Apparel",
            price: Number(p.basePrice) || 49.99,
            rating: 4.8,
            reviewsCount: 25,
            image:
              p.images?.[0]?.imageUrl ||
              "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=80",
            colors: Array.from(
              new Set(p.variants?.map((v) => v.colorName).filter(Boolean)),
            ),
            sizes: Array.from(
              new Set(p.variants?.map((v) => v.size).filter(Boolean)),
            ),
          }));
          setProductsList(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load filtered products catalog:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchQuery, genderQuery, categorySlugQuery, sortQuery]);

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set("search", value);
      else prev.delete("search");
      return prev;
    });
  };

  const handleGenderChange = (gender: string) => {
    setSearchParams((prev) => {
      if (gender) prev.set("gender", gender);
      else prev.delete("gender");
      prev.delete("category"); // clean legacy query parameter
      return prev;
    });
  };

  const handleCategorySlugChange = (slug: string) => {
    setSearchParams((prev) => {
      if (slug) prev.set("categorySlug", slug);
      else prev.delete("categorySlug");
      prev.delete("subtype"); // clean legacy query parameter
      return prev;
    });
  };

  const handleSortChange = (sort: string) => {
    setSearchParams((prev) => {
      if (sort) prev.set("sort", sort);
      else prev.delete("sort");
      return prev;
    });
  };

  const handleClearAll = () => {
    setSearchParams({});
  };

  return (
    <RootLayout>
      <main className="py-10 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Apparel Catalog
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse top-half clothes, bottom-half essentials, and accessories.
            </p>
          </div>

          <ProductFilter
            searchQuery={searchQuery}
            genderQuery={genderQuery}
            categorySlugQuery={categorySlugQuery}
            sortQuery={sortQuery}
            onSearchChange={handleSearchChange}
            onGenderChange={handleGenderChange}
            onCategorySlugChange={handleCategorySlugChange}
            onSortChange={handleSortChange}
            onClearAll={handleClearAll}
          />

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Showing{" "}
              <strong className="text-slate-900 dark:text-white">
                {productsList.length}
              </strong>{" "}
              {productsList.length === 1 ? "product" : "products"}
              {searchQuery && (
                <span>
                  {" "}
                  for "
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {searchQuery}
                  </span>
                  "
                </span>
              )}
            </p>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500 shadow-sm my-8">
              Loading product catalog...
            </div>
          ) : productsList.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto shadow-sm my-8">
              <SearchX className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                No products found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                We couldn't find any items matching your current filters. Try
                resetting your search query.
              </p>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productsList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </RootLayout>
  );
}
