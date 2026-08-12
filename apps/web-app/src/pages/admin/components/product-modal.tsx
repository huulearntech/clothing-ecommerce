import { useState, useEffect } from "react";
import { X, Plus, Trash2, Layers, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductVariant, ProductImage, GenderCategory } from "../../../services/types";
import ImageUploader from "../../../components/ImageUploader";
import { catalogService } from "../../../services/catalog.service";

interface VariantFormItem {
  id?: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  priceOverride: string;
  stockQuantity: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  initialData?: Product | null;
}

const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36", "ONE SIZE"];

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    gender: "UNISEX",
    basePrice: "",
    description: "",
    materialComposition: "",
    careInstructions: "",
    images: [] as string[],
  });

  const [variants, setVariants] = useState<VariantFormItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initializeModalData = async () => {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          gender: initialData.gender || "UNISEX",
          basePrice: initialData.basePrice ? String(initialData.basePrice) : "",
          description: initialData.description || "",
          materialComposition: initialData.materialComposition || "",
          careInstructions: initialData.careInstructions || "",
          images: initialData.images?.map((img) => img.imageUrl) || [],
        });

        if (initialData.variants && initialData.variants.length > 0) {
          setVariants(
            initialData.variants.map((v) => ({
              id: v.id,
              sku: v.sku || "",
              size: v.size || "M",
              colorName: v.colorName || "Default",
              colorHex: v.colorHex || "#000000",
              priceOverride: v.priceOverride !== undefined && v.priceOverride !== null ? String(v.priceOverride) : "",
              stockQuantity: String(v.stockQuantity ?? 20),
            }))
          );
        } else {
          try {
            const [sku] = await catalogService.generateSkus({
              productName: initialData.name,
              items: [{ colorName: "Black", size: "M" }],
            });
            if (isMounted) {
              setVariants([
                {
                  sku: sku || "PRD-BLK-M",
                  size: "M",
                  colorName: "Black",
                  colorHex: "#000000",
                  priceOverride: "",
                  stockQuantity: "20",
                },
              ]);
            }
          } catch (err) {
            if (isMounted) {
              setVariants([
                {
                  sku: "PRD-BLK-M",
                  size: "M",
                  colorName: "Black",
                  colorHex: "#000000",
                  priceOverride: "",
                  stockQuantity: "20",
                },
              ]);
            }
          }
        }
      } else {
        setFormData({
          name: "",
          gender: "UNISEX",
          basePrice: "",
          description: "",
          materialComposition: "",
          careInstructions: "",
          images: [],
        });
        try {
          const [sku] = await catalogService.generateSkus({
            productName: "",
            items: [{ colorName: "Black", size: "M" }],
          });
          if (isMounted) {
            setVariants([
              {
                sku: sku || "PRD-BLK-M",
                size: "M",
                colorName: "Black",
                colorHex: "#000000",
                priceOverride: "",
                stockQuantity: "20",
              },
            ]);
          }
        } catch (err) {
          if (isMounted) {
            setVariants([
              {
                sku: "PRD-BLK-M",
                size: "M",
                colorName: "Black",
                colorHex: "#000000",
                priceOverride: "",
                stockQuantity: "20",
              },
            ]);
          }
        }
      }
    };

    if (isOpen) {
      initializeModalData();
    }

    return () => {
      isMounted = false;
    };
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddVariantRow = async () => {
    const defaultColor = variants[0]?.colorName || "Black";
    const defaultHex = variants[0]?.colorHex || "#000000";
    let newSku = "";
    try {
      const [fetchedSku] = await catalogService.generateSkus({
        productName: formData.name,
        items: [{ colorName: defaultColor, size: "L" }],
      });
      newSku = fetchedSku;
    } catch {
      newSku = `PRD-${defaultColor.slice(0, 3).toUpperCase()}-L`;
    }

    setVariants((prev) => [
      ...prev,
      {
        sku: newSku,
        size: "L",
        colorName: defaultColor,
        colorHex: defaultHex,
        priceOverride: "",
        stockQuantity: "20",
      },
    ]);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length <= 1) {
      toast.warning("A product must contain at least one concrete variant.");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantFormItem,
    value: string
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const handleQuickBatchGenerateVariants = async (colorName: string, colorHex: string) => {
    const sizes = ["S", "M", "L", "XL"];
    let skus: string[] = [];
    try {
      skus = await catalogService.generateSkus({
        productName: formData.name,
        items: sizes.map((sz) => ({ colorName, size: sz })),
      });
    } catch {
      skus = sizes.map(
        (sz) => `${formData.name ? formData.name.slice(0, 3).toUpperCase() : "PRD"}-${colorName.slice(0, 3).toUpperCase()}-${sz}`
      );
    }

    const newBatch: VariantFormItem[] = sizes.map((sz, idx) => ({
      sku: skus[idx] || `PRD-${colorName.slice(0, 3).toUpperCase()}-${sz}`,
      size: sz,
      colorName,
      colorHex,
      priceOverride: "",
      stockQuantity: "25",
    }));
    setVariants((prev) => [...prev, ...newBatch]);
    toast.success(`Generated S-XL variant batch for ${colorName}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (variants.length === 0) {
      toast.error("Please add at least one product variant.");
      return;
    }

    const missingSkuIndexes = variants
      .map((v, idx) => (!v.sku || !v.sku.trim() ? idx : -1))
      .filter((idx) => idx !== -1);

    let filledVariants = [...variants];

    if (missingSkuIndexes.length > 0) {
      try {
        const fetchedSkus = await catalogService.generateSkus({
          productName: formData.name,
          items: missingSkuIndexes.map((idx) => ({
            colorName: variants[idx].colorName,
            size: variants[idx].size,
          })),
        });

        filledVariants = filledVariants.map((v, idx) => {
          const missingPos = missingSkuIndexes.indexOf(idx);
          if (missingPos !== -1 && fetchedSkus[missingPos]) {
            return { ...v, sku: fetchedSkus[missingPos] };
          }
          return v;
        });
      } catch (err) {
        console.error("Failed to generate missing SKUs from server:", err);
      }
    }

    const formattedVariants: Partial<ProductVariant>[] = filledVariants.map((v) => ({
      ...(v.id && !v.id.startsWith('var-') ? { id: v.id } : {}),
      sku: v.sku || `PRD-${v.colorName.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}`,
      size: v.size || "M",
      colorName: v.colorName || "Default",
      colorHex: v.colorHex || "#000000",
      priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
      stockQuantity: Number(v.stockQuantity) || 0,
    }));

    const images: Partial<ProductImage>[] = formData.images.map((url, idx) => {
      const existingImg = initialData?.images?.find((img) => img.imageUrl === url) || initialData?.images?.[idx];
      return {
        ...(existingImg?.id ? { id: existingImg.id } : {}),
        imageUrl: url,
        displayOrder: idx,
        isThumbnail: idx === 0,
      };
    });

    onSave({
      id: initialData?.id,
      name: formData.name,
      gender: formData.gender as GenderCategory,
      basePrice: Number(formData.basePrice) || 49.99,
      description: formData.description,
      materialComposition: formData.materialComposition,
      careInstructions: formData.careInstructions,
      images: images as ProductImage[],
      variants: formattedVariants as ProductVariant[],
    });
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? "Edit Apparel Container & Variants" : "Create Apparel Product & Variants"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products are containers for concrete size/color inventory variants.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Product Container Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              1. Product Container Metadata
            </h4>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Apparel Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Premium Heavyweight Cotton Hoodie"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Gender Category *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="MEN">Men</option>
                  <option value="WOMEN">Women</option>
                  <option value="UNISEX">Unisex</option>
                  <option value="KIDS">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Base Reference Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="49.99"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Product Images
              </label>
              <ImageUploader
                images={formData.images}
                onChange={(updatedImages) =>
                  setFormData({ ...formData, images: updatedImages })
                }
                maxFiles={10}
                maxSizeBytes={5 * 1024 * 1024}
                folder="products"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe material composition, garment fit, style notes..."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Section 2: Concrete Product Variants Management */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> 2. Concrete Product Variants ({variants.length})
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Manage exact physical items with unique SKU, size, color, price override, and stock.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickBatchGenerateVariants("Washed Navy", "#1e3a8a")}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                  title="Generate S, M, L, XL batch for Navy"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> + Batch S-XL
                </button>
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </button>
              </div>
            </div>

            {/* Variants List / Table */}
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id || index}
                  className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] flex items-center justify-center font-mono">
                        #{index + 1}
                      </span>
                      Variant SKU: <span className="font-mono text-slate-900 dark:text-white">{variant.sku}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariantRow(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    {/* SKU input */}
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        SKU Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.sku}
                        onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>

                    {/* Size Select / Input */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Size *
                      </label>
                      <input
                        type="text"
                        list={`sizes-list-${index}`}
                        required
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, "size", e.target.value)}
                        placeholder="M"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                      <datalist id={`sizes-list-${index}`}>
                        {COMMON_SIZES.map((sz) => (
                          <option key={sz} value={sz} />
                        ))}
                      </datalist>
                    </div>

                    {/* Color Name */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Color Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={variant.colorName}
                        onChange={(e) => handleVariantChange(index, "colorName", e.target.value)}
                        placeholder="Washed Black"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {/* Price Override */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Price Override ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.priceOverride}
                        onChange={(e) => handleVariantChange(index, "priceOverride", e.target.value)}
                        placeholder={`Optional (${formData.basePrice || "49.99"})`}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {/* Stock Quantity */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={variant.stockQuantity}
                        onChange={(e) => handleVariantChange(index, "stockQuantity", e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
            >
              {initialData ? "Save Changes & Variants" : "Create Product Container & Variants"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
