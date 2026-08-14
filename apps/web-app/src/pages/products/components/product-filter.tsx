import { Search, X, SlidersHorizontal, ArrowUpDown, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../../components/ui/dropdown-menu";
import { GenderCategory } from "../../../services/types";

interface ProductFilterProps {
  searchQuery: string;
  genderQuery: string;
  categorySlugQuery: string;
  sortQuery: string;
  onSearchChange: (value: string) => void;
  onGenderChange: (gender: string) => void;
  onCategorySlugChange: (slug: string) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Genders" },
  { value: GenderCategory.MEN, label: "Men" },
  { value: GenderCategory.WOMEN, label: "Women" },
  { value: GenderCategory.UNISEX, label: "Unisex" },
  { value: GenderCategory.KIDS, label: "Kids" },
];

export const CATEGORY_SLUG_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Apparel Types" },
  { value: "top-half", label: "Top-Half (Shirts, Hoodies)" },
  { value: "bottom-half", label: "Bottom-Half (Jeans, Pants)" },
  { value: "outerwear", label: "Outerwear & Jackets" },
  { value: "accessories", label: "Accessories" },
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

export default function ProductFilter({
  searchQuery,
  genderQuery,
  categorySlugQuery,
  sortQuery,
  onSearchChange,
  onGenderChange,
  onCategorySlugChange,
  onSortChange,
  onClearAll,
}: ProductFilterProps) {
  const hasActiveFilters = Boolean(searchQuery || genderQuery || categorySlugQuery || sortQuery);

  const selectedGenderLabel =
    GENDER_OPTIONS.find((g) => g.value === genderQuery)?.label || "Gender: All";

  const selectedCategoryLabel =
    CATEGORY_SLUG_OPTIONS.find((c) => c.value === categorySlugQuery)?.label || "Category: All";

  const selectedSortLabel =
    SORT_OPTIONS.find((s) => s.value === sortQuery)?.label || "Sort: Featured";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 mb-8">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clothes name, material composition, category..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters prioritizing shadcn DropdownMenu */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Gender Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-36 px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors inline-flex items-center justify-between gap-2 outline-none">
              <div className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="truncate">{selectedGenderLabel}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuRadioGroup value={genderQuery} onValueChange={onGenderChange}>
                {GENDER_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Type Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-56 px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors inline-flex items-center justify-between gap-2 outline-none">
              <span className="truncate">{selectedCategoryLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuRadioGroup value={categorySlugQuery} onValueChange={onCategorySlugChange}>
                {CATEGORY_SLUG_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="w-44 px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors inline-flex items-center justify-between gap-2 outline-none">
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{selectedSortLabel}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuRadioGroup value={sortQuery} onValueChange={onSortChange}>
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Filter Pills & Reset Filters */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-slate-400 shrink-0">Quick Filter:</span>
          <button
            onClick={() => {
              onGenderChange("");
              onCategorySlugChange("");
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
              !genderQuery && !categorySlugQuery
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Items
          </button>
          {GENDER_OPTIONS.filter((g) => g.value).map((g) => (
            <button
              key={g.value}
              onClick={() => onGenderChange(genderQuery === g.value ? "" : g.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                genderQuery === g.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Reset Filter Button in lower row to prevent layout shifting */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 rounded-full transition-all shrink-0 flex items-center gap-1.5 ml-auto"
          >
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
